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
      .from('snap_retailers')
      .select('*', { count: 'exact', head: true });

    // Get active count
    const { count: activeCount } = await supabase
      .from('snap_retailers')
      .select('*', { count: 'exact', head: true })
      .eq('is_currently_authorized', true);

    // Sample for aggregations (Supabase doesn't have GROUP BY via REST API easily)
    const { data: stateSample } = await supabase
      .from('snap_retailers')
      .select('state')
      .eq('is_currently_authorized', true)
      .limit(50000);

    const byState: Record<string, number> = {};
    stateSample?.forEach(r => {
      byState[r.state] = (byState[r.state] || 0) + 1;
    });

    const topStates = Object.entries(byState)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([state, count]) => ({ state, count }));

    // Store types
    const { data: typeSample } = await supabase
      .from('snap_retailers')
      .select('store_type')
      .eq('is_currently_authorized', true)
      .limit(50000);

    const byType: Record<string, number> = {};
    typeSample?.forEach(r => {
      if (r.store_type) {
        byType[r.store_type] = (byType[r.store_type] || 0) + 1;
      }
    });

    const storeTypes = Object.entries(byType)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([type, count]) => ({ type, count }));

    return NextResponse.json({
      totalRetailers: totalCount || 0,
      activeRetailers: activeCount || 0,
      inactiveRetailers: (totalCount || 0) - (activeCount || 0),
      topStates,
      storeTypes,
    });
  } catch (error) {
    console.error('SNAP stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
