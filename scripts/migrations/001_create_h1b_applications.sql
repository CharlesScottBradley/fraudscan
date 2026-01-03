-- Migration: Create h1b_applications table for DOL H-1B Labor Condition Application data
-- Created: 2026-01-02
-- Description: Stores H-1B LCA disclosure data from DOL with cross-reference flags for fraud detection

-- Ensure required extensions are enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
-- PostGIS is optional - for spatial indexing (may require manual enabling in Supabase dashboard)
-- CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create the h1b_applications table
CREATE TABLE IF NOT EXISTS h1b_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Case Info
    case_number VARCHAR(20) UNIQUE NOT NULL, -- I-XXX-XXXXX-XXXXXX format
    case_status VARCHAR(50), -- Certified, Certified-Withdrawn, Denied, Withdrawn
    received_date DATE,
    decision_date DATE,
    visa_class VARCHAR(20), -- H-1B, H-1B1 Chile, H-1B1 Singapore, E-3 Australian

    -- Employer Info
    employer_name VARCHAR(255) NOT NULL,
    employer_address VARCHAR(255),
    employer_city VARCHAR(100),
    employer_state VARCHAR(2),
    employer_postal_code VARCHAR(20),
    employer_country VARCHAR(50),
    employer_phone VARCHAR(20),
    naics_code VARCHAR(10),

    -- Job Info
    job_title VARCHAR(255),
    soc_code VARCHAR(20), -- Standard Occupational Classification
    soc_title VARCHAR(255),
    full_time_position BOOLEAN,
    total_workers INTEGER,

    -- Wage Info
    wage_rate_from DECIMAL(12, 2),
    wage_rate_to DECIMAL(12, 2),
    wage_unit VARCHAR(20), -- Hour, Week, Bi-Weekly, Month, Year
    prevailing_wage DECIMAL(12, 2),
    pw_unit VARCHAR(20),

    -- Worksite (primary work location - this is what we map)
    worksite_address VARCHAR(255),
    worksite_city VARCHAR(100),
    worksite_state VARCHAR(2),
    worksite_postal_code VARCHAR(20),
    worksite_county VARCHAR(100),

    -- Geo for map (worksite location)
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),

    -- H-1B Dependent employer flags
    h1b_dependent BOOLEAN,
    willful_violator BOOLEAN,

    -- Employment dates
    employment_start_date DATE,
    employment_end_date DATE,

    -- Cross-reference flags (populated later)
    ppp_match_id UUID,
    eidl_match_id UUID,
    org_id UUID REFERENCES organizations(id),
    fraud_flags TEXT[],

    -- Metadata
    data_source VARCHAR(100) DEFAULT 'dol_lca',
    fiscal_year INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add table comment
COMMENT ON TABLE h1b_applications IS 'DOL H-1B Labor Condition Application disclosure data for fraud detection cross-referencing';

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_h1b_case_number ON h1b_applications(case_number);
CREATE INDEX IF NOT EXISTS idx_h1b_employer_name ON h1b_applications USING gin(employer_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_h1b_employer_state ON h1b_applications(employer_state);
CREATE INDEX IF NOT EXISTS idx_h1b_worksite_state ON h1b_applications(worksite_state);
CREATE INDEX IF NOT EXISTS idx_h1b_naics ON h1b_applications(naics_code);
CREATE INDEX IF NOT EXISTS idx_h1b_visa_class ON h1b_applications(visa_class);
CREATE INDEX IF NOT EXISTS idx_h1b_case_status ON h1b_applications(case_status);
CREATE INDEX IF NOT EXISTS idx_h1b_fiscal_year ON h1b_applications(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_h1b_decision_date ON h1b_applications(decision_date);
CREATE INDEX IF NOT EXISTS idx_h1b_geo ON h1b_applications(latitude, longitude) WHERE latitude IS NOT NULL;

-- For geo bounding box queries on the map (requires PostGIS)
-- This index will only be created if PostGIS is available
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_h1b_geo_box ON h1b_applications USING gist (
            ST_MakePoint(longitude, latitude)
        ) WHERE latitude IS NOT NULL AND longitude IS NOT NULL';
    ELSE
        RAISE NOTICE 'PostGIS not available, skipping spatial index idx_h1b_geo_box';
    END IF;
END
$$;

-- Foreign key indexes for cross-reference columns
CREATE INDEX IF NOT EXISTS idx_h1b_ppp_match ON h1b_applications(ppp_match_id) WHERE ppp_match_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_h1b_eidl_match ON h1b_applications(eidl_match_id) WHERE eidl_match_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_h1b_org_id ON h1b_applications(org_id) WHERE org_id IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE h1b_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow public read access (this is public government data)
CREATE POLICY "h1b_applications_public_read" ON h1b_applications
    FOR SELECT
    USING (true);

-- RLS Policy: Only service role can insert/update/delete
CREATE POLICY "h1b_applications_service_write" ON h1b_applications
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_h1b_applications_updated_at ON h1b_applications;
CREATE TRIGGER update_h1b_applications_updated_at
    BEFORE UPDATE ON h1b_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
