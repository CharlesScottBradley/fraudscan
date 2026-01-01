#!/usr/bin/env node

/**
 * Simple loan linking - one loan at a time for reliability
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://powsedjqwgniermriadb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvd3NlZGpxd2duaWVybXJpYWRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njk1Nzk2OCwiZXhwIjoyMDgyNTMzOTY4fQ.hVub2maoGMdtou7SEwPVDGGVOckHeB008F4M7adJRKk'
);

function normalizeName(name) {
  if (!name) return null;
  return name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

async function getStats() {
  const { count: pppUnlinked } = await supabase.from('ppp_loans').select('id', { count: 'exact', head: true }).is('organization_id', null);
  const { count: eidlUnlinked } = await supabase.from('eidl_loans').select('id', { count: 'exact', head: true }).is('organization_id', null);
  const { count: totalOrgs } = await supabase.from('organizations').select('id', { count: 'exact', head: true });
  return { pppUnlinked, eidlUnlinked, totalOrgs };
}

async function findOrCreateOrg(name, state, address, city, zip, naicsCode, isPpp = true) {
  const norm = normalizeName(name);
  if (!norm) return null;

  // First try exact match with state
  let query = supabase.from('organizations').select('id').eq('name_normalized', norm);
  if (state) query = query.eq('state', state);
  const { data: exactMatch } = await query.limit(1);
  if (exactMatch && exactMatch[0]) return exactMatch[0].id;

  // Try match without state
  const { data: nameMatch } = await supabase.from('organizations').select('id').eq('name_normalized', norm).limit(1);
  if (nameMatch && nameMatch[0]) return nameMatch[0].id;

  // Create new org
  const { data: newOrg, error } = await supabase.from('organizations').insert({
    legal_name: name,
    name_normalized: norm,
    address,
    city,
    state,
    zip_code: zip,
    naics_code: naicsCode,
    is_ppp_recipient: isPpp,
    data_sources: [isPpp ? 'ppp_sba' : 'eidl_sba']
  }).select('id').single();

  if (error) {
    // If insert failed, try lookup again (race condition)
    const { data: retry } = await supabase.from('organizations').select('id').eq('name_normalized', norm).limit(1);
    if (retry && retry[0]) return retry[0].id;
    console.error('Failed to create org:', name, error.message);
    return null;
  }

  return newOrg?.id;
}

async function linkPPPBatch() {
  const BATCH_SIZE = 500;
  const CONCURRENT = 50;

  const { data: loans, error } = await supabase
    .from('ppp_loans')
    .select('id, borrower_name, borrower_address, borrower_city, borrower_state, borrower_zip, naics_code')
    .is('organization_id', null)
    .limit(BATCH_SIZE);

  if (error || !loans || loans.length === 0) return { processed: 0, linked: 0 };

  let linked = 0;
  const tasks = loans.map(async (loan) => {
    if (!loan.borrower_name) return;

    const state = loan.borrower_state?.length === 2 ? loan.borrower_state.toUpperCase() : null;
    const orgId = await findOrCreateOrg(
      loan.borrower_name,
      state,
      loan.borrower_address,
      loan.borrower_city,
      loan.borrower_zip,
      loan.naics_code,
      true
    );

    if (orgId) {
      const { error: updateErr } = await supabase.from('ppp_loans').update({ organization_id: orgId }).eq('id', loan.id);
      if (!updateErr) linked++;
    }
  });

  // Process in chunks
  for (let i = 0; i < tasks.length; i += CONCURRENT) {
    await Promise.all(tasks.slice(i, i + CONCURRENT));
  }

  return { processed: loans.length, linked };
}

async function linkEIDLBatch() {
  const BATCH_SIZE = 500;
  const CONCURRENT = 50;

  const { data: loans, error } = await supabase
    .from('eidl_loans')
    .select('id, borrower_name, borrower_name_normalized, borrower_address, borrower_city, borrower_state, borrower_zip')
    .is('organization_id', null)
    .limit(BATCH_SIZE);

  if (error || !loans || loans.length === 0) return { processed: 0, linked: 0 };

  let linked = 0;
  const tasks = loans.map(async (loan) => {
    if (!loan.borrower_name) return;

    const state = loan.borrower_state?.length === 2 ? loan.borrower_state.toUpperCase() : null;
    const orgId = await findOrCreateOrg(
      loan.borrower_name,
      state,
      loan.borrower_address,
      loan.borrower_city,
      loan.borrower_zip,
      null,
      false
    );

    if (orgId) {
      const { error: updateErr } = await supabase.from('eidl_loans').update({ organization_id: orgId }).eq('id', loan.id);
      if (!updateErr) linked++;
    }
  });

  for (let i = 0; i < tasks.length; i += CONCURRENT) {
    await Promise.all(tasks.slice(i, i + CONCURRENT));
  }

  return { processed: loans.length, linked };
}

async function main() {
  console.log('=== Simple Loan Linking ===\n');

  const before = await getStats();
  console.log(`Before: PPP=${before.pppUnlinked} unlinked, EIDL=${before.eidlUnlinked} unlinked, Orgs=${before.totalOrgs}\n`);

  // Link PPP
  console.log('--- PPP ---');
  let pppTotal = { processed: 0, linked: 0 };
  let iteration = 0;
  while (true) {
    iteration++;
    const result = await linkPPPBatch();
    if (result.processed === 0) break;
    pppTotal.processed += result.processed;
    pppTotal.linked += result.linked;
    console.log(`PPP #${iteration}: +${result.linked}/${result.processed} (Total: ${pppTotal.linked})`);
  }

  // Link EIDL
  console.log('\n--- EIDL ---');
  let eidlTotal = { processed: 0, linked: 0 };
  iteration = 0;
  while (true) {
    iteration++;
    const result = await linkEIDLBatch();
    if (result.processed === 0) break;
    eidlTotal.processed += result.processed;
    eidlTotal.linked += result.linked;
    console.log(`EIDL #${iteration}: +${result.linked}/${result.processed} (Total: ${eidlTotal.linked})`);
  }

  const after = await getStats();
  console.log(`\n=== RESULTS ===`);
  console.log(`After: PPP=${after.pppUnlinked} unlinked, EIDL=${after.eidlUnlinked} unlinked, Orgs=${after.totalOrgs}`);
  console.log(`PPP linked: ${pppTotal.linked}`);
  console.log(`EIDL linked: ${eidlTotal.linked}`);
  console.log(`New orgs: +${after.totalOrgs - before.totalOrgs}`);
}

main().catch(console.error);
