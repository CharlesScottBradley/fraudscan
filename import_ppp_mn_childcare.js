#!/usr/bin/env node
/**
 * Import MN childcare PPP loans into Supabase
 */

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Read env
const envFile = fs.readFileSync('.env.local', 'utf8');
const urlMatch = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=([^\n]+)/);
const keyMatch = envFile.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=([^\n]+)/);

const SUPABASE_URL = urlMatch ? urlMatch[1].trim() : '';
const SUPABASE_KEY = keyMatch ? keyMatch[1].trim() : '';

console.log('URL:', SUPABASE_URL);
console.log('Key length:', SUPABASE_KEY.length);

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function parseDate(dateStr) {
  if (!dateStr || dateStr.trim() === '') return null;
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
  }
  return null;
}

function parseFloat(val) {
  if (!val || val.trim() === '') return null;
  const num = Number(val.replace(/,/g, ''));
  return isNaN(num) ? null : num;
}

function parseInt(val) {
  if (!val || val.trim() === '') return null;
  const num = Math.floor(Number(val));
  return isNaN(num) ? null : num;
}

async function main() {
  const csvFile = 'ppp_150k_plus.csv';
  const content = fs.readFileSync(csvFile, 'utf8');
  const lines = content.split('\n');

  // Parse header
  const header = lines[0].split(',');
  const colIndex = {};
  header.forEach((col, i) => {
    colIndex[col] = i;
  });

  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    // Simple CSV parsing (handles quoted fields)
    const cols = [];
    let current = '';
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        cols.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    cols.push(current);

    // Filter for MN childcare
    const state = cols[colIndex['BorrowerState']];
    const naics = cols[colIndex['NAICSCode']];

    if (state === 'MN' && naics === '624410') {
      records.push({
        loan_number: cols[colIndex['LoanNumber']],
        date_approved: parseDate(cols[colIndex['DateApproved']]),
        borrower_name: cols[colIndex['BorrowerName']],
        borrower_address: cols[colIndex['BorrowerAddress']],
        borrower_city: cols[colIndex['BorrowerCity']],
        borrower_state: cols[colIndex['BorrowerState']],
        borrower_zip: cols[colIndex['BorrowerZip']],
        initial_approval_amount: parseFloat(cols[colIndex['InitialApprovalAmount']]),
        current_approval_amount: parseFloat(cols[colIndex['CurrentApprovalAmount']]),
        forgiveness_amount: parseFloat(cols[colIndex['ForgivenessAmount']]),
        forgiveness_date: parseDate(cols[colIndex['ForgivenessDate']]),
        loan_status: cols[colIndex['LoanStatus']],
        jobs_reported: parseInt(cols[colIndex['JobsReported']]),
        naics_code: cols[colIndex['NAICSCode']],
        business_type: cols[colIndex['BusinessType']],
        lender_name: cols[colIndex['OriginatingLender']],
        payroll_proceed: parseFloat(cols[colIndex['PAYROLL_PROCEED']]),
        rent_proceed: parseFloat(cols[colIndex['RENT_PROCEED']]),
        utilities_proceed: parseFloat(cols[colIndex['UTILITIES_PROCEED']]),
        is_nonprofit: cols[colIndex['NonProfit']]?.toUpperCase() === 'Y',
      });
    }
  }

  console.log(`Found ${records.length} MN childcare PPP loans`);

  // Insert in batches
  const batchSize = 50;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    try {
      const { error } = await supabase
        .from('ppp_loans')
        .upsert(batch, { onConflict: 'loan_number' });

      if (error) {
        console.error(`Error inserting batch ${Math.floor(i/batchSize) + 1}:`, error.message);
      } else {
        console.log(`Inserted batch ${Math.floor(i/batchSize) + 1}: ${batch.length} records`);
      }
    } catch (e) {
      console.error(`Exception inserting batch:`, e.message);
    }
  }

  console.log('Done!');
}

main().catch(console.error);
