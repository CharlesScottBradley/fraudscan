#!/usr/bin/env node
/**
 * Run SQL migrations against Supabase
 * Usage: node scripts/run-migration.js <migration-file.sql>
 *
 * Requires DATABASE_URL in .env.local (get from Supabase Dashboard > Project Settings > Database)
 * Format: postgresql://postgres.[project-ref]:[password]@aws-0-us-west-1.pooler.supabase.com:6543/postgres
 *
 * If DATABASE_URL is not set, outputs SQL for manual execution.
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const PROJECT_REF = SUPABASE_URL ? SUPABASE_URL.match(/https:\/\/([^.]+)/)?.[1] : null;
const DATABASE_URL = process.env.DATABASE_URL;

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
        console.log(`Project ref: ${PROJECT_REF}\n`);

        if (!DATABASE_URL) {
            console.log('============================================================');
            console.log('DATABASE_URL not set. To run migrations automatically, add:');
            console.log('DATABASE_URL=postgresql://postgres.[project-ref]:[password]@...');
            console.log('to your .env.local file (get from Supabase Dashboard > Settings > Database)');
            console.log('============================================================\n');
            console.log('MIGRATION SQL - Copy and paste into Supabase SQL Editor:');
            console.log(`https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new`);
            console.log('============================================================\n');
            console.log(sql);
            console.log('\n============================================================');
            console.log('END OF MIGRATION');
            console.log('============================================================');
            return;
        }

        // Execute migration using pg
        console.log('Connecting to database...');
        const pool = new Pool({
            connectionString: DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });

        console.log('Executing migration...\n');
        const result = await pool.query(sql);

        console.log('Migration completed successfully!');
        if (Array.isArray(result)) {
            result.forEach((r, i) => {
                if (r.command) console.log(`  [${i + 1}] ${r.command}${r.rowCount !== null ? ` (${r.rowCount} rows)` : ''}`);
            });
        } else if (result.command) {
            console.log(`  ${result.command}${result.rowCount !== null ? ` (${result.rowCount} rows)` : ''}`);
        }

        await pool.end();
        console.log('\nDatabase connection closed.');

    } catch (err) {
        console.error('Migration error:', err.message);
        if (err.position) {
            console.error(`Error at position ${err.position}`);
        }
        process.exit(1);
    }
}

// Get migration file from command line arguments
const args = process.argv.slice(2);
if (args.length === 0) {
    console.log('Usage: node scripts/run-migration.js <migration-file.sql>');
    console.log('\nAvailable migrations:');
    const migrationsDir = path.join(__dirname, 'migrations');
    if (fs.existsSync(migrationsDir)) {
        const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
        files.forEach(f => console.log(`  - scripts/migrations/${f}`));
    }
    process.exit(0);
}

runMigration(args[0]);
