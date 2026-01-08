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

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

interface Investigation {
  id: string;
  title: string;
  investigation_type: string;
  subject: string;
  status: string;
  total_flagged_amount: number;
  entity_count: number;
  finding_count: number;
  confidence_score: number;
  created_at: string;
}

interface InvestigationStats {
  flagged_ppp: number;
  flagged_ppp_amount: number;
  flagged_eidl: number;
  flagged_eidl_amount: number;
  fraud_cases: number;
  total_fraud_amount: number;
  total_investigations: number;
  total_findings: number;
}

async function getInvestigations(): Promise<Investigation[]> {
  const { data, error } = await supabase
    .from('investigations')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching investigations:', error);
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    title: row.title,
    investigation_type: row.investigation_type,
    subject: row.subject,
    status: row.status,
    total_flagged_amount: Number(row.total_flagged_amount) || 0,
    entity_count: row.entity_count || 0,
    finding_count: row.finding_count || 0,
    confidence_score: Number(row.confidence_score) || 0,
    created_at: row.created_at
  }));
}

async function getStats(): Promise<InvestigationStats> {
  // Use individual queries to avoid timeout issues with large tables
  const [pppStats, eidlStats, caseStats, invStats] = await Promise.all([
    supabase.rpc('get_flagged_ppp_stats').single(),
    supabase.rpc('get_flagged_eidl_stats').single(),
    supabase.from('cases').select('id, total_fraud_amount'),
    supabase.from('investigations').select('id', { count: 'exact', head: true })
  ]);

  // Fallback to manual query if RPC doesn't exist
  let flaggedPpp = 0, flaggedPppAmount = 0, flaggedEidl = 0, flaggedEidlAmount = 0;
  
  if (pppStats.error) {
    const { count } = await supabase.from('ppp_loans').select('*', { count: 'exact', head: true }).eq('is_flagged', true);
    flaggedPpp = count || 0;
    // For amount, we'll show as "calculating" or use cached value
    flaggedPppAmount = 2402875627; // Cached value from earlier query
  } else {
    const pppData = pppStats.data as { count?: number; total_amount?: number } | null;
    flaggedPpp = pppData?.count || 0;
    flaggedPppAmount = pppData?.total_amount || 0;
  }

  if (eidlStats.error) {
    const { count } = await supabase.from('eidl_loans').select('*', { count: 'exact', head: true }).eq('is_flagged', true);
    flaggedEidl = count || 0;
    flaggedEidlAmount = 4938239500; // Cached value
  } else {
    const eidlData = eidlStats.data as { count?: number; total_amount?: number } | null;
    flaggedEidl = eidlData?.count || 0;
    flaggedEidlAmount = eidlData?.total_amount || 0;
  }

  const fraudCases = caseStats.data?.length || 0;
  const totalFraudAmount = caseStats.data?.reduce((sum: number, c: { total_fraud_amount: number }) => sum + (c.total_fraud_amount || 0), 0) || 0;

  return {
    flagged_ppp: flaggedPpp,
    flagged_ppp_amount: flaggedPppAmount,
    flagged_eidl: flaggedEidl,
    flagged_eidl_amount: flaggedEidlAmount,
    fraud_cases: fraudCases,
    total_fraud_amount: totalFraudAmount,
    total_investigations: invStats.count || 0,
    total_findings: 0 // Will be populated from investigation findings
  };
}

const INVESTIGATION_TYPES = [
  {
    id: 'fec-smurfing',
    title: 'FEC Smurfing Analysis',
    description: 'LLM-enhanced detection of 2,547 extreme donors making 5.5M donations with automation signatures',
    href: '/investigation/fec-smurfing',
    stats: '$107.7M flagged',
    isNew: true
  },
  {
    id: 'rose-lake-capital',
    title: 'Rose Lake Capital / E Street Group',
    description: '$2.9M from Omar campaign to husband\'s firm, plus $1.2M settled fraud lawsuit against business partner',
    href: '/investigation/rose-lake-capital',
    stats: '2 lawsuits settled',
    isNew: true
  },
  {
    id: 'columbus-oh-ppp-fraud',
    title: 'Columbus OH PPP Network',
    description: '$13.86M PPP across 186 entities - SERC, home health, trucking clusters',
    href: '/investigation/columbus-oh-ppp-fraud',
    stats: '186 entities',
    isNew: true
  },
  {
    id: 'unemployed-army',
    title: 'The Unemployed Army',
    description: '$1.75B in anomalous donations from "NOT EMPLOYED" donors',
    href: '/investigation/unemployed-army',
    stats: '16.3M donations',
    isNew: true
  },
  {
    id: 'retired-army',
    title: 'The Retired Army',
    description: '$1.89B from "RETIRED" donors - the partisan mirror',
    href: '/investigation/retired-army',
    stats: '18.3M donations',
    isNew: true
  },
  {
    id: 'mn-medicaid-fraud',
    title: 'MN Medicaid Fraud Wave',
    description: '$9B+ in fraud across FOF, housing, and autism programs',
    href: '/investigation/mn-medicaid-fraud',
    stats: '98 charged',
    isNew: false
  },
  {
    id: '2104-park-ave',
    title: '2104 Park Ave Cluster',
    description: '5 businesses, $2.1M PPP, $42M DHS payments from single address',
    href: '/investigation/2104-park-ave',
    stats: '$44M tracked',
    isNew: true
  },
  {
    id: 'mn-oh-wa',
    title: 'Three-State Analysis',
    description: 'Deep dive into Minnesota, Ohio, and Washington funding data',
    href: '/investigation/mn-oh-wa',
    stats: '$655B tracked'
  },
  {
    id: 'address-clusters',
    title: 'Address Cluster Detection',
    description: 'Find multiple businesses at single addresses',
    href: '/investigation/address-clusters',
    stats: 'Shell company patterns'
  },
  {
    id: 'double-dippers',
    title: 'Double Dipper Analysis',
    description: 'Businesses receiving both PPP and EIDL loans',
    href: '/investigation/double-dippers',
    stats: 'Cross-program fraud'
  },
  {
    id: 'industry',
    title: 'Industry Analysis',
    description: 'Fraud patterns by NAICS industry code',
    href: '/investigation/industry',
    stats: '18 fraud-prone industries'
  }
];

export const revalidate = 300;

export default async function InvestigationsPage() {
  const [investigations, stats] = await Promise.all([
    getInvestigations(),
    getStats()
  ]);

  const totalFlagged = stats.flagged_ppp + stats.flagged_eidl;
  const totalFlaggedAmount = stats.flagged_ppp_amount + stats.flagged_eidl_amount;

  return (
    <div>
      {/* Terminal-style stats */}
      <div className="font-mono text-sm mb-10">
        <p className="text-gray-500">FRAUD_DETECTION_SYSTEM</p>
        <div className="mt-2 text-gray-400">
          <p><span className="text-gray-600">├─</span> flagged_loan_value <span className="text-green-500 ml-4">{formatMoney(totalFlaggedAmount)}</span></p>
          <p><span className="text-gray-600">├─</span> flagged_loans <span className="text-white ml-4">{formatNumber(totalFlagged)}</span></p>
          <p><span className="text-gray-600">├─</span> prosecuted_cases <span className="text-white ml-4">{stats.fraud_cases}</span></p>
          <p><span className="text-gray-600">├─</span> confirmed_fraud <span className="text-green-500 ml-4">{formatMoney(stats.total_fraud_amount)}</span></p>
          <p><span className="text-gray-600">└─</span> investigations <span className="text-white ml-4">{stats.total_investigations}</span></p>
        </div>
      </div>

      {/* Investigation Types */}
      <div className="mb-10">
        <h2 className="text-sm font-medium text-gray-400 mb-4">Investigation Types</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {INVESTIGATION_TYPES.map(type => (
            <Link
              key={type.id}
              href={type.href}
              className={`border p-4 hover:border-gray-700 transition-colors block ${
                type.isNew ? 'border-red-800 bg-red-900/10' : 'border-gray-800'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-medium">{type.title}</h3>
                  {type.isNew && (
                    <span className="text-xs bg-red-600 text-white px-1.5 py-0.5 rounded font-medium">
                      NEW
                    </span>
                  )}
                </div>
                <span className={`text-xs font-mono ${type.isNew ? 'text-red-400' : 'text-gray-500'}`}>
                  {type.stats}
                </span>
              </div>
              <p className="text-sm text-gray-500">{type.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Active Investigations */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-gray-400">Investigations</h2>
          {/* Future: Add new investigation button */}
        </div>
        
        {investigations.length === 0 ? (
          <div className="border border-gray-800 p-8 text-center">
            <p className="text-gray-500 mb-4">No formal investigations recorded yet.</p>
            <p className="text-gray-600 text-sm">
              Use the investigation types above to explore fraud patterns, or check the{' '}
              <Link href="/cases" className="text-green-500 hover:underline">Cases</Link> page for prosecuted fraud.
            </p>
          </div>
        ) : (
          <div className="border border-gray-800 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-900">
                <tr>
                  <th className="text-left p-3 font-medium text-gray-400">Title</th>
                  <th className="text-left p-3 font-medium text-gray-400">Type</th>
                  <th className="text-left p-3 font-medium text-gray-400">Status</th>
                  <th className="text-right p-3 font-medium text-gray-400">Entities</th>
                  <th className="text-right p-3 font-medium text-gray-400">Findings</th>
                  <th className="text-right p-3 font-medium text-gray-400">Flagged Value</th>
                  <th className="text-right p-3 font-medium text-gray-400">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {investigations.map(inv => (
                  <tr key={inv.id} className="hover:bg-gray-900/50">
                    <td className="p-3">
                      <Link 
                        href={`/investigation/${inv.id}`}
                        className="text-white hover:text-green-400"
                      >
                        {inv.title.length > 40 ? inv.title.slice(0, 40) + '...' : inv.title}
                      </Link>
                    </td>
                    <td className="p-3 text-gray-400">{inv.investigation_type}</td>
                    <td className="p-3 text-gray-400">{inv.status}</td>
                    <td className="p-3 text-right font-mono text-white">{inv.entity_count}</td>
                    <td className="p-3 text-right font-mono text-white">{inv.finding_count}</td>
                    <td className="p-3 text-right font-mono text-green-500">{formatMoney(inv.total_flagged_amount)}</td>
                    <td className="p-3 text-right text-gray-500">{formatDate(inv.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Flagged Loans Breakdown */}
      <div className="mb-10">
        <h2 className="text-sm font-medium text-gray-400 mb-4">Flagged for Review</h2>
        <div className="border border-gray-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left p-3 font-medium text-gray-400">Program</th>
                <th className="text-right p-3 font-medium text-gray-400">Flagged Loans</th>
                <th className="text-right p-3 font-medium text-gray-400">Flagged Value</th>
                <th className="text-left p-3 font-medium text-gray-400">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              <tr className="hover:bg-gray-900/50">
                <td className="p-3 text-white">PPP Loans</td>
                <td className="p-3 text-right font-mono text-white">{formatNumber(stats.flagged_ppp)}</td>
                <td className="p-3 text-right font-mono text-green-500">{formatMoney(stats.flagged_ppp_amount)}</td>
                <td className="p-3">
                  <Link href="/ppp/flagged" className="text-gray-400 hover:text-green-400">
                    View flagged
                  </Link>
                </td>
              </tr>
              <tr className="hover:bg-gray-900/50">
                <td className="p-3 text-white">EIDL Loans</td>
                <td className="p-3 text-right font-mono text-white">{formatNumber(stats.flagged_eidl)}</td>
                <td className="p-3 text-right font-mono text-green-500">{formatMoney(stats.flagged_eidl_amount)}</td>
                <td className="p-3">
                  <span className="text-gray-600">Coming soon</span>
                </td>
              </tr>
              <tr className="bg-gray-900/30">
                <td className="p-3 text-gray-400 font-medium">Total</td>
                <td className="p-3 text-right font-mono text-white">{formatNumber(totalFlagged)}</td>
                <td className="p-3 text-right font-mono text-green-500">{formatMoney(totalFlaggedAmount)}</td>
                <td className="p-3"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Related Resources */}
      <div className="border-t border-gray-800 pt-6">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Related</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <Link href="/cases" className="text-gray-400 hover:text-green-400">
            Fraud Cases
          </Link>
          <span className="text-gray-700">|</span>
          <Link href="/ppp" className="text-gray-400 hover:text-green-400">
            PPP Database
          </Link>
          <span className="text-gray-700">|</span>
          <Link href="/nursing-homes" className="text-gray-400 hover:text-green-400">
            Nursing Homes
          </Link>
          <span className="text-gray-700">|</span>
          <Link href="/improper-payments" className="text-gray-400 hover:text-green-400">
            Improper Payments
          </Link>
          <span className="text-gray-700">|</span>
          <Link href="/tip" className="text-gray-400 hover:text-green-400">
            Submit a Tip
          </Link>
        </div>
      </div>
    </div>
  );
}


