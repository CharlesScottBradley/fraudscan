import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export interface EntityStats {
  count: number;
  geocoded: number;
  funding?: number;
  amount?: number;
  flagged?: number;
}

export interface StateStats {
  childcare: EntityStats;
  nursing_home: EntityStats;
  ppp: EntityStats & { amount: number; flagged: number };
  fraud_cases: { count: number; amount: number };
  total_count: number;
  total_funding: number;
}

export interface MapStatsResponse {
  states: Record<string, StateStats>;
  totals: {
    childcare: number;
    nursing_homes: number;
    ppp_loans: number;
    ppp_amount: number;
    fraud_cases: number;
    fraud_amount: number;
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const entityTypes = searchParams.get('types')?.split(',') || ['childcare', 'nursing_home', 'ppp'];
  const state = searchParams.get('state');

  try {
    // Try to use the materialized view first
    let query = supabase.from('map_entity_stats').select('*');
    
    if (state) {
      query = query.eq('state', state.toUpperCase());
    }

    const { data: viewData, error: viewError } = await query;

    // If materialized view exists and has data, use it
    if (!viewError && viewData && viewData.length > 0) {
      const states: Record<string, StateStats> = {};
      const totals = {
        childcare: 0,
        nursing_homes: 0,
        ppp_loans: 0,
        ppp_amount: 0,
        fraud_cases: 0,
        fraud_amount: 0,
      };

      viewData.forEach((row: {
        state: string;
        childcare_count: number;
        childcare_geocoded: number;
        childcare_funding: number;
        nursing_home_count: number;
        nursing_home_geocoded: number;
        ppp_count: number;
        ppp_total_amount: number;
        ppp_flagged_count: number;
        fraud_case_count: number;
        fraud_total_amount: number;
      }) => {
        if (!row.state) return;
        
        states[row.state] = {
          childcare: {
            count: row.childcare_count || 0,
            geocoded: row.childcare_geocoded || 0,
            funding: row.childcare_funding || 0,
          },
          nursing_home: {
            count: row.nursing_home_count || 0,
            geocoded: row.nursing_home_geocoded || 0,
          },
          ppp: {
            count: row.ppp_count || 0,
            geocoded: row.ppp_count || 0, // PPP is aggregated by state
            amount: row.ppp_total_amount || 0,
            flagged: row.ppp_flagged_count || 0,
          },
          fraud_cases: {
            count: row.fraud_case_count || 0,
            amount: row.fraud_total_amount || 0,
          },
          total_count: (row.childcare_count || 0) + (row.nursing_home_count || 0) + (row.ppp_count || 0),
          total_funding: (row.childcare_funding || 0) + (row.ppp_total_amount || 0),
        };

        totals.childcare += row.childcare_count || 0;
        totals.nursing_homes += row.nursing_home_count || 0;
        totals.ppp_loans += row.ppp_count || 0;
        totals.ppp_amount += row.ppp_total_amount || 0;
        totals.fraud_cases += row.fraud_case_count || 0;
        totals.fraud_amount += row.fraud_total_amount || 0;
      });

      return NextResponse.json({ states, totals });
    }

    // Fallback: Query tables directly if materialized view doesn't exist
    // This is slower but works without the migration
    const stateStatsMap: Record<string, StateStats> = {};
    const totals = {
      childcare: 0,
      nursing_homes: 0,
      ppp_loans: 0,
      ppp_amount: 0,
      fraud_cases: 0,
      fraud_amount: 0,
    };

    // Get childcare provider stats
    if (entityTypes.includes('childcare')) {
      const { data: providers } = await supabase
        .from('providers')
        .select('state, latitude')
        .not('state', 'is', null);

      if (providers) {
        const childcareByState: Record<string, { count: number; geocoded: number }> = {};
        providers.forEach((p: { state: string; latitude: number | null }) => {
          const st = p.state?.toUpperCase();
          if (!st || st.length !== 2) return;
          if (!childcareByState[st]) {
            childcareByState[st] = { count: 0, geocoded: 0 };
          }
          childcareByState[st].count++;
          if (p.latitude) childcareByState[st].geocoded++;
        });

        Object.entries(childcareByState).forEach(([st, data]) => {
          if (!stateStatsMap[st]) {
            stateStatsMap[st] = createEmptyStateStats();
          }
          stateStatsMap[st].childcare = { count: data.count, geocoded: data.geocoded, funding: 0 };
          totals.childcare += data.count;
        });
      }

      // Get funding data
      const { data: payments } = await supabase
        .from('payments')
        .select('total_amount, providers(state)');

      if (payments) {
        payments.forEach((p: { total_amount: number; providers: { state: string } | { state: string }[] | null }) => {
          const provider = p.providers as { state: string } | { state: string }[] | null;
          const st = Array.isArray(provider) ? provider[0]?.state?.toUpperCase() : provider?.state?.toUpperCase();
          if (st && stateStatsMap[st]) {
            stateStatsMap[st].childcare.funding = (stateStatsMap[st].childcare.funding || 0) + (p.total_amount || 0);
          }
        });
      }
    }

    // Get nursing home stats (if table exists)
    if (entityTypes.includes('nursing_home')) {
      const { data: nursingHomes, error } = await supabase
        .from('nursing_homes')
        .select('state, latitude');

      if (!error && nursingHomes) {
        const nhByState: Record<string, { count: number; geocoded: number }> = {};
        nursingHomes.forEach((nh: { state: string; latitude: number | null }) => {
          const st = nh.state?.toUpperCase();
          if (!st || st.length !== 2) return;
          if (!nhByState[st]) {
            nhByState[st] = { count: 0, geocoded: 0 };
          }
          nhByState[st].count++;
          if (nh.latitude) nhByState[st].geocoded++;
        });

        Object.entries(nhByState).forEach(([st, data]) => {
          if (!stateStatsMap[st]) {
            stateStatsMap[st] = createEmptyStateStats();
          }
          stateStatsMap[st].nursing_home = { count: data.count, geocoded: data.geocoded };
          totals.nursing_homes += data.count;
        });
      }
    }

    // Get PPP stats (if table exists)
    if (entityTypes.includes('ppp')) {
      const { data: pppLoans, error } = await supabase
        .from('ppp_loans')
        .select('borrower_state, loan_amount, is_flagged');

      if (!error && pppLoans) {
        const pppByState: Record<string, { count: number; amount: number; flagged: number }> = {};
        pppLoans.forEach((loan: { borrower_state: string; loan_amount: number; is_flagged: boolean }) => {
          const st = loan.borrower_state?.toUpperCase();
          if (!st || st.length !== 2) return;
          if (!pppByState[st]) {
            pppByState[st] = { count: 0, amount: 0, flagged: 0 };
          }
          pppByState[st].count++;
          pppByState[st].amount += loan.loan_amount || 0;
          if (loan.is_flagged) pppByState[st].flagged++;
        });

        Object.entries(pppByState).forEach(([st, data]) => {
          if (!stateStatsMap[st]) {
            stateStatsMap[st] = createEmptyStateStats();
          }
          stateStatsMap[st].ppp = { count: data.count, geocoded: data.count, amount: data.amount, flagged: data.flagged };
          totals.ppp_loans += data.count;
          totals.ppp_amount += data.amount;
        });
      }
    }

    // Get fraud case stats
    const { data: cases } = await supabase
      .from('cases')
      .select('state, total_fraud_amount');

    if (cases) {
      const casesByState: Record<string, { count: number; amount: number }> = {};
      cases.forEach((c: { state: string; total_fraud_amount: number }) => {
        const st = c.state?.toUpperCase();
        if (!st || st.length !== 2) return;
        if (!casesByState[st]) {
          casesByState[st] = { count: 0, amount: 0 };
        }
        casesByState[st].count++;
        casesByState[st].amount += c.total_fraud_amount || 0;
      });

      Object.entries(casesByState).forEach(([st, data]) => {
        if (!stateStatsMap[st]) {
          stateStatsMap[st] = createEmptyStateStats();
        }
        stateStatsMap[st].fraud_cases = data;
        totals.fraud_cases += data.count;
        totals.fraud_amount += data.amount;
      });
    }

    // Calculate totals for each state
    Object.values(stateStatsMap).forEach(stats => {
      stats.total_count = stats.childcare.count + stats.nursing_home.count + stats.ppp.count;
      stats.total_funding = (stats.childcare.funding || 0) + stats.ppp.amount;
    });

    return NextResponse.json({ states: stateStatsMap, totals });

  } catch (error) {
    console.error('Map stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch map stats' },
      { status: 500 }
    );
  }
}

function createEmptyStateStats(): StateStats {
  return {
    childcare: { count: 0, geocoded: 0, funding: 0 },
    nursing_home: { count: 0, geocoded: 0 },
    ppp: { count: 0, geocoded: 0, amount: 0, flagged: 0 },
    fraud_cases: { count: 0, amount: 0 },
    total_count: 0,
    total_funding: 0,
  };
}

