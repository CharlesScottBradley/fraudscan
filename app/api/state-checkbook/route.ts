import { NextResponse } from 'next/server';

// Use native fetch to PostgREST - Supabase JS client times out in Next.js
async function queryPostgREST(table: string, query: string) {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${table}?${query}`;
  const res = await fetch(url, {
    headers: {
      'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PostgREST error ${res.status}: ${err}`);
  }
  return res.json();
}

// Minimal columns returned to avoid timeout on 138M row table
export interface StateCheckbookRecord {
  id: number;
  state: string;
  fiscal_year: number | null;
  vendor_name: string;
  amount: number;
  agency: string | null;
  expenditure_category: string | null;
  organization_id: string | null;
}

export interface StateCheckbookResponse {
  records: StateCheckbookRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  stats: {
    totalAmount: number;
    recordCount: number;
    uniqueVendors: number;
    uniqueAgencies: number;
    statesAvailable: string[];
    fiscalYears: number[];
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Pagination
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '50'), 100);
  const offset = (page - 1) * pageSize;

  // Filters
  const state = searchParams.get('state');
  const fiscalYear = searchParams.get('fiscalYear');
  const vendor = searchParams.get('vendor');
  const agency = searchParams.get('agency');
  const minAmount = searchParams.get('minAmount');
  const maxAmount = searchParams.get('maxAmount');
  // Default to amount desc - ORDER BY id times out, but amount uses index
  const sortBy = searchParams.get('sortBy') || 'amount';
  const sortDir = searchParams.get('sortDir') || 'desc';

  try {
    // Large states (CA=52M, TX=24M) timeout without additional filters
    // Require fiscal_year or another filter when filtering by state alone
    if (state && !fiscalYear && !vendor && !agency && !minAmount) {
      return NextResponse.json({
        error: 'Please select a fiscal year when filtering by state',
        hint: 'Large states have millions of records that require additional filtering'
      }, { status: 400 });
    }

    // Build PostgREST query params
    const params = new URLSearchParams();
    params.set('select', 'id,state,fiscal_year,vendor_name,amount,agency,expenditure_category,organization_id');

    // Apply filters using PostgREST syntax
    if (state) {
      params.set('state', `eq.${state.toUpperCase()}`);
    }

    if (fiscalYear) {
      const fyValues = fiscalYear.split(',').map(y => parseInt(y.trim())).filter(y => !isNaN(y));
      if (fyValues.length === 1) {
        params.set('fiscal_year', `eq.${fyValues[0]}`);
      } else if (fyValues.length > 1) {
        params.set('fiscal_year', `in.(${fyValues.join(',')})`);
      }
    }

    if (vendor) {
      params.set('vendor_name', `ilike.*${vendor}*`);
    }

    if (agency) {
      params.set('agency', `ilike.*${agency}*`);
    }

    if (minAmount) {
      params.set('amount', `gte.${parseFloat(minAmount)}`);
    }

    if (maxAmount) {
      params.append('amount', `lte.${parseFloat(maxAmount)}`);
    }

    // Only apply sorting if there's a filter - unfiltered 138M row sorts timeout
    const hasFilter = state || fiscalYear || vendor || agency || minAmount || maxAmount;
    if (hasFilter) {
      const validSortColumns = ['amount', 'vendor_name', 'agency', 'fiscal_year', 'state'];
      const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'amount';
      params.set('order', `${sortColumn}.${sortDir}`);
    }

    // Pagination
    params.set('offset', offset.toString());
    params.set('limit', pageSize.toString());

    const records = await queryPostgREST('state_checkbook', params.toString());

    // Get stats from materialized view (much faster than aggregating 138M rows)
    const statsData = await queryPostgREST(
      'state_checkbook_stats',
      'select=state,fiscal_year,record_count,total_amount,unique_vendors,unique_agencies'
    );

    let totalAmount = 0;
    let recordCount = 0;
    let uniqueVendors = 0;
    let uniqueAgencies = 0;
    const statesSet = new Set<string>();
    const fiscalYearSet = new Set<number>();

    if (statsData) {
      for (const stat of statsData) {
        // If filtering by state, only count that state's stats
        if (state && stat.state !== state.toUpperCase()) continue;
        // If filtering by fiscal year, only count that year's stats
        if (fiscalYear && stat.fiscal_year !== parseInt(fiscalYear)) continue;

        totalAmount += parseFloat(stat.total_amount) || 0;
        recordCount += stat.record_count || 0;
        uniqueVendors += stat.unique_vendors || 0;
        uniqueAgencies += stat.unique_agencies || 0;
        statesSet.add(stat.state);
        if (stat.fiscal_year) fiscalYearSet.add(stat.fiscal_year);
      }
    }

    // Use stats-based count for total (much faster than exact count on 138M rows)
    const estimatedTotal = recordCount;

    const response: StateCheckbookResponse = {
      records: records || [],
      total: estimatedTotal,
      page,
      pageSize,
      totalPages: Math.ceil(estimatedTotal / pageSize),
      stats: {
        totalAmount,
        recordCount,
        uniqueVendors,
        uniqueAgencies,
        statesAvailable: Array.from(statesSet).sort(),
        fiscalYears: Array.from(fiscalYearSet).sort((a, b) => b - a),
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('State checkbook API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch state checkbook data' },
      { status: 500 }
    );
  }
}
