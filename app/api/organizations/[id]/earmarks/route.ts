import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Fetch earmarks where this organization is the recipient
  const { data: earmarks, error: earmarksError } = await supabase
    .from('earmarks')
    .select(`
      id,
      fiscal_year,
      amount_requested,
      industry,
      subcommittee,
      project_description,
      member_name,
      bioguide_id
    `)
    .eq('organization_id', id)
    .order('fiscal_year', { ascending: false })
    .order('amount_requested', { ascending: false });

  if (earmarksError) {
    return NextResponse.json({ error: earmarksError.message }, { status: 500 });
  }

  // Get politician info for each bioguide_id
  const bioguideIds = [...new Set(earmarks?.filter(e => e.bioguide_id).map(e => e.bioguide_id) || [])];
  let politicianMap = new Map<string, { id: string; full_name: string }>();

  if (bioguideIds.length > 0) {
    const { data: politicians } = await supabase
      .from('politicians')
      .select('id, bioguide_id, full_name')
      .in('bioguide_id', bioguideIds);

    if (politicians) {
      politicians.forEach(p => {
        if (p.bioguide_id) {
          politicianMap.set(p.bioguide_id, { id: p.id, full_name: p.full_name || p.bioguide_id });
        }
      });
    }
  }

  // Enrich earmarks with politician info
  const enrichedEarmarks = (earmarks || []).map(e => {
    const politician = e.bioguide_id ? politicianMap.get(e.bioguide_id) : null;
    return {
      id: e.id,
      fiscal_year: e.fiscal_year,
      amount_requested: e.amount_requested,
      industry: e.industry,
      subcommittee: e.subcommittee,
      project_description: e.project_description,
      politician_name: politician?.full_name || e.member_name || null,
      politician_id: politician?.id || null,
      bioguide_id: e.bioguide_id
    };
  });

  // Calculate total
  const totalAmount = enrichedEarmarks.reduce((sum, e) => sum + (e.amount_requested || 0), 0);

  return NextResponse.json({
    earmarks: enrichedEarmarks,
    stats: {
      totalEarmarks: enrichedEarmarks.length,
      totalAmount,
      uniquePoliticians: new Set(enrichedEarmarks.map(e => e.bioguide_id).filter(Boolean)).size
    }
  });
}
