import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const groupBy = searchParams.get('groupBy') || 'state'; // 'state', 'agency', 'cfda'
  const state = searchParams.get('state');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

  try {
    if (groupBy === 'state') {
      // Get stats grouped by state
      const { data, error } = await supabase.rpc('get_grant_stats_by_state');

      if (error) {
        // Fallback to manual aggregation if RPC doesn't exist
        const { data: grants, error: fetchError } = await supabase
          .from('federal_grants')
          .select('recipient_state, award_amount')
          .not('recipient_state', 'is', null);

        if (fetchError) throw fetchError;

        const stateStats: Record<string, { count: number; total: number }> = {};
        grants?.forEach((g) => {
          const st = g.recipient_state;
          if (!stateStats[st]) stateStats[st] = { count: 0, total: 0 };
          stateStats[st].count++;
          stateStats[st].total += g.award_amount || 0;
        });

        const result = Object.entries(stateStats)
          .map(([state, stats]) => ({
            state,
            grant_count: stats.count,
            total_amount: stats.total,
            avg_amount: stats.total / stats.count
          }))
          .sort((a, b) => b.total_amount - a.total_amount)
          .slice(0, limit);

        return NextResponse.json({ stats: result, groupBy: 'state' });
      }

      return NextResponse.json({ stats: data, groupBy: 'state' });
    }

    if (groupBy === 'agency') {
      // Get stats grouped by awarding agency
      let query = supabase
        .from('federal_grants')
        .select('awarding_agency, award_amount');

      if (state) {
        query = query.eq('recipient_state', state.toUpperCase());
      }

      const { data: grants, error } = await query;

      if (error) throw error;

      const agencyStats: Record<string, { count: number; total: number }> = {};
      grants?.forEach((g) => {
        const agency = g.awarding_agency || 'Unknown';
        if (!agencyStats[agency]) agencyStats[agency] = { count: 0, total: 0 };
        agencyStats[agency].count++;
        agencyStats[agency].total += g.award_amount || 0;
      });

      const result = Object.entries(agencyStats)
        .map(([agency, stats]) => ({
          agency,
          grant_count: stats.count,
          total_amount: stats.total,
          avg_amount: stats.total / stats.count
        }))
        .sort((a, b) => b.total_amount - a.total_amount)
        .slice(0, limit);

      return NextResponse.json({ stats: result, groupBy: 'agency', state: state || 'all' });
    }

    if (groupBy === 'cfda') {
      // Get stats grouped by CFDA program
      let query = supabase
        .from('federal_grants')
        .select('cfda_number, cfda_title, award_amount');

      if (state) {
        query = query.eq('recipient_state', state.toUpperCase());
      }

      const { data: grants, error } = await query;

      if (error) throw error;

      const cfdaStats: Record<string, { title: string; count: number; total: number }> = {};
      grants?.forEach((g) => {
        const cfda = g.cfda_number || 'Unknown';
        if (!cfdaStats[cfda]) {
          cfdaStats[cfda] = { title: g.cfda_title || 'Unknown', count: 0, total: 0 };
        }
        cfdaStats[cfda].count++;
        cfdaStats[cfda].total += g.award_amount || 0;
      });

      const result = Object.entries(cfdaStats)
        .map(([cfda_number, stats]) => ({
          cfda_number,
          cfda_title: stats.title,
          grant_count: stats.count,
          total_amount: stats.total,
          avg_amount: stats.total / stats.count
        }))
        .sort((a, b) => b.total_amount - a.total_amount)
        .slice(0, limit);

      return NextResponse.json({ stats: result, groupBy: 'cfda', state: state || 'all' });
    }

    return NextResponse.json(
      { error: 'Invalid groupBy parameter. Use: state, agency, or cfda' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Grant stats API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch grant statistics' },
      { status: 500 }
    );
  }
}
