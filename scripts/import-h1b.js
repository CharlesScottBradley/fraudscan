#!/usr/bin/env node

/**
 * H-1B LCA Data Importer
 * Imports DOL Labor Condition Application disclosure data into Supabase
 *
 * Usage:
 *   node scripts/import-h1b.js <file.xlsx|file.csv> [--states=MN,OH,WA] [--limit=1000] [--dry-run]
 *
 * Examples:
 *   node scripts/import-h1b.js ../data/h1b/LCA_Disclosure_Data_FY2024_Q4.csv
 *   node scripts/import-h1b.js ../data/h1b/LCA_Disclosure_Data_FY2024_Q4.csv --states=MN,OH,WA
 *   node scripts/import-h1b.js ../data/h1b/LCA_Disclosure_Data_FY2024_Q4.xlsx --limit=100 --dry-run
 *
 * Note: CSV files are MUCH faster to parse than XLSX for large files.
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const readline = require('readline');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Parse command line arguments
const args = process.argv.slice(2);
const filePath = args.find(a => !a.startsWith('--'));
const statesArg = args.find(a => a.startsWith('--states='));
const limitArg = args.find(a => a.startsWith('--limit='));
const dryRun = args.includes('--dry-run');

const filterStates = statesArg ? statesArg.split('=')[1].split(',').map(s => s.toUpperCase()) : null;
const limit = limitArg ? parseInt(limitArg.split('=')[1]) : null;

if (!filePath) {
  console.error('Usage: node scripts/import-h1b.js <xlsx_file> [--states=MN,OH,WA] [--limit=1000] [--dry-run]');
  process.exit(1);
}

// Extract fiscal year from filename (e.g., FY2024_Q4 -> 2024)
function extractFiscalYear(filename) {
  const match = filename.match(/FY(\d{4})/i);
  return match ? parseInt(match[1]) : null;
}

// Convert date value to ISO format
// Handles: Excel serial numbers, ISO strings (YYYY-MM-DD), MM/DD/YYYY strings
function parseDate(value) {
  if (!value) return null;

  // Excel serial number
  if (typeof value === 'number') {
    const utc_days = Math.floor(value - 25569);
    const date = new Date(utc_days * 86400 * 1000);
    return date.toISOString().split('T')[0];
  }

  // String date
  const str = String(value).trim();
  if (!str) return null;

  // Already ISO format (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // MM/DD/YYYY format
  const mdyMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdyMatch) {
    const [, m, d, y] = mdyMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  return null;
}

// Parse wage value (handles "$143,666" or "143666" formats)
function parseWage(value) {
  if (!value) return null;
  const cleaned = String(value).replace(/[$,]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

// Parse boolean from Y/N or Yes/No
function parseBoolean(value) {
  if (!value) return null;
  const v = String(value).toLowerCase().trim();
  if (v === 'y' || v === 'yes' || v === 'true' || v === '1') return true;
  if (v === 'n' || v === 'no' || v === 'false' || v === '0') return false;
  return null;
}

// Map Excel row to database record
function mapRowToRecord(row, fiscalYear) {
  return {
    case_number: row['CASE_NUMBER'],
    case_status: row['CASE_STATUS'],
    received_date: parseDate(row['RECEIVED_DATE']),
    decision_date: parseDate(row['DECISION_DATE']),
    visa_class: row['VISA_CLASS'],

    employer_name: row['EMPLOYER_NAME'],
    employer_address: [row['EMPLOYER_ADDRESS1'], row['EMPLOYER_ADDRESS2']].filter(Boolean).join(', '),
    employer_city: row['EMPLOYER_CITY'],
    employer_state: row['EMPLOYER_STATE'],
    employer_postal_code: row['EMPLOYER_POSTAL_CODE'],
    employer_country: row['EMPLOYER_COUNTRY'],
    employer_phone: row['EMPLOYER_PHONE'],
    naics_code: row['NAICS_CODE'],

    job_title: row['JOB_TITLE'],
    soc_code: row['SOC_CODE'],
    soc_title: row['SOC_TITLE'],
    full_time_position: parseBoolean(row['FULL_TIME_POSITION']),
    total_workers: parseInt(row['TOTAL_WORKER_POSITIONS']) || null,

    wage_rate_from: parseWage(row['WAGE_RATE_OF_PAY_FROM']),
    wage_rate_to: parseWage(row['WAGE_RATE_OF_PAY_TO']),
    wage_unit: row['WAGE_UNIT_OF_PAY'],
    prevailing_wage: parseWage(row['PREVAILING_WAGE']),
    pw_unit: row['PW_UNIT_OF_PAY'],

    worksite_address: [row['WORKSITE_ADDRESS1'], row['WORKSITE_ADDRESS2']].filter(Boolean).join(', '),
    worksite_city: row['WORKSITE_CITY'],
    worksite_state: row['WORKSITE_STATE'],
    worksite_postal_code: row['WORKSITE_POSTAL_CODE'],
    worksite_county: row['WORKSITE_COUNTY'],

    h1b_dependent: parseBoolean(row['H_1B_DEPENDENT']),
    willful_violator: parseBoolean(row['WILLFUL_VIOLATOR']),

    employment_start_date: parseDate(row['BEGIN_DATE']),
    employment_end_date: parseDate(row['END_DATE']),

    fiscal_year: fiscalYear,
    data_source: 'dol_lca',
  };
}

// Parse CSV line (handles quoted fields with commas)
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// Read CSV file with streaming
async function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    const rows = [];
    let headers = null;
    let lineCount = 0;

    const rl = readline.createInterface({
      input: fs.createReadStream(filePath, { encoding: 'utf8' }),
      crlfDelay: Infinity
    });

    rl.on('line', (line) => {
      lineCount++;
      const values = parseCSVLine(line);

      if (!headers) {
        headers = values;
        return;
      }

      const row = {};
      headers.forEach((h, i) => {
        row[h] = values[i] || '';
      });
      rows.push(row);

      if (lineCount % 100000 === 0) {
        console.log(`  Read ${lineCount.toLocaleString()} lines...`);
      }
    });

    rl.on('close', () => resolve(rows));
    rl.on('error', reject);
  });
}

async function importH1B() {
  console.log(`\n=== H-1B LCA Data Importer ===`);
  console.log(`File: ${filePath}`);
  console.log(`Filter states: ${filterStates ? filterStates.join(', ') : 'All'}`);
  console.log(`Limit: ${limit || 'None'}`);
  console.log(`Dry run: ${dryRun}`);
  console.log('');

  const fiscalYear = extractFiscalYear(path.basename(filePath));
  console.log(`Detected fiscal year: ${fiscalYear || 'Unknown'}`);

  const isCSV = filePath.toLowerCase().endsWith('.csv');
  let rows;

  if (isCSV) {
    // CSV - use streaming (fast)
    console.log('\nReading CSV file (streaming)...');
    const startRead = Date.now();
    rows = await readCSV(filePath);
    console.log(`Total rows: ${rows.length.toLocaleString()}, read in ${((Date.now() - startRead) / 1000).toFixed(1)}s`);
  } else {
    // Excel - use XLSX library (slow for large files)
    console.log('\nReading Excel file (this may take several minutes for large files)...');
    console.log('TIP: Convert to CSV first for faster processing.');
    const XLSX = require('xlsx');
    const startRead = Date.now();
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    console.log(`Sheet: ${sheetName}, read in ${((Date.now() - startRead) / 1000).toFixed(1)}s`);

    console.log('Converting to JSON...');
    const startConvert = Date.now();
    rows = XLSX.utils.sheet_to_json(sheet);
    console.log(`Total rows: ${rows.length.toLocaleString()}, converted in ${((Date.now() - startConvert) / 1000).toFixed(1)}s`);
  }

  // Filter by state if specified
  let filteredRows = rows;
  if (filterStates) {
    filteredRows = rows.filter(row => filterStates.includes(row['WORKSITE_STATE']));
    console.log(`Filtered to ${filterStates.join('/')}: ${filteredRows.length.toLocaleString()} rows`);
  }

  // Apply limit
  if (limit && filteredRows.length > limit) {
    filteredRows = filteredRows.slice(0, limit);
    console.log(`Limited to first ${limit} rows`);
  }

  if (filteredRows.length === 0) {
    console.log('No rows to import.');
    return;
  }

  // Map rows to records
  console.log('\nMapping rows to database records...');
  const records = filteredRows.map(row => mapRowToRecord(row, fiscalYear));

  // Show sample record
  console.log('\nSample record:');
  console.log(JSON.stringify(records[0], null, 2));

  if (dryRun) {
    console.log('\n[DRY RUN] Would insert', records.length.toLocaleString(), 'records');

    // Show state breakdown
    const stateCounts = {};
    records.forEach(r => {
      const state = r.worksite_state || 'Unknown';
      stateCounts[state] = (stateCounts[state] || 0) + 1;
    });
    console.log('\nRecords by worksite state:');
    Object.entries(stateCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .forEach(([state, count]) => console.log(`  ${state}: ${count.toLocaleString()}`));

    return;
  }

  // Batch insert to Supabase
  console.log('\nInserting to Supabase...');
  const BATCH_SIZE = 500;
  let inserted = 0;
  let errors = 0;
  let duplicates = 0;

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);

    const { data, error } = await supabase
      .from('h1b_applications')
      .upsert(batch, {
        onConflict: 'case_number',
        ignoreDuplicates: false
      })
      .select('case_number');

    if (error) {
      console.error(`Batch ${Math.floor(i / BATCH_SIZE) + 1} error:`, error.message);
      errors += batch.length;
    } else {
      inserted += data.length;
    }

    // Progress update every 10 batches
    if ((i / BATCH_SIZE) % 10 === 0) {
      console.log(`Progress: ${(i + batch.length).toLocaleString()} / ${records.length.toLocaleString()} (${Math.round((i + batch.length) / records.length * 100)}%)`);
    }
  }

  console.log('\n=== Import Complete ===');
  console.log(`Inserted/Updated: ${inserted.toLocaleString()}`);
  console.log(`Errors: ${errors.toLocaleString()}`);

  // Show final stats
  const { count } = await supabase
    .from('h1b_applications')
    .select('*', { count: 'exact', head: true });

  console.log(`Total records in h1b_applications: ${count?.toLocaleString() || 'Unknown'}`);
}

importH1B().catch(console.error);
