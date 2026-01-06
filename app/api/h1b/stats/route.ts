import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const state = searchParams.get('state');
  const fiscalYear = searchParams.get('fiscalYear');

  try {
    // Get total counts
    let countQuery = supabase.from('h1b_employer_stats').select('*', { count: 'exact', head: true });
    if (state) countQuery = countQuery.eq('state', state.toUpperCase());
    if (fiscalYear) countQuery = countQuery.eq('fiscal_year', parseInt(fiscalYear));
    const { count: totalRecords } = await countQuery;

    // Get aggregates
    let aggQuery = supabase
      .from('h1b_employer_stats')
      .select('total_approvals, total_denials, total_petitions, approval_rate, state, fiscal_year');
    if (state) aggQuery = aggQuery.eq('state', state.toUpperCase());
    if (fiscalYear) aggQuery = aggQuery.eq('fiscal_year', parseInt(fiscalYear));
    aggQuery = aggQuery.limit(50000);
    const { data: aggData } = await aggQuery;

    const totalApprovals = aggData?.reduce((sum, r) => sum + (r.total_approvals || 0), 0) || 0;
    const totalDenials = aggData?.reduce((sum, r) => sum + (r.total_denials || 0), 0) || 0;
    const totalPetitions = aggData?.reduce((sum, r) => sum + (r.total_petitions || 0), 0) || 0;
    const rates = aggData?.filter(r => r.approval_rate).map(r => r.approval_rate) || [];
    const avgApprovalRate = rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : 0;

    // By state (top 15)
    const byState: Record<string, { approvals: number; denials: number; petitions: number }> = {};
    aggData?.forEach(r => {
      if (r.state) {
        if (!byState[r.state]) byState[r.state] = { approvals: 0, denials: 0, petitions: 0 };
        byState[r.state].approvals += r.total_approvals || 0;
        byState[r.state].denials += r.total_denials || 0;
        byState[r.state].petitions += r.total_petitions || 0;
      }
    });
    const topStates = Object.entries(byState)
      .sort((a, b) => b[1].approvals - a[1].approvals)
      .slice(0, 15)
      .map(([state, data]) => ({ state, ...data }));

    // By year
    const byYear: Record<number, { approvals: number; denials: number; petitions: number }> = {};
    aggData?.forEach(r => {
      if (r.fiscal_year) {
        if (!byYear[r.fiscal_year]) byYear[r.fiscal_year] = { approvals: 0, denials: 0, petitions: 0 };
        byYear[r.fiscal_year].approvals += r.total_approvals || 0;
        byYear[r.fiscal_year].denials += r.total_denials || 0;
        byYear[r.fiscal_year].petitions += r.total_petitions || 0;
      }
    });
    const yearTrends = Object.entries(byYear)
      .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
      .map(([year, data]) => ({ year: parseInt(year), ...data }));

    // Top employers (by recent approvals)
    const { data: topEmployers } = await supabase
      .from('h1b_employer_stats')
      .select('employer_name, state, total_approvals, approval_rate')
      .gte('fiscal_year', 2020)
      .order('total_approvals', { ascending: false })
      .limit(20);

    // Fraud flag counts
    const { count: totalFlags } = await supabase
      .from('h1b_fraud_flags')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    const { data: flagStats } = await supabase
      .from('h1b_fraud_flags')
      .select('flag_type, severity')
      .eq('is_active', true);

    const flagsByType: Record<string, number> = {};
    const flagsBySeverity: Record<string, number> = {};
    flagStats?.forEach(f => {
      flagsByType[f.flag_type] = (flagsByType[f.flag_type] || 0) + 1;
      flagsBySeverity[f.severity] = (flagsBySeverity[f.severity] || 0) + 1;
    });

    return NextResponse.json({
      summary: {
        totalRecords: totalRecords || 0,
        totalApprovals,
        totalDenials,
        totalPetitions,
        avgApprovalRate: Math.round(avgApprovalRate * 10) / 10,
        overallApprovalRate: totalPetitions > 0 ? Math.round((totalApprovals / totalPetitions) * 1000) / 10 : 0,
      },
      topStates,
      yearTrends,
      topEmployers: topEmployers || [],
      fraudFlags: {
        total: totalFlags || 0,
        byType: Object.entries(flagsByType).map(([type, count]) => ({ type, count })),
        bySeverity: Object.entries(flagsBySeverity).map(([severity, count]) => ({ severity, count })),
      },
    });
  } catch (error) {
    console.error('H1B stats API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch H1B statistics' },
      { status: 500 }
    );
  }
}
