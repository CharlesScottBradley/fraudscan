import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { DonationFilters } from './DonationFilters';

interface SearchParams {
  q?: string;
  recipient?: string;
  contributor?: string;
  employer?: string;
  minAmount?: string;
  maxAmount?: string;
  year?: string;
  party?: string;
  contributorType?: string;
  recipientType?: string;
  state?: string;
  page?: string;
}

interface Donation {
  id: string;
  recipient_name: string;
  recipient_type: string;
  contributor_name: string | null;
  contributor_type: string | null;
  contributor_employer: string | null;
  amount: number;
  receipt_date: string;
  year: number;
}

const PAGE_SIZE = 50;

async function searchDonations(params: SearchParams): Promise<{ donations: Donation[]; total: number }> {
  let query = supabase
    .from('political_donations')
    .select('id, recipient_name, recipient_type, contributor_name, contributor_type, contributor_employer, amount, receipt_date, year', { count: 'exact' });

  // Text search (recipient or contributor)
  if (params.q) {
    query = query.or(`recipient_name.ilike.%${params.q}%,contributor_name.ilike.%${params.q}%`);
  }

  // Recipient filter
  if (params.recipient) {
    query = query.ilike('recipient_name', `%${params.recipient}%`);
  }

  // Contributor filter
  if (params.contributor) {
    query = query.ilike('contributor_name', `%${params.contributor}%`);
  }

  // Employer filter
  if (params.employer) {
    query = query.ilike('contributor_employer', `%${params.employer}%`);
  }

  // Amount filters
  if (params.minAmount) {
    query = query.gte('amount', parseFloat(params.minAmount));
  }
  if (params.maxAmount) {
    query = query.lte('amount', parseFloat(params.maxAmount));
  }

  // Year filter
  if (params.year && params.year !== 'all') {
    query = query.eq('year', parseInt(params.year));
  }

  // Party filter (based on recipient name patterns)
  if (params.party === 'dfl') {
    query = query.or('recipient_name.ilike.%DFL%,recipient_name.ilike.%Democrat%');
  } else if (params.party === 'gop') {
    query = query.or('recipient_name.ilike.%RPM%,recipient_name.ilike.%Republican%');
  }

  // Contributor type filter
  if (params.contributorType && params.contributorType !== 'all') {
    query = query.eq('contributor_type', params.contributorType);
  }

  // Recipient type filter
  if (params.recipientType && params.recipientType !== 'all') {
    query = query.eq('recipient_type', params.recipientType);
  }

  // State filter
  if (params.state && params.state !== 'all') {
    query = query.eq('state', params.state.toUpperCase());
  }

  // Pagination
  const page = parseInt(params.page || '1');
  const offset = (page - 1) * PAGE_SIZE;

  query = query
    .order('amount', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  const { data, count } = await query;

  return {
    donations: (data || []) as Donation[],
    total: count || 0,
  };
}

async function getFilterStats() {
  // Get aggregate stats for the current filter (for display)
  const { data: years } = await supabase
    .from('political_donations')
    .select('year')
    .order('year', { ascending: false });

  const { data: statesData } = await supabase
    .from('political_donations')
    .select('state');

  const uniqueYears = [...new Set(years?.map(y => y.year))].filter(Boolean);
  const uniqueStates = [...new Set(statesData?.map(s => s.state))].filter(Boolean).sort();

  return { years: uniqueYears, states: uniqueStates };
}

export const revalidate = 0; // Dynamic page

function formatMoney(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(2)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}K`;
  }
  return `$${amount.toLocaleString()}`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getRecipientTypeLabel(type: string): string {
  switch (type) {
    case 'PCC': return 'Candidate';
    case 'PTU': return 'Party';
    case 'PCF': return 'Committee';
    default: return type || 'Other';
  }
}

function getPartyFromRecipient(name: string): 'dfl' | 'gop' | null {
  if (name.includes('DFL') || name.includes('Democrat')) return 'dfl';
  if (name.includes('RPM') || name.includes('Republican')) return 'gop';
  return null;
}

export default async function DonationsSearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const { donations, total } = await searchDonations(params);
  const { years, states } = await getFilterStats();

  const currentPage = parseInt(params.page || '1');
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const hasFilters = params.q || params.recipient || params.contributor || params.employer ||
    params.minAmount || params.maxAmount ||
    (params.year && params.year !== 'all') ||
    params.party ||
    (params.contributorType && params.contributorType !== 'all') ||
    (params.recipientType && params.recipientType !== 'all') ||
    (params.state && params.state !== 'all');

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Search Donations</h1>
            <p className="text-gray-500">Filter and search Minnesota campaign finance data</p>
          </div>
          <Link href="/donations" className="text-gray-400 hover:text-white text-sm">
            &larr; Back to overview
          </Link>
        </div>
      </div>

      {/* Filters */}
      <DonationFilters
        currentParams={params}
        years={years}
        states={states}
      />

      {/* Results summary */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-gray-500 text-sm">
          {total.toLocaleString()} results
          {hasFilters && ' (filtered)'}
        </p>
        {hasFilters && (
          <Link href="/donations/search" className="text-sm text-gray-400 hover:text-white">
            Clear all filters
          </Link>
        )}
      </div>

      {/* Results table */}
      <div className="border border-gray-800 mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-800">
              <th className="p-3 font-normal">Date</th>
              <th className="p-3 font-normal">Contributor</th>
              <th className="p-3 font-normal">Recipient</th>
              <th className="p-3 font-normal">Type</th>
              <th className="p-3 font-normal text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {donations.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">
                  No donations found matching your filters
                </td>
              </tr>
            ) : (
              donations.map((donation) => {
                const party = getPartyFromRecipient(donation.recipient_name);
                return (
                  <tr key={donation.id} className="border-b border-gray-900 hover:bg-gray-950">
                    <td className="p-3 text-gray-400 whitespace-nowrap">{formatDate(donation.receipt_date)}</td>
                    <td className="p-3">
                      {donation.contributor_name ? (
                        <Link
                          href={`/donations/contributor/${encodeURIComponent(donation.contributor_name)}`}
                          className="hover:underline"
                        >
                          {donation.contributor_name}
                        </Link>
                      ) : (
                        <span className="text-gray-500">Anonymous</span>
                      )}
                      {donation.contributor_employer && (
                        <span className="block text-xs text-gray-500">{donation.contributor_employer}</span>
                      )}
                      {donation.contributor_type && (
                        <span className="text-xs text-gray-600"> ({donation.contributor_type})</span>
                      )}
                    </td>
                    <td className="p-3">
                      <Link
                        href={`/donations/recipient/${encodeURIComponent(donation.recipient_name)}`}
                        className="hover:underline"
                      >
                        {donation.recipient_name}
                      </Link>
                      {party && (
                        <span className={`ml-2 px-1.5 py-0.5 text-xs ${
                          party === 'dfl' ? 'bg-blue-900 text-blue-300' : 'bg-red-900 text-red-300'
                        }`}>
                          {party === 'dfl' ? 'DFL' : 'GOP'}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-gray-400">
                      <span className="px-2 py-0.5 bg-gray-800 text-xs">
                        {getRecipientTypeLabel(donation.recipient_type)}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono text-green-500 whitespace-nowrap">
                      {formatMoney(donation.amount)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {currentPage > 1 && (
            <Link
              href={`/donations/search?${new URLSearchParams({ ...params, page: String(currentPage - 1) }).toString()}`}
              className="px-3 py-1 border border-gray-700 hover:border-gray-500 text-sm"
            >
              Previous
            </Link>
          )}
          <span className="text-gray-500 text-sm px-4">
            Page {currentPage} of {totalPages.toLocaleString()}
          </span>
          {currentPage < totalPages && (
            <Link
              href={`/donations/search?${new URLSearchParams({ ...params, page: String(currentPage + 1) }).toString()}`}
              className="px-3 py-1 border border-gray-700 hover:border-gray-500 text-sm"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
