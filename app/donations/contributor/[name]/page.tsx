import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface StateDonation {
  id: string;
  recipient_name: string;
  recipient_type: string;
  amount: number;
  receipt_date: string;
}

interface FECDonation {
  id: string;
  cmte_id: string | null;
  transaction_amt: number;
  transaction_dt: string | null;
  city: string | null;
  state: string | null;
  employer: string | null;
  occupation: string | null;
  election_cycle: number;
  is_fraud_linked: boolean;
  fraud_match_type: string | null;
  matched_entity_id: string | null;
  matched_entity_type: string | null;
}

interface FraudMatch {
  type: 'defendant' | 'organization';
  id: string;
  name: string;
  case_id?: string;
  case_name?: string;
}

interface ContributorStats {
  total_amount: number;
  donation_count: number;
  unique_recipients: number;
  avg_donation: number;
  years: number[];
  employer: string | null;
  is_fraud_linked: boolean;
  fraud_matches: FraudMatch[];
  fec_total: number;
  fec_count: number;
}

async function getStateDonations(name: string): Promise<StateDonation[]> {
  const { data } = await supabase
    .from('political_donations')
    .select('id, recipient_name, recipient_type, amount, receipt_date')
    .eq('contributor_name', name)
    .order('amount', { ascending: false })
    .limit(500);

  return (data || []) as StateDonation[];
}

async function getFECDonations(name: string): Promise<FECDonation[]> {
  // FEC names are uppercase
  const normalizedName = name.toUpperCase().replace(/[^A-Z0-9\s]/g, '').replace(/\s+/g, ' ').trim();

  const { data } = await supabase
    .from('fec_contributions')
    .select('id, cmte_id, transaction_amt, transaction_dt, city, state, employer, occupation, election_cycle, is_fraud_linked, fraud_match_type, matched_entity_id, matched_entity_type')
    .eq('name_normalized', normalizedName)
    .order('transaction_amt', { ascending: false })
    .limit(500);

  // Also try partial match if no exact match
  if (!data || data.length === 0) {
    const { data: partialData } = await supabase
      .from('fec_contributions')
      .select('id, cmte_id, transaction_amt, transaction_dt, city, state, employer, occupation, election_cycle, is_fraud_linked, fraud_match_type, matched_entity_id, matched_entity_type')
      .ilike('name', `%${name}%`)
      .order('transaction_amt', { ascending: false })
      .limit(500);
    return (partialData || []) as FECDonation[];
  }

  return (data || []) as FECDonation[];
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

async function getFraudMatches(fecDonations: FECDonation[]): Promise<FraudMatch[]> {
  const matches: FraudMatch[] = [];
  const seenIds = new Set<string>();

  for (const donation of fecDonations) {
    if (!donation.is_fraud_linked || !donation.matched_entity_id || seenIds.has(donation.matched_entity_id)) {
      continue;
    }
    seenIds.add(donation.matched_entity_id);

    if (donation.matched_entity_type === 'defendant') {
      const { data } = await supabase
        .from('defendants')
        .select('id, name, case_id, cases(id, case_name)')
        .eq('id', donation.matched_entity_id)
        .single();

      if (data) {
        const caseData = Array.isArray(data.cases) ? data.cases[0] : data.cases;
        matches.push({
          type: 'defendant',
          id: data.id,
          name: data.name,
          case_id: data.case_id || caseData?.id,
          case_name: caseData?.case_name,
        });
      }
    } else if (donation.matched_entity_type === 'organization') {
      const { data } = await supabase
        .from('organizations')
        .select('id, legal_name')
        .eq('id', donation.matched_entity_id)
        .single();

      if (data) {
        matches.push({
          type: 'organization',
          id: data.id,
          name: data.legal_name,
        });
      }
    }
  }

  return matches;
}

function calculateStats(
  stateDonations: StateDonation[],
  fecDonations: FECDonation[],
  employer: string | null,
  fraudMatches: FraudMatch[]
): ContributorStats {
  const stateTotal = stateDonations.reduce((sum, d) => sum + d.amount, 0);
  const fecTotal = fecDonations.reduce((sum, d) => sum + (d.transaction_amt || 0), 0);

  const stateRecipients = new Set(stateDonations.map(d => d.recipient_name));
  const fecRecipients = new Set(fecDonations.map(d => d.cmte_id).filter(Boolean));

  const stateYears = stateDonations.map(d => new Date(d.receipt_date).getFullYear()).filter(y => !isNaN(y));
  const fecYears = fecDonations.map(d => d.election_cycle).filter(Boolean);
  const allYears = [...new Set([...stateYears, ...fecYears])].sort((a, b) => b - a);

  const totalCount = stateDonations.length + fecDonations.length;
  const totalAmount = stateTotal + fecTotal;

  const isFraudLinked = fecDonations.some(d => d.is_fraud_linked);

  // Get employer from FEC if not from state data
  const fecEmployer = fecDonations.find(d => d.employer)?.employer || null;

  return {
    total_amount: totalAmount,
    donation_count: totalCount,
    unique_recipients: stateRecipients.size + fecRecipients.size,
    avg_donation: totalCount > 0 ? totalAmount / totalCount : 0,
    years: allYears,
    employer: employer || fecEmployer,
    is_fraud_linked: isFraudLinked,
    fraud_matches: fraudMatches,
    fec_total: fecTotal,
    fec_count: fecDonations.length,
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

function formatDate(dateStr: string | null): string {
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

  const [stateDonations, fecDonations, contributorInfo] = await Promise.all([
    getStateDonations(decodedName),
    getFECDonations(decodedName),
    getContributorInfo(decodedName),
  ]);

  if (stateDonations.length === 0 && fecDonations.length === 0) {
    notFound();
  }

  const fraudMatches = await getFraudMatches(fecDonations);
  const stats = calculateStats(
    stateDonations,
    fecDonations,
    contributorInfo?.contributor_employer || null,
    fraudMatches
  );

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
          {stats.is_fraud_linked && (
            <span className="px-2 py-1 bg-red-900 text-red-300 text-sm font-medium">
              FRAUD LINKED
            </span>
          )}
        </div>
        {stats.employer && (
          <p className="text-gray-500 mt-1">{stats.employer}</p>
        )}
      </div>

      {/* Fraud warning */}
      {stats.is_fraud_linked && stats.fraud_matches.length > 0 && (
        <div className="mb-8 border border-red-900/50 bg-red-950/20 p-4">
          <h3 className="text-red-400 font-bold mb-2">Fraud Connection Detected</h3>
          <p className="text-gray-400 text-sm mb-3">
            This contributor has been linked to the following fraud-related entities:
          </p>
          <ul className="space-y-2">
            {stats.fraud_matches.map((match) => (
              <li key={match.id} className="flex items-center gap-2 text-sm">
                <span className={`px-2 py-0.5 text-xs ${
                  match.type === 'defendant' ? 'bg-red-900 text-red-300' : 'bg-orange-900 text-orange-300'
                }`}>
                  {match.type === 'defendant' ? 'DEFENDANT' : 'ORGANIZATION'}
                </span>
                {match.type === 'defendant' && match.case_id ? (
                  <Link href={`/case/${match.case_id}`} className="text-red-400 hover:underline">
                    {match.name}
                  </Link>
                ) : (
                  <Link href={`/organization/${match.id}`} className="text-orange-400 hover:underline">
                    {match.name}
                  </Link>
                )}
                {match.case_name && (
                  <span className="text-gray-500">— {match.case_name}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
        <div>
          <p className={`font-mono text-3xl font-bold ${stats.is_fraud_linked ? 'text-red-500' : 'text-green-500'}`}>
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

      {/* Years and source breakdown */}
      <div className="mb-8 flex flex-wrap gap-4 text-sm text-gray-500">
        {stats.years.length > 0 && (
          <p>Years active: {stats.years.join(', ')}</p>
        )}
        {stats.fec_count > 0 && stateDonations.length > 0 && (
          <p className="text-gray-600">|</p>
        )}
        {stats.fec_count > 0 && (
          <p>
            <span className="text-blue-400">FEC:</span> {stats.fec_count} donations ({formatMoney(stats.fec_total)})
          </p>
        )}
        {stateDonations.length > 0 && (
          <p>
            <span className="text-green-400">State:</span> {stateDonations.length} donations ({formatMoney(stateDonations.reduce((s, d) => s + d.amount, 0))})
          </p>
        )}
      </div>

      {/* FEC contributions */}
      {fecDonations.length > 0 && (
        <div className="mb-12">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            Federal Contributions (FEC)
            {fecDonations.some(d => d.is_fraud_linked) && (
              <span className="text-xs px-2 py-0.5 bg-red-900 text-red-300">Contains fraud-linked</span>
            )}
          </h2>
          <div className={`border ${fecDonations.some(d => d.is_fraud_linked) ? 'border-red-900/50' : 'border-gray-800'}`}>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-800">
                  <th className="p-3 font-normal">Date</th>
                  <th className="p-3 font-normal">Committee</th>
                  <th className="p-3 font-normal">Cycle</th>
                  <th className="p-3 font-normal">Status</th>
                  <th className="p-3 font-normal text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {fecDonations.map((donation) => (
                  <tr
                    key={donation.id}
                    className={`border-b border-gray-900 hover:bg-gray-950 ${
                      donation.is_fraud_linked ? 'bg-red-950/20' : ''
                    }`}
                  >
                    <td className="p-3 text-gray-400">{formatDate(donation.transaction_dt)}</td>
                    <td className="p-3 font-mono text-xs">{donation.cmte_id || '-'}</td>
                    <td className="p-3 text-gray-400">{donation.election_cycle}</td>
                    <td className="p-3">
                      {donation.is_fraud_linked ? (
                        <span className="px-2 py-0.5 bg-red-900 text-red-300 text-xs">
                          {donation.fraud_match_type?.replace(/_/g, ' ') || 'linked'}
                        </span>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                    <td className={`p-3 text-right font-mono ${donation.is_fraud_linked ? 'text-red-400' : 'text-green-500'}`}>
                      ${donation.transaction_amt.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {fecDonations.length >= 500 && (
            <p className="mt-4 text-sm text-gray-500">Showing top 500 FEC donations by amount</p>
          )}
        </div>
      )}

      {/* State contributions */}
      {stateDonations.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-4">State Contributions</h2>
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
                {stateDonations.map((donation) => (
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
          {stateDonations.length >= 500 && (
            <p className="mt-4 text-sm text-gray-500">Showing top 500 donations by amount</p>
          )}
        </div>
      )}
    </div>
  );
}
