import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

const QUERY_TIMEOUT = 3000; // 3 seconds
const RESULTS_PER_CATEGORY = 5;

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  url: string;
  entityType: string;
}

interface SearchResponse {
  results: Record<string, SearchResult[]>;
  counts: Record<string, number>;
  query: string;
  timing: number;
}

// Helper to race a promise against a timeout
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T | null> {
  const timeout = new Promise<null>((resolve) =>
    setTimeout(() => resolve(null), timeoutMs)
  );
  return Promise.race([promise, timeout]);
}

// Format currency for display
function formatAmount(amount: number | null): string {
  if (!amount) return '';
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return `$${amount.toFixed(0)}`;
}

// Search functions for each entity type
const searchFunctions = {
  organizations: async (search: string) => {
    const { data, count } = await supabase
      .from('organizations')
      .select('id, legal_name, city, state, total_government_funding', { count: 'estimated' })
      .or(`legal_name.ilike.%${search}%,name_normalized.ilike.%${search}%`)
      .limit(RESULTS_PER_CATEGORY);

    return {
      results: (data || []).map(r => ({
        id: r.id,
        title: r.legal_name || 'Unknown',
        subtitle: [r.city, r.state, formatAmount(r.total_government_funding)].filter(Boolean).join(' • '),
        url: `/organizations/${r.id}`,
        entityType: 'organizations'
      })),
      count: count || 0
    };
  },

  ppp_loans: async (search: string) => {
    const { data, count } = await supabase
      .from('ppp_loans')
      .select('loan_number, borrower_name, borrower_city, borrower_state, initial_approval_amount', { count: 'estimated' })
      .or(`borrower_name.ilike.%${search}%,loan_number.ilike.%${search}%`)
      .limit(RESULTS_PER_CATEGORY);

    return {
      results: (data || []).map(r => ({
        id: r.loan_number,
        title: r.borrower_name || 'Unknown',
        subtitle: [r.borrower_city, r.borrower_state, formatAmount(r.initial_approval_amount)].filter(Boolean).join(' • '),
        url: `/ppp/${r.loan_number}`,
        entityType: 'ppp_loans'
      })),
      count: count || 0
    };
  },

  federal_grants: async (search: string) => {
    const { data, count } = await supabase
      .from('federal_grants')
      .select('id, recipient_name, awarding_agency_name, recipient_state, total_funding_amount', { count: 'estimated' })
      .or(`recipient_name.ilike.%${search}%,cfda_title.ilike.%${search}%`)
      .limit(RESULTS_PER_CATEGORY);

    return {
      results: (data || []).map(r => ({
        id: r.id,
        title: r.recipient_name || 'Unknown',
        subtitle: [r.awarding_agency_name, r.recipient_state, formatAmount(r.total_funding_amount)].filter(Boolean).join(' • '),
        url: `/federal-grants?id=${r.id}`,
        entityType: 'federal_grants'
      })),
      count: count || 0
    };
  },

  cases: async (search: string) => {
    const { data, count } = await supabase
      .from('cases')
      .select('id, case_name, state, total_fraud_amount, status', { count: 'exact' })
      .or(`case_name.ilike.%${search}%,case_number.ilike.%${search}%,summary.ilike.%${search}%`)
      .limit(RESULTS_PER_CATEGORY);

    return {
      results: (data || []).map(r => ({
        id: r.id,
        title: r.case_name || 'Unknown Case',
        subtitle: [r.state, r.status, formatAmount(r.total_fraud_amount)].filter(Boolean).join(' • '),
        url: `/case/${r.id}`,
        entityType: 'cases'
      })),
      count: count || 0
    };
  },

  politicians: async (search: string) => {
    // Politicians need a join with people table for names
    const { data, count } = await supabase
      .from('politicians')
      .select(`
        id,
        person_id,
        office_type,
        office_title,
        state,
        party,
        people!inner(full_name)
      `, { count: 'exact' })
      .ilike('people.full_name', `%${search}%`)
      .limit(RESULTS_PER_CATEGORY);

    return {
      results: (data || []).map((r: Record<string, unknown>) => {
        const people = r.people as { full_name: string } | null;
        return {
          id: r.id as string,
          title: people?.full_name || 'Unknown',
          subtitle: [r.office_title || r.office_type, r.state, r.party].filter(Boolean).join(' • '),
          url: `/politician/${r.id}`,
          entityType: 'politicians'
        };
      }),
      count: count || 0
    };
  },

  providers: async (search: string) => {
    const { data, count } = await supabase
      .from('providers')
      .select('id, name, city, state, license_number, license_type', { count: 'estimated' })
      .or(`name.ilike.%${search}%,license_number.ilike.%${search}%`)
      .limit(RESULTS_PER_CATEGORY);

    return {
      results: (data || []).map(r => ({
        id: r.id,
        title: r.name || 'Unknown Provider',
        subtitle: [r.license_type, r.city, r.state].filter(Boolean).join(' • '),
        url: `/provider/${r.license_number || r.id}`,
        entityType: 'providers'
      })),
      count: count || 0
    };
  },

  sba_loans: async (search: string) => {
    const { data, count } = await supabase
      .from('sba_loans')
      .select('id, borrower_name, borrower_city, borrower_state, gross_approval, loan_program', { count: 'estimated' })
      .or(`borrower_name.ilike.%${search}%,sba_loan_number.ilike.%${search}%`)
      .limit(RESULTS_PER_CATEGORY);

    return {
      results: (data || []).map(r => ({
        id: r.id,
        title: r.borrower_name || 'Unknown',
        subtitle: [r.loan_program, r.borrower_city, r.borrower_state, formatAmount(r.gross_approval)].filter(Boolean).join(' • '),
        url: `/sba?id=${r.id}`,
        entityType: 'sba_loans'
      })),
      count: count || 0
    };
  },

  snap_retailers: async (search: string) => {
    const { data, count } = await supabase
      .from('snap_retailers')
      .select('id, store_name, address, city, state, store_type', { count: 'estimated' })
      .or(`store_name.ilike.%${search}%,address.ilike.%${search}%`)
      .limit(RESULTS_PER_CATEGORY);

    return {
      results: (data || []).map(r => ({
        id: r.id,
        title: r.store_name || 'Unknown Store',
        subtitle: [r.store_type, r.city, r.state].filter(Boolean).join(' • '),
        url: `/snap-retailers?id=${r.id}`,
        entityType: 'snap_retailers'
      })),
      count: count || 0
    };
  },

  h1b_employers: async (search: string) => {
    const { data, count } = await supabase
      .from('h1b_employer_stats')
      .select('id, employer_name, city, state, initial_approvals, fiscal_year', { count: 'estimated' })
      .ilike('employer_name', `%${search}%`)
      .order('initial_approvals', { ascending: false })
      .limit(RESULTS_PER_CATEGORY);

    return {
      results: (data || []).map(r => ({
        id: r.id,
        title: r.employer_name || 'Unknown Employer',
        subtitle: [r.city, r.state, `FY${r.fiscal_year}`, `${r.initial_approvals} approvals`].filter(Boolean).join(' • '),
        url: `/h1b?employer=${encodeURIComponent(r.employer_name || '')}`,
        entityType: 'h1b_employers'
      })),
      count: count || 0
    };
  },

  open_payments: async (search: string) => {
    const { data, count } = await supabase
      .from('open_payments_general')
      .select('record_id, covered_recipient_last_name, covered_recipient_first_name, recipient_city, recipient_state, total_amount_of_payment_usdollars', { count: 'estimated' })
      .or(`covered_recipient_last_name.ilike.%${search}%,applicable_manufacturer_or_applicable_gpo_making_payment_name.ilike.%${search}%`)
      .limit(RESULTS_PER_CATEGORY);

    return {
      results: (data || []).map(r => ({
        id: r.record_id,
        title: `Dr. ${r.covered_recipient_first_name || ''} ${r.covered_recipient_last_name || ''}`.trim() || 'Unknown',
        subtitle: [r.recipient_city, r.recipient_state, formatAmount(r.total_amount_of_payment_usdollars)].filter(Boolean).join(' • '),
        url: `/open-payments?id=${r.record_id}`,
        entityType: 'open_payments'
      })),
      count: count || 0
    };
  },

  nursing_homes: async (search: string) => {
    const { data, count } = await supabase
      .from('nursing_homes')
      .select('id, provider_name, provider_city, provider_state, overall_rating', { count: 'estimated' })
      .ilike('provider_name', `%${search}%`)
      .limit(RESULTS_PER_CATEGORY);

    return {
      results: (data || []).map(r => ({
        id: r.id,
        title: r.provider_name || 'Unknown Facility',
        subtitle: [r.provider_city, r.provider_state, r.overall_rating ? `${r.overall_rating}★` : null].filter(Boolean).join(' • '),
        url: `/nursing-homes?id=${r.id}`,
        entityType: 'nursing_homes'
      })),
      count: count || 0
    };
  },

  contributions: async (search: string) => {
    // Search FEC contributions
    const { data, count } = await supabase
      .from('fec_contributions')
      .select('id, contributor_name, contributor_city, contributor_state, contribution_receipt_amount, committee_name', { count: 'estimated' })
      .or(`contributor_name.ilike.%${search}%,committee_name.ilike.%${search}%`)
      .limit(RESULTS_PER_CATEGORY);

    return {
      results: (data || []).map(r => ({
        id: r.id,
        title: r.contributor_name || 'Unknown Donor',
        subtitle: [r.committee_name, r.contributor_city, r.contributor_state, formatAmount(r.contribution_receipt_amount)].filter(Boolean).join(' • '),
        url: `/donations/search?q=${encodeURIComponent(r.contributor_name || '')}`,
        entityType: 'contributions'
      })),
      count: count || 0
    };
  },

  budgets: async (search: string) => {
    const { data, count } = await supabase
      .from('budget_jurisdictions')
      .select('id, name, state, jurisdiction_type, census_total_expenditure', { count: 'exact' })
      .ilike('name', `%${search}%`)
      .limit(RESULTS_PER_CATEGORY);

    return {
      results: (data || []).map(r => ({
        id: r.id,
        title: r.name || 'Unknown Jurisdiction',
        subtitle: [r.jurisdiction_type, r.state, formatAmount(r.census_total_expenditure)].filter(Boolean).join(' • '),
        url: `/budgets/${r.id}`,
        entityType: 'budgets'
      })),
      count: count || 0
    };
  }
};

export async function GET(request: Request) {
  const startTime = Date.now();
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('q');

  if (!search || search.length < 2) {
    return NextResponse.json({
      results: {},
      counts: {},
      query: search || '',
      timing: 0,
      error: 'Query must be at least 2 characters'
    });
  }

  try {
    // Execute all searches in parallel with timeout
    const searchPromises = Object.entries(searchFunctions).map(
      async ([entityType, searchFn]) => {
        try {
          const result = await withTimeout(searchFn(search), QUERY_TIMEOUT);
          return {
            entityType,
            results: result?.results || [],
            count: result?.count || 0,
            error: result === null
          };
        } catch (error) {
          console.error(`Search error for ${entityType}:`, error);
          return {
            entityType,
            results: [],
            count: 0,
            error: true
          };
        }
      }
    );

    const searchResults = await Promise.all(searchPromises);

    // Aggregate results
    const results: Record<string, SearchResult[]> = {};
    const counts: Record<string, number> = {};

    for (const { entityType, results: entityResults, count } of searchResults) {
      if (entityResults.length > 0) {
        results[entityType] = entityResults;
      }
      counts[entityType] = count;
    }

    const response: SearchResponse = {
      results,
      counts,
      query: search,
      timing: Date.now() - startTime
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Global search error:', error);
    return NextResponse.json(
      { error: 'Search failed', query: search, timing: Date.now() - startTime },
      { status: 500 }
    );
  }
}
