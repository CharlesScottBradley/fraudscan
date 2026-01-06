import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { data: grant, error } = await supabase
      .from('federal_grants')
      .select(`
        id,
        award_id,
        fain,
        uri,
        recipient_name,
        recipient_name_normalized,
        recipient_uei,
        recipient_duns,
        recipient_address,
        recipient_city,
        recipient_state,
        recipient_zip,
        recipient_county,
        recipient_country,
        award_amount,
        total_obligation,
        total_outlay,
        non_federal_funding,
        award_type,
        award_type_code,
        assistance_type,
        awarding_agency,
        awarding_agency_code,
        awarding_sub_agency,
        awarding_office,
        funding_agency,
        funding_agency_code,
        cfda_number,
        cfda_title,
        program_activity,
        award_date,
        start_date,
        end_date,
        last_modified_date,
        pop_city,
        pop_state,
        pop_zip,
        pop_county,
        pop_congressional_district,
        award_description,
        is_fraud_prone_industry,
        industry_category,
        organization_id,
        data_source,
        created_at,
        updated_at
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Grant not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    // Get related grants to the same recipient (if we have a match)
    let relatedGrants: unknown[] = [];
    if (grant.recipient_name) {
      const { data: related } = await supabase
        .from('federal_grants')
        .select('id, award_id, recipient_name, award_amount, awarding_agency, award_date')
        .ilike('recipient_name', grant.recipient_name)
        .neq('id', id)
        .order('award_amount', { ascending: false })
        .limit(5);

      relatedGrants = related || [];
    }

    // Get organization if linked
    let organization = null;
    if (grant.organization_id) {
      const { data: org } = await supabase
        .from('organizations')
        .select('id, name, address, city, state, zip, total_government_funding, ppp_loan_count, eidl_loan_count')
        .eq('id', grant.organization_id)
        .single();

      organization = org;
    }

    return NextResponse.json({
      grant,
      relatedGrants,
      organization
    });

  } catch (error) {
    console.error('Federal grant detail API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch grant details' },
      { status: 500 }
    );
  }
}
