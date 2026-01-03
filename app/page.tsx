import { supabase } from '@/lib/supabase';
import HomePageClient from './HomePageClient';

const STATE_INFO: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
  MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
  OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  DC: 'District of Columbia',
};

interface EntityStats {
  count: number;
  geocoded?: number;
  funding?: number;
  amount?: number;
  flagged?: number;
  fraudProne?: number;
}

interface StateEntityStats {
  childcare: EntityStats;
  nursing_home: EntityStats;
  ppp: EntityStats & { amount: number; flagged: number; fraudProne: number };
  sba: EntityStats & { amount: number; fraudProne: number };
  h1b: EntityStats & { avgWage: number };
  fraud_cases: { count: number; amount: number };
  total_count: number;
  total_funding: number;
}

async function getMapStats(): Promise<{
  states: Record<string, StateEntityStats>;
  totals: { childcare: number; nursing_homes: number; ppp_loans: number; ppp_amount: number; sba_loans: number; sba_amount: number; h1b: number };
}> {
  const states: Record<string, StateEntityStats> = {};
  const totals = { childcare: 0, nursing_homes: 0, ppp_loans: 0, ppp_amount: 0, sba_loans: 0, sba_amount: 0, h1b: 0 };

  Object.keys(STATE_INFO).forEach(code => {
    states[code] = {
      childcare: { count: 0, geocoded: 0, funding: 0 },
      nursing_home: { count: 0, geocoded: 0 },
      ppp: { count: 0, geocoded: 0, amount: 0, flagged: 0, fraudProne: 0 },
      sba: { count: 0, amount: 0, fraudProne: 0 },
      h1b: { count: 0, avgWage: 0 },
      fraud_cases: { count: 0, amount: 0 },
      total_count: 0,
      total_funding: 0,
    };
  });

  // Fetch main entity stats from view
  const { data: viewData } = await supabase.from('map_entity_stats').select('*');

  // Fetch H-1B stats directly (not in view yet)
  const { data: h1bData } = await supabase
    .from('h1b_applications')
    .select('worksite_state, wage_rate_from');

  // Aggregate H-1B by state
  const h1bByState: Record<string, { count: number; totalWage: number }> = {};
  h1bData?.forEach(row => {
    const state = row.worksite_state;
    if (!state) return;
    if (!h1bByState[state]) h1bByState[state] = { count: 0, totalWage: 0 };
    h1bByState[state].count++;
    if (row.wage_rate_from) h1bByState[state].totalWage += row.wage_rate_from;
  });

  if (viewData) {
    viewData.forEach((row: {
      state: string;
      childcare_count?: number;
      childcare_geocoded?: number;
      childcare_funding?: number;
      nursing_home_count?: number;
      nursing_home_geocoded?: number;
      ppp_count?: number;
      ppp_total_amount?: number;
      ppp_flagged_count?: number;
      ppp_fraud_prone_count?: number;
      sba_count?: number;
      sba_total_amount?: number;
      sba_fraud_prone_count?: number;
      fraud_case_count?: number;
      fraud_total_amount?: number;
    }) => {
      if (!row.state || !states[row.state]) return;

      const h1bStats = h1bByState[row.state] || { count: 0, totalWage: 0 };
      const h1bAvgWage = h1bStats.count > 0 ? h1bStats.totalWage / h1bStats.count : 0;

      states[row.state] = {
        childcare: { count: row.childcare_count || 0, geocoded: row.childcare_geocoded || 0, funding: row.childcare_funding || 0 },
        nursing_home: { count: row.nursing_home_count || 0, geocoded: row.nursing_home_geocoded || 0 },
        ppp: { count: row.ppp_count || 0, geocoded: row.ppp_count || 0, amount: row.ppp_total_amount || 0, flagged: row.ppp_flagged_count || 0, fraudProne: row.ppp_fraud_prone_count || 0 },
        sba: { count: row.sba_count || 0, amount: row.sba_total_amount || 0, fraudProne: row.sba_fraud_prone_count || 0 },
        h1b: { count: h1bStats.count, avgWage: Math.round(h1bAvgWage) },
        fraud_cases: { count: row.fraud_case_count || 0, amount: row.fraud_total_amount || 0 },
        total_count: (row.childcare_count || 0) + (row.nursing_home_count || 0) + (row.ppp_count || 0) + (row.sba_count || 0) + h1bStats.count,
        total_funding: (row.childcare_funding || 0) + (row.ppp_total_amount || 0) + (row.sba_total_amount || 0),
      };

      totals.childcare += row.childcare_count || 0;
      totals.nursing_homes += row.nursing_home_count || 0;
      totals.ppp_loans += row.ppp_count || 0;
      totals.ppp_amount += row.ppp_total_amount || 0;
      totals.sba_loans += row.sba_count || 0;
      totals.sba_amount += row.sba_total_amount || 0;
      totals.h1b += h1bStats.count;
    });
  }

  return { states, totals };
}

async function getFraudTotal(): Promise<number> {
  const { data: cases } = await supabase
    .from('cases')
    .select('total_fraud_amount');
  
  return cases?.reduce((sum, c) => sum + (c.total_fraud_amount || 0), 0) || 0;
}

export const revalidate = 60;

export default async function Home() {
  const [{ states, totals }, totalFraud] = await Promise.all([
    getMapStats(),
    getFraudTotal(),
  ]);

  const totalOrganizations = totals.childcare + totals.nursing_homes + totals.ppp_loans + totals.sba_loans + totals.h1b;

  return (
    <HomePageClient
      stateStats={states}
      entityCounts={{
        childcare: totals.childcare,
        nursing_home: totals.nursing_homes,
        ppp: totals.ppp_loans,
        sba: totals.sba_loans,
        h1b: totals.h1b,
      }}
      totalFraud={totalFraud}
      totalOrganizations={totalOrganizations}
    />
  );
}
