import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import DonationsMap from '../components/DonationsMap';

const STATE_NAMES: Record<string, string> = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
  'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
  'DC': 'Washington DC', 'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii',
  'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
  'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine',
  'MD': 'Maryland', 'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota',
  'MS': 'Mississippi', 'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska',
  'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico',
  'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
  'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island',
  'SC': 'South Carolina', 'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas',
  'UT': 'Utah', 'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington',
  'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming',
};

async function getDonationStats() {
  // Get totals using RPC function (avoids row limits)
  const { data: totals } = await supabase.rpc('get_donation_totals');
  const totalDonations = totals?.[0]?.total_donations || 0;
  const totalAmount = parseFloat(totals?.[0]?.total_amount || '0');

  // Get stats by state using RPC function
  const { data: stateData } = await supabase.rpc('get_donation_stats_by_state');

  const stateStats: Record<string, { total_amount: number; donation_count: number }> = {};

  // Initialize all states with zero
  Object.keys(STATE_NAMES).forEach(code => {
    stateStats[code] = { total_amount: 0, donation_count: 0 };
  });

  // Populate from RPC results
  stateData?.forEach((d: { state: string; donation_count: number; total_amount: string }) => {
    const state = d.state?.toUpperCase();
    if (state && stateStats[state]) {
      stateStats[state].total_amount = parseFloat(d.total_amount) || 0;
      stateStats[state].donation_count = d.donation_count || 0;
    }
  });

  // Get states with data
  const statesWithData = Object.entries(stateStats)
    .filter(([_, data]) => data.donation_count > 0)
    .sort((a, b) => b[1].total_amount - a[1].total_amount);

  return {
    totalDonations,
    totalAmount,
    stateStats,
    statesWithData,
  };
}

export const revalidate = 60;

function formatMoney(amount: number): string {
  if (amount >= 1000000000) {
    return `$${(amount / 1000000000).toFixed(2)}B`;
  }
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(2)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return `$${amount.toLocaleString()}`;
}

export default async function DonationsPage() {
  const { totalDonations, totalAmount, stateStats, statesWithData } = await getDonationStats();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Political Donations</h1>
        <p className="text-gray-500">Campaign finance data across the United States</p>
      </div>

      {/* Hero stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div>
          <p className="text-green-500 font-mono text-4xl font-bold">
            {formatMoney(totalAmount)}
          </p>
          <p className="text-gray-500 mt-1">Total donations tracked</p>
        </div>
        <div>
          <p className="text-white font-mono text-4xl font-bold">
            {totalDonations.toLocaleString()}
          </p>
          <p className="text-gray-500 mt-1">Individual contributions</p>
        </div>
        <div>
          <p className="text-white font-mono text-4xl font-bold">
            {statesWithData.length}
          </p>
          <p className="text-gray-500 mt-1">States covered</p>
        </div>
      </div>

      {/* Map */}
      <div className="mb-12">
        <DonationsMap stateData={stateStats} />
      </div>

      {/* Top states */}
      {statesWithData.length > 0 && (
        <div className="mb-12">
          <h2 className="text-lg font-bold mb-4">States by Donation Volume</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {statesWithData.slice(0, 10).map(([code, data]) => (
              <Link
                key={code}
                href={`/donations/${code.toLowerCase()}`}
                className="border border-gray-800 p-4 hover:border-gray-600 transition-colors"
              >
                <p className="font-bold">{STATE_NAMES[code] || code}</p>
                <p className="text-green-500 font-mono">{formatMoney(data.total_amount)}</p>
                <p className="text-gray-500 text-sm">{data.donation_count.toLocaleString()} donations</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="flex flex-wrap gap-4 mb-8">
        <Link
          href="/donations/search"
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium"
        >
          Search All Donations
        </Link>
        <Link
          href="/donations/network"
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium"
        >
          Funding Network Analysis
        </Link>
        <Link
          href="/donations/federal"
          className="text-gray-400 hover:text-white text-sm py-2"
        >
          Federal donations →
        </Link>
      </div>

      {/* Data sources */}
      <div className="text-sm text-gray-500 border-t border-gray-800 pt-8">
        <p className="font-medium text-gray-400 mb-2">Data Sources</p>
        <ul className="space-y-1">
          {statesWithData.map(([code]) => (
            <li key={code}>
              <span className="text-white">{STATE_NAMES[code]}</span>
              {code === 'MN' && (
                <span className="text-gray-600"> — <a href="https://cfb.mn.gov" className="underline hover:text-gray-400" target="_blank" rel="noopener">Campaign Finance Board</a></span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
