import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { notFound } from 'next/navigation';

const STATE_NAMES: Record<string, string> = {
  'al': 'Alabama', 'ak': 'Alaska', 'az': 'Arizona', 'ar': 'Arkansas',
  'ca': 'California', 'co': 'Colorado', 'ct': 'Connecticut', 'de': 'Delaware',
  'dc': 'Washington DC', 'fl': 'Florida', 'ga': 'Georgia', 'hi': 'Hawaii',
  'id': 'Idaho', 'il': 'Illinois', 'in': 'Indiana', 'ia': 'Iowa',
  'ks': 'Kansas', 'ky': 'Kentucky', 'la': 'Louisiana', 'me': 'Maine',
  'md': 'Maryland', 'ma': 'Massachusetts', 'mi': 'Michigan', 'mn': 'Minnesota',
  'ms': 'Mississippi', 'mo': 'Missouri', 'mt': 'Montana', 'ne': 'Nebraska',
  'nv': 'Nevada', 'nh': 'New Hampshire', 'nj': 'New Jersey', 'nm': 'New Mexico',
  'ny': 'New York', 'nc': 'North Carolina', 'nd': 'North Dakota', 'oh': 'Ohio',
  'ok': 'Oklahoma', 'or': 'Oregon', 'pa': 'Pennsylvania', 'ri': 'Rhode Island',
  'sc': 'South Carolina', 'sd': 'South Dakota', 'tn': 'Tennessee', 'tx': 'Texas',
  'ut': 'Utah', 'vt': 'Vermont', 'va': 'Virginia', 'wa': 'Washington',
  'wv': 'West Virginia', 'wi': 'Wisconsin', 'wy': 'Wyoming',
};

interface DonationStats {
  total_donations: number;
  total_amount: number;
  unique_recipients: number;
  unique_contributors: number;
}

interface TopRecipient {
  recipient_name: string;
  recipient_type: string;
  total_amount: number;
  donation_count: number;
}

interface TopContributor {
  contributor_name: string;
  contributor_employer: string | null;
  total_amount: number;
  donation_count: number;
}

interface RecentDonation {
  id: string;
  recipient_name: string;
  contributor_name: string;
  amount: number;
  receipt_date: string;
  contributor_employer: string | null;
}

async function getDonationStats(state: string): Promise<DonationStats | null> {
  const stateUpper = state.toUpperCase();

  const { count } = await supabase
    .from('political_donations')
    .select('*', { count: 'exact', head: true })
    .eq('state', stateUpper);

  if (!count || count === 0) return null;

  const { data: amounts } = await supabase
    .from('political_donations')
    .select('amount')
    .eq('state', stateUpper);

  const totalAmount = amounts?.reduce((sum, d) => sum + (d.amount || 0), 0) || 0;

  const { data: recipients } = await supabase
    .from('political_donations')
    .select('recipient_name')
    .eq('state', stateUpper)
    .limit(100000);

  const { data: contributors } = await supabase
    .from('political_donations')
    .select('contributor_name')
    .eq('state', stateUpper)
    .limit(100000);

  const uniqueRecipients = new Set(recipients?.map(r => r.recipient_name)).size;
  const uniqueContributors = new Set(contributors?.filter(c => c.contributor_name).map(c => c.contributor_name)).size;

  return {
    total_donations: count || 0,
    total_amount: totalAmount,
    unique_recipients: uniqueRecipients,
    unique_contributors: uniqueContributors,
  };
}

async function getTopRecipients(state: string): Promise<TopRecipient[]> {
  const stateUpper = state.toUpperCase();

  const { data } = await supabase
    .from('political_donations')
    .select('recipient_name, recipient_type, amount')
    .eq('state', stateUpper)
    .order('amount', { ascending: false })
    .limit(50000);

  if (!data) return [];

  const recipientMap = new Map<string, { type: string; total: number; count: number }>();

  data.forEach(d => {
    const existing = recipientMap.get(d.recipient_name) || { type: d.recipient_type || '', total: 0, count: 0 };
    existing.total += d.amount || 0;
    existing.count += 1;
    recipientMap.set(d.recipient_name, existing);
  });

  return Array.from(recipientMap.entries())
    .map(([name, data]) => ({
      recipient_name: name,
      recipient_type: data.type,
      total_amount: data.total,
      donation_count: data.count,
    }))
    .sort((a, b) => b.total_amount - a.total_amount)
    .slice(0, 25);
}

async function getTopContributors(state: string): Promise<TopContributor[]> {
  const stateUpper = state.toUpperCase();

  const { data } = await supabase
    .from('political_donations')
    .select('contributor_name, contributor_employer, amount')
    .eq('state', stateUpper)
    .not('contributor_name', 'is', null)
    .order('amount', { ascending: false })
    .limit(50000);

  if (!data) return [];

  const contributorMap = new Map<string, { employer: string | null; total: number; count: number }>();

  data.forEach(d => {
    if (!d.contributor_name) return;
    const existing = contributorMap.get(d.contributor_name) || { employer: d.contributor_employer, total: 0, count: 0 };
    existing.total += d.amount || 0;
    existing.count += 1;
    contributorMap.set(d.contributor_name, existing);
  });

  return Array.from(contributorMap.entries())
    .map(([name, data]) => ({
      contributor_name: name,
      contributor_employer: data.employer,
      total_amount: data.total,
      donation_count: data.count,
    }))
    .sort((a, b) => b.total_amount - a.total_amount)
    .slice(0, 25);
}

async function getRecentDonations(state: string): Promise<RecentDonation[]> {
  const stateUpper = state.toUpperCase();

  const { data } = await supabase
    .from('political_donations')
    .select('id, recipient_name, contributor_name, amount, receipt_date, contributor_employer')
    .eq('state', stateUpper)
    .order('receipt_date', { ascending: false })
    .limit(50);

  return (data || []) as RecentDonation[];
}

export const revalidate = 60;

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

export default async function StateDonationsPage({ params }: { params: Promise<{ state: string }> }) {
  const { state } = await params;
  const stateLower = state.toLowerCase();
  const stateName = STATE_NAMES[stateLower];

  if (!stateName) {
    notFound();
  }

  const [stats, topRecipients, topContributors, recentDonations] = await Promise.all([
    getDonationStats(stateLower),
    getTopRecipients(stateLower),
    getTopContributors(stateLower),
    getRecentDonations(stateLower),
  ]);

  if (!stats) {
    return (
      <div>
        <div className="mb-2">
          <Link href="/donations" className="text-gray-500 hover:text-white text-sm">
            &larr; Back to donations
          </Link>
        </div>
        <h1 className="text-2xl font-bold mb-4">{stateName}</h1>
        <p className="text-gray-500">No donation data available for {stateName} yet.</p>
        <p className="text-gray-600 mt-2 text-sm">Check back soon - we&apos;re adding more states.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2">
        <Link href="/donations" className="text-gray-500 hover:text-white text-sm">
          &larr; Back to donations
        </Link>
      </div>

      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">{stateName} Political Donations</h1>
          <p className="text-gray-500">Campaign finance data from state sources</p>
        </div>
        <Link
          href={`/donations/search?state=${state.toUpperCase()}`}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium"
        >
          Search & Filter
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
        <div>
          <p className="text-green-500 font-mono text-3xl font-bold">
            {formatMoney(stats.total_amount)}
          </p>
          <p className="text-gray-500 mt-1">Total contributions</p>
        </div>
        <div>
          <p className="text-white font-mono text-3xl font-bold">
            {stats.total_donations.toLocaleString()}
          </p>
          <p className="text-gray-500 mt-1">Individual donations</p>
        </div>
        <div>
          <p className="text-white font-mono text-3xl font-bold">
            {stats.unique_recipients.toLocaleString()}
          </p>
          <p className="text-gray-500 mt-1">Recipients</p>
        </div>
        <div>
          <p className="text-white font-mono text-3xl font-bold">
            {stats.unique_contributors.toLocaleString()}
          </p>
          <p className="text-gray-500 mt-1">Contributors</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Top Recipients */}
        <div>
          <h2 className="text-lg font-bold mb-4">Top Recipients</h2>
          <div className="border border-gray-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-800">
                  <th className="p-3 font-normal">#</th>
                  <th className="p-3 font-normal">Recipient</th>
                  <th className="p-3 font-normal">Type</th>
                  <th className="p-3 font-normal text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {topRecipients.map((recipient, index) => (
                  <tr key={recipient.recipient_name} className="border-b border-gray-900 hover:bg-gray-950">
                    <td className="p-3 text-gray-500">{index + 1}</td>
                    <td className="p-3">
                      <Link
                        href={`/donations/recipient/${encodeURIComponent(recipient.recipient_name)}`}
                        className="hover:underline"
                      >
                        {recipient.recipient_name}
                      </Link>
                    </td>
                    <td className="p-3 text-gray-400">
                      <span className="px-2 py-0.5 bg-gray-800 text-xs">
                        {getRecipientTypeLabel(recipient.recipient_type)}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono text-green-500">
                      {formatMoney(recipient.total_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Contributors */}
        <div>
          <h2 className="text-lg font-bold mb-4">Top Contributors</h2>
          <div className="border border-gray-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-800">
                  <th className="p-3 font-normal">#</th>
                  <th className="p-3 font-normal">Contributor</th>
                  <th className="p-3 font-normal text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {topContributors.map((contributor, index) => (
                  <tr key={contributor.contributor_name} className="border-b border-gray-900 hover:bg-gray-950">
                    <td className="p-3 text-gray-500">{index + 1}</td>
                    <td className="p-3">
                      <Link
                        href={`/donations/contributor/${encodeURIComponent(contributor.contributor_name)}`}
                        className="hover:underline"
                      >
                        {contributor.contributor_name}
                      </Link>
                      {contributor.contributor_employer && (
                        <span className="block text-xs text-gray-500">{contributor.contributor_employer}</span>
                      )}
                    </td>
                    <td className="p-3 text-right font-mono text-green-500">
                      {formatMoney(contributor.total_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Donations */}
      <div>
        <h2 className="text-lg font-bold mb-4">Recent Donations</h2>
        <div className="border border-gray-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-800">
                <th className="p-3 font-normal">Date</th>
                <th className="p-3 font-normal">Contributor</th>
                <th className="p-3 font-normal">Recipient</th>
                <th className="p-3 font-normal text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {recentDonations.map((donation) => (
                <tr key={donation.id} className="border-b border-gray-900 hover:bg-gray-950">
                  <td className="p-3 text-gray-400">{formatDate(donation.receipt_date)}</td>
                  <td className="p-3">
                    {donation.contributor_name || 'Anonymous'}
                    {donation.contributor_employer && (
                      <span className="block text-xs text-gray-500">{donation.contributor_employer}</span>
                    )}
                  </td>
                  <td className="p-3">{donation.recipient_name}</td>
                  <td className="p-3 text-right font-mono text-green-500">
                    ${donation.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
