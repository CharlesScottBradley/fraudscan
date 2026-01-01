#!/usr/bin/env node

/**
 * Fast script to link loans using SQL queries
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://powsedjqwgniermriadb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvd3NlZGpxd2duaWVybXJpYWRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njk1Nzk2OCwiZXhwIjoyMDgyNTMzOTY4fQ.hVub2maoGMdtou7SEwPVDGGVOckHeB008F4M7adJRKk'
);

async function runSQL(sql, description) {
  console.log(`\n${description}...`);
  const start = Date.now();
  const { data, error } = await supabase.rpc('exec_sql', { sql });
  if (error) {
    // Try direct query if RPC not available
    console.log('RPC not available, using alternative method');
    return null;
  }
  console.log(`Done in ${((Date.now() - start) / 1000).toFixed(1)}s`);
  return data;
}

async function getStats() {
  const { count: pppUnlinked } = await supabase.from('ppp_loans').select('id', { count: 'exact', head: true }).is('organization_id', null);
  const { count: eidlUnlinked } = await supabase.from('eidl_loans').select('id', { count: 'exact', head: true }).is('organization_id', null);
  const { count: totalOrgs } = await supabase.from('organizations').select('id', { count: 'exact', head: true });
  return { pppUnlinked, eidlUnlinked, totalOrgs };
}

function normalizeName(name) {
  if (!name) return null;
  return name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

async function linkPPPLoansInBatches() {
  console.log('\n=== Linking PPP Loans ===');

  const BATCH_SIZE = 2000;
  let totalLinked = 0;
  let totalCreated = 0;
  let iteration = 0;

  while (true) {
    iteration++;

    // Get batch of unlinked loans
    const { data: loans, error } = await supabase
      .from('ppp_loans')
      .select('id, borrower_name, borrower_address, borrower_city, borrower_state, borrower_zip, naics_code')
      .is('organization_id', null)
      .limit(BATCH_SIZE);

    if (error) {
      console.error('Error fetching:', error.message);
      break;
    }

    if (!loans || loans.length === 0) {
      console.log('No more unlinked PPP loans');
      break;
    }

    // Build lookup map: normalized_name+state -> loan ids
    const loansByKey = {};
    const loansToProcess = [];

    for (const loan of loans) {
      if (!loan.borrower_name) continue;
      const norm = normalizeName(loan.borrower_name);
      const state = loan.borrower_state?.length === 2 ? loan.borrower_state.toUpperCase() : 'XX';
      const key = `${norm}|${state}`;
      if (!loansByKey[key]) loansByKey[key] = [];
      loansByKey[key].push(loan);
      loansToProcess.push({ ...loan, norm, state: state === 'XX' ? null : state, key });
    }

    // Get unique keys to look up
    const uniqueKeys = Object.keys(loansByKey);
    const keyParts = uniqueKeys.map(k => {
      const [norm, state] = k.split('|');
      return { norm, state: state === 'XX' ? null : state };
    });

    // Batch lookup existing orgs
    const existingOrgs = {};
    for (let i = 0; i < keyParts.length; i += 100) {
      const batch = keyParts.slice(i, i + 100);
      for (const { norm, state } of batch) {
        let query = supabase.from('organizations').select('id, name_normalized, state').eq('name_normalized', norm);
        if (state) query = query.eq('state', state);
        else query = query.is('state', null);

        const { data } = await query.limit(1);
        if (data && data[0]) {
          const key = `${norm}|${state || 'XX'}`;
          existingOrgs[key] = data[0].id;
        }
      }
    }

    // Create missing orgs
    const orgsToCreate = [];
    const keyToNewOrg = {};

    for (const { norm, state } of keyParts) {
      const key = `${norm}|${state || 'XX'}`;
      if (!existingOrgs[key]) {
        const loan = loansByKey[key][0];
        orgsToCreate.push({
          legal_name: loan.borrower_name,
          name_normalized: norm,
          address: loan.borrower_address,
          city: loan.borrower_city,
          state: state,
          zip_code: loan.borrower_zip,
          naics_code: loan.naics_code,
          is_ppp_recipient: true,
          data_sources: ['ppp_sba']
        });
        keyToNewOrg[key] = orgsToCreate.length - 1;
      }
    }

    // Insert new orgs
    if (orgsToCreate.length > 0) {
      const { data: newOrgs, error: insertError } = await supabase
        .from('organizations')
        .insert(orgsToCreate)
        .select('id, name_normalized, state');

      if (insertError) {
        console.error('Error creating orgs:', insertError.message);
      } else if (newOrgs) {
        for (const org of newOrgs) {
          const key = `${org.name_normalized}|${org.state || 'XX'}`;
          existingOrgs[key] = org.id;
        }
        totalCreated += newOrgs.length;
      }
    }

    // Update loans with org IDs
    const updates = [];
    for (const loan of loansToProcess) {
      const orgId = existingOrgs[loan.key];
      if (orgId) {
        updates.push({ id: loan.id, organization_id: orgId });
      }
    }

    // Batch update
    for (let i = 0; i < updates.length; i += 100) {
      const batch = updates.slice(i, i + 100);
      for (const { id, organization_id } of batch) {
        await supabase.from('ppp_loans').update({ organization_id }).eq('id', id);
      }
    }

    totalLinked += updates.length;
    console.log(`PPP Batch ${iteration}: Linked ${updates.length}, Created ${orgsToCreate.length} orgs (Total: ${totalLinked} linked, ${totalCreated} created)`);
  }

  return { linked: totalLinked, created: totalCreated };
}

async function linkEIDLLoansInBatches() {
  console.log('\n=== Linking EIDL Loans ===');

  const BATCH_SIZE = 2000;
  let totalLinked = 0;
  let totalCreated = 0;
  let totalMatched = 0;
  let iteration = 0;

  while (true) {
    iteration++;

    const { data: loans, error } = await supabase
      .from('eidl_loans')
      .select('id, borrower_name, borrower_name_normalized, borrower_address, borrower_city, borrower_state, borrower_zip')
      .is('organization_id', null)
      .limit(BATCH_SIZE);

    if (error) {
      console.error('Error fetching:', error.message);
      break;
    }

    if (!loans || loans.length === 0) {
      console.log('No more unlinked EIDL loans');
      break;
    }

    const loansByKey = {};
    const loansToProcess = [];

    for (const loan of loans) {
      if (!loan.borrower_name) continue;
      const norm = loan.borrower_name_normalized || normalizeName(loan.borrower_name);
      const state = loan.borrower_state?.length === 2 ? loan.borrower_state.toUpperCase() : 'XX';
      const key = `${norm}|${state}`;
      if (!loansByKey[key]) loansByKey[key] = [];
      loansByKey[key].push(loan);
      loansToProcess.push({ ...loan, norm, state: state === 'XX' ? null : state, key });
    }

    const uniqueKeys = Object.keys(loansByKey);
    const keyParts = uniqueKeys.map(k => {
      const [norm, state] = k.split('|');
      return { norm, state: state === 'XX' ? null : state };
    });

    const existingOrgs = {};
    let matchedInBatch = 0;

    for (let i = 0; i < keyParts.length; i += 100) {
      const batch = keyParts.slice(i, i + 100);
      for (const { norm, state } of batch) {
        let query = supabase.from('organizations').select('id, name_normalized, state').eq('name_normalized', norm);
        if (state) query = query.eq('state', state);
        else query = query.is('state', null);

        const { data } = await query.limit(1);
        if (data && data[0]) {
          const key = `${norm}|${state || 'XX'}`;
          existingOrgs[key] = data[0].id;
          matchedInBatch++;
        }
      }
    }

    totalMatched += matchedInBatch;

    const orgsToCreate = [];

    for (const { norm, state } of keyParts) {
      const key = `${norm}|${state || 'XX'}`;
      if (!existingOrgs[key]) {
        const loan = loansByKey[key][0];
        orgsToCreate.push({
          legal_name: loan.borrower_name,
          name_normalized: norm,
          address: loan.borrower_address,
          city: loan.borrower_city,
          state: state,
          zip_code: loan.borrower_zip,
          is_ppp_recipient: false,
          data_sources: ['eidl_sba']
        });
      }
    }

    if (orgsToCreate.length > 0) {
      const { data: newOrgs, error: insertError } = await supabase
        .from('organizations')
        .insert(orgsToCreate)
        .select('id, name_normalized, state');

      if (insertError) {
        console.error('Error creating orgs:', insertError.message);
      } else if (newOrgs) {
        for (const org of newOrgs) {
          const key = `${org.name_normalized}|${org.state || 'XX'}`;
          existingOrgs[key] = org.id;
        }
        totalCreated += newOrgs.length;
      }
    }

    const updates = [];
    for (const loan of loansToProcess) {
      const orgId = existingOrgs[loan.key];
      if (orgId) {
        updates.push({ id: loan.id, organization_id: orgId });
      }
    }

    for (let i = 0; i < updates.length; i += 100) {
      const batch = updates.slice(i, i + 100);
      for (const { id, organization_id } of batch) {
        await supabase.from('eidl_loans').update({ organization_id }).eq('id', id);
      }
    }

    totalLinked += updates.length;
    console.log(`EIDL Batch ${iteration}: Linked ${updates.length}, Matched ${matchedInBatch}, Created ${orgsToCreate.length} (Total: ${totalLinked} linked, ${totalMatched} matched, ${totalCreated} created)`);
  }

  return { linked: totalLinked, matched: totalMatched, created: totalCreated };
}

async function main() {
  console.log('=== Loan Linking Script ===');

  const before = await getStats();
  console.log(`\nBefore: PPP unlinked=${before.pppUnlinked}, EIDL unlinked=${before.eidlUnlinked}, Total orgs=${before.totalOrgs}`);

  const pppResult = await linkPPPLoansInBatches();
  const eidlResult = await linkEIDLLoansInBatches();

  const after = await getStats();
  console.log(`\nAfter: PPP unlinked=${after.pppUnlinked}, EIDL unlinked=${after.eidlUnlinked}, Total orgs=${after.totalOrgs}`);

  console.log('\n=== SUMMARY ===');
  console.log(`PPP: Linked ${pppResult.linked}, Created ${pppResult.created} orgs`);
  console.log(`EIDL: Linked ${eidlResult.linked}, Matched ${eidlResult.matched}, Created ${eidlResult.created} orgs`);
  console.log(`New orgs created: ${after.totalOrgs - before.totalOrgs}`);
}

main().catch(console.error);
