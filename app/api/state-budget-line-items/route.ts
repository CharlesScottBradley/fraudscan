import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export interface StateBudgetLineItem {
  id: string;
  state: string;
  fiscal_year: string;
  fiscal_period: string | null;
  agency_code: string | null;
  agency_name: string | null;
  department_code: string | null;
  department_name: string | null;
  division_name: string | null;
  program_code: string | null;
  program_name: string | null;
  fund_type: string | null;
  fund_code: string | null;
  fund_name: string | null;
  budget_category: string | null;
  object_code: string | null;
  object_name: string | null;
  line_item_name: string | null;
  line_item_description: string | null;
  amount_appropriated: number | null;
  amount_budgeted: number | null;
  amount_estimated: number | null;
  amount_actual: number | null;
  amount_encumbered: number | null;
  amount_prior_year: number | null;
  is_estimate: boolean;
  is_enacted: boolean;
  is_capital: boolean;
  budget_phase: string | null;
  source_document: string | null;
  source_url: string | null;
  extraction_method: string | null;
  extraction_confidence: number | null;
  created_at: string;
}

export interface StateBudgetLineItemsResponse {
  records: StateBudgetLineItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  stats: {
    totalAppropriated: number;
    totalActual: number;
    recordCount: number;
    uniqueAgencies: number;
    statesAvailable: string[];
    fiscalYears: string[];
    budgetCategories: string[];
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
  const agency = searchParams.get('agency');
  const program = searchParams.get('program');
  const fundType = searchParams.get('fundType');
  const budgetCategory = searchParams.get('budgetCategory');
  const minAmount = searchParams.get('minAmount');
  const maxAmount = searchParams.get('maxAmount');
  const sortBy = searchParams.get('sortBy') || 'amount_appropriated';
  const sortDir = searchParams.get('sortDir') || 'desc';
  const budgetPhase = searchParams.get('budgetPhase'); // proposed, enacted, revised, actual

  try {
    // Build query
    let query = supabase
      .from('state_budget_line_items')
      .select(`
        id,
        state,
        fiscal_year,
        fiscal_period,
        agency_code,
        agency_name,
        department_code,
        department_name,
        division_name,
        program_code,
        program_name,
        fund_type,
        fund_code,
        fund_name,
        budget_category,
        object_code,
        object_name,
        line_item_name,
        line_item_description,
        amount_appropriated,
        amount_budgeted,
        amount_estimated,
        amount_actual,
        amount_encumbered,
        amount_prior_year,
        is_estimate,
        is_enacted,
        is_capital,
        budget_phase,
        source_document,
        source_url,
        extraction_method,
        extraction_confidence,
        created_at
      `, { count: 'exact' });

    // Apply filters
    if (state) {
      query = query.eq('state', state.toUpperCase());
    }

    if (fiscalYear) {
      const fyValues = fiscalYear.split(',').map(y => y.trim()).filter(y => y);
      if (fyValues.length === 1) {
        query = query.eq('fiscal_year', fyValues[0]);
      } else if (fyValues.length > 1) {
        query = query.in('fiscal_year', fyValues);
      }
    }

    if (agency) {
      query = query.ilike('agency_name', `%${agency}%`);
    }

    if (program) {
      query = query.ilike('program_name', `%${program}%`);
    }

    if (fundType) {
      query = query.eq('fund_type', fundType);
    }

    if (budgetCategory) {
      query = query.ilike('budget_category', `%${budgetCategory}%`);
    }

    if (budgetPhase) {
      query = query.eq('budget_phase', budgetPhase);
    }

    if (minAmount) {
      query = query.gte('amount_appropriated', parseFloat(minAmount));
    }

    if (maxAmount) {
      query = query.lte('amount_appropriated', parseFloat(maxAmount));
    }

    // Sorting
    const validSortColumns = [
      'amount_appropriated', 'amount_actual', 'agency_name', 'fiscal_year',
      'state', 'budget_category', 'fund_type', 'program_name', 'created_at'
    ];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'amount_appropriated';
    query = query.order(sortColumn, { ascending: sortDir === 'asc', nullsFirst: false });

    // Pagination
    query = query.range(offset, offset + pageSize - 1);

    const { data: records, error, count } = await query;

    if (error) {
      console.error('State budget line items query error:', error);
      throw error;
    }

    // Try to get stats from materialized view, fall back to aggregation if not available
    let statsData = null;
    const { data: matViewData, error: matViewError } = await supabase
      .from('state_budget_line_items_stats')
      .select('state, fiscal_year, agency_name, fund_type, budget_category, line_item_count, total_appropriated, total_actual');

    if (!matViewError && matViewData) {
      statsData = matViewData;
    }

    let totalAppropriated = 0;
    let totalActual = 0;
    let recordCount = 0;
    const agenciesSet = new Set<string>();
    const statesSet = new Set<string>();
    const fiscalYearSet = new Set<string>();
    const categoriesSet = new Set<string>();

    if (statsData && statsData.length > 0) {
      for (const stat of statsData) {
        // If filtering by state, only count that state's stats
        if (state && stat.state !== state.toUpperCase()) continue;

        totalAppropriated += parseFloat(stat.total_appropriated) || 0;
        totalActual += parseFloat(stat.total_actual) || 0;
        recordCount += stat.line_item_count || 0;
        if (stat.agency_name) agenciesSet.add(stat.agency_name);
        statesSet.add(stat.state);
        if (stat.fiscal_year) fiscalYearSet.add(stat.fiscal_year);
        if (stat.budget_category) categoriesSet.add(stat.budget_category);
      }
    } else {
      // Fallback: get basic stats from distinct queries (lighter than full aggregation)
      const { data: statesData } = await supabase
        .from('state_budget_line_items')
        .select('state')
        .limit(1000);

      if (statesData) {
        statesData.forEach(s => statesSet.add(s.state));
      }

      const { data: yearsData } = await supabase
        .from('state_budget_line_items')
        .select('fiscal_year')
        .limit(1000);

      if (yearsData) {
        yearsData.forEach(y => fiscalYearSet.add(y.fiscal_year));
      }
    }

    const response: StateBudgetLineItemsResponse = {
      records: records || [],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
      stats: {
        totalAppropriated,
        totalActual,
        recordCount,
        uniqueAgencies: agenciesSet.size,
        statesAvailable: Array.from(statesSet).sort(),
        fiscalYears: Array.from(fiscalYearSet).sort().reverse(),
        budgetCategories: Array.from(categoriesSet).sort(),
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('State budget line items API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch state budget line items' },
      { status: 500 }
    );
  }
}
