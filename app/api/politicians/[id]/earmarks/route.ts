import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // First get the politician's bioguide_id
  const { data: politician, error: politicianError } = await supabase
    .from('politicians')
    .select('id, bioguide_id, full_name')
    .eq('id', id)
    .single();

  if (politicianError || !politician) {
    return NextResponse.json({ error: 'Politician not found' }, { status: 404 });
  }

  const bioguideId = politician.bioguide_id;

  // If no bioguide_id, return empty results (state/local politicians won't have earmarks)
  if (!bioguideId) {
    return NextResponse.json({
      earmarks: [],
      stats: {
        totalEarmarks: 0,
        totalAmount: 0,
        uniqueRecipients: 0,
        topIndustry: null,
        byIndustry: [],
        fiscalYears: []
      }
    });
  }

  // Fetch earmarks with organization info
  const { data: earmarks, error: earmarksError } = await supabase
    .from('earmarks')
    .select(`
      id,
      fiscal_year,
      recipient_name,
      amount_requested,
      industry,
      recipient_type,
      subcommittee,
      project_description,
      recipient_city,
      recipient_state,
      organization_id
    `)
    .eq('bioguide_id', bioguideId)
    .order('amount_requested', { ascending: false })
    .limit(100);

  if (earmarksError) {
    return NextResponse.json({ error: earmarksError.message }, { status: 500 });
  }

  // Get stats
  const { data: statsData, error: statsError } = await supabase
    .from('earmarks')
    .select('amount_requested, industry, recipient_name, fiscal_year')
    .eq('bioguide_id', bioguideId);

  let stats = {
    totalEarmarks: 0,
    totalAmount: 0,
    uniqueRecipients: 0,
    topIndustry: null as string | null,
    byIndustry: [] as { industry: string; count: number; amount: number }[],
    fiscalYears: [] as number[]
  };

  if (!statsError && statsData) {
    // Calculate aggregates
    stats.totalEarmarks = statsData.length;
    stats.totalAmount = statsData.reduce((sum, e) => sum + (e.amount_requested || 0), 0);
    stats.uniqueRecipients = new Set(statsData.map(e => e.recipient_name)).size;
    stats.fiscalYears = [...new Set(statsData.map(e => e.fiscal_year))].sort();

    // Group by industry
    const industryMap = new Map<string, { count: number; amount: number }>();
    statsData.forEach(e => {
      const ind = e.industry || 'Other';
      const current = industryMap.get(ind) || { count: 0, amount: 0 };
      industryMap.set(ind, {
        count: current.count + 1,
        amount: current.amount + (e.amount_requested || 0)
      });
    });

    stats.byIndustry = Array.from(industryMap.entries())
      .map(([industry, data]) => ({ industry, ...data }))
      .sort((a, b) => b.amount - a.amount);

    stats.topIndustry = stats.byIndustry[0]?.industry || null;
  }

  // Fetch organization details for linked earmarks
  const orgIds = [...new Set(earmarks?.filter(e => e.organization_id).map(e => e.organization_id))];
  let orgMap = new Map<string, { legal_name: string; ein: string | null }>();

  if (orgIds.length > 0) {
    const { data: orgs } = await supabase
      .from('organizations')
      .select('id, legal_name, ein')
      .in('id', orgIds);

    if (orgs) {
      orgs.forEach(o => orgMap.set(o.id, { legal_name: o.legal_name, ein: o.ein }));
    }
  }

  // Enrich earmarks with org info
  const enrichedEarmarks = (earmarks || []).map(e => ({
    ...e,
    organization: e.organization_id ? orgMap.get(e.organization_id) : null
  }));

  return NextResponse.json({
    earmarks: enrichedEarmarks,
    stats
  });
}
