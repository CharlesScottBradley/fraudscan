import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export interface Organization {
  id: string;
  legal_name: string;
  dba_name: string | null;
  name_normalized: string;
  entity_type: string | null;
  state: string | null;
  city: string | null;
  address: string | null;
  zip: string | null;
  naics_code: string | null;
  naics_description: string | null;
  industry_sector: string | null;
  total_government_funding: number;
  first_funding_date: string | null;
  last_funding_date: string | null;
  funding_program_count: number;
  is_ppp_recipient: boolean;
  is_fraud_prone_industry: boolean;
  is_flagged: boolean;
  fraud_score: number | null;
  address_cluster_size: number | null;
  data_source: string | null;
}

export interface OrganizationSearchResponse {
  organizations: Organization[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  stats: {
    totalFunding: number;
    fraudProneCount: number;
    pppRecipientCount: number;
    avgFunding: number;
  };
}

// RPC response type from search_organizations function
interface SearchOrgResult {
  id: string;
  legal_name: string;
  name_normalized: string;
  state: string | null;
  city: string | null;
  naics_code: string | null;
  naics_description: string | null;
  total_government_funding: number;
  first_funding_date: string | null;
  last_funding_date: string | null;
  is_ppp_recipient: boolean;
  is_fraud_prone_industry: boolean;
  fraud_prone_category: string | null;
  total_count: number;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Pagination
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '50'), 100);
  const offset = (page - 1) * pageSize;

  // Filters
  const search = searchParams.get('search');
  const state = searchParams.get('state');
  const minFunding = searchParams.get('minFunding');
  const maxFunding = searchParams.get('maxFunding');
  const naicsCode = searchParams.get('naics');
  const industrySector = searchParams.get('sector');
  const fraudProne = searchParams.get('fraudProne');
  const orgType = searchParams.get('type'); // ppp_recipient, eidl_only, childcare, etc.
  const dataSource = searchParams.get('dataSource');
  const minClusterSize = searchParams.get('minClusterSize');

  // Sorting
  const sortBy = searchParams.get('sortBy') || 'total_government_funding';
  const sortDir = searchParams.get('sortDir') || 'desc';

  try {
    // Use optimized RPC function for search (uses full-text search index)
    const { data, error } = await supabase.rpc('search_organizations', {
      search_term: search || null,
      state_filter: state ? state.toUpperCase() : null,
      min_funding: minFunding ? parseFloat(minFunding) : null,
      max_funding: maxFunding ? parseFloat(maxFunding) : null,
      fraud_prone_only: fraudProne === 'true',
      ppp_only: orgType === 'ppp_recipient',
      page_num: page,
      page_size: pageSize,
      sort_by: sortBy === 'legal_name' ? 'legal_name' : 'total_government_funding',
      sort_dir: sortDir === 'asc' ? 'asc' : 'desc'
    });

    // Cast to typed array
    const orgs = (data || []) as SearchOrgResult[];

    // Get count from first result (included in RPC response)
    const count = orgs.length > 0 ? Number(orgs[0].total_count) : 0;

    if (error) {
      console.error('Organizations query error:', JSON.stringify(error, null, 2));
      return NextResponse.json(
        { error: 'Failed to fetch organizations', details: error.message, code: error.code },
        { status: 500 }
      );
    }

    // Get org IDs to fetch loan status summaries
    const orgIds = orgs.map(o => o.id);

    // Fetch PPP and EIDL loans for these orgs to get status summary
    let loanStatusMap: Record<string, { forgiven: number; chargedOff: number; paidInFull: number; pppTotal: number; eidlTotal: number }> = {};
    if (orgIds.length > 0) {
      // Fetch PPP loans
      const { data: pppLoans } = await supabase
        .from('ppp_loans')
        .select('organization_id, loan_status, forgiveness_amount')
        .in('organization_id', orgIds);

      if (pppLoans) {
        pppLoans.forEach(loan => {
          if (!loanStatusMap[loan.organization_id]) {
            loanStatusMap[loan.organization_id] = { forgiven: 0, chargedOff: 0, paidInFull: 0, pppTotal: 0, eidlTotal: 0 };
          }
          loanStatusMap[loan.organization_id].pppTotal++;

          // Determine derived status
          if (loan.forgiveness_amount && loan.forgiveness_amount > 0) {
            loanStatusMap[loan.organization_id].forgiven++;
          } else if (loan.loan_status === 'Charged Off') {
            loanStatusMap[loan.organization_id].chargedOff++;
          } else {
            loanStatusMap[loan.organization_id].paidInFull++;
          }
        });
      }

      // Fetch EIDL loans
      const { data: eidlLoans } = await supabase
        .from('eidl_loans')
        .select('organization_id')
        .in('organization_id', orgIds);

      if (eidlLoans) {
        eidlLoans.forEach(loan => {
          if (!loanStatusMap[loan.organization_id]) {
            loanStatusMap[loan.organization_id] = { forgiven: 0, chargedOff: 0, paidInFull: 0, pppTotal: 0, eidlTotal: 0 };
          }
          loanStatusMap[loan.organization_id].eidlTotal++;
        });
      }
    }

    // Transform to response format
    const organizations = orgs.map(org => {
      const loanStatus = loanStatusMap[org.id] || { forgiven: 0, chargedOff: 0, paidInFull: 0, pppTotal: 0, eidlTotal: 0 };
      return {
        id: org.id,
        legal_name: org.legal_name,
        dba_name: null,
        name_normalized: org.name_normalized,
        entity_type: null,
        state: org.state,
        city: org.city,
        address: null,
        zip: null,
        naics_code: org.naics_code,
        naics_description: org.naics_description,
        industry_sector: org.fraud_prone_category,
        total_government_funding: org.total_government_funding || 0,
        first_funding_date: org.first_funding_date,
        last_funding_date: org.last_funding_date,
        funding_program_count: org.is_ppp_recipient ? 1 : 0,
        is_ppp_recipient: org.is_ppp_recipient || false,
        is_fraud_prone_industry: org.is_fraud_prone_industry || false,
        is_flagged: false,
        fraud_score: null,
        address_cluster_size: null,
        data_source: null,
        loan_status: loanStatus
      };
    });

    // Calculate stats from current page
    let totalFunding = 0;
    let fraudProneCount = 0;
    let pppRecipientCount = 0;

    organizations.forEach((org) => {
      totalFunding += org.total_government_funding || 0;
      if (org.is_fraud_prone_industry) fraudProneCount++;
      if (org.is_ppp_recipient) pppRecipientCount++;
    });

    const response: OrganizationSearchResponse = {
      organizations,
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
      stats: {
        totalFunding,
        fraudProneCount,
        pppRecipientCount,
        avgFunding: organizations.length ? totalFunding / organizations.length : 0
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Organizations API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organizations' },
      { status: 500 }
    );
  }
}
