# Schema Agent Knowledge Base

## Overview
This knowledge base contains learnings, patterns, and gotchas for database schema work in the FraudWatch/SomaliScan project.

## Project Context
- **Database**: Supabase (PostgreSQL)
- **Project Ref**: powsedjqwgniermriadb
- **Existing Tables**: organizations, ppp_loans, eidl_loans, h1b_applications

## Patterns

### Table Creation Pattern
```sql
CREATE TABLE IF NOT EXISTS table_name (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- columns here
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### RLS Pattern (Public Data)
```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "table_name_public_read" ON table_name
    FOR SELECT USING (true);

-- Service role write access
CREATE POLICY "table_name_service_write" ON table_name
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
```

### Updated At Trigger
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_table_updated_at
    BEFORE UPDATE ON table_name
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### Trigram Search Index
Requires pg_trgm extension:
```sql
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE INDEX idx_name ON table_name USING gin(column_name gin_trgm_ops);
```

## Gotchas

1. **Supabase JS client cannot execute DDL**: The @supabase/supabase-js client does not support raw SQL execution. Use:
   - Supabase SQL Editor (dashboard)
   - `psql` with DATABASE_URL
   - Supabase CLI with `--db-url` flag

2. **PostGIS may not be enabled**: Check if PostGIS extension exists before creating spatial indexes. Use conditional DO block.

3. **RLS must be enabled**: New tables need RLS policies or they will be inaccessible via the REST API.

4. **Use IF NOT EXISTS/IF EXISTS**: For idempotent migrations that can be re-run safely.

## Bugs Fixed

| Date | Bug | Fix |
|------|-----|-----|
| 2026-01-02 | PostGIS index fails if extension not installed | Added conditional DO block to check for postgis extension before creating spatial index |

## Useful SQL Snippets

### Check existing extensions
```sql
SELECT * FROM pg_extension;
```

### Check table exists
```sql
SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'table_name');
```

### Get table structure
```sql
\d table_name
-- or
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'table_name';
```

## Migration Files

| File | Description | Status |
|------|-------------|--------|
| scripts/migrations/001_create_h1b_applications.sql | H-1B LCA applications table | Created 2026-01-02 |

## Changelog

### 2026-01-02
- Created initial knowledge base
- Added h1b_applications migration (001)
- Documented PostGIS gotcha with conditional spatial index
- Added patterns for RLS, triggers, and trigram indexes
