import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface Politician {
  id: string;
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

interface PoliticalConnection {
  id: string;
  case_id: string | null;
  total_amount: number | null;
  connection_type: string | null;
  cases: {
    id: string;
    case_name: string;
    fraud_type: string | null;
    total_fraud_amount: number | null;
    status: string;
  } | null;
}

interface Contribution {
  id: string;
  contributor_name: string | null;
  amount: number;
  receipt_date: string | null;
  recipient_name: string | null;
  is_fraud_linked: boolean | null;
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

const STATUS_COLORS: Record<string, string> = {
  investigating: 'bg-gray-700 text-gray-300',
  charged: 'bg-yellow-900/50 text-yellow-400',
  indicted: 'bg-orange-900/50 text-orange-400',
  convicted: 'bg-red-900/50 text-red-400',
  sentenced: 'bg-green-900/50 text-green-400',
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

async function getPoliticalConnections(politicianId: string): Promise<PoliticalConnection[]> {
  const { data, error } = await supabase
    .from('political_connections')
    .select(`
      id,
      case_id,
      total_amount,
      connection_type,
      cases (
        id,
        case_name,
        fraud_type,
        total_fraud_amount,
        status
      )
    `)
    .eq('politician_id', politicianId)
    .not('case_id', 'is', null);

  if (error) return [];
  // Supabase returns joined data that needs to be mapped
  return (data || []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    case_id: row.case_id as string | null,
    total_amount: row.total_amount as number | null,
    connection_type: row.connection_type as string | null,
    cases: Array.isArray(row.cases) ? row.cases[0] || null : row.cases || null,
  })) as PoliticalConnection[];
}

async function getContributions(politicianName: string): Promise<Contribution[]> {
  // Get contributions where this politician is the recipient
  const { data, error } = await supabase
    .from('political_donations')
    .select('id, contributor_name, amount, receipt_date, recipient_name, is_fraud_linked')
    .ilike('recipient_name', `%${politicianName}%`)
    .order('amount', { ascending: false })
    .limit(50);

  if (error) return [];
  return data || [];
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

export const revalidate = 60;

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

  // Fetch person and connections first
  const [person, connections] = await Promise.all([
    politician.person_id ? getPerson(politician.person_id) : null,
    getPoliticalConnections(id),
  ]);

  const name = person?.full_name || 'Unknown Politician';

  // Then fetch contributions and news (which need the name)
  const [contributions, newsArticles] = await Promise.all([
    name !== 'Unknown Politician' ? getContributions(name) : Promise.resolve([]),
    name !== 'Unknown Politician' ? getNewsArticles(name) : Promise.resolve([]),
  ]);
  const photoUrl = politician.photo_url || person?.photo_url;

  // Calculate fraud stats
  const fraudLinkedContributions = contributions.filter(c => c.is_fraud_linked);
  const totalContributions = contributions.reduce((sum, c) => sum + (c.amount || 0), 0);
  const fraudLinkedAmount = fraudLinkedContributions.reduce((sum, c) => sum + (c.amount || 0), 0);
  const connectedCasesAmount = connections.reduce((sum, c) => sum + (c.total_amount || 0), 0);

  // Group contributions by year for timeline
  const contributionsByYear: Record<string, { count: number; amount: number; fraudLinked: number }> = {};
  contributions.forEach(c => {
    const year = c.receipt_date ? new Date(c.receipt_date).getFullYear().toString() : 'Unknown';
    if (!contributionsByYear[year]) {
      contributionsByYear[year] = { count: 0, amount: 0, fraudLinked: 0 };
    }
    contributionsByYear[year].count++;
    contributionsByYear[year].amount += c.amount || 0;
    if (c.is_fraud_linked) contributionsByYear[year].fraudLinked++;
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

      {/* 7.7: Fraud-linked contributions summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="border border-gray-800 p-4">
          <p className="text-gray-500 text-sm mb-1">Total Contributions</p>
          <p className="text-green-500 font-mono text-xl font-bold">
            {formatMoney(totalContributions)}
          </p>
          <p className="text-gray-600 text-xs">{contributions.length} contributions</p>
        </div>
        <div className="border border-gray-800 p-4">
          <p className="text-gray-500 text-sm mb-1">Fraud-Linked</p>
          <p className="text-red-500 font-mono text-xl font-bold">
            {formatMoney(fraudLinkedAmount)}
          </p>
          <p className="text-gray-600 text-xs">{fraudLinkedContributions.length} flagged</p>
        </div>
        <div className="border border-gray-800 p-4">
          <p className="text-gray-500 text-sm mb-1">Connected Cases</p>
          <p className="text-white font-mono text-xl font-bold">
            {connections.length}
          </p>
          <p className="text-gray-600 text-xs">{formatMoney(connectedCasesAmount)} linked</p>
        </div>
        <div className="border border-gray-800 p-4">
          <p className="text-gray-500 text-sm mb-1">News Mentions</p>
          <p className="text-white font-mono text-xl font-bold">
            {newsArticles.length}
          </p>
          <p className="text-gray-600 text-xs">articles found</p>
        </div>
      </div>

      {/* 7.8: Contribution timeline */}
      {timelineData.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4">Contribution Timeline</h2>
          <div className="border border-gray-800 p-4">
            <div className="flex items-end gap-2 h-32">
              {timelineData.map(([year, data]) => {
                const maxAmount = Math.max(...timelineData.map(([, d]) => d.amount));
                const height = maxAmount > 0 ? (data.amount / maxAmount) * 100 : 0;
                const fraudPercent = data.count > 0 ? (data.fraudLinked / data.count) * 100 : 0;

                return (
                  <div key={year} className="flex-1 flex flex-col items-center">
                    <div className="w-full flex flex-col justify-end h-24">
                      {data.fraudLinked > 0 && (
                        <div
                          className="w-full bg-red-600"
                          style={{ height: `${(fraudPercent / 100) * height}%` }}
                          title={`${data.fraudLinked} fraud-linked`}
                        />
                      )}
                      <div
                        className="w-full bg-green-600"
                        style={{ height: `${((100 - fraudPercent) / 100) * height}%` }}
                        title={`${data.count - data.fraudLinked} clean`}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{year}</p>
                    <p className="text-xs text-gray-600">{formatMoney(data.amount)}</p>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-4 mt-4 text-xs">
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-600" /> Clean
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-600" /> Fraud-linked
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 7.9: Contributors table */}
      {contributions.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4">Top Contributors</h2>
          <div className="border border-gray-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-900">
                <tr>
                  <th className="text-left p-3 font-medium text-gray-400">Contributor</th>
                  <th className="text-right p-3 font-medium text-gray-400">Amount</th>
                  <th className="text-center p-3 font-medium text-gray-400">Date</th>
                  <th className="text-center p-3 font-medium text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {contributions.slice(0, 20).map((c) => (
                  <tr
                    key={c.id}
                    className={`hover:bg-gray-900/50 ${c.is_fraud_linked ? 'bg-red-950/20' : ''}`}
                  >
                    <td className="p-3">
                      <span className="font-medium text-white">
                        {c.contributor_name || 'Unknown'}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono text-green-500">
                      {formatMoney(c.amount)}
                    </td>
                    <td className="p-3 text-center text-gray-500">
                      {formatDate(c.receipt_date)}
                    </td>
                    <td className="p-3 text-center">
                      {c.is_fraud_linked ? (
                        <span className="px-2 py-0.5 rounded text-xs bg-red-900/50 text-red-400">
                          Fraud-linked
                        </span>
                      ) : (
                        <span className="text-gray-600">-</span>
                      )}
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

      {/* 7.10: Connected cases section */}
      {connections.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4">Connected Fraud Cases</h2>
          <div className="border border-gray-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-900">
                <tr>
                  <th className="text-left p-3 font-medium text-gray-400">Case</th>
                  <th className="text-left p-3 font-medium text-gray-400">Type</th>
                  <th className="text-right p-3 font-medium text-gray-400">Fraud Amount</th>
                  <th className="text-right p-3 font-medium text-gray-400">Connection</th>
                  <th className="text-center p-3 font-medium text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {connections.map((conn) => (
                  <tr key={conn.id} className="hover:bg-gray-900/50">
                    <td className="p-3">
                      {conn.cases ? (
                        <Link
                          href={`/case/${conn.cases.id}`}
                          className="font-medium text-white hover:text-green-400"
                        >
                          {conn.cases.case_name.length > 40
                            ? conn.cases.case_name.substring(0, 40) + '...'
                            : conn.cases.case_name}
                        </Link>
                      ) : (
                        <span className="text-gray-500">Unknown Case</span>
                      )}
                    </td>
                    <td className="p-3 text-gray-400">
                      {conn.cases?.fraud_type || '-'}
                    </td>
                    <td className="p-3 text-right font-mono text-red-400">
                      {formatMoney(conn.cases?.total_fraud_amount || null)}
                    </td>
                    <td className="p-3 text-right font-mono text-green-500">
                      {formatMoney(conn.total_amount)}
                    </td>
                    <td className="p-3 text-center">
                      {conn.cases?.status && (
                        <span className={`px-2 py-0.5 rounded text-xs ${STATUS_COLORS[conn.cases.status] || 'bg-gray-800 text-gray-400'}`}>
                          {conn.cases.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7.11: News coverage section */}
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
          Data sourced from FEC filings, state campaign finance boards, and public records.
          Fraud connections are based on campaign contributions from individuals later convicted of fraud.
        </p>
      </div>
    </div>
  );
}
