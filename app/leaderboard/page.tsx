import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface TopPolitician {
  politician_id: string;
  full_name: string;
  party: string | null;
  state: string | null;
  office_title: string | null;
  office_type: string | null;
  contribution_count: number;
  total_amount: number;
}

async function getTopPoliticians(): Promise<TopPolitician[]> {
  // Use materialized view for fast queries (avoids 3s Supabase timeout)
  const { data, error } = await supabase
    .from('top_politicians_by_contributions')
    .select('*')
    .limit(25);

  if (error) {
    console.error('Error fetching top politicians:', error);
    return [];
  }

  return (data || []) as TopPolitician[];
}

async function getTotalContributions(): Promise<{ count: number; amount: number }> {
  // Sum from materialized view (fast, no timeout issues)
  const { data, error } = await supabase
    .from('top_politicians_by_contributions')
    .select('contribution_count, total_amount');

  if (error) {
    console.error('Error fetching contribution totals:', error);
    return { count: 0, amount: 0 };
  }

  // Sum across all politicians in the view
  const totalCount = (data || []).reduce((sum, p) => sum + (Number(p.contribution_count) || 0), 0);
  const totalAmount = (data || []).reduce((sum, p) => sum + (Number(p.total_amount) || 0), 0);

  return { count: totalCount, amount: totalAmount };
}

// Revalidate every 60 seconds
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

const PARTY_BG_COLORS: Record<string, string> = {
  R: 'bg-red-900/40 text-red-400 border-red-800',
  Republican: 'bg-red-900/40 text-red-400 border-red-800',
  D: 'bg-blue-900/40 text-blue-400 border-blue-800',
  Democrat: 'bg-blue-900/40 text-blue-400 border-blue-800',
  Democratic: 'bg-blue-900/40 text-blue-400 border-blue-800',
  I: 'bg-purple-900/40 text-purple-400 border-purple-800',
  Independent: 'bg-purple-900/40 text-purple-400 border-purple-800',
};

function getPartyBgClass(party: string | null): string {
  if (!party) return 'bg-gray-800 text-gray-400 border-gray-700';
  return PARTY_BG_COLORS[party] || PARTY_BG_COLORS[party.charAt(0).toUpperCase()] || 'bg-gray-800 text-gray-400 border-gray-700';
}

export default async function LeaderboardPage() {
  const topPoliticians = await getTopPoliticians();
  const totals = await getTotalContributions();

  return (
    <div>
      <div className="mb-12">
        <p className="text-green-500 font-mono text-4xl font-bold">
          {formatMoney(totals.amount)}
        </p>
        <p className="text-gray-500 mt-1">Total tracked from top 100 recipients</p>
        <p className="text-gray-600 text-sm mt-2">
          {totals.count.toLocaleString()} contributions to top recipients
        </p>
      </div>

      <h2 className="text-lg font-bold mb-4">Top Political Donation Recipients</h2>
      <p className="text-gray-500 text-sm mb-6">
        Politicians ranked by total campaign contributions received, based on FEC filings.
      </p>

      {topPoliticians.length > 0 ? (
        <table className="w-full">
          <thead>
            <tr className="text-left text-gray-500 text-sm border-b border-gray-800">
              <th className="pb-3 font-normal w-12">#</th>
              <th className="pb-3 font-normal">Name</th>
              <th className="pb-3 font-normal">Party</th>
              <th className="pb-3 font-normal">State</th>
              <th className="pb-3 font-normal">Office</th>
              <th className="pb-3 font-normal text-right">Contributions</th>
              <th className="pb-3 font-normal text-right">Total Raised</th>
            </tr>
          </thead>
          <tbody>
            {topPoliticians.map((politician, index) => (
              <tr key={politician.politician_id} className="border-b border-gray-900 hover:bg-gray-950">
                <td className="py-4 text-gray-500">{index + 1}</td>
                <td className="py-4">
                  <Link
                    href={`/politician/${politician.politician_id}`}
                    className="hover:underline hover:text-green-400"
                  >
                    {politician.full_name}
                  </Link>
                </td>
                <td className="py-4">
                  <span className={`px-2 py-0.5 rounded text-xs border ${getPartyBgClass(politician.party)}`}>
                    {politician.party || '-'}
                  </span>
                </td>
                <td className="py-4 text-gray-400">{politician.state || '-'}</td>
                <td className="py-4 text-gray-400">
                  {politician.office_title || politician.office_type || '-'}
                </td>
                <td className="py-4 text-right font-mono text-gray-400">
                  {politician.contribution_count.toLocaleString()}
                </td>
                <td className="py-4 text-right font-mono">
                  <span className="text-green-500 font-bold">{formatMoney(politician.total_amount)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-gray-500">No contribution data available yet.</p>
      )}

      {/* Data source */}
      <div className="mt-8 pt-8 border-t border-gray-800 text-sm text-gray-500">
        <p className="font-medium text-gray-400 mb-2">Data Source</p>
        <p>
          <span className="text-white">FEC</span>
          <span className="text-gray-600"> - <a href="https://fec.gov" className="underline hover:text-gray-400" target="_blank" rel="noopener">Federal Election Commission</a></span>
        </p>
      </div>
    </div>
  );
}
