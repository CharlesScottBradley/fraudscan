import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export interface OrganizationDetail {
  id: string;
  legal_name: string;
  dba_name: string | null;
  name_normalized: string;
  entity_type: string | null;
  ein: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  county: string | null;
  naics_code: string | null;
  naics_description: string | null;
  industry_sector: string | null;
  total_government_funding: number;
  first_funding_date: string | null;
  last_funding_date: string | null;
  is_ppp_recipient: boolean;
  is_fraud_prone_industry: boolean;
  is_flagged: boolean;
  fraud_score: number | null;
  address_cluster_size: number | null;
  data_source: string | null;
  ppp_loans: PPPLoanSummary[];
  eidl_loans: EIDLLoanSummary[];
  related_orgs: RelatedOrg[];
}

interface PPPLoanSummary {
  id: string;
  loan_number: string;
  initial_approval_amount: number;
  forgiveness_amount: number | null;
  jobs_reported: number | null;
  date_approved: string | null;
  loan_status: string | null;
  is_flagged: boolean;
}

interface EIDLLoanSummary {
  id: string;
  fain: string;
  loan_amount: number;
  action_date: string | null;
}

interface RelatedOrg {
  id: string;
  legal_name: string;
  total_government_funding: number;
  relationship: string; // 'same_address', 'similar_name'
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Fetch organization details
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select(`
        id,
        legal_name,
        dba_name,
        name_normalized,
        entity_type,
        ein,
        address,
        city,
        state,
        zip_code,
        county,
        naics_code,
        naics_description,
        total_government_funding,
        first_funding_date,
        last_funding_date,
        is_ppp_recipient,
        is_fraud_prone_industry,
        fraud_prone_category
      `)
      .eq('id', id)
      .single();

    if (orgError) {
      console.error('Org query error:', JSON.stringify(orgError));
      if (orgError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Organization not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to fetch organization', details: orgError.message },
        { status: 500 }
      );
    }

    // Fetch PPP loans for this organization
    const { data: pppLoans, error: pppError } = await supabase
      .from('ppp_loans')
      .select(`
        id,
        loan_number,
        initial_approval_amount,
        forgiveness_amount,
        jobs_reported,
        date_approved,
        loan_status,
        is_flagged
      `)
      .eq('organization_id', id)
      .order('initial_approval_amount', { ascending: false })
      .limit(100);

    if (pppError) {
      console.error('PPP loans query error:', pppError);
    }

    // Fetch EIDL loans for this organization
    const { data: eidlLoans, error: eidlError } = await supabase
      .from('eidl_loans')
      .select(`
        id,
        fain,
        loan_amount,
        action_date
      `)
      .eq('organization_id', id)
      .order('loan_amount', { ascending: false })
      .limit(100);

    if (eidlError) {
      console.error('EIDL loans query error:', eidlError);
    }

    // Related orgs query disabled - address_cluster_id not in schema cache
    const relatedOrgs: RelatedOrg[] = [];

    const response: OrganizationDetail = {
      id: org.id,
      legal_name: org.legal_name,
      dba_name: org.dba_name,
      name_normalized: org.name_normalized,
      entity_type: org.entity_type,
      ein: org.ein,
      address: org.address,
      city: org.city,
      state: org.state,
      zip: org.zip_code,
      county: org.county,
      naics_code: org.naics_code,
      naics_description: org.naics_description,
      industry_sector: org.fraud_prone_category,
      total_government_funding: org.total_government_funding || 0,
      first_funding_date: org.first_funding_date,
      last_funding_date: org.last_funding_date,
      is_ppp_recipient: org.is_ppp_recipient || false,
      is_fraud_prone_industry: org.is_fraud_prone_industry || false,
      is_flagged: false,
      fraud_score: null,
      address_cluster_size: null,
      data_source: null,
      ppp_loans: pppLoans || [],
      eidl_loans: eidlLoans || [],
      related_orgs: relatedOrgs
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Organization detail API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organization' },
      { status: 500 }
    );
  }
}
