import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import ToshiAdBanner from '../components/ToshiAdBanner';

interface Case {
  id: string;
  case_number: string;
  case_name: string;
  court: string | null;
  state: string | null;
  fraud_type: string | null;
  fraud_types: string[] | null;
  total_fraud_amount: number | null;
  total_restitution: number | null;
  status: string;
  date_sentenced: string | null;
  date_convicted: string | null;
  date_indicted: string | null;
  date_charged: string | null;
  doj_press_url: string | null;
}

interface Defendant {
  case_id: string;
}

const STATUS_COLORS: Record<string, string> = {
  investigating: 'bg-gray-700 text-gray-300',
  charged: 'bg-yellow-900/50 text-yellow-400',
  indicted: 'bg-orange-900/50 text-orange-400',
  trial: 'bg-purple-900/50 text-purple-400',
  convicted: 'bg-red-900/50 text-red-400',
  sentenced: 'bg-green-900/50 text-green-400',
  acquitted: 'bg-blue-900/50 text-blue-400',
  dismissed: 'bg-gray-800 text-gray-400',
};

const FRAUD_TYPE_COLORS: Record<string, string> = {
  PPP: 'bg-blue-900/40 text-blue-400 border-blue-800',
  EIDL: 'bg-cyan-900/40 text-cyan-400 border-cyan-800',
  CCAP: 'bg-pink-900/40 text-pink-400 border-pink-800',
  CACFP: 'bg-orange-900/40 text-orange-400 border-orange-800',
  Medicare: 'bg-purple-900/40 text-purple-400 border-purple-800',
  Medicaid: 'bg-violet-900/40 text-violet-400 border-violet-800',
  SNAP: 'bg-amber-900/40 text-amber-400 border-amber-800',
  COVID: 'bg-red-900/40 text-red-400 border-red-800',
  Other: 'bg-gray-800 text-gray-400 border-gray-700',
};

function formatMoney(amount: number | null): string {
  if (!amount) return '-';
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return `$${amount.toLocaleString()}`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getLatestDate(c: Case): string | null {
  return c.date_sentenced || c.date_convicted || c.date_indicted || c.date_charged;
}

async function getCases(): Promise<{ cases: Case[], stats: { total: number, total_amount: number, convicted_count: number } }> {
  const { data: cases, error } = await supabase
    .from('cases')
    .select('*')
    .order('total_fraud_amount', { ascending: false });

  if (error) {
    console.error('Error fetching cases:', error);
    return { cases: [], stats: { total: 0, total_amount: 0, convicted_count: 0 } };
  }

  const total = cases?.length || 0;
  const total_amount = cases?.reduce((sum, c) => sum + (c.total_fraud_amount || 0), 0) || 0;
  const convicted_count = cases?.filter(c => ['convicted', 'sentenced'].includes(c.status)).length || 0;

  return {
    cases: cases || [],
    stats: { total, total_amount, convicted_count }
  };
}

async function getDefendantCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('defendants')
    .select('case_id');

  if (error || !data) return {};

  const counts: Record<string, number> = {};
  data.forEach((d: Defendant) => {
    counts[d.case_id] = (counts[d.case_id] || 0) + 1;
  });
  return counts;
}

export const revalidate = 60;

export default async function CasesPage() {
  const [{ cases, stats }, defendantCounts] = await Promise.all([
    getCases(),
    getDefendantCounts(),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Fraud Cases</h1>
          <p className="text-gray-500">{stats.total} cases tracked</p>
        </div>
      </div>

      {/* Toshi Sponsor Banner */}
      <ToshiAdBanner className="mb-8" />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="border border-gray-800 p-4">
          <p className="text-green-500 font-mono text-3xl font-bold">
            {formatMoney(stats.total_amount)}
          </p>
          <p className="text-gray-500 text-sm">Total fraud amount</p>
        </div>
        <div className="border border-gray-800 p-4">
          <p className="text-white font-mono text-3xl font-bold">{stats.total}</p>
          <p className="text-gray-500 text-sm">Cases tracked</p>
        </div>
        <div className="border border-gray-800 p-4">
          <p className="text-white font-mono text-3xl font-bold">{stats.convicted_count}</p>
          <p className="text-gray-500 text-sm">Convicted/Sentenced</p>
        </div>
      </div>

      {/* Cases Table */}
      <div className="border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-900">
            <tr>
              <th className="text-left p-3 font-medium text-gray-400">Case</th>
              <th className="text-left p-3 font-medium text-gray-400">Type</th>
              <th className="text-right p-3 font-medium text-gray-400">Amount</th>
              <th className="text-center p-3 font-medium text-gray-400">Status</th>
              <th className="text-center p-3 font-medium text-gray-400">State</th>
              <th className="text-right p-3 font-medium text-gray-400">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {cases.map((c) => (
              <tr key={c.id} className="hover:bg-gray-900/50">
                <td className="p-3">
                  <Link
                    href={`/case/${c.id}`}
                    className="font-medium text-white hover:text-green-400"
                  >
                    {c.case_name.length > 50
                      ? c.case_name.substring(0, 50) + '...'
                      : c.case_name}
                  </Link>
                  {defendantCounts[c.id] && (
                    <span className="text-gray-500 text-xs ml-2">
                      ({defendantCounts[c.id]} defendant{defendantCounts[c.id] > 1 ? 's' : ''})
                    </span>
                  )}
                </td>
                <td className="p-3">
                  {c.fraud_type && (
                    <span className={`px-2 py-0.5 rounded text-xs border ${FRAUD_TYPE_COLORS[c.fraud_type] || FRAUD_TYPE_COLORS.Other}`}>
                      {c.fraud_type}
                    </span>
                  )}
                </td>
                <td className="p-3 text-right font-mono text-green-500">
                  {formatMoney(c.total_fraud_amount)}
                </td>
                <td className="p-3 text-center">
                  <span className={`px-2 py-0.5 rounded text-xs ${STATUS_COLORS[c.status] || STATUS_COLORS.investigating}`}>
                    {c.status}
                  </span>
                </td>
                <td className="p-3 text-center text-gray-400">
                  {c.state || '-'}
                </td>
                <td className="p-3 text-right text-gray-500">
                  {formatDate(getLatestDate(c))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {cases.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No cases found. Cases are populated from DOJ press releases.
        </div>
      )}

      {/* Legend */}
      <div className="mt-8 pt-8 border-t border-gray-800">
        <h3 className="text-sm font-medium text-gray-400 mb-3">Fraud Types</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(FRAUD_TYPE_COLORS).map(([type, classes]) => (
            <span key={type} className={`px-2 py-0.5 rounded text-xs border ${classes}`}>
              {type}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
