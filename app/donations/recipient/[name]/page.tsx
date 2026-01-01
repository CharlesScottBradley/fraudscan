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
  is_fraud_linked?: boolean;
  fraud_match_type?: string;
  matched_defendant?: { id: string; name: string; case_id: string | null };
}

interface RecipientStats {
  total_amount: number;
  donation_count: number;
  unique_contributors: number;
  avg_donation: number;
  years: number[];
  fraud_linked_count: number;
  fraud_linked_amount: number;
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

async function checkFraudLinks(donations: Donation[]): Promise<Map<string, { defendant: { id: string; name: string; case_id: string | null } }>> {
  const fraudMap = new Map<string, { defendant: { id: string; name: string; case_id: string | null } }>();

  // Get unique contributor names
  const uniqueNames = [...new Set(donations.filter(d => d.contributor_name).map(d => d.contributor_name))];
  if (uniqueNames.length === 0) return fraudMap;

  // Get all defendants
  const { data: defendants } = await supabase
    .from('defendants')
    .select('id, name, name_normalized, case_id');

  if (!defendants || defendants.length === 0) return fraudMap;

  // Create a map of normalized names to defendants
  const defendantMap = new Map<string, { id: string; name: string; case_id: string | null }>();
  for (const d of defendants) {
    if (d.name_normalized) {
      defendantMap.set(d.name_normalized, { id: d.id, name: d.name, case_id: d.case_id });
    }
    // Also try with original name normalized
    const normalized = d.name?.toUpperCase().replace(/[^A-Z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
    if (normalized) {
      defendantMap.set(normalized, { id: d.id, name: d.name, case_id: d.case_id });
    }
  }

  // Check each contributor
  for (const name of uniqueNames) {
    const normalized = name.toUpperCase().replace(/[^A-Z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
    const match = defendantMap.get(normalized);
    if (match) {
      fraudMap.set(name, { defendant: match });
    }
  }

  return fraudMap;
}

function calculateStats(donations: Donation[], fraudMap: Map<string, { defendant: { id: string; name: string; case_id: string | null } }>): RecipientStats {
  const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);
  const uniqueContributors = new Set(donations.filter(d => d.contributor_name).map(d => d.contributor_name)).size;
  const years = [...new Set(donations.map(d => new Date(d.receipt_date).getFullYear()))].sort((a, b) => b - a);

  let fraudLinkedCount = 0;
  let fraudLinkedAmount = 0;
  for (const donation of donations) {
    if (donation.contributor_name && fraudMap.has(donation.contributor_name)) {
      fraudLinkedCount++;
      fraudLinkedAmount += donation.amount;
    }
  }

  return {
    total_amount: totalAmount,
    donation_count: donations.length,
    unique_contributors: uniqueContributors,
    avg_donation: donations.length > 0 ? totalAmount / donations.length : 0,
    years,
    fraud_linked_count: fraudLinkedCount,
    fraud_linked_amount: fraudLinkedAmount,
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

  const fraudMap = await checkFraudLinks(donations);
  const stats = calculateStats(donations, fraudMap);

  // Get unique fraud-linked contributors for the alert
  const fraudLinkedContributors = [...fraudMap.entries()].map(([contributorName, data]) => ({
    contributorName,
    ...data.defendant,
  }));

  return (
    <div>
      <div className="mb-2">
        <Link href="/donations" className="text-gray-500 hover:text-white text-sm">
          &larr; Back to donations
        </Link>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{decodedName}</h1>
          {stats.fraud_linked_count > 0 && (
            <span className="px-2 py-1 bg-red-900 text-red-300 text-sm font-medium">
              {stats.fraud_linked_count} FRAUD-LINKED DONOR{stats.fraud_linked_count > 1 ? 'S' : ''}
            </span>
          )}
        </div>
        {recipientInfo && (
          <p className="text-gray-500 mt-1">
            {getRecipientTypeLabel(recipientInfo.recipient_type)}
            {recipientInfo.recipient_subtype && ` - ${recipientInfo.recipient_subtype}`}
          </p>
        )}
      </div>

      {/* Fraud alert */}
      {fraudLinkedContributors.length > 0 && (
        <div className="mb-8 border border-red-900/50 bg-red-950/20 p-4">
          <h3 className="text-red-400 font-bold mb-2">Fraud-Linked Contributions Detected</h3>
          <p className="text-gray-400 text-sm mb-3">
            This recipient received {formatMoney(stats.fraud_linked_amount)} from {stats.fraud_linked_count} donation(s)
            linked to known fraud defendants:
          </p>
          <ul className="space-y-2">
            {fraudLinkedContributors.slice(0, 10).map((contributor) => (
              <li key={contributor.id} className="flex items-center gap-2 text-sm">
                <span className="px-2 py-0.5 bg-red-900 text-red-300 text-xs">DEFENDANT</span>
                <Link
                  href={`/donations/contributor/${encodeURIComponent(contributor.name)}`}
                  className="text-white hover:underline"
                >
                  {contributor.name}
                </Link>
                {contributor.case_id && (
                  <>
                    <span className="text-gray-600">—</span>
                    <Link href={`/case/${contributor.case_id}`} className="text-red-400 hover:underline text-xs">
                      View Case
                    </Link>
                  </>
                )}
              </li>
            ))}
          </ul>
          {fraudLinkedContributors.length > 10 && (
            <p className="mt-2 text-xs text-gray-500">
              And {fraudLinkedContributors.length - 10} more fraud-linked contributors
            </p>
          )}
        </div>
      )}

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
              {donations.map((donation) => {
                const isFraudLinked = donation.contributor_name && fraudMap.has(donation.contributor_name);
                return (
                  <tr
                    key={donation.id}
                    className={`border-b border-gray-900 hover:bg-gray-950 ${
                      isFraudLinked ? 'bg-red-950/20' : ''
                    }`}
                  >
                    <td className="p-3 text-gray-400">{formatDate(donation.receipt_date)}</td>
                    <td className="p-3">
                      {donation.contributor_name ? (
                        <span className="flex items-center gap-2">
                          <Link
                            href={`/donations/contributor/${encodeURIComponent(donation.contributor_name)}`}
                            className="hover:underline"
                          >
                            {donation.contributor_name}
                          </Link>
                          {isFraudLinked && (
                            <span className="px-1.5 py-0.5 bg-red-900 text-red-300 text-xs">
                              FRAUD
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-gray-500">Anonymous</span>
                      )}
                      {donation.contributor_employer && (
                        <span className="block text-xs text-gray-500">{donation.contributor_employer}</span>
                      )}
                    </td>
                    <td className="p-3 text-gray-400">{donation.contributor_type || '-'}</td>
                    <td className={`p-3 text-right font-mono ${isFraudLinked ? 'text-red-400' : 'text-green-500'}`}>
                      ${donation.amount.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
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
