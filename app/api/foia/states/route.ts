import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const onlyComplete = searchParams.get('complete') === 'true';

  // Get all states with public records data
  let query = supabase
    .from('state_public_records')
    .select(`
      state_code,
      state_name,
      law_name,
      law_short_name,
      response_days,
      is_complete
    `)
    .order('state_name');

  if (onlyComplete) {
    query = query.eq('is_complete', true);
  }

  const { data: states, error } = await query;

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch states' }, { status: 500 });
  }

  // Get agency counts per state
  const { data: agencyCounts } = await supabase
    .from('foia_agency_contacts')
    .select('state_code');

  const agencyCountMap: Record<string, number> = {};
  agencyCounts?.forEach(a => {
    agencyCountMap[a.state_code] = (agencyCountMap[a.state_code] || 0) + 1;
  });

  const statesWithCounts = states?.map(s => ({
    ...s,
    agencyCount: agencyCountMap[s.state_code] || 0,
  }));

  return NextResponse.json({
    states: statesWithCounts || [],
    totalStates: states?.length || 0,
    completeStates: states?.filter(s => s.is_complete).length || 0,
  });
}

