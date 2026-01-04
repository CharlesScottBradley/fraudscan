#!/usr/bin/env node
/**
 * Run SQL migrations against Supabase using the Management API
 * Usage: node scripts/run-migration-api.js <migration-file.sql>
 *
 * This uses the Supabase Management API to execute raw SQL.
 * Requires SUPABASE_ACCESS_TOKEN environment variable (from supabase.com dashboard > Account > Access Tokens)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Extract project ref from URL
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const PROJECT_REF = SUPABASE_URL ? SUPABASE_URL.match(/https:\/\/([^.]+)/)?.[1] : null;
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

async function executeSql(sql) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({ query: sql });

        const options = {
            hostname: 'api.supabase.com',
            port: 443,
            path: `/v1/projects/${PROJECT_REF}/database/query`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Length': data.length
            }
        };

        const req = https.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => { responseData += chunk; });
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(JSON.parse(responseData));
                    } catch {
                        resolve(responseData);
                    }
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
                }
            });
        });

        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

async function runMigration(sqlFilePath) {
    try {
        // Read the SQL file
        const absolutePath = path.isAbsolute(sqlFilePath)
            ? sqlFilePath
            : path.join(process.cwd(), sqlFilePath);

        console.log(`Reading migration file: ${absolutePath}`);

        if (!fs.existsSync(absolutePath)) {
            console.error(`Error: File not found: ${absolutePath}`);
            process.exit(1);
        }

        const sql = fs.readFileSync(absolutePath, 'utf8');
        console.log(`Migration file loaded (${sql.length} bytes)`);
        console.log(`Project ref: ${PROJECT_REF}`);

        if (!ACCESS_TOKEN) {
            console.log('\n=== SUPABASE_ACCESS_TOKEN not set ===');
            console.log('To use the Management API, add SUPABASE_ACCESS_TOKEN to .env.local');
            console.log('Get it from: https://supabase.com/dashboard/account/tokens\n');
            console.log('Alternatively, run the SQL directly in Supabase SQL Editor:');
            console.log(`https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new\n`);
            console.log('=== SQL to execute ===\n');
            console.log(sql);
            return;
        }

        console.log('\nExecuting migration via Supabase Management API...');

        const result = await executeSql(sql);
        console.log('\nMigration completed successfully!');
        console.log('Result:', JSON.stringify(result, null, 2));

    } catch (err) {
        console.error('Error running migration:', err.message);
        process.exit(1);
    }
}

// Get migration file from command line arguments
const args = process.argv.slice(2);
if (args.length === 0) {
    console.log('Usage: node scripts/run-migration-api.js <migration-file.sql>');
    console.log('\nAvailable migrations:');
    const migrationsDir = path.join(__dirname, 'migrations');
    if (fs.existsSync(migrationsDir)) {
        const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
        files.forEach(f => console.log(`  - scripts/migrations/${f}`));
    }
    process.exit(0);
}

runMigration(args[0]);
