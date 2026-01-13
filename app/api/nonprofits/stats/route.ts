import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Get total count
    const { count: totalCount } = await supabase
      .from('nonprofits')
      .select('*', { count: 'exact', head: true });

    // Get counts by subsection (tax code)
    const { data: bySubsection } = await supabase
      .from('nonprofits')
      .select('subsection, subsection_desc')
      .limit(10000);

    const subsectionCounts: Record<string, { count: number; desc: string }> = {};
    if (bySubsection) {
      bySubsection.forEach(row => {
        const key = row.subsection || 'unknown';
        if (!subsectionCounts[key]) {
          subsectionCounts[key] = { count: 0, desc: row.subsection_desc || '' };
        }
        subsectionCounts[key].count++;
      });
    }

    // Get state distribution (sample)
    const { data: byState } = await supabase
      .from('nonprofits')
      .select('state')
      .limit(10000);

    const stateCounts: Record<string, number> = {};
    if (byState) {
      byState.forEach(row => {
        const key = row.state || 'unknown';
        stateCounts[key] = (stateCounts[key] || 0) + 1;
      });
    }

    return NextResponse.json({
      total: totalCount || 0,
      bySubsection: Object.entries(subsectionCounts)
        .map(([code, data]) => ({ code, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      topStates: Object.entries(stateCounts)
        .map(([state, count]) => ({ state, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
    });
  } catch (error) {
    console.error('Nonprofit stats API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
