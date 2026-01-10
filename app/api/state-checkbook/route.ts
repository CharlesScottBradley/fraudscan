import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export interface StateCheckbookRecord {
  id: number;
  state: string;
  county: string | null;
  fiscal_year: number | null;
  fiscal_quarter: number | null;
  payment_date: string | null;
  vendor_name: string;
  vendor_name_normalized: string | null;
  contract_number: string | null;
  amount: number;
  agency: string | null;
  division: string | null;
  expenditure_category: string | null;
  account_description: string | null;
  budget_code: string | null;
  fund_name: string | null;
  service_type: string | null;
  source_file: string | null;
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
  const sortBy = searchParams.get('sortBy') || 'amount';
  const sortDir = searchParams.get('sortDir') || 'desc';

  try {
    // Build query
    let query = supabase
      .from('state_checkbook')
      .select(`
        id,
        state,
        county,
        fiscal_year,
        fiscal_quarter,
        payment_date,
        vendor_name,
        vendor_name_normalized,
        contract_number,
        amount,
        agency,
        division,
        expenditure_category,
        account_description,
        budget_code,
        fund_name,
        service_type,
        source_file,
        organization_id
      `, { count: 'exact' });

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

    // Sorting
    const validSortColumns = [
      'amount', 'vendor_name', 'agency', 'fiscal_year', 'state', 'payment_date'
    ];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'amount';
    query = query.order(sortColumn, { ascending: sortDir === 'asc', nullsFirst: false });

    // Pagination
    query = query.range(offset, offset + pageSize - 1);

    const { data: records, error, count } = await query;

    if (error) {
      console.error('State checkbook query error:', error);
      throw error;
    }

    // Get stats from materialized view (much faster than aggregating 54M rows)
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

        totalAmount += parseFloat(stat.total_amount) || 0;
        recordCount += stat.record_count || 0;
        uniqueVendors += stat.unique_vendors || 0;
        uniqueAgencies += stat.unique_agencies || 0;
        statesSet.add(stat.state);
        if (stat.fiscal_year) fiscalYearSet.add(stat.fiscal_year);
      }
    }

    const response: StateCheckbookResponse = {
      records: records || [],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
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
