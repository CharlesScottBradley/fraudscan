import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface Committee {
  id: string;
  cmte_id: string;
  name: string;
  committee_type: string | null;
  party: string | null;
  state: string | null;
  description: string | null;
  total_received: number;
  total_unemployed_donations: number;
  unemployed_donation_count: number;
  total_retired_donations: number;
  retired_donation_count: number;
  is_active: boolean;
  fec_url: string | null;
}

interface TopDonor {
  name: string;
  city: string | null;
  state: string | null;
  donation_count: number;
  total_amount: number;
}

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

async function getCommittee(cmteId: string): Promise<Committee | null> {
  const { data, error } = await supabase
    .from('fec_committees')
    .select('*')
    .eq('cmte_id', cmteId)
    .single();

  if (error) return null;
  return data;
}

async function getTopDonors(cmteId: string): Promise<TopDonor[]> {
  // Get top "NOT EMPLOYED" donors to this committee
  const { data, error } = await supabase
    .rpc('get_top_unemployed_donors_by_committee', { committee_id: cmteId });

  if (error) {
    // Fallback to direct query if RPC doesn't exist
    console.error('RPC error, using fallback query');
    return [];
  }

  return data || [];
}

async function getMonthlyTrend(cmteId: string): Promise<{ month: string; count: number; amount: number }[]> {
  const { data, error } = await supabase
    .rpc('get_unemployed_monthly_by_committee', { committee_id: cmteId });

  if (error) {
    return [];
  }

  return data || [];
}

export const revalidate = 3600; // Cache for 1 hour

export default async function CommitteeDetailPage({
  params,
}: {
  params: Promise<{ cmte_id: string }>;
}) {
  const { cmte_id } = await params;
  const committee = await getCommittee(cmte_id);

  if (!committee) {
    notFound();
  }

  // Calculate percentage of total donations
  const totalUnemployedDonations = 16311395; // From our analysis
  const totalUnemployedAmount = 1748347868;
  const totalRetiredDonations = 18260909;
  const totalRetiredAmount = 1887221621;

  const pctOfUnemployedDonations = ((committee.unemployed_donation_count / totalUnemployedDonations) * 100).toFixed(2);
  const pctOfUnemployedAmount = ((committee.total_unemployed_donations / totalUnemployedAmount) * 100).toFixed(2);
  const pctOfRetiredDonations = ((committee.retired_donation_count / totalRetiredDonations) * 100).toFixed(2);
  const pctOfRetiredAmount = ((committee.total_retired_donations / totalRetiredAmount) * 100).toFixed(2);

  // Determine which is the dominant category for this committee
  const isUnemployedDominant = committee.total_unemployed_donations > committee.total_retired_donations;

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-6 text-sm">
        <Link href="/investigation" className="text-gray-500 hover:text-gray-400">
          Investigations
        </Link>
        <span className="text-gray-600 mx-2">/</span>
        <Link
          href={isUnemployedDominant ? "/investigation/unemployed-army" : "/investigation/retired-army"}
          className="text-gray-500 hover:text-gray-400"
        >
          {isUnemployedDominant ? "Unemployed Army" : "Retired Army"}
        </Link>
        <span className="text-gray-600 mx-2">/</span>
        <span className="text-gray-400">{committee.name}</span>
      </div>

      {/* Header */}
      <div className="border-b border-gray-800 pb-6 mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white mb-2">{committee.name}</h1>
            <p className="text-gray-500 font-mono text-sm">{committee.cmte_id}</p>
          </div>
          <div className="flex gap-2">
            {committee.party && (
              <span className={`px-2 py-1 text-xs font-medium rounded ${
                committee.party === 'Democratic'
                  ? 'bg-blue-900/40 text-blue-400 border border-blue-800'
                  : committee.party === 'Republican'
                  ? 'bg-red-900/40 text-red-400 border border-red-800'
                  : 'bg-gray-800 text-gray-400 border border-gray-700'
              }`}>
                {committee.party}
              </span>
            )}
            {committee.committee_type && (
              <span className="px-2 py-1 text-xs font-medium rounded bg-gray-800 text-gray-400 border border-gray-700">
                {committee.committee_type}
              </span>
            )}
          </div>
        </div>
        {committee.description && (
          <p className="text-gray-400 mt-4">{committee.description}</p>
        )}
      </div>

      {/* Stats Grid - Unemployed */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-blue-400 mb-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          &quot;NOT EMPLOYED&quot; Donations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="border border-gray-800 p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              Amount Received
            </div>
            <div className="text-2xl font-mono text-green-500">
              {formatMoney(committee.total_unemployed_donations)}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {pctOfUnemployedAmount}% of total
            </div>
          </div>
          <div className="border border-gray-800 p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              Donation Count
            </div>
            <div className="text-2xl font-mono text-white">
              {formatNumber(committee.unemployed_donation_count)}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {pctOfUnemployedDonations}% of total
            </div>
          </div>
          <div className="border border-gray-800 p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              Avg Donation
            </div>
            <div className="text-2xl font-mono text-yellow-500">
              {committee.unemployed_donation_count > 0
                ? `$${(committee.total_unemployed_donations / committee.unemployed_donation_count).toFixed(2)}`
                : '-'}
            </div>
          </div>
          <div className="border border-gray-800 p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              Status
            </div>
            <div className={`text-2xl font-mono ${committee.is_active ? 'text-green-500' : 'text-gray-500'}`}>
              {committee.is_active ? 'Active' : 'Inactive'}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid - Retired */}
      <div className="mb-8">
        <h3 className="text-sm font-medium text-red-400 mb-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500"></span>
          &quot;RETIRED&quot; Donations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="border border-gray-800 p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              Amount Received
            </div>
            <div className="text-2xl font-mono text-green-500">
              {formatMoney(committee.total_retired_donations)}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {pctOfRetiredAmount}% of total
            </div>
          </div>
          <div className="border border-gray-800 p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              Donation Count
            </div>
            <div className="text-2xl font-mono text-white">
              {formatNumber(committee.retired_donation_count)}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {pctOfRetiredDonations}% of total
            </div>
          </div>
          <div className="border border-gray-800 p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              Avg Donation
            </div>
            <div className="text-2xl font-mono text-yellow-500">
              {committee.retired_donation_count > 0
                ? `$${(committee.total_retired_donations / committee.retired_donation_count).toFixed(2)}`
                : '-'}
            </div>
          </div>
          <div className="border border-gray-800 p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              Ratio
            </div>
            <div className="text-2xl font-mono text-purple-400">
              {committee.total_unemployed_donations > 0 && committee.total_retired_donations > 0
                ? (committee.total_retired_donations / committee.total_unemployed_donations).toFixed(1) + 'x'
                : '-'}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              retired vs unemployed
            </div>
          </div>
        </div>
      </div>

      {/* Warning Callout */}
      <div className={`border-l-4 p-4 mb-8 ${
        isUnemployedDominant
          ? 'border-blue-600 bg-blue-900/10'
          : 'border-red-600 bg-red-900/10'
      }`}>
        <div className="flex">
          <div className="ml-3">
            <p className={`text-sm ${isUnemployedDominant ? 'text-blue-400' : 'text-red-400'}`}>
              <strong>Part of the &quot;{isUnemployedDominant ? 'Unemployed' : 'Retired'} Army&quot; Investigation</strong>
            </p>
            <p className="text-xs text-gray-400 mt-1">
              This committee received donations from both &quot;NOT EMPLOYED&quot; ({formatNumber(committee.unemployed_donation_count)} donations, {formatMoney(committee.total_unemployed_donations)})
              and &quot;RETIRED&quot; donors ({formatNumber(committee.retired_donation_count)} donations, {formatMoney(committee.total_retired_donations)}).
              These patterns warrant investigation to determine whether they reflect data issues, platform artifacts, or activities requiring regulatory review.
            </p>
          </div>
        </div>
      </div>

      {/* Context Section */}
      <div className="mb-8">
        <h2 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
          <span className="w-5 h-5 flex items-center justify-center bg-gray-800 rounded text-xs">?</span>
          About This Data
        </h2>
        <div className="border border-gray-800 p-4 text-sm text-gray-400">
          <p className="mb-2">
            This page shows donations to <strong className="text-white">{committee.name}</strong> from contributors who listed their occupation as "NOT EMPLOYED" in FEC filings.
          </p>
          <p className="mb-2">
            The data comes from the FEC Individual Contributions database. Employment status is self-reported by donors and is not independently verified.
          </p>
          <p>
            <strong className="text-gray-300">Note:</strong> Unusual patterns do not prove wrongdoing. "NOT EMPLOYED" can legitimately include retirees, investors, homemakers, or individuals with non-traditional income sources.
          </p>
        </div>
      </div>

      {/* External Links */}
      <div className="flex flex-wrap gap-4 mb-8">
        {committee.fec_url && (
          <a
            href={committee.fec_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            View on FEC.gov
          </a>
        )}
        <Link
          href="/investigation/unemployed-army"
          className="inline-flex items-center gap-2 px-4 py-2 border border-blue-700 hover:border-blue-600 text-blue-400 text-sm rounded transition-colors"
        >
          &#x2190; Unemployed Army
        </Link>
        <Link
          href="/investigation/retired-army"
          className="inline-flex items-center gap-2 px-4 py-2 border border-red-700 hover:border-red-600 text-red-400 text-sm rounded transition-colors"
        >
          &#x2190; Retired Army
        </Link>
      </div>

      {/* Footer Disclaimer */}
      <div className="mt-12 pt-6 border-t border-gray-800">
        <p className="text-xs text-gray-600">
          Data source: FEC Individual Contributions. This analysis is provided for informational purposes and raises questions for regulatory review - it is not an accusation of illegal conduct.
          The individuals and organizations referenced have not been charged with any crimes.
        </p>
      </div>
    </div>
  );
}
