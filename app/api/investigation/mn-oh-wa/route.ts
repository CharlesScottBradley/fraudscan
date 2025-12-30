import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export const revalidate = 300; // Cache for 5 minutes

interface StateStats {
  state: string;
  ppp: {
    count: number;
    amount: number;
    flagged_count: number;
    flagged_amount: number;
    fraud_prone_count: number;
  };
  eidl: {
    count: number;
    amount: number;
    flagged_count: number;
    flagged_amount: number;
  };
  sba: {
    count: number;
    amount: number;
    fraud_prone_count: number;
  };
  federal_grants: {
    count: number;
    amount: number;
  };
  state_grants: {
    count: number;
    amount: number;
  };
  doj_articles: number;
  fraud_cases: {
    count: number;
    amount: number;
  };
}

interface DemographicData {
  state: string;
  type: string;
  value: string;
  loan_count: number;
  loan_amount: number;
  pct_of_loans: number;
  flagged_count: number;
  flag_rate: number;
}

interface NamePatternMatch {
  borrower_name: string;
  borrower_state: string;
  initial_approval_amount: number;
  name_score: number;
  patterns: Array<{ pattern: string; weight: number; description: string }>;
}

export async function GET() {
  try {
    const states = ['MN', 'OH', 'WA'];
    
    // Get PPP stats by state
    const { data: pppStats } = await supabase
      .from('ppp_loans')
      .select('borrower_state, initial_approval_amount, is_flagged, is_fraud_prone_industry')
      .in('borrower_state', states);

    // Get EIDL stats by state  
    const { data: eidlStats } = await supabase
      .from('eidl_loans')
      .select('borrower_state, loan_amount, is_flagged, fraud_score')
      .in('borrower_state', states);

    // Get SBA 7(a)/504 stats
    const { data: sbaStats } = await supabase
      .from('sba_loans')
      .select('borrower_state, loan_amount, is_fraud_prone_industry')
      .in('borrower_state', states);

    // Get federal grants stats
    const { data: federalGrants } = await supabase
      .from('federal_grants')
      .select('recipient_state, award_amount')
      .in('recipient_state', states);

    // Get state grants stats
    const { data: stateGrants } = await supabase
      .from('state_grants')
      .select('state, payment_amount')
      .in('state', states);

    // Get DOJ articles count
    const { data: dojArticles } = await supabase
      .from('news_articles')
      .select('state')
      .eq('source_type', 'usa_attorney')
      .in('state', states);

    // Get fraud cases
    const { data: fraudCases } = await supabase
      .from('cases')
      .select('state, total_fraud_amount')
      .in('state', states);

    // Get demographic data
    const { data: demographics } = await supabase
      .from('ppp_demographic_summary')
      .select('*')
      .in('borrower_state', states);

    // Get name pattern matches (top 50) - function may not exist yet
    let namePatterns = null;
    try {
      const result = await supabase.rpc('get_top_name_pattern_matches', { 
        p_states: states,
        p_limit: 50 
      });
      namePatterns = result.data;
    } catch {
      namePatterns = null;
    }

    // Aggregate stats by state
    const stateStatsMap: Record<string, StateStats> = {};
    
    states.forEach(state => {
      stateStatsMap[state] = {
        state,
        ppp: { count: 0, amount: 0, flagged_count: 0, flagged_amount: 0, fraud_prone_count: 0 },
        eidl: { count: 0, amount: 0, flagged_count: 0, flagged_amount: 0 },
        sba: { count: 0, amount: 0, fraud_prone_count: 0 },
        federal_grants: { count: 0, amount: 0 },
        state_grants: { count: 0, amount: 0 },
        doj_articles: 0,
        fraud_cases: { count: 0, amount: 0 }
      };
    });

    // Process PPP
    pppStats?.forEach(row => {
      const s = stateStatsMap[row.borrower_state];
      if (s) {
        s.ppp.count++;
        s.ppp.amount += row.initial_approval_amount || 0;
        if (row.is_flagged) {
          s.ppp.flagged_count++;
          s.ppp.flagged_amount += row.initial_approval_amount || 0;
        }
        if (row.is_fraud_prone_industry) s.ppp.fraud_prone_count++;
      }
    });

    // Process EIDL
    eidlStats?.forEach(row => {
      const s = stateStatsMap[row.borrower_state];
      if (s) {
        s.eidl.count++;
        s.eidl.amount += row.loan_amount || 0;
        if (row.is_flagged) {
          s.eidl.flagged_count++;
          s.eidl.flagged_amount += row.loan_amount || 0;
        }
      }
    });

    // Process SBA
    sbaStats?.forEach(row => {
      const s = stateStatsMap[row.borrower_state];
      if (s) {
        s.sba.count++;
        s.sba.amount += row.loan_amount || 0;
        if (row.is_fraud_prone_industry) s.sba.fraud_prone_count++;
      }
    });

    // Process federal grants
    federalGrants?.forEach(row => {
      const s = stateStatsMap[row.recipient_state];
      if (s) {
        s.federal_grants.count++;
        s.federal_grants.amount += row.award_amount || 0;
      }
    });

    // Process state grants
    stateGrants?.forEach(row => {
      const s = stateStatsMap[row.state];
      if (s) {
        s.state_grants.count++;
        s.state_grants.amount += row.payment_amount || 0;
      }
    });

    // Process DOJ articles
    dojArticles?.forEach(row => {
      const s = stateStatsMap[row.state];
      if (s) s.doj_articles++;
    });

    // Process fraud cases
    fraudCases?.forEach(row => {
      const s = stateStatsMap[row.state];
      if (s) {
        s.fraud_cases.count++;
        s.fraud_cases.amount += row.total_fraud_amount || 0;
      }
    });

    // Calculate totals
    const totals = {
      ppp_count: 0,
      ppp_amount: 0,
      ppp_flagged: 0,
      eidl_count: 0,
      eidl_amount: 0,
      eidl_flagged: 0,
      sba_count: 0,
      sba_amount: 0,
      federal_grants_count: 0,
      federal_grants_amount: 0,
      state_grants_count: 0,
      state_grants_amount: 0,
      doj_articles: 0,
      fraud_cases: 0,
      fraud_amount: 0
    };

    Object.values(stateStatsMap).forEach(s => {
      totals.ppp_count += s.ppp.count;
      totals.ppp_amount += s.ppp.amount;
      totals.ppp_flagged += s.ppp.flagged_count;
      totals.eidl_count += s.eidl.count;
      totals.eidl_amount += s.eidl.amount;
      totals.eidl_flagged += s.eidl.flagged_count;
      totals.sba_count += s.sba.count;
      totals.sba_amount += s.sba.amount;
      totals.federal_grants_count += s.federal_grants.count;
      totals.federal_grants_amount += s.federal_grants.amount;
      totals.state_grants_count += s.state_grants.count;
      totals.state_grants_amount += s.state_grants.amount;
      totals.doj_articles += s.doj_articles;
      totals.fraud_cases += s.fraud_cases.count;
      totals.fraud_amount += s.fraud_cases.amount;
    });

    return NextResponse.json({
      states: Object.values(stateStatsMap),
      totals,
      demographics: demographics || [],
      namePatterns: namePatterns || []
    });

  } catch (error) {
    console.error('Error fetching investigation data:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

