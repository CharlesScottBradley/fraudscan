import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface Donation {
  id: string;
  contributor_name: string;
  contributor_employer: string | null;
  amount: number;
  receipt_date: string;
  contributor_type: string;
  contributor_zip: string | null;
}

interface RecipientStats {
  total_amount: number;
  donation_count: number;
  unique_contributors: number;
  avg_donation: number;
  years: number[];
}

async function getRecipientDonations(name: string): Promise<Donation[]> {
  const { data } = await supabase
    .from('political_donations')
    .select('id, contributor_name, contributor_employer, amount, receipt_date, contributor_type, contributor_zip')
    .eq('recipient_name', name)
    .order('amount', { ascending: false })
    .limit(500);

  return (data || []) as Donation[];
}

async function getRecipientInfo(name: string) {
  const { data } = await supabase
    .from('political_donations')
    .select('recipient_type, recipient_subtype')
    .eq('recipient_name', name)
    .limit(1);

  return data?.[0] || null;
}

function calculateStats(donations: Donation[]): RecipientStats {
  const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);
  const uniqueContributors = new Set(donations.filter(d => d.contributor_name).map(d => d.contributor_name)).size;
  const years = [...new Set(donations.map(d => new Date(d.receipt_date).getFullYear()))].sort((a, b) => b - a);

  return {
    total_amount: totalAmount,
    donation_count: donations.length,
    unique_contributors: uniqueContributors,
    avg_donation: donations.length > 0 ? totalAmount / donations.length : 0,
    years,
  };
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
    case 'PCC': return 'Principal Campaign Committee';
    case 'PTU': return 'Party Unit';
    case 'PCF': return 'Political Committee/Fund';
    default: return type || 'Unknown';
  }
}

export default async function RecipientPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);

  const [donations, recipientInfo] = await Promise.all([
    getRecipientDonations(decodedName),
    getRecipientInfo(decodedName),
  ]);

  if (donations.length === 0) {
    notFound();
  }

  const stats = calculateStats(donations);

  return (
    <div>
      <div className="mb-2">
        <Link href="/donations" className="text-gray-500 hover:text-white text-sm">
          &larr; Back to donations
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">{decodedName}</h1>
        {recipientInfo && (
          <p className="text-gray-500">
            {getRecipientTypeLabel(recipientInfo.recipient_type)}
            {recipientInfo.recipient_subtype && ` - ${recipientInfo.recipient_subtype}`}
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
        <div>
          <p className="text-green-500 font-mono text-3xl font-bold">
            {formatMoney(stats.total_amount)}
          </p>
          <p className="text-gray-500 mt-1">Total received</p>
        </div>
        <div>
          <p className="text-white font-mono text-3xl font-bold">
            {stats.donation_count.toLocaleString()}
          </p>
          <p className="text-gray-500 mt-1">Donations</p>
        </div>
        <div>
          <p className="text-white font-mono text-3xl font-bold">
            {stats.unique_contributors.toLocaleString()}
          </p>
          <p className="text-gray-500 mt-1">Unique contributors</p>
        </div>
        <div>
          <p className="text-white font-mono text-3xl font-bold">
            {formatMoney(stats.avg_donation)}
          </p>
          <p className="text-gray-500 mt-1">Avg donation</p>
        </div>
      </div>

      {/* Years active */}
      {stats.years.length > 0 && (
        <div className="mb-8">
          <p className="text-gray-500 text-sm">
            Years active: {stats.years.join(', ')}
          </p>
        </div>
      )}

      {/* Donations table */}
      <div>
        <h2 className="text-lg font-bold mb-4">Top Contributions</h2>
        <div className="border border-gray-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-800">
                <th className="p-3 font-normal">Date</th>
                <th className="p-3 font-normal">Contributor</th>
                <th className="p-3 font-normal">Type</th>
                <th className="p-3 font-normal text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {donations.map((donation) => (
                <tr key={donation.id} className="border-b border-gray-900 hover:bg-gray-950">
                  <td className="p-3 text-gray-400">{formatDate(donation.receipt_date)}</td>
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
                  </td>
                  <td className="p-3 text-gray-400">{donation.contributor_type || '-'}</td>
                  <td className="p-3 text-right font-mono text-green-500">
                    ${donation.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {donations.length >= 500 && (
          <p className="mt-4 text-sm text-gray-500">Showing top 500 donations by amount</p>
        )}
      </div>
    </div>
  );
}
