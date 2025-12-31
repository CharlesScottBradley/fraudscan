import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export interface CrowdsourceStats {
  total_submissions: number;
  approved_submissions: number;
  pending_submissions: number;
  total_contributors: number;
  states_with_submissions: number;
  states_with_gaps: number;
  total_gaps: number;
  completed_gaps: number;
  critical_gaps: number;
  foia_required_gaps: number;
  top_needs: Array<{
    id: string;
    state_code: string;
    title: string;
    priority: string;
    difficulty: string;
    requires_foia: boolean;
  }>;
  recent_submissions: Array<{
    id: string;
    state_code: string;
    title: string;
    submission_type: string;
    created_at: string;
    username: string | null;
  }>;
  state_coverage: Array<{
    state_code: string;
    total_gaps: number;
    completed: number;
    completion_pct: number;
  }>;
}

export async function GET() {
  try {
    // Fetch all stats in parallel
    const [
      submissionsResult,
      approvedResult,
      pendingResult,
      contributorsResult,
      gapsResult,
      topNeedsResult,
      recentResult,
      statesWithSubmissionsResult,
    ] = await Promise.all([
      // Total submissions
      supabase
        .from('crowdsource_submissions')
        .select('*', { count: 'exact', head: true }),
      
      // Approved submissions
      supabase
        .from('crowdsource_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved'),
      
      // Pending submissions
      supabase
        .from('crowdsource_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),
      
      // Total contributors
      supabase
        .from('crowdsource_contributors')
        .select('*', { count: 'exact', head: true }),
      
      // All gaps for stats
      supabase
        .from('state_data_gaps')
        .select('*')
        .eq('is_active', true),
      
      // Top needs (critical/high priority, not complete)
      supabase
        .from('state_data_gaps')
        .select('id, state_code, title, priority, difficulty, requires_foia')
        .eq('is_active', true)
        .neq('status', 'complete')
        .in('priority', ['critical', 'high'])
        .order('priority', { ascending: true })
        .limit(10),
      
      // Recent approved submissions
      supabase
        .from('crowdsource_submissions')
        .select(`
          id,
          state_code,
          title,
          submission_type,
          created_at,
          contributor:crowdsource_contributors(username)
        `)
        .eq('status', 'approved')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(10),
      
      // States with submissions
      supabase
        .from('crowdsource_submissions')
        .select('state_code')
        .eq('status', 'approved'),
    ]);

    // Calculate gaps stats
    const gaps = gapsResult.data || [];
    const completedGaps = gaps.filter(g => g.status === 'complete').length;
    const criticalGaps = gaps.filter(g => g.priority === 'critical' && g.status !== 'complete').length;
    const foiaRequiredGaps = gaps.filter(g => g.requires_foia && g.status !== 'complete').length;
    
    // Get unique states with gaps
    const statesWithGaps = new Set(gaps.map(g => g.state_code)).size;
    
    // Get unique states with submissions
    const statesWithSubmissions = new Set(
      (statesWithSubmissionsResult.data || []).map(s => s.state_code)
    ).size;

    // Calculate state coverage
    const stateCoverage: Record<string, { total: number; completed: number }> = {};
    gaps.forEach(gap => {
      if (!stateCoverage[gap.state_code]) {
        stateCoverage[gap.state_code] = { total: 0, completed: 0 };
      }
      stateCoverage[gap.state_code].total++;
      if (gap.status === 'complete') {
        stateCoverage[gap.state_code].completed++;
      }
    });

    const stateCoverageArray = Object.entries(stateCoverage)
      .map(([state_code, stats]) => ({
        state_code,
        total_gaps: stats.total,
        completed: stats.completed,
        completion_pct: Math.round((stats.completed / stats.total) * 100),
      }))
      .sort((a, b) => b.total_gaps - a.total_gaps);

    // Transform recent submissions
    const recentSubmissions = (recentResult.data || []).map(s => {
      // Supabase returns joined data as an object (single) or array (multiple)
      const contributor = Array.isArray(s.contributor) 
        ? s.contributor[0] 
        : s.contributor;
      return {
        id: s.id,
        state_code: s.state_code,
        title: s.title,
        submission_type: s.submission_type,
        created_at: s.created_at,
        username: contributor?.username || null,
      };
    });

    const stats: CrowdsourceStats = {
      total_submissions: submissionsResult.count || 0,
      approved_submissions: approvedResult.count || 0,
      pending_submissions: pendingResult.count || 0,
      total_contributors: contributorsResult.count || 0,
      states_with_submissions: statesWithSubmissions,
      states_with_gaps: statesWithGaps,
      total_gaps: gaps.length,
      completed_gaps: completedGaps,
      critical_gaps: criticalGaps,
      foia_required_gaps: foiaRequiredGaps,
      top_needs: topNeedsResult.data || [],
      recent_submissions: recentSubmissions,
      state_coverage: stateCoverageArray,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

