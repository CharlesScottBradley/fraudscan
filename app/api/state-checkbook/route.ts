import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

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
  // Default to id desc (uses primary key index) - amount sort only fast when filtered by state
  const sortBy = searchParams.get('sortBy') || 'id';
  const sortDir = searchParams.get('sortDir') || 'desc';

  try {
    // Build query - minimal columns to avoid timeout on 138M row table
    let query = supabase
      .from('state_checkbook')
      .select('id, state, fiscal_year, vendor_name, amount, agency, expenditure_category, organization_id');

    // Apply filters
    if (state) {
      query = query.eq('state', state.toUpperCase());
    }

    if (fiscalYear) {
      const fyValues = fiscalYear.split(',').map(y => parseInt(y.trim())).filter(y => !isNaN(y));
      if (fyValues.length === 1) {
        query = query.eq('fiscal_year', fyValues[0]);
      } else if (fyValues.length > 1) {
        query = query.in('fiscal_year', fyValues);
      }
    }

    if (vendor) {
      query = query.ilike('vendor_name', `%${vendor}%`);
    }

    if (agency) {
      query = query.ilike('agency', `%${agency}%`);
    }

    if (minAmount) {
      query = query.gte('amount', parseFloat(minAmount));
    }

    if (maxAmount) {
      query = query.lte('amount', parseFloat(maxAmount));
    }

    // Only apply sorting if there's a filter - unfiltered 138M row sorts timeout
    const hasFilter = state || fiscalYear || vendor || agency || minAmount || maxAmount;
    if (hasFilter) {
      const validSortColumns = [
        'id', 'amount', 'vendor_name', 'agency', 'fiscal_year', 'state', 'payment_date'
      ];
      const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'amount';
      query = query.order(sortColumn, { ascending: sortDir === 'asc', nullsFirst: false });
    }
    // Without filter, no ORDER BY - returns random-ish rows but avoids timeout

    // Pagination
    query = query.range(offset, offset + pageSize - 1);

    const { data: records, error } = await query;

    if (error) {
      console.error('State checkbook query error:', error);
      throw error;
    }

    // Get stats from materialized view (much faster than aggregating 138M rows)
    const { data: statsData } = await supabase
      .from('state_checkbook_stats')
      .select('state, fiscal_year, record_count, total_amount, unique_vendors, unique_agencies');

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
