import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export interface PoliticianCommittee {
  cmte_id: string;
  name: string | null;
  committee_type: string | null;
  party: string | null;
  designation: string;
  designation_label: string;
  total_received: number;
  donation_count: number;
}

const DESIGNATION_LABELS: Record<string, string> = {
  'P': 'Principal Campaign',
  'A': 'Authorized',
  'J': 'Joint Fundraising',
  'U': 'Unauthorized',
  'B': 'Lobbyist/Registrant PAC',
  'D': 'Leadership PAC',
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: 'Politician ID required' }, { status: 400 });
  }

  try {
    // Get politician's FEC candidate ID
    const { data: politician, error: polError } = await supabase
      .from('politicians')
      .select('id, full_name, fec_candidate_id')
      .eq('id', id)
      .single();

    if (polError || !politician) {
      return NextResponse.json({ error: 'Politician not found' }, { status: 404 });
    }

    if (!politician.fec_candidate_id) {
      // No FEC linkage - return empty but valid response
      return NextResponse.json({
        politician_id: id,
        politician_name: politician.full_name,
        fec_candidate_id: null,
        committees: [],
      });
    }

    // Get linked committees from fec_committee_candidate_links
    const { data: links, error: linksError } = await supabase
      .from('fec_committee_candidate_links')
      .select('cmte_id, cmte_dsgn')
      .eq('cand_id', politician.fec_candidate_id);

    if (linksError) {
      console.error('Links query error:', linksError);
      return NextResponse.json(
        { error: 'Failed to fetch committee links' },
        { status: 500 }
      );
    }

    if (!links || links.length === 0) {
      return NextResponse.json({
        politician_id: id,
        politician_name: politician.full_name,
        fec_candidate_id: politician.fec_candidate_id,
        committees: [],
      });
    }

    // Get committee details and stats
    const cmteIds = links.map(l => l.cmte_id);
    const designationMap = new Map(links.map(l => [l.cmte_id, l.cmte_dsgn]));

    // Fetch committee info
    const { data: committees } = await supabase
      .from('fec_committees')
      .select('cmte_id, name, committee_type, party')
      .in('cmte_id', cmteIds);

    // Fetch stats
    const { data: stats } = await supabase
      .from('pac_stats')
      .select('cmte_id, total_received, donation_count')
      .in('cmte_id', cmteIds);

    const committeeMap = new Map(committees?.map(c => [c.cmte_id, c]) || []);
    const statsMap = new Map(stats?.map(s => [s.cmte_id, s]) || []);

    // Build response
    const result: PoliticianCommittee[] = cmteIds.map(cmte_id => {
      const committee = committeeMap.get(cmte_id);
      const stat = statsMap.get(cmte_id);
      const designation = designationMap.get(cmte_id) || 'U';

      return {
        cmte_id,
        name: committee?.name || null,
        committee_type: committee?.committee_type || null,
        party: committee?.party || null,
        designation,
        designation_label: DESIGNATION_LABELS[designation] || 'Unknown',
        total_received: Number(stat?.total_received) || 0,
        donation_count: Number(stat?.donation_count) || 0,
      };
    });

    // Sort by total received (principal campaigns first, then by amount)
    result.sort((a, b) => {
      // Principal campaigns first
      if (a.designation === 'P' && b.designation !== 'P') return -1;
      if (b.designation === 'P' && a.designation !== 'P') return 1;
      // Then by total received
      return b.total_received - a.total_received;
    });

    return NextResponse.json({
      politician_id: id,
      politician_name: politician.full_name,
      fec_candidate_id: politician.fec_candidate_id,
      committees: result,
    });

  } catch (error) {
    console.error('Politician committees error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch committees' },
      { status: 500 }
    );
  }
}
