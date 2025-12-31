import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export interface LeaderboardEntry {
  id: string;
  username: string;
  submissions_count: number;
  approved_count: number;
  points: number;
  rank: string;
  states_count: number;
  total_records_contributed: number;
  first_submission_at: string | null;
  last_submission_at: string | null;
  badges: Array<{ id: string; name: string; awarded_at: string }>;
}

export interface LeaderboardResponse {
  contributors: LeaderboardEntry[];
  total: number;
}

// Calculate rank based on points
function calculateRank(points: number): string {
  if (points >= 1000) return 'Master Investigator';
  if (points >= 500) return 'Fraud Fighter';
  if (points >= 300) return 'FOIA Warrior';
  if (points >= 150) return 'Research Analyst';
  if (points >= 50) return 'Data Hunter';
  return 'Contributor';
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Limit
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

  try {
    // Fetch contributors who want to be on leaderboard
    const { data: contributors, error, count } = await supabase
      .from('crowdsource_contributors')
      .select('*', { count: 'exact' })
      .eq('show_on_leaderboard', true)
      .not('username', 'is', null)
      .order('points', { ascending: false })
      .order('approved_count', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching leaderboard:', error);
      return NextResponse.json(
        { error: 'Failed to fetch leaderboard' },
        { status: 500 }
      );
    }

    // Transform and add computed fields
    const leaderboard: LeaderboardEntry[] = (contributors || []).map(c => ({
      id: c.id,
      username: c.username,
      submissions_count: c.submissions_count || 0,
      approved_count: c.approved_count || 0,
      points: c.points || 0,
      rank: calculateRank(c.points || 0),
      states_count: c.states_contributed?.length || 0,
      total_records_contributed: c.total_records_contributed || 0,
      first_submission_at: c.first_submission_at,
      last_submission_at: c.last_submission_at,
      badges: c.badges || [],
    }));

    const response: LeaderboardResponse = {
      contributors: leaderboard,
      total: count || 0,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Leaderboard API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

