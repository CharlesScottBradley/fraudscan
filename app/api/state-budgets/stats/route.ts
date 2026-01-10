import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export interface StateBudgetStats {
  state: string;
  state_name: string | null;
  fiscal_year: number;
  total_expenditure: number | null;
  total_revenue: number | null;
  intergovernmental_revenue: number | null;
  public_welfare_expenditure: number | null;
  education_expenditure: number | null;
  expenditure_per_capita: number | null;
  intergovernmental_pct: number | null;
  welfare_pct: number | null;
}

export interface StateBudgetStatsResponse {
  stats: StateBudgetStats[];
  fiscalYears: number[];
  totals: {
    totalExpenditure: number;
    totalFederalAid: number;
    statesWithData: number;
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fiscalYear = searchParams.get('fiscalYear');

  try {
    let query = supabase
      .from('state_budgets')
      .select(`
        state,
        state_name,
        fiscal_year,
        total_expenditure,
        total_revenue,
        intergovernmental_revenue,
        public_welfare_expenditure,
        education_expenditure,
        expenditure_per_capita,
        intergovernmental_pct,
        welfare_pct
      `)
      .order('total_expenditure', { ascending: false, nullsFirst: false });

    if (fiscalYear) {
      query = query.eq('fiscal_year', parseInt(fiscalYear));
    }

    const { data: stats, error } = await query;

    if (error) {
      console.error('State budget stats error:', error);
      throw error;
    }

    // Get available fiscal years
    const { data: fyData } = await supabase
      .from('state_budgets')
      .select('fiscal_year')
      .order('fiscal_year', { ascending: false });

    const fiscalYears = [...new Set(fyData?.map(r => r.fiscal_year) || [])];

    // Calculate totals
    let totalExpenditure = 0;
    let totalFederalAid = 0;
    const statesWithData = new Set<string>();

    for (const stat of stats || []) {
      totalExpenditure += stat.total_expenditure || 0;
      totalFederalAid += stat.intergovernmental_revenue || 0;
      if (stat.state) statesWithData.add(stat.state);
    }

    const response: StateBudgetStatsResponse = {
      stats: stats || [],
      fiscalYears,
      totals: {
        totalExpenditure,
        totalFederalAid,
        statesWithData: statesWithData.size,
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('State budget stats API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch state budget stats' },
      { status: 500 }
    );
  }
}
