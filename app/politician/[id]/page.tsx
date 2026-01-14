import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface Politician {
  id: string;
  full_name: string | null;
  person_id: string | null;
  office_type: string | null;
  office_title: string | null;
  state: string | null;
  district: string | null;
  party: string | null;
  current_term_start: string | null;
  current_term_end: string | null;
  is_current: boolean | null;
  fec_candidate_id: string | null;
  bioguide_id: string | null;
  opensecrets_id: string | null;
  photo_url: string | null;
  website: string | null;
}

interface Person {
  id: string;
  full_name: string;
  photo_url: string | null;
}

interface Contribution {
  id: string;
  name: string | null;  // contributor name
  transaction_amt: number | null;
  transaction_dt: string | null;
  employer: string | null;
  occupation: string | null;
  city: string | null;
  state: string | null;
}

interface NewsArticle {
  id: string;
  title: string;
  source: string | null;
  published_at: string | null;
  url: string | null;
}

interface PoliticianCommittee {
  cmte_id: string;
  name: string | null;
  committee_type: string | null;
  party: string | null;
  designation: string;
  designation_label: string;
  total_received: number;
  donation_count: number;
}

interface Earmark {
  id: string;
  fiscal_year: number;
  recipient_name: string;
  amount_requested: number | null;
  industry: string | null;
  recipient_type: string | null;
  subcommittee: string | null;
  project_description: string | null;
  recipient_city: string | null;
  recipient_state: string | null;
  organization_id: string | null;
  organization: {
    legal_name: string;
    ein: string | null;
  } | null;
}

interface EarmarkStats {
  totalEarmarks: number;
  totalAmount: number;
  uniqueRecipients: number;
  topIndustry: string | null;
  byIndustry: { industry: string; count: number; amount: number }[];
  fiscalYears: number[];
}

interface Vote {
  id: number;
  vote: string;
  voteDate: string | null;
  voteQuestion: string | null;
  voteDescription: string | null;
  voteResult: string | null;
  billId: string | null;
  billType: string | null;
  billNumber: number | null;
  billTitle: string | null;
  chamber: string | null;
}

interface VoteStats {
  totalVotes: number;
  yeaCount: number;
  nayCount: number;
  presentCount: number;
  notVotingCount: number;
  yeaPercent: number;
}

const PARTY_COLORS: Record<string, string> = {
  R: 'bg-red-900/40 text-red-400 border-red-800',
  Republican: 'bg-red-900/40 text-red-400 border-red-800',
  D: 'bg-blue-900/40 text-blue-400 border-blue-800',
  Democrat: 'bg-blue-900/40 text-blue-400 border-blue-800',
  Democratic: 'bg-blue-900/40 text-blue-400 border-blue-800',
  I: 'bg-purple-900/40 text-purple-400 border-purple-800',
  Independent: 'bg-purple-900/40 text-purple-400 border-purple-800',
};

function formatMoney(amount: number | null): string {
  if (!amount) return '-';
  if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(2)}B`;
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(2)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getPartyClass(party: string | null): string {
  if (!party) return 'bg-gray-800 text-gray-400 border-gray-700';
  return PARTY_COLORS[party] || PARTY_COLORS[party.charAt(0).toUpperCase()] || 'bg-gray-800 text-gray-400 border-gray-700';
}

async function getPolitician(id: string): Promise<Politician | null> {
  const { data, error } = await supabase
    .from('politicians')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
}

async function getPerson(personId: string): Promise<Person | null> {
  const { data, error } = await supabase
    .from('people')
    .select('id, full_name, photo_url')
    .eq('id', personId)
    .single();

  if (error) return null;
  return data;
}

interface ContributionsResponse {
  contributions: Contribution[];
  totalCount: number;
  totalAmount: number;
}

async function getContributions(politicianId: string): Promise<ContributionsResponse> {
  // Use internal API route for reliable data fetching in server components
  const url = `https://www.somaliscan.com/api/politicians/${politicianId}/contributions`;

  try {
    const response = await fetch(url, { cache: 'no-store' });

    if (!response.ok) {
      console.error('[getContributions] API error:', response.status);
      return { contributions: [], totalCount: 0, totalAmount: 0 };
    }

    const data = await response.json();
    return {
      contributions: data.contributions || [],
      totalCount: data.totalCount || 0,
      totalAmount: data.totalAmount || 0
    };
  } catch (error) {
    console.error('[getContributions] Error:', error);
    return { contributions: [], totalCount: 0, totalAmount: 0 };
  }
}

async function getNewsArticles(politicianName: string): Promise<NewsArticle[]> {
  // Search news articles mentioning this politician
  const { data, error } = await supabase
    .from('news_articles')
    .select('id, title, source, published_at, url')
    .or(`title.ilike.%${politicianName}%,content.ilike.%${politicianName}%`)
    .order('published_at', { ascending: false })
    .limit(10);

  if (error) return [];
  return data || [];
}

async function getCommittees(politicianId: string): Promise<PoliticianCommittee[]> {
  const url = `https://www.somaliscan.com/api/politicians/${politicianId}/committees`;

  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) return [];
    const data = await response.json();
    return data.committees || [];
  } catch (error) {
    console.error('[getCommittees] Error:', error);
    return [];
  }
}

interface EarmarksResponse {
  earmarks: Earmark[];
  stats: EarmarkStats;
}

async function getEarmarks(politicianId: string): Promise<EarmarksResponse> {
  const url = `https://www.somaliscan.com/api/politicians/${politicianId}/earmarks`;

  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      return { earmarks: [], stats: { totalEarmarks: 0, totalAmount: 0, uniqueRecipients: 0, topIndustry: null, byIndustry: [], fiscalYears: [] } };
    }
    const data = await response.json();
    return {
      earmarks: data.earmarks || [],
      stats: data.stats || { totalEarmarks: 0, totalAmount: 0, uniqueRecipients: 0, topIndustry: null, byIndustry: [], fiscalYears: [] }
    };
  } catch (error) {
    console.error('[getEarmarks] Error:', error);
    return { earmarks: [], stats: { totalEarmarks: 0, totalAmount: 0, uniqueRecipients: 0, topIndustry: null, byIndustry: [], fiscalYears: [] } };
  }
}

interface VotesResponse {
  votes: Vote[];
  stats: VoteStats;
}

async function getVotes(politicianId: string): Promise<VotesResponse> {
  const url = `https://www.somaliscan.com/api/politicians/${politicianId}/votes`;

  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      return { votes: [], stats: { totalVotes: 0, yeaCount: 0, nayCount: 0, presentCount: 0, notVotingCount: 0, yeaPercent: 0 } };
    }
    const data = await response.json();
    return {
      votes: data.votes || [],
      stats: data.stats || { totalVotes: 0, yeaCount: 0, nayCount: 0, presentCount: 0, notVotingCount: 0, yeaPercent: 0 }
    };
  } catch (error) {
    console.error('[getVotes] Error:', error);
    return { votes: [], stats: { totalVotes: 0, yeaCount: 0, nayCount: 0, presentCount: 0, notVotingCount: 0, yeaPercent: 0 } };
  }
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PoliticianDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const politician = await getPolitician(id);

  if (!politician) {
    notFound();
  }

  // Fetch person info
  const person = politician.person_id ? await getPerson(politician.person_id) : null;

  const name = politician.full_name || person?.full_name || 'Unknown Politician';

  // Fetch contributions, committees, news, earmarks, and votes
  const [contributionsData, committees, newsArticles, earmarksData, votesData] = await Promise.all([
    getContributions(id),
    getCommittees(id),
    name !== 'Unknown Politician' ? getNewsArticles(name) : Promise.resolve([]),
    getEarmarks(id),
    getVotes(id),
  ]);
  const { contributions, totalCount, totalAmount } = contributionsData;
  const { earmarks, stats: earmarkStats } = earmarksData;
  const { votes, stats: voteStats } = votesData;
  const photoUrl = politician.photo_url || person?.photo_url;

  // Use totals from API (accurate across all contributions, not just top 100)
  const totalRaised = totalAmount;
  const contributionCount = totalCount;
  const avgContribution = contributionCount > 0 ? totalRaised / contributionCount : 0;

  // Group earmarks by fiscal year for timeline
  const earmarksByYear: Record<number, { count: number; amount: number }> = {};
  earmarks.forEach(e => {
    const fy = e.fiscal_year;
    if (!earmarksByYear[fy]) {
      earmarksByYear[fy] = { count: 0, amount: 0 };
    }
    earmarksByYear[fy].count++;
    earmarksByYear[fy].amount += e.amount_requested || 0;
  });

  const earmarkTimelineData = Object.entries(earmarksByYear)
    .map(([year, data]) => ({ year: parseInt(year), ...data }))
    .sort((a, b) => a.year - b.year);

  return (
    <div className="max-w-4xl mx-auto">
      <Link href="/politicians" className="text-gray-500 hover:text-white text-sm mb-6 inline-block">
        ← Back to Politicians
      </Link>

      {/* 7.6: Header with photo, office, party */}
      <div className="flex gap-6 mb-8">
        {/* Photo */}
        <div className="flex-shrink-0">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={name}
              className="w-32 h-32 object-cover border border-gray-700"
            />
          ) : (
            <div className="w-32 h-32 bg-gray-800 border border-gray-700 flex items-center justify-center">
              <span className="text-4xl text-gray-600">
                {name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1">
          <h1 className="text-2xl font-bold mb-2">{name}</h1>
          <div className="flex flex-wrap gap-2 items-center mb-3">
            <span className={`px-3 py-1 rounded text-sm border ${getPartyClass(politician.party)}`}>
              {politician.party || 'Unknown Party'}
            </span>
            {politician.is_current && (
              <span className="px-2 py-0.5 rounded text-xs bg-green-900/40 text-green-400 border border-green-800">
                Current
              </span>
            )}
          </div>
          <p className="text-gray-300 mb-1">
            {politician.office_title || politician.office_type || 'Office Unknown'}
          </p>
          {politician.state && (
            <p className="text-gray-500">
              {politician.state}{politician.district ? `, District ${politician.district}` : ''}
            </p>
          )}
          {politician.current_term_start && (
            <p className="text-gray-600 text-sm mt-2">
              Term: {formatDate(politician.current_term_start)} - {formatDate(politician.current_term_end) || 'Present'}
            </p>
          )}
        </div>
      </div>

      {/* Summary stats - show earmark stats if available, otherwise contributions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {earmarkStats.totalEarmarks > 0 ? (
          <>
            <div className="border border-gray-800 p-4">
              <p className="text-gray-500 text-sm mb-1">Total Earmarked</p>
              <p className="text-amber-500 font-mono text-xl font-bold">
                {formatMoney(earmarkStats.totalAmount)}
              </p>
              <p className="text-gray-600 text-xs">requested spending</p>
            </div>
            <div className="border border-gray-800 p-4">
              <p className="text-gray-500 text-sm mb-1"># Earmarks</p>
              <p className="text-white font-mono text-xl font-bold">
                {earmarkStats.totalEarmarks}
              </p>
              <p className="text-gray-600 text-xs">spending requests</p>
            </div>
            <div className="border border-gray-800 p-4">
              <p className="text-gray-500 text-sm mb-1">Recipients</p>
              <p className="text-white font-mono text-xl font-bold">
                {earmarkStats.uniqueRecipients}
              </p>
              <p className="text-gray-600 text-xs">unique organizations</p>
            </div>
            <div className="border border-gray-800 p-4">
              <p className="text-gray-500 text-sm mb-1">News Mentions</p>
              <p className="text-white font-mono text-xl font-bold">
                {newsArticles.length}
              </p>
              <p className="text-gray-600 text-xs">articles found</p>
            </div>
          </>
        ) : (
          <>
            <div className="border border-gray-800 p-4">
              <p className="text-gray-500 text-sm mb-1">Total Raised</p>
              <p className="text-green-500 font-mono text-xl font-bold">
                {formatMoney(totalRaised)}
              </p>
              <p className="text-gray-600 text-xs">from FEC filings</p>
            </div>
            <div className="border border-gray-800 p-4">
              <p className="text-gray-500 text-sm mb-1"># Contributions</p>
              <p className="text-white font-mono text-xl font-bold">
                {contributionCount.toLocaleString()}
              </p>
              <p className="text-gray-600 text-xs">individual donations</p>
            </div>
            <div className="border border-gray-800 p-4">
              <p className="text-gray-500 text-sm mb-1">Avg Contribution</p>
              <p className="text-white font-mono text-xl font-bold">
                {formatMoney(avgContribution)}
              </p>
              <p className="text-gray-600 text-xs">per donation</p>
            </div>
            <div className="border border-gray-800 p-4">
              <p className="text-gray-500 text-sm mb-1">News Mentions</p>
              <p className="text-white font-mono text-xl font-bold">
                {newsArticles.length}
              </p>
              <p className="text-gray-600 text-xs">articles found</p>
            </div>
          </>
        )}
      </div>

      {/* Earmark Timeline */}
      {earmarkTimelineData.length > 1 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4">Earmark Timeline</h2>
          <div className="border border-gray-800 p-4">
            <div className="flex items-end gap-2 h-32">
              {earmarkTimelineData.map(({ year, count, amount }) => {
                const maxAmount = Math.max(...earmarkTimelineData.map(d => d.amount));
                const height = maxAmount > 0 ? (amount / maxAmount) * 100 : 0;

                return (
                  <div key={year} className="flex-1 flex flex-col items-center">
                    <div className="w-full flex flex-col justify-end h-24">
                      <div
                        className="w-full bg-amber-600"
                        style={{ height: `${height}%` }}
                        title={`FY${year}: ${count} earmarks - ${formatMoney(amount)}`}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">FY{year}</p>
                    <p className="text-xs text-gray-600">{formatMoney(amount)}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Campaign Committees */}
      {committees.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4">Campaign Committees</h2>
          <div className="border border-gray-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-900">
                <tr>
                  <th className="text-left p-3 font-medium text-gray-400">Committee</th>
                  <th className="text-left p-3 font-medium text-gray-400">Type</th>
                  <th className="text-left p-3 font-medium text-gray-400">Relationship</th>
                  <th className="text-right p-3 font-medium text-gray-400">Total Raised</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {committees.map((c) => (
                  <tr key={c.cmte_id} className="hover:bg-gray-900/50">
                    <td className="p-3">
                      <Link
                        href={`/pac/${c.cmte_id}`}
                        className="font-medium text-white hover:text-green-400"
                      >
                        {c.name || c.cmte_id}
                      </Link>
                      <span className="ml-2 text-xs text-gray-600">{c.cmte_id}</span>
                    </td>
                    <td className="p-3 text-gray-400 text-xs">
                      {c.committee_type || '-'}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        c.designation === 'P'
                          ? 'bg-green-900/40 text-green-400 border border-green-800'
                          : 'bg-gray-800 text-gray-400 border border-gray-700'
                      }`}>
                        {c.designation_label}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono text-green-500">
                      {formatMoney(c.total_received)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Earmarks Section */}
      {earmarkStats.totalEarmarks > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4">
            Earmarks {earmarkStats.fiscalYears.length > 0 && (
              <span className="text-gray-500 font-normal text-sm ml-2">
                FY{earmarkStats.fiscalYears[0]}{earmarkStats.fiscalYears.length > 1 ? `-${earmarkStats.fiscalYears[earmarkStats.fiscalYears.length - 1]}` : ''}
              </span>
            )}
          </h2>

          {/* Earmark Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="border border-gray-800 p-4">
              <p className="text-gray-500 text-sm mb-1">Total Earmarked</p>
              <p className="text-green-500 font-mono text-xl font-bold">
                {formatMoney(earmarkStats.totalAmount)}
              </p>
            </div>
            <div className="border border-gray-800 p-4">
              <p className="text-gray-500 text-sm mb-1"># Earmarks</p>
              <p className="text-white font-mono text-xl font-bold">
                {earmarkStats.totalEarmarks}
              </p>
            </div>
            <div className="border border-gray-800 p-4">
              <p className="text-gray-500 text-sm mb-1">Recipients</p>
              <p className="text-white font-mono text-xl font-bold">
                {earmarkStats.uniqueRecipients}
              </p>
            </div>
            <div className="border border-gray-800 p-4">
              <p className="text-gray-500 text-sm mb-1">Top Industry</p>
              <p className="text-white font-mono text-lg font-bold truncate">
                {earmarkStats.topIndustry || '-'}
              </p>
            </div>
          </div>

          {/* Industry Breakdown */}
          {earmarkStats.byIndustry.length > 0 && (
            <div className="mb-6">
              <p className="text-gray-500 text-sm mb-2">By Industry</p>
              <div className="flex flex-wrap gap-2">
                {earmarkStats.byIndustry.slice(0, 8).map((ind) => (
                  <span
                    key={ind.industry}
                    className="px-3 py-1 rounded text-sm bg-gray-800 text-gray-300 border border-gray-700"
                  >
                    {ind.industry} <span className="text-green-500">{formatMoney(ind.amount)}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Earmark Recipients Table */}
          <div className="border border-gray-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-900">
                <tr>
                  <th className="text-left p-3 font-medium text-gray-400">Recipient</th>
                  <th className="text-right p-3 font-medium text-gray-400">Amount</th>
                  <th className="text-left p-3 font-medium text-gray-400">Industry</th>
                  <th className="text-center p-3 font-medium text-gray-400">FY</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {earmarks.slice(0, 15).map((e) => (
                  <tr key={e.id} className="hover:bg-gray-900/50">
                    <td className="p-3">
                      {e.organization_id ? (
                        <Link
                          href={`/organizations/${e.organization_id}`}
                          className="font-medium text-white hover:text-green-400"
                        >
                          {e.recipient_name}
                        </Link>
                      ) : (
                        <span className="font-medium text-white">{e.recipient_name}</span>
                      )}
                      {e.recipient_city && e.recipient_state && (
                        <p className="text-xs text-gray-600 mt-0.5">
                          {e.recipient_city}, {e.recipient_state}
                        </p>
                      )}
                    </td>
                    <td className="p-3 text-right font-mono text-green-500">
                      {formatMoney(e.amount_requested)}
                    </td>
                    <td className="p-3 text-gray-400 text-xs">
                      {e.industry || '-'}
                    </td>
                    <td className="p-3 text-center text-gray-500">
                      {e.fiscal_year}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {earmarks.length > 15 && (
            <p className="text-gray-500 text-sm mt-2">
              Showing top 15 of {earmarkStats.totalEarmarks} earmarks
            </p>
          )}
        </div>
      )}

      {/* Voting Record Section */}
      {voteStats.totalVotes > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4">Voting Record</h2>

          {/* Vote Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="border border-gray-800 p-4">
              <p className="text-gray-500 text-sm mb-1">Total Votes</p>
              <p className="text-white font-mono text-xl font-bold">
                {voteStats.totalVotes.toLocaleString()}
              </p>
            </div>
            <div className="border border-gray-800 p-4">
              <p className="text-gray-500 text-sm mb-1">Yea Rate</p>
              <p className="text-green-500 font-mono text-xl font-bold">
                {voteStats.yeaPercent}%
              </p>
            </div>
            <div className="border border-gray-800 p-4">
              <p className="text-gray-500 text-sm mb-1">Yea / Nay</p>
              <p className="font-mono text-lg">
                <span className="text-green-500">{voteStats.yeaCount.toLocaleString()}</span>
                <span className="text-gray-600"> / </span>
                <span className="text-red-500">{voteStats.nayCount.toLocaleString()}</span>
              </p>
            </div>
            <div className="border border-gray-800 p-4">
              <p className="text-gray-500 text-sm mb-1">Present / Not Voting</p>
              <p className="text-gray-400 font-mono text-lg">
                {voteStats.presentCount} / {voteStats.notVotingCount}
              </p>
            </div>
          </div>

          {/* Recent Votes Table */}
          <div className="border border-gray-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-900">
                <tr>
                  <th className="text-left p-3 font-medium text-gray-400">Bill / Vote Question</th>
                  <th className="text-center p-3 font-medium text-gray-400">Vote</th>
                  <th className="text-center p-3 font-medium text-gray-400">Result</th>
                  <th className="text-center p-3 font-medium text-gray-400">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {votes.slice(0, 20).map((v) => (
                  <tr key={v.id} className="hover:bg-gray-900/50">
                    <td className="p-3">
                      <span className="font-medium text-white">
                        {v.billTitle || v.voteQuestion || v.voteDescription || 'Vote'}
                      </span>
                      {v.billType && v.billNumber && (
                        <span className="ml-2 text-xs text-gray-500">
                          {v.billType.toUpperCase()} {v.billNumber}
                        </span>
                      )}
                      {v.chamber && (
                        <span className="ml-2 text-xs text-gray-600">
                          ({v.chamber})
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        v.vote === 'Yea' || v.vote === 'Yes' || v.vote === 'Aye'
                          ? 'bg-green-900/40 text-green-400 border border-green-800'
                          : v.vote === 'Nay' || v.vote === 'No'
                          ? 'bg-red-900/40 text-red-400 border border-red-800'
                          : 'bg-gray-800 text-gray-400 border border-gray-700'
                      }`}>
                        {v.vote}
                      </span>
                    </td>
                    <td className="p-3 text-center text-xs text-gray-500">
                      {v.voteResult || '-'}
                    </td>
                    <td className="p-3 text-center text-gray-500 text-xs">
                      {formatDate(v.voteDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {votes.length > 20 && (
            <p className="text-gray-500 text-sm mt-2">
              Showing 20 most recent of {voteStats.totalVotes.toLocaleString()} votes
            </p>
          )}
        </div>
      )}

      {/* Top Contributors table */}
      {contributions.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4">Top Contributors</h2>
          <div className="border border-gray-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-900">
                <tr>
                  <th className="text-left p-3 font-medium text-gray-400">Contributor</th>
                  <th className="text-left p-3 font-medium text-gray-400">Employer / Occupation</th>
                  <th className="text-right p-3 font-medium text-gray-400">Amount</th>
                  <th className="text-center p-3 font-medium text-gray-400">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {contributions.slice(0, 20).map((c) => (
                  <tr key={c.id} className="hover:bg-gray-900/50">
                    <td className="p-3">
                      <span className="font-medium text-white">
                        {c.name || 'Unknown'}
                      </span>
                      {c.city && c.state && (
                        <p className="text-xs text-gray-600 mt-0.5">
                          {c.city}, {c.state}
                        </p>
                      )}
                    </td>
                    <td className="p-3 text-gray-400">
                      {c.occupation || c.employer ? (
                        <>
                          {c.occupation && <span>{c.occupation}</span>}
                          {c.occupation && c.employer && <span className="text-gray-600"> @ </span>}
                          {c.employer && <span>{c.employer}</span>}
                        </>
                      ) : (
                        <span className="text-gray-600">-</span>
                      )}
                    </td>
                    <td className="p-3 text-right font-mono text-green-500">
                      {formatMoney(c.transaction_amt)}
                    </td>
                    <td className="p-3 text-center text-gray-500">
                      {formatDate(c.transaction_dt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {contributions.length > 20 && (
            <p className="text-gray-500 text-sm mt-2">
              Showing top 20 of {contributionCount.toLocaleString()} contributions
            </p>
          )}
        </div>
      )}

      {/* News coverage section */}
      {newsArticles.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4">News Coverage</h2>
          <div className="space-y-3">
            {newsArticles.map((article) => (
              <div key={article.id} className="border border-gray-800 p-4 hover:border-gray-700">
                {article.url ? (
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-white hover:text-green-400"
                  >
                    {article.title}
                  </a>
                ) : (
                  <span className="font-medium text-white">{article.title}</span>
                )}
                <div className="flex gap-4 mt-2 text-sm text-gray-500">
                  {article.source && <span>{article.source}</span>}
                  {article.published_at && <span>{formatDate(article.published_at)}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state for news */}
      {newsArticles.length === 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4">News Coverage</h2>
          <div className="border border-gray-800 p-8 text-center">
            <p className="text-gray-500">No news articles found for this politician.</p>
          </div>
        </div>
      )}

      {/* 7.12: External links */}
      <div className="mb-8">
        <h2 className="text-lg font-bold mb-4">External Links</h2>
        <div className="border border-gray-800 p-4 space-y-3">
          {politician.fec_candidate_id && (
            <a
              href={`https://www.fec.gov/data/candidate/${politician.fec_candidate_id}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-400 hover:underline"
            >
              <span className="text-gray-600">FEC</span>
              Federal Election Commission Profile ↗
            </a>
          )}
          {politician.opensecrets_id && (
            <a
              href={`https://www.opensecrets.org/members-of-congress/summary?cid=${politician.opensecrets_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-400 hover:underline"
            >
              <span className="text-gray-600">OpenSecrets</span>
              Campaign Finance Summary ↗
            </a>
          )}
          {politician.bioguide_id && (
            <a
              href={`https://bioguide.congress.gov/search/bio/${politician.bioguide_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-400 hover:underline"
            >
              <span className="text-gray-600">Congress.gov</span>
              Biographical Directory ↗
            </a>
          )}
          {politician.website && (
            <a
              href={politician.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-400 hover:underline"
            >
              <span className="text-gray-600">Official</span>
              Campaign/Office Website ↗
            </a>
          )}
          {!politician.fec_candidate_id && !politician.opensecrets_id && !politician.bioguide_id && !politician.website && (
            <p className="text-gray-500">No external links available</p>
          )}
        </div>
      </div>

      {/* Data disclaimer */}
      <div className="text-sm text-gray-600 border-t border-gray-800 pt-8">
        <p>
          Contribution data sourced from FEC filings and public records.
        </p>
      </div>
    </div>
  );
}
