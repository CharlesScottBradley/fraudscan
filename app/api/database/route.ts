import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '25');
  const dataType = searchParams.get('type') || 'all';
  const search = searchParams.get('search') || '';
  const state = searchParams.get('state') || '';
  const minAmount = parseFloat(searchParams.get('minAmount') || '0');
  const maxAmount = parseFloat(searchParams.get('maxAmount') || '') || null;
  const sortBy = searchParams.get('sortBy') || 'amount';
  const sortDir = searchParams.get('sortDir') || 'desc';

  const offset = (page - 1) * pageSize;

  const results: {
    data: Array<{
      id: string;
      type: 'provider' | 'ppp_loan';
      name: string;
      city: string | null;
      state: string | null;
      category: string | null;
      amount: number;
      license_number?: string;
      jobs_reported?: number | null;
    }>;
    totalCount: number;
    providerCount: number;
    pppCount: number;
  } = {
    data: [],
    totalCount: 0,
    providerCount: 0,
    pppCount: 0,
  };

  // Get provider count
  if (dataType === 'all' || dataType === 'providers') {
    let countQuery = supabase
      .from('providers')
      .select('*', { count: 'exact', head: true });

    if (search) {
      countQuery = countQuery.or(`name.ilike.%${search}%,city.ilike.%${search}%`);
    }
    if (state) {
      countQuery = countQuery.eq('state', state);
    }

    const { count } = await countQuery;
    results.providerCount = count || 0;
  }

  // Get PPP count
  if (dataType === 'all' || dataType === 'ppp_loans') {
    let countQuery = supabase
      .from('ppp_loans')
      .select('*', { count: 'exact', head: true });

    if (search) {
      countQuery = countQuery.or(`borrower_name.ilike.%${search}%,borrower_city.ilike.%${search}%`);
    }
    if (state) {
      countQuery = countQuery.eq('borrower_state', state);
    }
    if (minAmount > 0) {
      countQuery = countQuery.gte('current_approval_amount', minAmount);
    }
    if (maxAmount !== null) {
      countQuery = countQuery.lte('current_approval_amount', maxAmount);
    }

    const { count, error } = await countQuery;
    if (error) console.error('PPP count error:', error);
    results.pppCount = count || 0;
  }

  // Fetch data based on type
  if (dataType === 'providers') {
    let query = supabase
      .from('providers')
      .select(`id, license_number, name, city, state, license_type`);

    if (search) {
      query = query.or(`name.ilike.%${search}%,city.ilike.%${search}%`);
    }
    if (state) {
      query = query.eq('state', state);
    }

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
      state: p.state,
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
        borrower_state,
        business_type,
        current_approval_amount,
        jobs_reported
      `);

    if (search) {
      query = query.or(`borrower_name.ilike.%${search}%,borrower_city.ilike.%${search}%`);
    }
    if (state) {
      query = query.eq('borrower_state', state);
    }
    if (minAmount > 0) {
      query = query.gte('current_approval_amount', minAmount);
    }
    if (maxAmount !== null) {
      query = query.lte('current_approval_amount', maxAmount);
    }

    if (sortBy === 'amount') {
      query = query.order('current_approval_amount', { ascending: sortDir === 'asc' });
    } else {
      query = query.order('borrower_name', { ascending: sortDir === 'asc' });
    }

    query = query.range(offset, offset + pageSize - 1);

    const { data: loans, error } = await query;
    if (error) console.error('PPP query error:', error);

    results.data = (loans || []).map(l => ({
      id: l.id,
      type: 'ppp_loan' as const,
      name: l.borrower_name,
      city: l.borrower_city,
      state: l.borrower_state,
      category: l.business_type,
      amount: l.current_approval_amount || 0,
      jobs_reported: l.jobs_reported,
    }));

    results.totalCount = results.pppCount;

  } else {
    // 'all' type - show PPP loans first (by amount), then providers
    results.totalCount = results.providerCount + results.pppCount;

    if (offset < results.pppCount) {
      // Still in PPP section
      const pppToFetch = Math.min(pageSize, results.pppCount - offset);

      let query = supabase
        .from('ppp_loans')
        .select(`
          id,
          loan_number,
          borrower_name,
          borrower_city,
          borrower_state,
          business_type,
          current_approval_amount,
          jobs_reported
        `);

      if (search) {
        query = query.or(`borrower_name.ilike.%${search}%,borrower_city.ilike.%${search}%`);
      }
      if (state) {
        query = query.eq('borrower_state', state);
      }
      if (minAmount > 0) {
        query = query.gte('current_approval_amount', minAmount);
      }
      if (maxAmount !== null) {
        query = query.lte('current_approval_amount', maxAmount);
      }

      query = query.order('current_approval_amount', { ascending: sortDir === 'asc' })
        .range(offset, offset + pppToFetch - 1);

      const { data: loans, error } = await query;
      if (error) console.error('PPP all query error:', error);

      results.data = (loans || []).map(l => ({
        id: l.id,
        type: 'ppp_loan' as const,
        name: l.borrower_name,
        city: l.borrower_city,
        state: l.borrower_state,
        category: l.business_type,
        amount: l.current_approval_amount || 0,
        jobs_reported: l.jobs_reported,
      }));

      // Fill remaining with providers if needed
      if (pppToFetch < pageSize) {
        const providersToFetch = pageSize - pppToFetch;

        let provQuery = supabase
          .from('providers')
          .select(`id, license_number, name, city, state, license_type`);

        if (search) {
          provQuery = provQuery.or(`name.ilike.%${search}%,city.ilike.%${search}%`);
        }
        if (state) {
          provQuery = provQuery.eq('state', state);
        }

        provQuery = provQuery.order('name', { ascending: true })
          .range(0, providersToFetch - 1);

        const { data: providers } = await provQuery;

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
          state: p.state,
          category: p.license_type,
          amount: fundingMap[p.id] || 0,
          license_number: p.license_number,
        }));

        results.data = [...results.data, ...providerResults];
      }
    } else {
      // Past PPP, into providers
      const providerOffset = offset - results.pppCount;

      let query = supabase
        .from('providers')
        .select(`id, license_number, name, city, state, license_type`);

      if (search) {
        query = query.or(`name.ilike.%${search}%,city.ilike.%${search}%`);
      }
      if (state) {
        query = query.eq('state', state);
      }

      query = query.order('name', { ascending: true })
        .range(providerOffset, providerOffset + pageSize - 1);

      const { data: providers } = await query;

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
        state: p.state,
        category: p.license_type,
        amount: fundingMap[p.id] || 0,
        license_number: p.license_number,
      }));
    }
  }

  return NextResponse.json(results);
}
