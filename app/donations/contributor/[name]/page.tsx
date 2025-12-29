import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface Donation {
  id: string;
  recipient_name: string;
  recipient_type: string;
  amount: number;
  receipt_date: string;
}

interface ContributorStats {
  total_amount: number;
  donation_count: number;
  unique_recipients: number;
  avg_donation: number;
  years: number[];
  employer: string | null;
}

async function getContributorDonations(name: string): Promise<Donation[]> {
  const { data } = await supabase
    .from('political_donations')
    .select('id, recipient_name, recipient_type, amount, receipt_date')
    .eq('contributor_name', name)
    .order('amount', { ascending: false })
    .limit(500);

  return (data || []) as Donation[];
}

async function getContributorInfo(name: string) {
  const { data } = await supabase
    .from('political_donations')
    .select('contributor_employer, contributor_zip')
    .eq('contributor_name', name)
    .not('contributor_employer', 'is', null)
    .limit(1);

  return data?.[0] || null;
}

function calculateStats(donations: Donation[], employer: string | null): ContributorStats {
  const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);
  const uniqueRecipients = new Set(donations.map(d => d.recipient_name)).size;
  const years = [...new Set(donations.map(d => new Date(d.receipt_date).getFullYear()))].sort((a, b) => b - a);

  return {
    total_amount: totalAmount,
    donation_count: donations.length,
    unique_recipients: uniqueRecipients,
    avg_donation: donations.length > 0 ? totalAmount / donations.length : 0,
    years,
    employer,
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
    case 'PCC': return 'Candidate';
    case 'PTU': return 'Party';
    case 'PCF': return 'Committee';
    default: return type || 'Other';
  }
}

export default async function ContributorPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);

  const [donations, contributorInfo] = await Promise.all([
    getContributorDonations(decodedName),
    getContributorInfo(decodedName),
  ]);

  if (donations.length === 0) {
    notFound();
  }

  const stats = calculateStats(donations, contributorInfo?.contributor_employer || null);

  return (
    <div>
      <div className="mb-2">
        <Link href="/donations" className="text-gray-500 hover:text-white text-sm">
          &larr; Back to donations
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">{decodedName}</h1>
        {stats.employer && (
          <p className="text-gray-500">{stats.employer}</p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
        <div>
          <p className="text-green-500 font-mono text-3xl font-bold">
            {formatMoney(stats.total_amount)}
          </p>
          <p className="text-gray-500 mt-1">Total contributed</p>
        </div>
        <div>
          <p className="text-white font-mono text-3xl font-bold">
            {stats.donation_count.toLocaleString()}
          </p>
          <p className="text-gray-500 mt-1">Donations</p>
        </div>
        <div>
          <p className="text-white font-mono text-3xl font-bold">
            {stats.unique_recipients.toLocaleString()}
          </p>
          <p className="text-gray-500 mt-1">Recipients</p>
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
        <h2 className="text-lg font-bold mb-4">Contributions Made</h2>
        <div className="border border-gray-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-800">
                <th className="p-3 font-normal">Date</th>
                <th className="p-3 font-normal">Recipient</th>
                <th className="p-3 font-normal">Type</th>
                <th className="p-3 font-normal text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {donations.map((donation) => (
                <tr key={donation.id} className="border-b border-gray-900 hover:bg-gray-950">
                  <td className="p-3 text-gray-400">{formatDate(donation.receipt_date)}</td>
                  <td className="p-3">
                    <Link
                      href={`/donations/recipient/${encodeURIComponent(donation.recipient_name)}`}
                      className="hover:underline"
                    >
                      {donation.recipient_name}
                    </Link>
                  </td>
                  <td className="p-3 text-gray-400">
                    <span className="px-2 py-0.5 bg-gray-800 text-xs">
                      {getRecipientTypeLabel(donation.recipient_type)}
                    </span>
                  </td>
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
