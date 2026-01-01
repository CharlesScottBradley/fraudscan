import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface FECStats {
  totalContributions: number;
  totalAmount: number;
  fraudLinkedCount: number;
  fraudLinkedAmount: number;
  electionCycles: number[];
  topCommittees: { cmte_id: string; total: number; count: number }[];
  topStates: { state: string; total: number; count: number }[];
}

interface FECContribution {
  id: string;
  name: string | null;
  city: string | null;
  state: string | null;
  employer: string | null;
  occupation: string | null;
  cmte_id: string | null;
  transaction_amt: number;
  transaction_dt: string | null;
  election_cycle: number;
  is_fraud_linked: boolean;
  fraud_match_type: string | null;
}

async function getFECStats(): Promise<FECStats> {
  // Get total counts
  const { count: totalContributions } = await supabase
    .from('fec_contributions')
    .select('*', { count: 'exact', head: true });

  const { data: totalData } = await supabase
    .from('fec_contributions')
    .select('transaction_amt');

  const totalAmount = totalData?.reduce((sum, r) => sum + (r.transaction_amt || 0), 0) || 0;

  // Get fraud-linked stats
  const { count: fraudLinkedCount } = await supabase
    .from('fec_contributions')
    .select('*', { count: 'exact', head: true })
    .eq('is_fraud_linked', true);

  const { data: fraudData } = await supabase
    .from('fec_contributions')
    .select('transaction_amt')
    .eq('is_fraud_linked', true);

  const fraudLinkedAmount = fraudData?.reduce((sum, r) => sum + (r.transaction_amt || 0), 0) || 0;

  // Get election cycles
  const { data: cyclesData } = await supabase
    .from('fec_contributions')
    .select('election_cycle')
    .order('election_cycle', { ascending: false });

  const electionCycles = [...new Set(cyclesData?.map(r => r.election_cycle) || [])];

  // Get top committees
  const { data: committeeData } = await supabase
    .from('fec_contributions')
    .select('cmte_id, transaction_amt')
    .not('cmte_id', 'is', null)
    .limit(10000);

  const committeeMap = new Map<string, { total: number; count: number }>();
  committeeData?.forEach(r => {
    const existing = committeeMap.get(r.cmte_id) || { total: 0, count: 0 };
    committeeMap.set(r.cmte_id, {
      total: existing.total + (r.transaction_amt || 0),
      count: existing.count + 1,
    });
  });

  const topCommittees = [...committeeMap.entries()]
    .map(([cmte_id, stats]) => ({ cmte_id, ...stats }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  // Get top states
  const { data: stateData } = await supabase
    .from('fec_contributions')
    .select('state, transaction_amt')
    .not('state', 'is', null)
    .limit(50000);

  const stateMap = new Map<string, { total: number; count: number }>();
  stateData?.forEach(r => {
    if (!r.state) return;
    const existing = stateMap.get(r.state) || { total: 0, count: 0 };
    stateMap.set(r.state, {
      total: existing.total + (r.transaction_amt || 0),
      count: existing.count + 1,
    });
  });

  const topStates = [...stateMap.entries()]
    .map(([state, stats]) => ({ state, ...stats }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  return {
    totalContributions: totalContributions || 0,
    totalAmount,
    fraudLinkedCount: fraudLinkedCount || 0,
    fraudLinkedAmount,
    electionCycles,
    topCommittees,
    topStates,
  };
}

async function getRecentContributions(limit: number = 50): Promise<FECContribution[]> {
  const { data } = await supabase
    .from('fec_contributions')
    .select('id, name, city, state, employer, occupation, cmte_id, transaction_amt, transaction_dt, election_cycle, is_fraud_linked, fraud_match_type')
    .order('transaction_amt', { ascending: false })
    .limit(limit);

  return (data || []) as FECContribution[];
}

async function getFraudLinkedContributions(limit: number = 50): Promise<FECContribution[]> {
  const { data } = await supabase
    .from('fec_contributions')
    .select('id, name, city, state, employer, occupation, cmte_id, transaction_amt, transaction_dt, election_cycle, is_fraud_linked, fraud_match_type')
    .eq('is_fraud_linked', true)
    .order('transaction_amt', { ascending: false })
    .limit(limit);

  return (data || []) as FECContribution[];
}

export const revalidate = 3600; // Cache for 1 hour

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

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default async function FederalDonationsPage() {
  const stats = await getFECStats();
  const topContributions = await getRecentContributions(25);
  const fraudLinked = await getFraudLinkedContributions(25);

  const hasData = stats.totalContributions > 0;

  return (
    <div>
      <div className="mb-2">
        <Link href="/donations" className="text-gray-500 hover:text-white text-sm">
          &larr; Back to donations
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Federal Campaign Contributions</h1>
        <p className="text-gray-500">FEC data for Senate, House, and Presidential races</p>
      </div>

      {!hasData ? (
        <div className="border border-gray-800 p-8 text-center">
          <p className="text-gray-400 text-lg mb-4">No FEC Data Available</p>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            Federal campaign finance data has not been imported yet.
            Run the FEC import script to populate this page.
          </p>
        </div>
      ) : (
        <>
          {/* Hero stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            <div>
              <p className="text-green-500 font-mono text-3xl font-bold">
                {formatMoney(stats.totalAmount)}
              </p>
              <p className="text-gray-500 mt-1">Total contributions</p>
            </div>
            <div>
              <p className="text-white font-mono text-3xl font-bold">
                {stats.totalContributions.toLocaleString()}
              </p>
              <p className="text-gray-500 mt-1">Individual donations</p>
            </div>
            <div>
              <p className="text-red-500 font-mono text-3xl font-bold">
                {formatMoney(stats.fraudLinkedAmount)}
              </p>
              <p className="text-gray-500 mt-1">Fraud-linked amount</p>
            </div>
            <div>
              <p className="text-red-400 font-mono text-3xl font-bold">
                {stats.fraudLinkedCount.toLocaleString()}
              </p>
              <p className="text-gray-500 mt-1">Fraud-linked donations</p>
            </div>
          </div>

          {/* Election cycles */}
          {stats.electionCycles.length > 0 && (
            <div className="mb-8">
              <p className="text-gray-500 text-sm">
                Election cycles: {stats.electionCycles.join(', ')}
              </p>
            </div>
          )}

          {/* Fraud-linked contributions */}
          {fraudLinked.length > 0 && (
            <div className="mb-12">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                Fraud-Linked Contributions
              </h2>
              <div className="border border-red-900/50 bg-red-950/20">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-red-900/50">
                      <th className="p-3 font-normal">Contributor</th>
                      <th className="p-3 font-normal">Location</th>
                      <th className="p-3 font-normal">Employer</th>
                      <th className="p-3 font-normal">Match Type</th>
                      <th className="p-3 font-normal text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fraudLinked.map((c) => (
                      <tr key={c.id} className="border-b border-red-900/30 hover:bg-red-950/30">
                        <td className="p-3">
                          {c.name ? (
                            <Link
                              href={`/donations/contributor/${encodeURIComponent(c.name)}`}
                              className="hover:underline"
                            >
                              {c.name}
                            </Link>
                          ) : (
                            <span className="text-gray-500">Unknown</span>
                          )}
                        </td>
                        <td className="p-3 text-gray-400">
                          {c.city && c.state ? `${c.city}, ${c.state}` : c.state || '-'}
                        </td>
                        <td className="p-3 text-gray-400">{c.employer || '-'}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 bg-red-900 text-red-300 text-xs">
                            {c.fraud_match_type?.replace(/_/g, ' ') || 'linked'}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono text-red-400">
                          {formatMoney(c.transaction_amt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Top contributions */}
          <div className="mb-12">
            <h2 className="text-lg font-bold mb-4">Largest Contributions</h2>
            <div className="border border-gray-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-800">
                    <th className="p-3 font-normal">Contributor</th>
                    <th className="p-3 font-normal">Location</th>
                    <th className="p-3 font-normal">Employer</th>
                    <th className="p-3 font-normal">Committee</th>
                    <th className="p-3 font-normal text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {topContributions.map((c) => (
                    <tr
                      key={c.id}
                      className={`border-b border-gray-900 hover:bg-gray-950 ${
                        c.is_fraud_linked ? 'bg-red-950/20' : ''
                      }`}
                    >
                      <td className="p-3">
                        {c.name ? (
                          <Link
                            href={`/donations/contributor/${encodeURIComponent(c.name)}`}
                            className="hover:underline"
                          >
                            {c.name}
                          </Link>
                        ) : (
                          <span className="text-gray-500">Unknown</span>
                        )}
                        {c.is_fraud_linked && (
                          <span className="ml-2 px-1.5 py-0.5 bg-red-900 text-red-300 text-xs">
                            FRAUD
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-gray-400">
                        {c.city && c.state ? `${c.city}, ${c.state}` : c.state || '-'}
                      </td>
                      <td className="p-3 text-gray-400">{c.employer || '-'}</td>
                      <td className="p-3 text-gray-400 font-mono text-xs">{c.cmte_id || '-'}</td>
                      <td className="p-3 text-right font-mono text-green-500">
                        {formatMoney(c.transaction_amt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top states */}
          {stats.topStates.length > 0 && (
            <div className="mb-12">
              <h2 className="text-lg font-bold mb-4">Top States</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {stats.topStates.map(({ state, total, count }) => (
                  <div key={state} className="border border-gray-800 p-4">
                    <p className="font-bold text-lg">{state}</p>
                    <p className="text-green-500 font-mono">{formatMoney(total)}</p>
                    <p className="text-gray-500 text-sm">{count.toLocaleString()} donations</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top committees */}
          {stats.topCommittees.length > 0 && (
            <div className="mb-12">
              <h2 className="text-lg font-bold mb-4">Top Recipient Committees</h2>
              <div className="border border-gray-800">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-gray-800">
                      <th className="p-3 font-normal">Committee ID</th>
                      <th className="p-3 font-normal text-right">Contributions</th>
                      <th className="p-3 font-normal text-right">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topCommittees.map(({ cmte_id, total, count }) => (
                      <tr key={cmte_id} className="border-b border-gray-900 hover:bg-gray-950">
                        <td className="p-3 font-mono">{cmte_id}</td>
                        <td className="p-3 text-right text-gray-400">{count.toLocaleString()}</td>
                        <td className="p-3 text-right font-mono text-green-500">
                          {formatMoney(total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      <div className="mt-8 text-sm text-gray-500 border-t border-gray-800 pt-8">
        <p>
          Source:{' '}
          <a
            href="https://www.fec.gov/data/"
            className="underline hover:text-gray-300"
            target="_blank"
            rel="noopener"
          >
            Federal Election Commission
          </a>
        </p>
        <p className="mt-2 text-gray-600">
          Individual contribution data from FEC bulk downloads. Fraud-linked contributions are
          identified by matching contributor names/employers to known fraud defendants and
          organizations.
        </p>
      </div>
    </div>
  );
}
