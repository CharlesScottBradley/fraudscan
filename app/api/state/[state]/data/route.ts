import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// NAICS 2-digit sector codes to industry names
const NAICS_SECTORS: Record<string, string> = {
  '11': 'Agriculture',
  '21': 'Mining',
  '22': 'Utilities',
  '23': 'Construction',
  '31': 'Manufacturing',
  '32': 'Manufacturing',
  '33': 'Manufacturing',
  '42': 'Wholesale Trade',
  '44': 'Retail Trade',
  '45': 'Retail Trade',
  '48': 'Transportation',
  '49': 'Transportation',
  '51': 'Information',
  '52': 'Finance & Insurance',
  '53': 'Real Estate',
  '54': 'Professional Services',
  '55': 'Management',
  '56': 'Administrative Services',
  '61': 'Education',
  '62': 'Healthcare',
  '71': 'Arts & Entertainment',
  '72': 'Accommodation & Food',
  '81': 'Other Services',
  '92': 'Public Administration',
};

// Map agency names to categories for state grants
function getAgencyCategory(agency: string | null): string {
  if (!agency) return 'Other';
  const a = agency.toLowerCase();

  if (a.includes('human services') || a.includes('medicaid') || a.includes('health')) return 'Healthcare & Human Services';
  if (a.includes('education') || a.includes('school') || a.includes('college') || a.includes('university')) return 'Education';
  if (a.includes('transport')) return 'Transportation';
  if (a.includes('commerce') || a.includes('economic') || a.includes('development')) return 'Economic Development';
  if (a.includes('public safety') || a.includes('corrections') || a.includes('military') || a.includes('veteran')) return 'Public Safety';
  if (a.includes('natural resources') || a.includes('environment') || a.includes('pollution') || a.includes('ecology')) return 'Environment';
  if (a.includes('housing') || a.includes('facilities')) return 'Housing & Infrastructure';
  if (a.includes('revenue') || a.includes('budget') || a.includes('management') || a.includes('administration')) return 'Government Operations';
  if (a.includes('agriculture') || a.includes('food')) return 'Agriculture';
  if (a.includes('labor') || a.includes('employment') || a.includes('workforce')) return 'Labor & Employment';
  if (a.includes('children') || a.includes('youth') || a.includes('family')) return 'Children & Families';
  if (a.includes('social') || a.includes('aging') || a.includes('disability')) return 'Social Services';

  return 'Other';
}

const AGENCY_CATEGORIES = [
  'Agriculture',
  'Children & Families',
  'Economic Development',
  'Education',
  'Environment',
  'Government Operations',
  'Healthcare & Human Services',
  'Housing & Infrastructure',
  'Labor & Employment',
  'Public Safety',
  'Social Services',
  'Transportation',
  'Other',
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ state: string }> }
) {
  const { state } = await params;
  const stateUpper = state.toUpperCase();

  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '25');
  const dataType = searchParams.get('type') || 'all';
  const search = searchParams.get('search') || '';
  const minAmount = parseFloat(searchParams.get('minAmount') || '0');
  const maxAmount = parseFloat(searchParams.get('maxAmount') || '') || null;
  const sortBy = searchParams.get('sortBy') || 'amount';
  const sortDir = searchParams.get('sortDir') || 'desc';
  const industry = searchParams.get('industry') || '';
  const category = searchParams.get('category') || '';

  // Get NAICS codes for the selected industry
  const industryNaicsCodes: string[] = [];
  if (industry) {
    for (const [code, name] of Object.entries(NAICS_SECTORS)) {
      if (name === industry) {
        industryNaicsCodes.push(code);
      }
    }
  }

  const offset = (page - 1) * pageSize;

  const results: {
    data: Array<{
      id: string;
      type: 'provider' | 'ppp_loan' | 'state_grant';
      name: string;
      city: string | null;
      category: string | null;
      amount: number;
      license_number?: string;
      jobs_reported?: number | null;
      fiscal_year?: number | null;
      agency?: string | null;
      industry?: string | null;
    }>;
    totalCount: number;
    providerCount: number;
    pppCount: number;
    grantCount: number;
    industries: string[];
    agencyCategories: string[];
  } = {
    data: [],
    totalCount: 0,
    providerCount: 0,
    pppCount: 0,
    grantCount: 0,
    industries: [...new Set(Object.values(NAICS_SECTORS))].sort(),
    agencyCategories: AGENCY_CATEGORIES,
  };

  // Always get all counts (for tab display) - these are TOTALS for this state, not filtered
  const [providerCountResult, pppCountResult, grantCountResult] = await Promise.all([
    supabase.from('providers').select('*', { count: 'exact', head: true }).eq('state', stateUpper),
    supabase.from('ppp_loans').select('*', { count: 'exact', head: true }).eq('borrower_state', stateUpper),
    supabase.from('state_grants').select('*', { count: 'exact', head: true }).eq('source_state', stateUpper),
  ]);

  results.providerCount = providerCountResult.count || 0;
  results.pppCount = pppCountResult.count || 0;
  results.grantCount = grantCountResult.count || 0;

  // For 'all' type, we need to merge and sort - this is complex
  // For simplicity, when type is 'all', we'll fetch separately and merge
  if (dataType === 'providers') {
    let query = supabase
      .from('providers')
      .select(`
        id,
        license_number,
        name,
        city,
        license_type
      `)
      .eq('state', stateUpper);

    if (search) {
      query = query.or(`name.ilike.%${search}%,city.ilike.%${search}%`);
    }

    // Sort - providers don't have amount in this query, sort by name
    if (sortBy === 'name') {
      query = query.order('name', { ascending: sortDir === 'asc' });
    } else {
      query = query.order('name', { ascending: true });
    }

    query = query.range(offset, offset + pageSize - 1);

    const { data: providers } = await query;

    // Get funding for these providers
    const providerIds = providers?.map(p => p.id) || [];
    let fundingMap: Record<string, number> = {};

    if (providerIds.length > 0) {
      const { data: payments } = await supabase
        .from('payments')
        .select('provider_id, total_amount')
        .in('provider_id', providerIds);

      payments?.forEach(p => {
        fundingMap[p.provider_id] = (fundingMap[p.provider_id] || 0) + p.total_amount;
      });
    }

    results.data = (providers || []).map(p => ({
      id: p.id,
      type: 'provider' as const,
      name: p.name,
      city: p.city,
      category: p.license_type,
      amount: fundingMap[p.id] || 0,
      license_number: p.license_number,
    }));

    results.totalCount = results.providerCount;

  } else if (dataType === 'ppp_loans') {
    let query = supabase
      .from('ppp_loans')
      .select(`
        id,
        loan_number,
        borrower_name,
        borrower_city,
        business_type,
        current_approval_amount,
        jobs_reported,
        naics_code
      `)
      .eq('borrower_state', stateUpper);

    if (search) {
      query = query.or(`borrower_name.ilike.%${search}%,borrower_city.ilike.%${search}%`);
    }
    if (minAmount > 0) {
      query = query.gte('current_approval_amount', minAmount);
    }
    if (maxAmount !== null) {
      query = query.lte('current_approval_amount', maxAmount);
    }

    // Industry filter - match NAICS codes starting with the 2-digit sector codes
    if (industryNaicsCodes.length > 0) {
      // Build OR conditions for NAICS code patterns
      const naicsFilters = industryNaicsCodes.map(code => `naics_code.like.${code}%`).join(',');
      query = query.or(naicsFilters);
    }

    // Sort
    if (sortBy === 'amount') {
      query = query.order('current_approval_amount', { ascending: sortDir === 'asc', nullsFirst: false });
    } else {
      query = query.order('borrower_name', { ascending: sortDir === 'asc' });
    }

    query = query.range(offset, offset + pageSize - 1);

    const { data: loans } = await query;

    results.data = (loans || []).map(l => {
      const naics2 = l.naics_code?.toString().substring(0, 2) || '';
      return {
        id: l.id,
        type: 'ppp_loan' as const,
        name: l.borrower_name,
        city: l.borrower_city,
        category: l.business_type,
        amount: l.current_approval_amount || 0,
        jobs_reported: l.jobs_reported,
        industry: NAICS_SECTORS[naics2] || null,
      };
    });

    // Get filtered count if industry filter is applied
    if (industryNaicsCodes.length > 0) {
      let countQuery = supabase
        .from('ppp_loans')
        .select('*', { count: 'exact', head: true })
        .eq('borrower_state', stateUpper);
      const naicsFilters = industryNaicsCodes.map(code => `naics_code.like.${code}%`).join(',');
      countQuery = countQuery.or(naicsFilters);
      const { count } = await countQuery;
      results.totalCount = count || 0;
    } else {
      results.totalCount = results.pppCount;
    }

  } else if (dataType === 'state_grants') {
    let query = supabase
      .from('state_grants')
      .select(`
        id,
        recipient_name,
        recipient_state,
        payment_amount,
        fiscal_year,
        agency,
        program_name
      `)
      .eq('source_state', stateUpper);

    if (search) {
      query = query.or(`recipient_name.ilike.%${search}%,agency.ilike.%${search}%`);
    }
    if (minAmount > 0) {
      query = query.gte('payment_amount', minAmount);
    }
    if (maxAmount !== null) {
      query = query.lte('payment_amount', maxAmount);
    }

    // Sort
    if (sortBy === 'amount') {
      query = query.order('payment_amount', { ascending: sortDir === 'asc', nullsFirst: false });
    } else {
      query = query.order('recipient_name', { ascending: sortDir === 'asc' });
    }

    query = query.range(offset, offset + pageSize - 1);

    const { data: grants } = await query;

    // Map grants and filter by category if specified
    let mappedGrants = (grants || []).map(g => ({
      id: g.id,
      type: 'state_grant' as const,
      name: g.recipient_name,
      city: null,
      category: getAgencyCategory(g.agency),
      amount: g.payment_amount || 0,
      fiscal_year: g.fiscal_year,
      agency: g.agency,
    }));

    // Filter by category client-side (since we can't do complex agency->category mapping in SQL)
    if (category) {
      mappedGrants = mappedGrants.filter(g => g.category === category);
    }

    results.data = mappedGrants;
    results.totalCount = category ? mappedGrants.length : results.grantCount;

  } else {
    // 'all' type - more complex, need to interleave
    // For now, show PPP loans first (sorted by amount), then providers
    // This is a simplification - true interleaving would require more complex logic

    results.totalCount = results.providerCount + results.pppCount;

    // Determine which data to fetch based on offset
    if (offset < results.pppCount) {
      // Still in PPP loans section
      const pppToFetch = Math.min(pageSize, results.pppCount - offset);

      let query = supabase
        .from('ppp_loans')
        .select(`
          id,
          loan_number,
          borrower_name,
          borrower_city,
          business_type,
          current_approval_amount,
          jobs_reported
        `)
        .eq('borrower_state', stateUpper);

      if (search) {
        query = query.or(`borrower_name.ilike.%${search}%,borrower_city.ilike.%${search}%`);
      }
      if (minAmount > 0) {
        query = query.gte('current_approval_amount', minAmount);
      }
      if (maxAmount !== null) {
        query = query.lte('current_approval_amount', maxAmount);
      }

      query = query.order('current_approval_amount', { ascending: sortDir === 'asc', nullsFirst: false })
        .range(offset, offset + pppToFetch - 1);

      const { data: loans } = await query;

      results.data = (loans || []).map(l => ({
        id: l.id,
        type: 'ppp_loan' as const,
        name: l.borrower_name,
        city: l.borrower_city,
        category: l.business_type,
        amount: l.current_approval_amount || 0,
        jobs_reported: l.jobs_reported,
      }));

      // If we need more items to fill the page, get providers
      if (pppToFetch < pageSize) {
        const providersToFetch = pageSize - pppToFetch;

        let provQuery = supabase
          .from('providers')
          .select(`id, license_number, name, city, license_type`)
          .eq('state', stateUpper);

        if (search) {
          provQuery = provQuery.or(`name.ilike.%${search}%,city.ilike.%${search}%`);
        }

        provQuery = provQuery.order('name', { ascending: true })
          .range(0, providersToFetch - 1);

        const { data: providers } = await provQuery;

        // Get funding
        const providerIds = providers?.map(p => p.id) || [];
        let fundingMap: Record<string, number> = {};

        if (providerIds.length > 0) {
          const { data: payments } = await supabase
            .from('payments')
            .select('provider_id, total_amount')
            .in('provider_id', providerIds);

          payments?.forEach(p => {
            fundingMap[p.provider_id] = (fundingMap[p.provider_id] || 0) + p.total_amount;
          });
        }

        const providerResults = (providers || []).map(p => ({
          id: p.id,
          type: 'provider' as const,
          name: p.name,
          city: p.city,
          category: p.license_type,
          amount: fundingMap[p.id] || 0,
          license_number: p.license_number,
        }));

        results.data = [...results.data, ...providerResults];
      }
    } else {
      // Past PPP loans, into providers
      const providerOffset = offset - results.pppCount;

      let query = supabase
        .from('providers')
        .select(`id, license_number, name, city, license_type`)
        .eq('state', stateUpper);

      if (search) {
        query = query.or(`name.ilike.%${search}%,city.ilike.%${search}%`);
      }

      query = query.order('name', { ascending: true })
        .range(providerOffset, providerOffset + pageSize - 1);

      const { data: providers } = await query;

      // Get funding
      const providerIds = providers?.map(p => p.id) || [];
      let fundingMap: Record<string, number> = {};

      if (providerIds.length > 0) {
        const { data: payments } = await supabase
          .from('payments')
          .select('provider_id, total_amount')
          .in('provider_id', providerIds);

        payments?.forEach(p => {
          fundingMap[p.provider_id] = (fundingMap[p.provider_id] || 0) + p.total_amount;
        });
      }

      results.data = (providers || []).map(p => ({
        id: p.id,
        type: 'provider' as const,
        name: p.name,
        city: p.city,
        category: p.license_type,
        amount: fundingMap[p.id] || 0,
        license_number: p.license_number,
      }));
    }
  }

  return NextResponse.json(results);
}
