#!/usr/bin/env node

/**
 * Link loans using direct SQL via Supabase RPC
 * Creates a function and calls it for bulk operations
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://powsedjqwgniermriadb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvd3NlZGpxd2duaWVybXJpYWRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njk1Nzk2OCwiZXhwIjoyMDgyNTMzOTY4fQ.hVub2maoGMdtou7SEwPVDGGVOckHeB008F4M7adJRKk'
);

async function getStats() {
  const { count: pppUnlinked } = await supabase.from('ppp_loans').select('id', { count: 'exact', head: true }).is('organization_id', null);
  const { count: eidlUnlinked } = await supabase.from('eidl_loans').select('id', { count: 'exact', head: true }).is('organization_id', null);
  const { count: totalOrgs } = await supabase.from('organizations').select('id', { count: 'exact', head: true });
  const { count: pppTotal } = await supabase.from('ppp_loans').select('id', { count: 'exact', head: true });
  const { count: eidlTotal } = await supabase.from('eidl_loans').select('id', { count: 'exact', head: true });
  return { pppUnlinked, eidlUnlinked, totalOrgs, pppTotal, eidlTotal };
}

function normalizeName(name) {
  if (!name) return null;
  return name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

async function linkPPPBatch(batchSize = 5000) {
  console.log(`\nProcessing PPP batch of ${batchSize}...`);

  // Get unlinked PPP loans
  const { data: loans, error } = await supabase
    .from('ppp_loans')
    .select('id, borrower_name, borrower_address, borrower_city, borrower_state, borrower_zip, naics_code')
    .is('organization_id', null)
    .limit(batchSize);

  if (error || !loans || loans.length === 0) {
    console.log('No more unlinked PPP loans or error:', error?.message);
    return { processed: 0, linked: 0, created: 0 };
  }

  console.log(`Fetched ${loans.length} unlinked PPP loans`);

  // Group by normalized name + state
  const groups = {};
  for (const loan of loans) {
    if (!loan.borrower_name) continue;
    const norm = normalizeName(loan.borrower_name);
    const state = loan.borrower_state?.length === 2 ? loan.borrower_state.toUpperCase() : null;
    const key = `${norm}||${state || 'NULL'}`;
    if (!groups[key]) {
      groups[key] = {
        norm,
        state,
        loans: [],
        template: loan
      };
    }
    groups[key].loans.push(loan.id);
  }

  const uniqueGroups = Object.values(groups);
  console.log(`Found ${uniqueGroups.length} unique borrower+state combinations`);

  // Batch lookup existing orgs (100 at a time)
  const orgIdMap = {};
  const lookupBatches = [];
  for (let i = 0; i < uniqueGroups.length; i += 50) {
    lookupBatches.push(uniqueGroups.slice(i, i + 50));
  }

  let matched = 0;
  for (const batch of lookupBatches) {
    const lookupPromises = batch.map(async (g) => {
      let query = supabase.from('organizations').select('id').eq('name_normalized', g.norm);
      if (g.state) query = query.eq('state', g.state);
      const { data } = await query.limit(1);
      if (data && data[0]) {
        orgIdMap[`${g.norm}||${g.state || 'NULL'}`] = data[0].id;
        matched++;
      }
    });
    await Promise.all(lookupPromises);
  }

  console.log(`Matched ${matched} to existing orgs`);

  // Create orgs for unmatched
  const toCreate = uniqueGroups.filter(g => !orgIdMap[`${g.norm}||${g.state || 'NULL'}`]);
  console.log(`Creating ${toCreate.length} new orgs...`);

  if (toCreate.length > 0) {
    // Insert in batches of 500
    for (let i = 0; i < toCreate.length; i += 500) {
      const batch = toCreate.slice(i, i + 500);
      const inserts = batch.map(g => ({
        legal_name: g.template.borrower_name,
        name_normalized: g.norm,
        address: g.template.borrower_address,
        city: g.template.borrower_city,
        state: g.state,
        zip_code: g.template.borrower_zip,
        naics_code: g.template.naics_code,
        is_ppp_recipient: true,
        data_sources: ['ppp_sba']
      }));

      const { data: newOrgs, error: insertErr } = await supabase
        .from('organizations')
        .insert(inserts)
        .select('id, name_normalized, state');

      if (insertErr) {
        console.error('Insert error:', insertErr.message);
      }

      for (const org of newOrgs || []) {
        orgIdMap[`${org.name_normalized}||${org.state || 'NULL'}`] = org.id;
      }

      // Look up any that failed to insert (already exist)
      const missing = batch.filter(g => !orgIdMap[`${g.norm}||${g.state || 'NULL'}`]);
      if (missing.length > 0) {
        const lookupPromises = missing.map(async (g) => {
          let query = supabase.from('organizations').select('id').eq('name_normalized', g.norm);
          if (g.state) query = query.eq('state', g.state);
          const { data } = await query.limit(1);
          if (data && data[0]) {
            orgIdMap[`${g.norm}||${g.state || 'NULL'}`] = data[0].id;
          }
        });
        await Promise.all(lookupPromises);
      }
    }
  }

  console.log(`Total org mappings: ${Object.keys(orgIdMap).length}`);

  // Update loans with org IDs (parallel, 200 at a time)
  let linked = 0;
  const updatePromises = [];

  for (const g of uniqueGroups) {
    const orgId = orgIdMap[`${g.norm}||${g.state || 'NULL'}`];
    if (!orgId) continue;

    for (const loanId of g.loans) {
      updatePromises.push(
        supabase.from('ppp_loans').update({ organization_id: orgId }).eq('id', loanId)
          .then(() => { linked++; })
          .catch(() => {})
      );
    }
  }

  // Run updates in chunks of 200
  for (let i = 0; i < updatePromises.length; i += 200) {
    await Promise.all(updatePromises.slice(i, i + 200));
    process.stdout.write(`\rUpdated ${Math.min(i + 200, updatePromises.length)}/${updatePromises.length} loans`);
  }
  console.log();

  return { processed: loans.length, linked, created: toCreate.length };
}

async function linkEIDLBatch(batchSize = 5000) {
  console.log(`\nProcessing EIDL batch of ${batchSize}...`);

  const { data: loans, error } = await supabase
    .from('eidl_loans')
    .select('id, borrower_name, borrower_name_normalized, borrower_address, borrower_city, borrower_state, borrower_zip')
    .is('organization_id', null)
    .limit(batchSize);

  if (error || !loans || loans.length === 0) {
    console.log('No more unlinked EIDL loans or error:', error?.message);
    return { processed: 0, linked: 0, matched: 0, created: 0 };
  }

  console.log(`Fetched ${loans.length} unlinked EIDL loans`);

  const groups = {};
  for (const loan of loans) {
    if (!loan.borrower_name) continue;
    const norm = loan.borrower_name_normalized || normalizeName(loan.borrower_name);
    const state = loan.borrower_state?.length === 2 ? loan.borrower_state.toUpperCase() : null;
    const key = `${norm}||${state || 'NULL'}`;
    if (!groups[key]) {
      groups[key] = { norm, state, loans: [], template: loan };
    }
    groups[key].loans.push(loan.id);
  }

  const uniqueGroups = Object.values(groups);
  console.log(`Found ${uniqueGroups.length} unique borrower+state combinations`);

  const orgIdMap = {};
  let matched = 0;

  // Lookup existing
  for (let i = 0; i < uniqueGroups.length; i += 50) {
    const batch = uniqueGroups.slice(i, i + 50);
    const lookupPromises = batch.map(async (g) => {
      let query = supabase.from('organizations').select('id').eq('name_normalized', g.norm);
      if (g.state) query = query.eq('state', g.state);
      const { data } = await query.limit(1);
      if (data && data[0]) {
        orgIdMap[`${g.norm}||${g.state || 'NULL'}`] = data[0].id;
        matched++;
      }
    });
    await Promise.all(lookupPromises);
  }

  console.log(`Matched ${matched} to existing orgs`);

  const toCreate = uniqueGroups.filter(g => !orgIdMap[`${g.norm}||${g.state || 'NULL'}`]);
  console.log(`Creating ${toCreate.length} new orgs...`);

  if (toCreate.length > 0) {
    for (let i = 0; i < toCreate.length; i += 500) {
      const batch = toCreate.slice(i, i + 500);
      const inserts = batch.map(g => ({
        legal_name: g.template.borrower_name,
        name_normalized: g.norm,
        address: g.template.borrower_address,
        city: g.template.borrower_city,
        state: g.state,
        zip_code: g.template.borrower_zip,
        is_ppp_recipient: false,
        data_sources: ['eidl_sba']
      }));

      const { data: newOrgs, error: insertErr } = await supabase
        .from('organizations')
        .insert(inserts)
        .select('id, name_normalized, state');

      if (insertErr) {
        console.error('Insert error:', insertErr.message);
      }

      for (const org of newOrgs || []) {
        orgIdMap[`${org.name_normalized}||${org.state || 'NULL'}`] = org.id;
      }

      // Look up any that failed to insert (already exist)
      const missing = batch.filter(g => !orgIdMap[`${g.norm}||${g.state || 'NULL'}`]);
      if (missing.length > 0) {
        const lookupPromises = missing.map(async (g) => {
          let query = supabase.from('organizations').select('id').eq('name_normalized', g.norm);
          if (g.state) query = query.eq('state', g.state);
          const { data } = await query.limit(1);
          if (data && data[0]) {
            orgIdMap[`${g.norm}||${g.state || 'NULL'}`] = data[0].id;
          }
        });
        await Promise.all(lookupPromises);
      }
    }
  }

  console.log(`Total org mappings: ${Object.keys(orgIdMap).length}`);

  let linked = 0;
  const updatePromises = [];

  for (const g of uniqueGroups) {
    const orgId = orgIdMap[`${g.norm}||${g.state || 'NULL'}`];
    if (!orgId) continue;

    for (const loanId of g.loans) {
      updatePromises.push(
        supabase.from('eidl_loans').update({ organization_id: orgId }).eq('id', loanId)
          .then(() => { linked++; })
          .catch(() => {})
      );
    }
  }

  for (let i = 0; i < updatePromises.length; i += 200) {
    await Promise.all(updatePromises.slice(i, i + 200));
    process.stdout.write(`\rUpdated ${Math.min(i + 200, updatePromises.length)}/${updatePromises.length} loans`);
  }
  console.log();

  return { processed: loans.length, linked, matched, created: toCreate.length };
}

async function main() {
  console.log('=== Loan Linking Script (Parallel) ===\n');

  const before = await getStats();
  console.log('Before:');
  console.log(`  PPP: ${before.pppUnlinked}/${before.pppTotal} unlinked (${((before.pppUnlinked/before.pppTotal)*100).toFixed(1)}%)`);
  console.log(`  EIDL: ${before.eidlUnlinked}/${before.eidlTotal} unlinked (${((before.eidlUnlinked/before.eidlTotal)*100).toFixed(1)}%)`);
  console.log(`  Total orgs: ${before.totalOrgs}`);

  // Process PPP in batches
  console.log('\n--- PPP LOANS ---');
  let pppTotals = { processed: 0, linked: 0, created: 0 };
  let iteration = 0;
  while (true) {
    iteration++;
    const result = await linkPPPBatch(10000);
    if (result.processed === 0) break;
    pppTotals.processed += result.processed;
    pppTotals.linked += result.linked;
    pppTotals.created += result.created;
    console.log(`PPP Iteration ${iteration}: +${result.linked} linked, +${result.created} created (Total: ${pppTotals.linked} linked, ${pppTotals.created} created)`);
  }

  // Process EIDL in batches
  console.log('\n--- EIDL LOANS ---');
  let eidlTotals = { processed: 0, linked: 0, matched: 0, created: 0 };
  iteration = 0;
  while (true) {
    iteration++;
    const result = await linkEIDLBatch(10000);
    if (result.processed === 0) break;
    eidlTotals.processed += result.processed;
    eidlTotals.linked += result.linked;
    eidlTotals.matched += result.matched;
    eidlTotals.created += result.created;
    console.log(`EIDL Iteration ${iteration}: +${result.linked} linked, +${result.matched} matched, +${result.created} created (Total: ${eidlTotals.linked} linked)`);
  }

  const after = await getStats();
  console.log('\n=== FINAL RESULTS ===');
  console.log('After:');
  console.log(`  PPP: ${after.pppUnlinked}/${after.pppTotal} unlinked (${((after.pppUnlinked/after.pppTotal)*100).toFixed(1)}%)`);
  console.log(`  EIDL: ${after.eidlUnlinked}/${after.eidlTotal} unlinked (${((after.eidlUnlinked/after.eidlTotal)*100).toFixed(1)}%)`);
  console.log(`  Total orgs: ${after.totalOrgs} (+${after.totalOrgs - before.totalOrgs} new)`);
  console.log(`\nPPP: Linked ${pppTotals.linked}, Created ${pppTotals.created} orgs`);
  console.log(`EIDL: Linked ${eidlTotals.linked}, Matched ${eidlTotals.matched}, Created ${eidlTotals.created} orgs`);
}

main().catch(console.error);
