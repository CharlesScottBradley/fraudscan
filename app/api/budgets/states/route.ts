import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export interface BudgetState {
  id: string;
  name: string;
  fips_code: string | null;
  fiscal_year_start_month: number | null;
  fiscal_year_start_day: number | null;
  county_count: number;
  city_count: number;
  jurisdiction_count: number;
  budget_count: number;
  total_org_count?: number;
  total_ppp_amount?: number;
  // Extracted budget totals
  total_budget_expenditure?: number;
  extracted_budget_count?: number;
}

export async function GET() {
  try {
    // Get all budget states
    const { data: states, error } = await supabase
      .from('budget_states')
      .select(`
        id,
        name,
        fips_code,
        fiscal_year_start_month,
        fiscal_year_start_day,
        county_count,
        city_count,
        jurisdiction_count,
        budget_count
      `)
      .order('name', { ascending: true });

    if (error) {
      console.error('Budget states query error:', error);
      throw error;
    }

    // Get aggregated stats per state from jurisdictions (including cached budget totals)
    const { data: stateStats, error: statsError } = await supabase
      .from('budget_jurisdictions')
      .select('state_id, org_count, ppp_loan_total, total_budget_expenditure');

    if (statsError) {
      console.error('State stats query error:', statsError);
    }

    // Aggregate stats by state (now using cached budget columns)
    const statsMap: Record<string, { org_count: number; ppp_total: number; budget_total: number; extracted_count: number }> = {};
    (stateStats || []).forEach((j: { state_id: string; org_count: number | null; ppp_loan_total: number | null; total_budget_expenditure?: number | null }) => {
      if (!statsMap[j.state_id]) {
        statsMap[j.state_id] = { org_count: 0, ppp_total: 0, budget_total: 0, extracted_count: 0 };
      }
      statsMap[j.state_id].org_count += j.org_count || 0;
      statsMap[j.state_id].ppp_total += j.ppp_loan_total || 0;
      if (j.total_budget_expenditure) {
        statsMap[j.state_id].budget_total += j.total_budget_expenditure;
        statsMap[j.state_id].extracted_count += 1;
      }
    });

    // Merge stats into states
    const statesWithStats = (states || []).map(state => ({
      ...state,
      total_org_count: statsMap[state.id]?.org_count || 0,
      total_ppp_amount: statsMap[state.id]?.ppp_total || 0,
      total_budget_expenditure: statsMap[state.id]?.budget_total || 0,
      extracted_budget_count: statsMap[state.id]?.extracted_count || 0,
    }));

    // Calculate totals
    const totals = statesWithStats.reduce(
      (acc, state) => ({
        jurisdictions: acc.jurisdictions + (state.jurisdiction_count || 0),
        budgets: acc.budgets + (state.budget_count || 0),
        orgs: acc.orgs + (state.total_org_count || 0),
        ppp: acc.ppp + (state.total_ppp_amount || 0),
        budget_expenditure: acc.budget_expenditure + (state.total_budget_expenditure || 0),
        extracted: acc.extracted + (state.extracted_budget_count || 0),
      }),
      { jurisdictions: 0, budgets: 0, orgs: 0, ppp: 0, budget_expenditure: 0, extracted: 0 }
    );

    return NextResponse.json({
      states: statesWithStats,
      totals: {
        states: statesWithStats.length,
        jurisdictions: totals.jurisdictions,
        budgets: totals.budgets,
        orgs: totals.orgs,
        ppp_amount: totals.ppp,
        budget_expenditure: totals.budget_expenditure,
        extracted_count: totals.extracted,
      }
    });

  } catch (error) {
    console.error('Budget states API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch budget states' },
      { status: 500 }
    );
  }
}
