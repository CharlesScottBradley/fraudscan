import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import USMap from './components/USMap';

// All US states for map navigation
const STATE_INFO: Record<string, { name: string; abbr: string }> = {
  AL: { name: 'Alabama', abbr: 'AL' },
  AK: { name: 'Alaska', abbr: 'AK' },
  AZ: { name: 'Arizona', abbr: 'AZ' },
  AR: { name: 'Arkansas', abbr: 'AR' },
  CA: { name: 'California', abbr: 'CA' },
  CO: { name: 'Colorado', abbr: 'CO' },
  CT: { name: 'Connecticut', abbr: 'CT' },
  DE: { name: 'Delaware', abbr: 'DE' },
  FL: { name: 'Florida', abbr: 'FL' },
  GA: { name: 'Georgia', abbr: 'GA' },
  HI: { name: 'Hawaii', abbr: 'HI' },
  ID: { name: 'Idaho', abbr: 'ID' },
  IL: { name: 'Illinois', abbr: 'IL' },
  IN: { name: 'Indiana', abbr: 'IN' },
  IA: { name: 'Iowa', abbr: 'IA' },
  KS: { name: 'Kansas', abbr: 'KS' },
  KY: { name: 'Kentucky', abbr: 'KY' },
  LA: { name: 'Louisiana', abbr: 'LA' },
  ME: { name: 'Maine', abbr: 'ME' },
  MD: { name: 'Maryland', abbr: 'MD' },
  MA: { name: 'Massachusetts', abbr: 'MA' },
  MI: { name: 'Michigan', abbr: 'MI' },
  MN: { name: 'Minnesota', abbr: 'MN' },
  MS: { name: 'Mississippi', abbr: 'MS' },
  MO: { name: 'Missouri', abbr: 'MO' },
  MT: { name: 'Montana', abbr: 'MT' },
  NE: { name: 'Nebraska', abbr: 'NE' },
  NV: { name: 'Nevada', abbr: 'NV' },
  NH: { name: 'New Hampshire', abbr: 'NH' },
  NJ: { name: 'New Jersey', abbr: 'NJ' },
  NM: { name: 'New Mexico', abbr: 'NM' },
  NY: { name: 'New York', abbr: 'NY' },
  NC: { name: 'North Carolina', abbr: 'NC' },
  ND: { name: 'North Dakota', abbr: 'ND' },
  OH: { name: 'Ohio', abbr: 'OH' },
  OK: { name: 'Oklahoma', abbr: 'OK' },
  OR: { name: 'Oregon', abbr: 'OR' },
  PA: { name: 'Pennsylvania', abbr: 'PA' },
  RI: { name: 'Rhode Island', abbr: 'RI' },
  SC: { name: 'South Carolina', abbr: 'SC' },
  SD: { name: 'South Dakota', abbr: 'SD' },
  TN: { name: 'Tennessee', abbr: 'TN' },
  TX: { name: 'Texas', abbr: 'TX' },
  UT: { name: 'Utah', abbr: 'UT' },
  VT: { name: 'Vermont', abbr: 'VT' },
  VA: { name: 'Virginia', abbr: 'VA' },
  WA: { name: 'Washington', abbr: 'WA' },
  WV: { name: 'West Virginia', abbr: 'WV' },
  WI: { name: 'Wisconsin', abbr: 'WI' },
  WY: { name: 'Wyoming', abbr: 'WY' },
  DC: { name: 'District of Columbia', abbr: 'DC' },
};

async function getStateStats(): Promise<Record<string, { count: number; funding: number }>> {
  const stats: Record<string, { count: number; funding: number }> = {};

  // Initialize all states
  Object.keys(STATE_INFO).forEach(code => {
    stats[code] = { count: 0, funding: 0 };
  });

  // Get provider counts per state using individual count queries
  // This is more efficient than fetching all rows
  const stateCountPromises = Object.keys(STATE_INFO).map(async (state) => {
    const { count } = await supabase
      .from('providers')
      .select('*', { count: 'exact', head: true })
      .eq('state', state);
    return { state, count: count || 0 };
  });

  const stateCounts = await Promise.all(stateCountPromises);
  stateCounts.forEach(({ state, count }) => {
    if (stats[state]) {
      stats[state].count = count;
    }
  });

  // Get funding by state (via provider join)
  const { data: payments } = await supabase
    .from('payments')
    .select('total_amount, providers(state)');

  // Sum funding
  payments?.forEach((p) => {
    const provider = p.providers as { state: string } | { state: string }[] | null;
    const state = Array.isArray(provider) ? provider[0]?.state?.toUpperCase() : provider?.state?.toUpperCase();
    if (state && stats[state]) {
      stats[state].funding += p.total_amount || 0;
    }
  });

  return stats;
}

async function getTotalStats() {
  const { count: providerCount } = await supabase
    .from('providers')
    .select('*', { count: 'exact', head: true });

  const { data: payments } = await supabase
    .from('payments')
    .select('total_amount');

  const totalFunding = payments?.reduce((sum, p) => sum + (p.total_amount || 0), 0) || 0;

  return { providerCount: providerCount || 0, totalFunding };
}

export const revalidate = 60;

function formatMoney(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(2)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return `$${amount.toLocaleString()}`;
}

export default async function Home() {
  const stateStats = await getStateStats();
  const { providerCount, totalFunding } = await getTotalStats();

  // Get top states by funding
  const topStates = Object.entries(stateStats)
    .filter(([_, data]) => data.funding > 0)
    .sort((a, b) => b[1].funding - a[1].funding)
    .slice(0, 5);

  return (
    <div>
      {/* Hero stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div>
          <p className="text-green-500 font-mono text-4xl font-bold">
            {formatMoney(totalFunding)}
          </p>
          <p className="text-gray-500 mt-1">Total fraud tracked</p>
        </div>
        <div>
          <p className="text-white font-mono text-4xl font-bold">
            {providerCount.toLocaleString()}
          </p>
          <p className="text-gray-500 mt-1">Providers in database</p>
        </div>
        <div>
          <p className="text-white font-mono text-4xl font-bold">
            {Object.values(stateStats).filter(s => s.count > 0).length}
          </p>
          <p className="text-gray-500 mt-1">States covered</p>
        </div>
      </div>

      {/* US Map */}
      <div className="mb-12">
        <USMap stateData={stateStats} />
      </div>

      {/* Top states by fraud */}
      {topStates.length > 0 && (
        <div className="mb-12">
          <h2 className="text-lg font-bold mb-4">Top States by Fraud Amount</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {topStates.map(([code, data]) => (
              <Link
                key={code}
                href={`/state/${code.toLowerCase()}`}
                className="border border-gray-800 p-4 hover:border-gray-600 transition-colors"
              >
                <p className="font-bold">{STATE_INFO[code]?.name || code}</p>
                <p className="text-green-500 font-mono">{formatMoney(data.funding)}</p>
                <p className="text-gray-500 text-sm">{data.count} providers</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="flex gap-4">
        <Link
          href="/leaderboard"
          className="text-gray-400 hover:text-white text-sm"
        >
          View full leaderboard →
        </Link>
        <Link
          href="/database"
          className="text-gray-400 hover:text-white text-sm"
        >
          Search database →
        </Link>
      </div>
    </div>
  );
}
