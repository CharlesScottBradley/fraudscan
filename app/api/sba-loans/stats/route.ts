import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const groupBy = searchParams.get('groupBy') || 'state'; // 'state', 'lender', 'naics', 'program'
  const state = searchParams.get('state');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

  try {
    if (groupBy === 'state') {
      // Get stats grouped by state
      const { data: loans, error } = await supabase
        .from('sba_loans')
        .select('borrower_state, gross_approval, loan_program')
        .not('borrower_state', 'is', null);

      if (error) throw error;

      const stateStats: Record<string, { count: number; total: number; by7a: number; by504: number }> = {};
      loans?.forEach((l) => {
        const st = l.borrower_state;
        if (!stateStats[st]) stateStats[st] = { count: 0, total: 0, by7a: 0, by504: 0 };
        stateStats[st].count++;
        stateStats[st].total += l.gross_approval || 0;
        if (l.loan_program === '7(a)') stateStats[st].by7a++;
        if (l.loan_program === '504') stateStats[st].by504++;
      });

      const result = Object.entries(stateStats)
        .map(([state, stats]) => ({
          state,
          loan_count: stats.count,
          total_amount: stats.total,
          avg_amount: stats.total / stats.count,
          by_7a: stats.by7a,
          by_504: stats.by504
        }))
        .sort((a, b) => b.total_amount - a.total_amount)
        .slice(0, limit);

      return NextResponse.json({ stats: result, groupBy: 'state' });
    }

    if (groupBy === 'lender') {
      // Get stats grouped by lender
      let query = supabase
        .from('sba_loans')
        .select('lender_name, gross_approval');

      if (state) {
        query = query.eq('borrower_state', state.toUpperCase());
      }

      const { data: loans, error } = await query;

      if (error) throw error;

      const lenderStats: Record<string, { count: number; total: number }> = {};
      loans?.forEach((l) => {
        const lender = l.lender_name || 'Unknown';
        if (!lenderStats[lender]) lenderStats[lender] = { count: 0, total: 0 };
        lenderStats[lender].count++;
        lenderStats[lender].total += l.gross_approval || 0;
      });

      const result = Object.entries(lenderStats)
        .map(([lender, stats]) => ({
          lender,
          loan_count: stats.count,
          total_amount: stats.total,
          avg_amount: stats.total / stats.count
        }))
        .sort((a, b) => b.total_amount - a.total_amount)
        .slice(0, limit);

      return NextResponse.json({ stats: result, groupBy: 'lender', state: state || 'all' });
    }

    if (groupBy === 'naics') {
      // Get stats grouped by NAICS industry
      let query = supabase
        .from('sba_loans')
        .select('naics_code, naics_description, gross_approval, is_fraud_prone_industry');

      if (state) {
        query = query.eq('borrower_state', state.toUpperCase());
      }

      const { data: loans, error } = await query;

      if (error) throw error;

      const naicsStats: Record<string, { description: string; count: number; total: number; fraudProne: boolean }> = {};
      loans?.forEach((l) => {
        const naics = l.naics_code || 'Unknown';
        if (!naicsStats[naics]) {
          naicsStats[naics] = {
            description: l.naics_description || 'Unknown',
            count: 0,
            total: 0,
            fraudProne: l.is_fraud_prone_industry || false
          };
        }
        naicsStats[naics].count++;
        naicsStats[naics].total += l.gross_approval || 0;
      });

      const result = Object.entries(naicsStats)
        .map(([naics_code, stats]) => ({
          naics_code,
          naics_description: stats.description,
          loan_count: stats.count,
          total_amount: stats.total,
          avg_amount: stats.total / stats.count,
          is_fraud_prone: stats.fraudProne
        }))
        .sort((a, b) => b.total_amount - a.total_amount)
        .slice(0, limit);

      return NextResponse.json({ stats: result, groupBy: 'naics', state: state || 'all' });
    }

    if (groupBy === 'program') {
      // Get stats grouped by loan program (7(a) vs 504)
      let query = supabase
        .from('sba_loans')
        .select('loan_program, loan_subprogram, gross_approval');

      if (state) {
        query = query.eq('borrower_state', state.toUpperCase());
      }

      const { data: loans, error } = await query;

      if (error) throw error;

      const programStats: Record<string, { count: number; total: number }> = {};
      loans?.forEach((l) => {
        const program = `${l.loan_program || 'Unknown'} - ${l.loan_subprogram || 'Standard'}`;
        if (!programStats[program]) programStats[program] = { count: 0, total: 0 };
        programStats[program].count++;
        programStats[program].total += l.gross_approval || 0;
      });

      const result = Object.entries(programStats)
        .map(([program, stats]) => ({
          program,
          loan_count: stats.count,
          total_amount: stats.total,
          avg_amount: stats.total / stats.count
        }))
        .sort((a, b) => b.total_amount - a.total_amount)
        .slice(0, limit);

      return NextResponse.json({ stats: result, groupBy: 'program', state: state || 'all' });
    }

    return NextResponse.json(
      { error: 'Invalid groupBy parameter. Use: state, lender, naics, or program' },
      { status: 400 }
    );

  } catch (error) {
    console.error('SBA loan stats API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SBA loan statistics' },
      { status: 500 }
    );
  }
}
