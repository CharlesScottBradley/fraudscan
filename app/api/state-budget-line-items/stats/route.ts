import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export interface StateBudgetLineItemsStatsResponse {
  byState: Array<{
    state: string;
    recordCount: number;
    totalAppropriated: number;
    totalActual: number;
    uniqueAgencies: number;
    fiscalYears: string[];
  }>;
  byFiscalYear: Array<{
    fiscalYear: string;
    recordCount: number;
    totalAppropriated: number;
    totalActual: number;
  }>;
  byCategory: Array<{
    budgetCategory: string;
    recordCount: number;
    totalAppropriated: number;
    totalActual: number;
  }>;
  totals: {
    recordCount: number;
    totalAppropriated: number;
    totalActual: number;
    uniqueStates: number;
    uniqueAgencies: number;
    uniquePrograms: number;
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const state = searchParams.get('state');

  try {
    // Get stats from materialized view
    let query = supabase
      .from('state_budget_line_items_stats')
      .select('state, fiscal_year, agency_name, fund_type, budget_category, line_item_count, total_appropriated, total_actual');

    if (state) {
      query = query.eq('state', state.toUpperCase());
    }

    const { data: statsData, error } = await query;

    if (error) {
      console.error('State budget line items stats query error:', error);
      throw error;
    }

    // Aggregate by state
    const stateMap = new Map<string, {
      recordCount: number;
      totalAppropriated: number;
      totalActual: number;
      agencies: Set<string>;
      fiscalYears: Set<string>;
    }>();

    // Aggregate by fiscal year
    const yearMap = new Map<string, {
      recordCount: number;
      totalAppropriated: number;
      totalActual: number;
    }>();

    // Aggregate by category
    const categoryMap = new Map<string, {
      recordCount: number;
      totalAppropriated: number;
      totalActual: number;
    }>();

    // Track totals
    let totalRecordCount = 0;
    let totalAppropriated = 0;
    let totalActual = 0;
    const allAgencies = new Set<string>();
    const allPrograms = new Set<string>();

    if (statsData) {
      for (const stat of statsData) {
        const recordCount = stat.line_item_count || 0;
        const appropriated = parseFloat(stat.total_appropriated) || 0;
        const actual = parseFloat(stat.total_actual) || 0;

        // By state
        if (!stateMap.has(stat.state)) {
          stateMap.set(stat.state, {
            recordCount: 0,
            totalAppropriated: 0,
            totalActual: 0,
            agencies: new Set(),
            fiscalYears: new Set(),
          });
        }
        const stateStats = stateMap.get(stat.state)!;
        stateStats.recordCount += recordCount;
        stateStats.totalAppropriated += appropriated;
        stateStats.totalActual += actual;
        if (stat.agency_name) stateStats.agencies.add(stat.agency_name);
        if (stat.fiscal_year) stateStats.fiscalYears.add(stat.fiscal_year);

        // By fiscal year
        if (stat.fiscal_year) {
          if (!yearMap.has(stat.fiscal_year)) {
            yearMap.set(stat.fiscal_year, { recordCount: 0, totalAppropriated: 0, totalActual: 0 });
          }
          const yearStats = yearMap.get(stat.fiscal_year)!;
          yearStats.recordCount += recordCount;
          yearStats.totalAppropriated += appropriated;
          yearStats.totalActual += actual;
        }

        // By category
        if (stat.budget_category) {
          if (!categoryMap.has(stat.budget_category)) {
            categoryMap.set(stat.budget_category, { recordCount: 0, totalAppropriated: 0, totalActual: 0 });
          }
          const catStats = categoryMap.get(stat.budget_category)!;
          catStats.recordCount += recordCount;
          catStats.totalAppropriated += appropriated;
          catStats.totalActual += actual;
        }

        // Totals
        totalRecordCount += recordCount;
        totalAppropriated += appropriated;
        totalActual += actual;
        if (stat.agency_name) allAgencies.add(stat.agency_name);
      }
    }

    const response: StateBudgetLineItemsStatsResponse = {
      byState: Array.from(stateMap.entries())
        .map(([st, stats]) => ({
          state: st,
          recordCount: stats.recordCount,
          totalAppropriated: stats.totalAppropriated,
          totalActual: stats.totalActual,
          uniqueAgencies: stats.agencies.size,
          fiscalYears: Array.from(stats.fiscalYears).sort().reverse(),
        }))
        .sort((a, b) => b.totalAppropriated - a.totalAppropriated),
      byFiscalYear: Array.from(yearMap.entries())
        .map(([fy, stats]) => ({
          fiscalYear: fy,
          ...stats,
        }))
        .sort((a, b) => b.fiscalYear.localeCompare(a.fiscalYear)),
      byCategory: Array.from(categoryMap.entries())
        .map(([cat, stats]) => ({
          budgetCategory: cat,
          ...stats,
        }))
        .sort((a, b) => b.totalAppropriated - a.totalAppropriated),
      totals: {
        recordCount: totalRecordCount,
        totalAppropriated,
        totalActual,
        uniqueStates: stateMap.size,
        uniqueAgencies: allAgencies.size,
        uniquePrograms: allPrograms.size,
      },
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('State budget line items stats API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch budget line items stats' },
      { status: 500 }
    );
  }
}
