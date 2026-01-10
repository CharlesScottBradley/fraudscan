import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export interface StateBudget {
  id: string;
  state: string;
  state_name: string | null;
  state_fips: string | null;
  fiscal_year: number;

  // Revenue
  total_revenue: number | null;
  tax_revenue: number | null;
  individual_income_tax: number | null;
  corporate_income_tax: number | null;
  sales_tax: number | null;
  intergovernmental_revenue: number | null;
  charges_revenue: number | null;

  // Expenditure
  total_expenditure: number | null;
  education_expenditure: number | null;
  higher_education_expenditure: number | null;
  public_welfare_expenditure: number | null;
  health_expenditure: number | null;
  hospitals_expenditure: number | null;
  highways_expenditure: number | null;
  police_expenditure: number | null;
  corrections_expenditure: number | null;

  // Calculated
  intergovernmental_pct: number | null;
  welfare_pct: number | null;
  education_pct: number | null;

  // Per capita
  population: number | null;
  revenue_per_capita: number | null;
  expenditure_per_capita: number | null;
  debt_per_capita: number | null;

  // Debt
  total_debt: number | null;
}

export interface StateBudgetResponse {
  budgets: StateBudget[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  stats: {
    totalExpenditure: number;
    totalRevenue: number;
    totalFederalAid: number;
    avgWelfarePct: number;
    avgEducationPct: number;
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
  const sortBy = searchParams.get('sortBy') || 'total_expenditure';
  const sortDir = searchParams.get('sortDir') || 'desc';

  try {
    // Build query
    let query = supabase
      .from('state_budgets')
      .select(`
        id,
        state,
        state_name,
        state_fips,
        fiscal_year,
        total_revenue,
        tax_revenue,
        individual_income_tax,
        corporate_income_tax,
        sales_tax,
        intergovernmental_revenue,
        charges_revenue,
        total_expenditure,
        education_expenditure,
        higher_education_expenditure,
        public_welfare_expenditure,
        health_expenditure,
        hospitals_expenditure,
        highways_expenditure,
        police_expenditure,
        corrections_expenditure,
        intergovernmental_pct,
        welfare_pct,
        education_pct,
        population,
        revenue_per_capita,
        expenditure_per_capita,
        debt_per_capita,
        total_debt
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

    // Sorting
    const validSortColumns = [
      'total_expenditure', 'total_revenue', 'public_welfare_expenditure',
      'education_expenditure', 'intergovernmental_revenue', 'expenditure_per_capita',
      'state', 'fiscal_year', 'population', 'total_debt'
    ];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'total_expenditure';
    query = query.order(sortColumn, { ascending: sortDir === 'asc', nullsFirst: false });

    // Pagination
    query = query.range(offset, offset + pageSize - 1);

    const { data: budgets, error, count } = await query;

    if (error) {
      console.error('State budgets query error:', error);
      throw error;
    }

    // Get aggregate stats
    const { data: allBudgets } = await supabase
      .from('state_budgets')
      .select('total_expenditure, total_revenue, intergovernmental_revenue, welfare_pct, education_pct, fiscal_year');

    let totalExpenditure = 0;
    let totalRevenue = 0;
    let totalFederalAid = 0;
    let welfarePctSum = 0;
    let educationPctSum = 0;
    let pctCount = 0;
    const fiscalYearSet = new Set<number>();

    if (allBudgets) {
      for (const budget of allBudgets) {
        totalExpenditure += budget.total_expenditure || 0;
        totalRevenue += budget.total_revenue || 0;
        totalFederalAid += budget.intergovernmental_revenue || 0;
        if (budget.welfare_pct) {
          welfarePctSum += budget.welfare_pct;
          pctCount++;
        }
        if (budget.education_pct) {
          educationPctSum += budget.education_pct;
        }
        if (budget.fiscal_year) {
          fiscalYearSet.add(budget.fiscal_year);
        }
      }
    }

    const response: StateBudgetResponse = {
      budgets: budgets || [],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
      stats: {
        totalExpenditure,
        totalRevenue,
        totalFederalAid,
        avgWelfarePct: pctCount > 0 ? Math.round(welfarePctSum / pctCount * 100) / 100 : 0,
        avgEducationPct: pctCount > 0 ? Math.round(educationPctSum / pctCount * 100) / 100 : 0,
        fiscalYears: Array.from(fiscalYearSet).sort((a, b) => b - a),
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('State budgets API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch state budgets' },
      { status: 500 }
    );
  }
}
