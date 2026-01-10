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

async function getContributions(politicianId: string): Promise<Contribution[]> {
  // Use internal API route for reliable data fetching in server components
  const url = `https://www.somaliscan.com/api/politicians/${politicianId}/contributions`;

  try {
    const response = await fetch(url, { cache: 'no-store' });

    if (!response.ok) {
      console.error('[getContributions] API error:', response.status);
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('[getContributions] Error:', error);
    return [];
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

  // Fetch contributions by politician ID and news by name
  const [contributions, newsArticles] = await Promise.all([
    getContributions(id),
    name !== 'Unknown Politician' ? getNewsArticles(name) : Promise.resolve([]),
  ]);
  const photoUrl = politician.photo_url || person?.photo_url;

  // Calculate contribution stats
  const totalRaised = contributions.reduce((sum, c) => sum + (c.transaction_amt || 0), 0);
  const contributionCount = contributions.length;
  const avgContribution = contributionCount > 0 ? totalRaised / contributionCount : 0;

  // Group contributions by year for timeline
  const contributionsByYear: Record<string, { count: number; amount: number }> = {};
  contributions.forEach(c => {
    const year = c.transaction_dt ? new Date(c.transaction_dt).getFullYear().toString() : 'Unknown';
    if (!contributionsByYear[year]) {
      contributionsByYear[year] = { count: 0, amount: 0 };
    }
    contributionsByYear[year].count++;
    contributionsByYear[year].amount += c.transaction_amt || 0;
  });

  const timelineData = Object.entries(contributionsByYear)
    .filter(([year]) => year !== 'Unknown')
    .sort(([a], [b]) => parseInt(a) - parseInt(b));

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

      {/* Contribution summary stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
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
      </div>

      {/* Contribution timeline */}
      {timelineData.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4">Contribution Timeline</h2>
          <div className="border border-gray-800 p-4">
            <div className="flex items-end gap-2 h-32">
              {timelineData.map(([year, data]) => {
                const maxAmount = Math.max(...timelineData.map(([, d]) => d.amount));
                const height = maxAmount > 0 ? (data.amount / maxAmount) * 100 : 0;

                return (
                  <div key={year} className="flex-1 flex flex-col items-center">
                    <div className="w-full flex flex-col justify-end h-24">
                      <div
                        className="w-full bg-green-600"
                        style={{ height: `${height}%` }}
                        title={`${data.count} contributions - ${formatMoney(data.amount)}`}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{year}</p>
                    <p className="text-xs text-gray-600">{formatMoney(data.amount)}</p>
                  </div>
                );
              })}
            </div>
          </div>
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
              Showing top 20 of {contributions.length} contributions
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
