import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export interface StateStats {
  state: string;
  total_orgs: number;
  ppp_recipient_count: number;
  eidl_only_count: number;
  fraud_prone_count: number;
  clustered_address_count: number;
  total_ppp_funding: number;
  total_eidl_funding: number;
  total_all_funding: number;
  total_ppp_loans: number;
  total_eidl_loans: number;
  avg_funding_per_org: number;
  top_industry_sector: string | null;
}

export interface StatsResponse {
  states: StateStats[];
  totals: {
    total_orgs: number;
    total_funding: number;
    fraud_prone_orgs: number;
    ppp_recipients: number;
    eidl_recipients: number;
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const state = searchParams.get('state');

  try {
    let query = supabase
      .from('state_organization_stats')
      .select('*')
      .order('total_all_funding', { ascending: false });

    if (state) {
      query = query.eq('state', state.toUpperCase());
    }

    const { data: states, error } = await query;

    if (error) {
      console.error('State stats query error:', error);
      throw error;
    }

    // Calculate totals
    let totalOrgs = 0;
    let totalFunding = 0;
    let fraudProneOrgs = 0;
    let pppRecipients = 0;
    let eidlRecipients = 0;

    (states || []).forEach((s) => {
      totalOrgs += s.total_orgs || 0;
      totalFunding += s.total_all_funding || 0;
      fraudProneOrgs += s.fraud_prone_count || 0;
      pppRecipients += s.ppp_recipient_count || 0;
      eidlRecipients += s.eidl_only_count || 0;
    });

    const response: StatsResponse = {
      states: states || [],
      totals: {
        total_orgs: totalOrgs,
        total_funding: totalFunding,
        fraud_prone_orgs: fraudProneOrgs,
        ppp_recipients: pppRecipients,
        eidl_recipients: eidlRecipients
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
