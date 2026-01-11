import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export interface PACDetail {
  cmte_id: string;
  name: string | null;
  committee_type: string | null;
  party: string | null;
  state: string | null;
  description: string | null;
  fec_url: string;
  stats: {
    total_received: number;
    donation_count: number;
    avg_donation: number;
    donor_states_count: number;
    first_donation: string | null;
    last_donation: string | null;
  };
  linkedCandidates: {
    cand_id: string;
    cand_name: string | null;
    party: string | null;
    office: string | null;
    state: string | null;
    designation: string;
    designation_label: string;
    politician_id: string | null;
  }[];
  topDonors: {
    name: string;
    employer: string | null;
    occupation: string | null;
    city: string | null;
    state: string | null;
    total_amount: number;
    donation_count: number;
  }[];
}

const DESIGNATION_LABELS: Record<string, string> = {
  'P': 'Principal Campaign Committee',
  'A': 'Authorized Committee',
  'J': 'Joint Fundraising Committee',
  'U': 'Unauthorized',
  'B': 'Lobbyist/Registrant PAC',
  'D': 'Leadership PAC',
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ cmte_id: string }> }
) {
  const { cmte_id } = await params;

  if (!cmte_id) {
    return NextResponse.json({ error: 'Committee ID required' }, { status: 400 });
  }

  try {
    // Fetch committee info
    const { data: committee, error: committeeError } = await supabase
      .from('fec_committees')
      .select('cmte_id, name, committee_type, party, state, description, fec_url')
      .eq('cmte_id', cmte_id)
      .single();

    // Fetch stats from pac_stats
    const { data: stats, error: statsError } = await supabase
      .from('pac_stats')
      .select('total_received, donation_count, avg_donation, donor_states_count, first_donation, last_donation')
      .eq('cmte_id', cmte_id)
      .single();

    // If no committee found, still try to get stats (committee might exist in contributions but not in fec_committees)
    if (!committee && !stats) {
      return NextResponse.json({ error: 'Committee not found' }, { status: 404 });
    }

    // Fetch linked candidates from fec_committee_candidate_links
    const { data: links } = await supabase
      .from('fec_committee_candidate_links')
      .select('cand_id, cmte_dsgn')
      .eq('cmte_id', cmte_id);

    // Get candidate details for linked candidates
    const candIds = links?.map(l => l.cand_id) || [];
    let linkedCandidates: PACDetail['linkedCandidates'] = [];

    if (candIds.length > 0) {
      const { data: candidates } = await supabase
        .from('fec_candidates')
        .select('cand_id, cand_name, cand_pty_affiliation, cand_office, cand_st')
        .in('cand_id', candIds);

      // Also try to find matching politicians
      const { data: politicians } = await supabase
        .from('politicians')
        .select('id, fec_candidate_id')
        .in('fec_candidate_id', candIds);

      const politicianMap = new Map(politicians?.map(p => [p.fec_candidate_id, p.id]) || []);
      const linkDesignations = new Map(links?.map(l => [l.cand_id, l.cmte_dsgn]) || []);

      linkedCandidates = (candidates || []).map(c => ({
        cand_id: c.cand_id,
        cand_name: c.cand_name,
        party: c.cand_pty_affiliation,
        office: c.cand_office,
        state: c.cand_st,
        designation: linkDesignations.get(c.cand_id) || 'U',
        designation_label: DESIGNATION_LABELS[linkDesignations.get(c.cand_id) || 'U'] || 'Unknown',
        politician_id: politicianMap.get(c.cand_id) || null,
      }));
    }

    // Fetch top donors (aggregate by name)
    const { data: donorData } = await supabase
      .from('fec_contributions')
      .select('name, employer, occupation, city, state, transaction_amt')
      .eq('cmte_id', cmte_id)
      .not('name', 'is', null)
      .order('transaction_amt', { ascending: false })
      .limit(1000); // Get more to aggregate

    // Aggregate donors by name
    const donorMap = new Map<string, {
      name: string;
      employer: string | null;
      occupation: string | null;
      city: string | null;
      state: string | null;
      total_amount: number;
      donation_count: number;
    }>();

    donorData?.forEach(d => {
      const key = d.name?.toUpperCase() || '';
      if (!key) return;

      const existing = donorMap.get(key);
      if (existing) {
        existing.total_amount += Number(d.transaction_amt) || 0;
        existing.donation_count += 1;
      } else {
        donorMap.set(key, {
          name: d.name || '',
          employer: d.employer,
          occupation: d.occupation,
          city: d.city,
          state: d.state,
          total_amount: Number(d.transaction_amt) || 0,
          donation_count: 1,
        });
      }
    });

    // Sort by total amount and take top 20
    const topDonors = Array.from(donorMap.values())
      .sort((a, b) => b.total_amount - a.total_amount)
      .slice(0, 20);

    const response: PACDetail = {
      cmte_id,
      name: committee?.name || null,
      committee_type: committee?.committee_type || null,
      party: committee?.party || null,
      state: committee?.state || null,
      description: committee?.description || null,
      fec_url: committee?.fec_url || `https://www.fec.gov/data/committee/${cmte_id}/`,
      stats: {
        total_received: Number(stats?.total_received) || 0,
        donation_count: Number(stats?.donation_count) || 0,
        avg_donation: Number(stats?.avg_donation) || 0,
        donor_states_count: Number(stats?.donor_states_count) || 0,
        first_donation: stats?.first_donation || null,
        last_donation: stats?.last_donation || null,
      },
      linkedCandidates,
      topDonors,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('PAC detail error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch committee details' },
      { status: 500 }
    );
  }
}
