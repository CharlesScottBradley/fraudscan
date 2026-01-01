import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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
    }>;
    totalCount: number;
    providerCount: number;
    pppCount: number;
    grantCount: number;
  } = {
    data: [],
    totalCount: 0,
    providerCount: 0,
    pppCount: 0,
    grantCount: 0,
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

    // Sort
    if (sortBy === 'amount') {
      query = query.order('current_approval_amount', { ascending: sortDir === 'asc', nullsFirst: false });
    } else {
      query = query.order('borrower_name', { ascending: sortDir === 'asc' });
    }

    query = query.range(offset, offset + pageSize - 1);

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

    results.totalCount = results.pppCount;

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

    results.data = (grants || []).map(g => ({
      id: g.id,
      type: 'state_grant' as const,
      name: g.recipient_name,
      city: null,
      category: g.program_name,
      amount: g.payment_amount || 0,
      fiscal_year: g.fiscal_year,
      agency: g.agency,
    }));

    results.totalCount = results.grantCount;

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
