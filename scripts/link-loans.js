#!/usr/bin/env node

/**
 * Script to link unlinked PPP and EIDL loans to organizations
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://powsedjqwgniermriadb.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvd3NlZGpxd2duaWVybXJpYWRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njk1Nzk2OCwiZXhwIjoyMDgyNTMzOTY4fQ.hVub2maoGMdtou7SEwPVDGGVOckHeB008F4M7adJRKk'
);

function normalizeName(name) {
  if (!name) return null;
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function linkUnlinkedPPPLoans() {
  console.log('=== Linking Unlinked PPP Loans ===');

  // Get count first
  const { count } = await supabase
    .from('ppp_loans')
    .select('id', { count: 'exact', head: true })
    .is('organization_id', null);

  console.log(`Found ${count} unlinked PPP loans`);

  const BATCH_SIZE = 500;
  let processed = 0;
  let created = 0;
  let linked = 0;

  while (processed < count) {
    // Fetch batch of unlinked loans
    const { data: loans, error } = await supabase
      .from('ppp_loans')
      .select('id, borrower_name, borrower_address, borrower_city, borrower_state, borrower_zip, naics_code')
      .is('organization_id', null)
      .limit(BATCH_SIZE);

    if (error) {
      console.error('Error fetching loans:', error.message);
      break;
    }

    if (!loans || loans.length === 0) break;

    for (const loan of loans) {
      if (!loan.borrower_name) {
        processed++;
        continue;
      }

      const normalizedName = normalizeName(loan.borrower_name);
      const state = loan.borrower_state?.length === 2 ? loan.borrower_state.toUpperCase() : null;

      // Try to find existing org
      let orgId = null;

      if (normalizedName && state) {
        const { data: existingOrg } = await supabase
          .from('organizations')
          .select('id')
          .eq('name_normalized', normalizedName)
          .eq('state', state)
          .limit(1)
          .single();

        if (existingOrg) {
          orgId = existingOrg.id;
        }
      }

      // Create new org if not found
      if (!orgId) {
        const { data: newOrg, error: createError } = await supabase
          .from('organizations')
          .insert({
            legal_name: loan.borrower_name,
            name_normalized: normalizedName,
            address: loan.borrower_address,
            city: loan.borrower_city,
            state: state,
            zip_code: loan.borrower_zip,
            naics_code: loan.naics_code,
            is_ppp_recipient: true,
            data_sources: ['ppp_sba']
          })
          .select('id')
          .single();

        if (createError) {
          console.error('Error creating org:', createError.message);
          processed++;
          continue;
        }

        orgId = newOrg.id;
        created++;
      }

      // Link the loan
      const { error: updateError } = await supabase
        .from('ppp_loans')
        .update({ organization_id: orgId })
        .eq('id', loan.id);

      if (!updateError) {
        linked++;
      }

      processed++;
    }

    console.log(`PPP: Processed ${processed}/${count} | Created ${created} orgs | Linked ${linked} loans`);
  }

  console.log(`\nPPP Complete: Created ${created} orgs, Linked ${linked} loans`);
  return { created, linked };
}

async function linkEIDLLoans() {
  console.log('\n=== Linking EIDL Loans ===');

  // Get count first
  const { count } = await supabase
    .from('eidl_loans')
    .select('id', { count: 'exact', head: true })
    .is('organization_id', null);

  console.log(`Found ${count} unlinked EIDL loans`);

  const BATCH_SIZE = 500;
  let processed = 0;
  let created = 0;
  let matched = 0;
  let linked = 0;

  while (processed < count) {
    // Fetch batch of unlinked loans
    const { data: loans, error } = await supabase
      .from('eidl_loans')
      .select('id, borrower_name, borrower_name_normalized, borrower_address, borrower_city, borrower_state, borrower_zip')
      .is('organization_id', null)
      .limit(BATCH_SIZE);

    if (error) {
      console.error('Error fetching EIDL loans:', error.message);
      break;
    }

    if (!loans || loans.length === 0) break;

    for (const loan of loans) {
      if (!loan.borrower_name) {
        processed++;
        continue;
      }

      const normalizedName = loan.borrower_name_normalized || normalizeName(loan.borrower_name);
      const state = loan.borrower_state?.length === 2 ? loan.borrower_state.toUpperCase() : null;

      // Try to find existing org
      let orgId = null;

      if (normalizedName && state) {
        const { data: existingOrg } = await supabase
          .from('organizations')
          .select('id')
          .eq('name_normalized', normalizedName)
          .eq('state', state)
          .limit(1)
          .single();

        if (existingOrg) {
          orgId = existingOrg.id;
          matched++;
        }
      }

      // Create new org if not found
      if (!orgId) {
        const { data: newOrg, error: createError } = await supabase
          .from('organizations')
          .insert({
            legal_name: loan.borrower_name,
            name_normalized: normalizedName,
            address: loan.borrower_address,
            city: loan.borrower_city,
            state: state,
            zip_code: loan.borrower_zip,
            is_ppp_recipient: false,
            data_sources: ['eidl_sba']
          })
          .select('id')
          .single();

        if (createError) {
          console.error('Error creating org:', createError.message);
          processed++;
          continue;
        }

        orgId = newOrg.id;
        created++;
      }

      // Link the loan
      const { error: updateError } = await supabase
        .from('eidl_loans')
        .update({ organization_id: orgId })
        .eq('id', loan.id);

      if (!updateError) {
        linked++;
      }

      processed++;
    }

    console.log(`EIDL: Processed ${processed}/${count} | Matched ${matched} | Created ${created} orgs | Linked ${linked} loans`);
  }

  console.log(`\nEIDL Complete: Matched ${matched} existing orgs, Created ${created} new orgs, Linked ${linked} loans`);
  return { matched, created, linked };
}

async function main() {
  console.log('Starting loan linking process...\n');

  const pppResult = await linkUnlinkedPPPLoans();
  const eidlResult = await linkEIDLLoans();

  console.log('\n=== SUMMARY ===');
  console.log(`PPP: Created ${pppResult.created} orgs, Linked ${pppResult.linked} loans`);
  console.log(`EIDL: Matched ${eidlResult.matched}, Created ${eidlResult.created} orgs, Linked ${eidlResult.linked} loans`);
}

main().catch(console.error);
