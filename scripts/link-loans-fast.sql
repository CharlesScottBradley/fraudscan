-- Fast SQL script to link unlinked PPP and EIDL loans to organizations
-- Run this directly in Supabase SQL editor or via psql

-- Step 1: Link PPP loans to existing orgs by matching normalized name + state
UPDATE ppp_loans p
SET organization_id = o.id
FROM organizations o
WHERE p.organization_id IS NULL
  AND o.name_normalized = lower(regexp_replace(p.borrower_name, '[^a-zA-Z0-9\s]', '', 'g'))
  AND o.state = upper(p.borrower_state)
  AND length(p.borrower_state) = 2;

-- Step 2: Create orgs for remaining unlinked PPP loans
WITH new_orgs AS (
  INSERT INTO organizations (
    legal_name,
    name_normalized,
    address,
    city,
    state,
    zip_code,
    naics_code,
    is_ppp_recipient,
    data_sources
  )
  SELECT DISTINCT ON (lower(regexp_replace(borrower_name, '[^a-zA-Z0-9\s]', '', 'g')), upper(borrower_state))
    borrower_name,
    lower(regexp_replace(borrower_name, '[^a-zA-Z0-9\s]', '', 'g')),
    borrower_address,
    borrower_city,
    CASE WHEN length(borrower_state) = 2 THEN upper(borrower_state) ELSE NULL END,
    borrower_zip,
    naics_code,
    true,
    ARRAY['ppp_sba']
  FROM ppp_loans
  WHERE organization_id IS NULL
    AND borrower_name IS NOT NULL
  RETURNING id, name_normalized, state
)
UPDATE ppp_loans p
SET organization_id = new_orgs.id
FROM new_orgs
WHERE p.organization_id IS NULL
  AND lower(regexp_replace(p.borrower_name, '[^a-zA-Z0-9\s]', '', 'g')) = new_orgs.name_normalized
  AND (
    (upper(p.borrower_state) = new_orgs.state AND length(p.borrower_state) = 2)
    OR (new_orgs.state IS NULL AND (p.borrower_state IS NULL OR length(p.borrower_state) != 2))
  );

-- Step 3: Link EIDL loans to existing orgs
UPDATE eidl_loans e
SET organization_id = o.id
FROM organizations o
WHERE e.organization_id IS NULL
  AND o.name_normalized = COALESCE(
    e.borrower_name_normalized,
    lower(regexp_replace(e.borrower_name, '[^a-zA-Z0-9\s]', '', 'g'))
  )
  AND o.state = upper(e.borrower_state)
  AND length(e.borrower_state) = 2;

-- Step 4: Create orgs for remaining unlinked EIDL loans
WITH new_eidl_orgs AS (
  INSERT INTO organizations (
    legal_name,
    name_normalized,
    address,
    city,
    state,
    zip_code,
    is_ppp_recipient,
    data_sources
  )
  SELECT DISTINCT ON (
    COALESCE(borrower_name_normalized, lower(regexp_replace(borrower_name, '[^a-zA-Z0-9\s]', '', 'g'))),
    upper(borrower_state)
  )
    borrower_name,
    COALESCE(borrower_name_normalized, lower(regexp_replace(borrower_name, '[^a-zA-Z0-9\s]', '', 'g'))),
    borrower_address,
    borrower_city,
    CASE WHEN length(borrower_state) = 2 THEN upper(borrower_state) ELSE NULL END,
    borrower_zip,
    false,
    ARRAY['eidl_sba']
  FROM eidl_loans
  WHERE organization_id IS NULL
    AND borrower_name IS NOT NULL
  RETURNING id, name_normalized, state
)
UPDATE eidl_loans e
SET organization_id = new_eidl_orgs.id
FROM new_eidl_orgs
WHERE e.organization_id IS NULL
  AND COALESCE(e.borrower_name_normalized, lower(regexp_replace(e.borrower_name, '[^a-zA-Z0-9\s]', '', 'g'))) = new_eidl_orgs.name_normalized
  AND (
    (upper(e.borrower_state) = new_eidl_orgs.state AND length(e.borrower_state) = 2)
    OR (new_eidl_orgs.state IS NULL AND (e.borrower_state IS NULL OR length(e.borrower_state) != 2))
  );
