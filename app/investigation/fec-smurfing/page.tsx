import { supabase } from '@/lib/supabase';
import Link from 'next/link';

function formatMoney(amount: number | null): string {
  if (!amount) return '-';
  if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(2)}B`;
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

function formatNumber(num: number): string {
  return num.toLocaleString();
}

interface SuspiciousDonor {
  name: string;
  city: string;
  state: string;
  occupation: string | null;
  total_donations: number;
  total_amount: number;
  pct_round_numbers: number;
  donations_per_day: number;
  suspicion_score: number;
  llm_analysis: {
    suspicion_level?: string;
    key_indicators?: string[];
  } | null;
}

interface CommitteeStats {
  cmte_id: string;
  name: string | null;
  party: string | null;
  suspicious_donors: number;
  amount_received: number;
}

// Investigation summary stats from completed analysis
const INVESTIGATION_STATS = {
  total_analyzed: 2925,
  high_suspicion: 2547,
  medium_suspicion: 378,
  total_donations: 5529560,
  total_amount: 107684777,
  avg_round_number_pct: 75.3,
  analysis_model: 'Claude 3 Haiku',
  analysis_cost: 15,
};

async function getTopSuspiciousDonors(): Promise<SuspiciousDonor[]> {
  const { data, error } = await supabase
    .from('fec_suspicious_donors')
    .select('name, city, state, occupation, total_donations, total_amount, pct_round_numbers, donations_per_day, suspicion_score, llm_analysis')
    .eq('llm_analysis->>suspicion_level', 'high')
    .order('total_donations', { ascending: false })
    .limit(25);

  if (error) {
    console.error('Error fetching suspicious donors:', error);
    return [];
  }

  return (data || []).map(d => ({
    ...d,
    total_amount: Number(d.total_amount) || 0,
    pct_round_numbers: Number(d.pct_round_numbers) || 0,
    donations_per_day: Number(d.donations_per_day) || 0,
  }));
}

async function getCommitteeBreakdown(): Promise<CommitteeStats[]> {
  // Get top committees that received from suspicious donors
  const { data, error } = await supabase
    .from('fec_committees')
    .select('cmte_id, name, party, total_unemployed_donations, unemployed_donation_count')
    .order('total_unemployed_donations', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error fetching committees:', error);
    return [];
  }

  return (data || []).map(c => ({
    cmte_id: c.cmte_id,
    name: c.name,
    party: c.party,
    suspicious_donors: c.unemployed_donation_count || 0,
    amount_received: Number(c.total_unemployed_donations) || 0,
  }));
}

async function getStateBreakdown(): Promise<{ state: string; donors: number; donations: number; amount: number }[]> {
  const { data, error } = await supabase
    .from('fec_suspicious_donors')
    .select('state, total_donations, total_amount')
    .eq('llm_analysis->>suspicion_level', 'high');

  if (error) {
    console.error('Error fetching state breakdown:', error);
    return [];
  }

  // Aggregate by state
  const stateMap = new Map<string, { donors: number; donations: number; amount: number }>();
  for (const d of data || []) {
    const existing = stateMap.get(d.state) || { donors: 0, donations: 0, amount: 0 };
    stateMap.set(d.state, {
      donors: existing.donors + 1,
      donations: existing.donations + (d.total_donations || 0),
      amount: existing.amount + (Number(d.total_amount) || 0),
    });
  }

  return Array.from(stateMap.entries())
    .map(([state, stats]) => ({ state, ...stats }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 15);
}

export const revalidate = 3600;

export default async function FecSmurfingPage() {
  const [donors, committees, stateBreakdown] = await Promise.all([
    getTopSuspiciousDonors(),
    getCommitteeBreakdown(),
    getStateBreakdown(),
  ]);

  return (
    <div>
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-6">
        <Link href="/investigation" className="hover:text-gray-300">Investigations</Link>
        <span className="mx-2">/</span>
        <span className="text-white">FEC Smurfing Analysis</span>
      </div>

      {/* Terminal-style stats */}
      <div className="font-mono text-sm mb-10">
        <p className="text-gray-500">FEC_SMURFING_ANALYSIS</p>
        <div className="mt-2 text-gray-400">
          <p><span className="text-gray-600">├─</span> donors_analyzed <span className="text-white ml-4">{formatNumber(INVESTIGATION_STATS.total_analyzed)}</span></p>
          <p><span className="text-gray-600">├─</span> high_suspicion <span className="text-red-400 ml-4">{formatNumber(INVESTIGATION_STATS.high_suspicion)} (87%)</span></p>
          <p><span className="text-gray-600">├─</span> total_donations <span className="text-white ml-4">{formatNumber(INVESTIGATION_STATS.total_donations)}</span></p>
          <p><span className="text-gray-600">├─</span> flagged_amount <span className="text-green-500 ml-4">{formatMoney(INVESTIGATION_STATS.total_amount)}</span></p>
          <p><span className="text-gray-600">├─</span> avg_round_numbers <span className="text-yellow-400 ml-4">{INVESTIGATION_STATS.avg_round_number_pct}%</span></p>
          <p><span className="text-gray-600">├─</span> analysis_model <span className="text-gray-500 ml-4">{INVESTIGATION_STATS.analysis_model}</span></p>
          <p><span className="text-gray-600">└─</span> source <span className="text-gray-500 ml-4">FEC Individual Contributions (58M records)</span></p>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="bg-yellow-900/20 border border-yellow-800 p-4 mb-8">
        <div className="flex items-start gap-3">
          <span className="text-yellow-500 text-xl">!</span>
          <div>
            <h2 className="text-yellow-400 font-medium mb-1">Important Disclaimer</h2>
            <p className="text-sm text-gray-400">
              This report presents statistical analysis of publicly available FEC data enhanced with LLM pattern detection.
              Unusual patterns do not prove wrongdoing. There may be legitimate explanations including recurring donations,
              data entry artifacts, platform technical issues, or legitimate income sources.
              The individuals referenced have not been charged with any crimes.
            </p>
          </div>
        </div>
      </div>

      {/* What is Smurfing */}
      <div className="border border-gray-800 p-4 mb-8">
        <h2 className="text-white font-medium mb-2">What is Political Donation Smurfing?</h2>
        <p className="text-sm text-gray-400 leading-relaxed mb-3">
          &quot;Smurfing&quot; refers to the practice of structuring donations to obscure their true source or circumvent
          contribution limits. In political donations, this can manifest as:
        </p>
        <ul className="text-sm text-gray-400 space-y-2 ml-4">
          <li className="flex gap-2">
            <span className="text-gray-600">•</span>
            <span><strong className="text-gray-300">Extreme volume patterns</strong> - Hundreds or thousands of donations from a single person</span>
          </li>
          <li className="flex gap-2">
            <span className="text-gray-600">•</span>
            <span><strong className="text-gray-300">Round number clustering</strong> - High percentage of $5, $10, $25, $50, $100 amounts</span>
          </li>
          <li className="flex gap-2">
            <span className="text-gray-600">•</span>
            <span><strong className="text-gray-300">Burst activity</strong> - 50+ donations in a single day from one donor</span>
          </li>
          <li className="flex gap-2">
            <span className="text-gray-600">•</span>
            <span><strong className="text-gray-300">Automation signatures</strong> - Patterns suggesting programmatic rather than manual donations</span>
          </li>
          <li className="flex gap-2">
            <span className="text-gray-600">•</span>
            <span><strong className="text-gray-300">Identity concerns</strong> - Abrupt starts/stops or patterns suggesting synthetic identities</span>
          </li>
        </ul>
      </div>

      {/* Analysis Method */}
      <div className="border border-gray-800 p-4 mb-8">
        <h2 className="text-white font-medium mb-2">Analysis Methodology</h2>
        <p className="text-sm text-gray-400 leading-relaxed mb-3">
          This investigation used a two-phase approach:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-gray-900/50 p-3 rounded">
            <h3 className="text-gray-300 font-medium mb-1">Phase 1: SQL Pattern Detection</h3>
            <p className="text-gray-500">
              Identified 61,867 extreme donors (100+ donations) from 58M FEC records.
              Scored donors on volume, burst patterns, round numbers, and donation frequency.
              Selected 2,925 high-priority donors (score &gt;= 50) for deep analysis.
            </p>
          </div>
          <div className="bg-gray-900/50 p-3 rounded">
            <h3 className="text-gray-300 font-medium mb-1">Phase 2: LLM Analysis</h3>
            <p className="text-gray-500">
              Each donor profile analyzed by Claude 3 Haiku for fraud indicators.
              Model assigned suspicion levels (critical/high/medium/low) with reasoning.
              87% of analyzed donors flagged as high suspicion.
            </p>
          </div>
        </div>
      </div>

      {/* Top 25 Suspicious Donors */}
      <div className="mb-8">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Top 25 Most Suspicious Donors</h3>
        <p className="text-xs text-gray-500 mb-4">
          Ranked by total donation count. Data from public FEC Individual Contributions filings.
        </p>
        <div className="border border-gray-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left p-3 font-medium text-gray-400">Donor</th>
                <th className="text-left p-3 font-medium text-gray-400">Location</th>
                <th className="text-left p-3 font-medium text-gray-400">Occupation</th>
                <th className="text-right p-3 font-medium text-gray-400">Donations</th>
                <th className="text-right p-3 font-medium text-gray-400">Amount</th>
                <th className="text-right p-3 font-medium text-gray-400">% Round</th>
                <th className="text-right p-3 font-medium text-gray-400">Per Day</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {donors.map((donor, idx) => (
                <tr key={idx} className="hover:bg-gray-900/50">
                  <td className="p-3 text-white">{donor.name}</td>
                  <td className="p-3 text-gray-400">{donor.city}, {donor.state}</td>
                  <td className="p-3 text-gray-500 text-xs">{donor.occupation || '-'}</td>
                  <td className="p-3 text-right font-mono text-white">
                    {formatNumber(donor.total_donations)}
                  </td>
                  <td className="p-3 text-right font-mono text-green-500">
                    {formatMoney(donor.total_amount)}
                  </td>
                  <td className={`p-3 text-right font-mono ${donor.pct_round_numbers > 80 ? 'text-red-400' : 'text-yellow-400'}`}>
                    {donor.pct_round_numbers.toFixed(1)}%
                  </td>
                  <td className={`p-3 text-right font-mono ${donor.donations_per_day > 20 ? 'text-red-400' : 'text-gray-400'}`}>
                    {donor.donations_per_day.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Party Breakdown */}
      <div className="mb-8">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Committee Recipients</h3>
        <p className="text-xs text-gray-500 mb-4">
          Top committees receiving donations from flagged donors.
        </p>
        <div className="border border-gray-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left p-3 font-medium text-gray-400">Committee</th>
                <th className="text-left p-3 font-medium text-gray-400">Party</th>
                <th className="text-right p-3 font-medium text-gray-400">Donations</th>
                <th className="text-right p-3 font-medium text-gray-400">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {committees.map((c, idx) => (
                <tr key={idx} className="hover:bg-gray-900/50">
                  <td className="p-3">
                    <Link
                      href={`/committees/${c.cmte_id}`}
                      className="text-cyan-400 hover:text-cyan-300 hover:underline"
                    >
                      {c.name || c.cmte_id}
                    </Link>
                    <span className="text-gray-600 text-xs ml-2">{c.cmte_id}</span>
                  </td>
                  <td className="p-3">
                    <span className={c.party === 'Democratic' ? 'text-blue-400' : c.party === 'Republican' ? 'text-red-400' : 'text-gray-500'}>
                      {c.party || 'Unknown'}
                    </span>
                  </td>
                  <td className="p-3 text-right font-mono text-white">
                    {formatNumber(c.suspicious_donors)}
                  </td>
                  <td className="p-3 text-right font-mono text-green-500">
                    {formatMoney(c.amount_received)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Geographic Distribution */}
      <div className="mb-8">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Geographic Distribution</h3>
        <div className="border border-gray-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left p-3 font-medium text-gray-400">State</th>
                <th className="text-right p-3 font-medium text-gray-400">Suspicious Donors</th>
                <th className="text-right p-3 font-medium text-gray-400">Donations</th>
                <th className="text-right p-3 font-medium text-gray-400">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {stateBreakdown.map((s, idx) => (
                <tr key={idx} className="hover:bg-gray-900/50">
                  <td className="p-3 text-white">{s.state}</td>
                  <td className="p-3 text-right font-mono text-white">{formatNumber(s.donors)}</td>
                  <td className="p-3 text-right font-mono text-white">{formatNumber(s.donations)}</td>
                  <td className="p-3 text-right font-mono text-green-500">{formatMoney(s.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Key Findings */}
      <div className="border border-gray-800 p-4 mb-8">
        <h3 className="text-white font-medium mb-3">Key Findings</h3>
        <ul className="text-sm text-gray-400 space-y-2">
          <li className="flex gap-2">
            <span className="text-gray-600">1.</span>
            <span><strong className="text-gray-300">87% high suspicion rate</strong> - 2,547 of 2,925 analyzed donors flagged as high suspicion by LLM analysis</span>
          </li>
          <li className="flex gap-2">
            <span className="text-gray-600">2.</span>
            <span><strong className="text-gray-300">Extreme donation volumes</strong> - Top donor made 31,403 donations averaging 43 per day</span>
          </li>
          <li className="flex gap-2">
            <span className="text-gray-600">3.</span>
            <span><strong className="text-gray-300">Round number clustering</strong> - Average 75% round number donations across flagged donors</span>
          </li>
          <li className="flex gap-2">
            <span className="text-gray-600">4.</span>
            <span><strong className="text-gray-300">Occupation patterns</strong> - 88% list &quot;NOT EMPLOYED&quot; or &quot;RETIRED&quot; as occupation</span>
          </li>
        </ul>
      </div>

      {/* View Full Report Link */}
      <div className="flex gap-4 mb-8">
        <a
          href="/reports/fec-smurfing-analysis-report.html"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-900/30 hover:bg-red-900/50 border border-red-800 text-red-400 text-sm rounded transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          View Full Visual Report
        </a>
        <Link
          href="/investigation"
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-700 hover:border-gray-600 text-gray-300 text-sm rounded transition-colors"
        >
          Back to Investigations
        </Link>
      </div>

      {/* Footer */}
      <div className="mt-12 pt-6 border-t border-gray-800">
        <p className="text-xs text-gray-600">
          Data source: FEC Individual Contributions (58.2M records analyzed). LLM analysis via Claude 3 Haiku.
          Investigation ID: fec-smurf-2024-001.
          This analysis is provided for informational purposes - it is not an accusation of illegal conduct.
        </p>
      </div>
    </div>
  );
}
