'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface Politician {
  id: string;
  person_id: string | null;
  name: string | null;
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
  fraud_connection_count: number;
  total_fraud_linked_amount: number;
}

interface PoliticiansResponse {
  data: Politician[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  stats: {
    partyBreakdown: Record<string, number>;
    officeBreakdown: Record<string, number>;
    fraudLinkedCount: number;
  };
}

interface ContributionStats {
  totalAmount: number;
  totalCount: number;
  topRecipients: { name: string; total: number }[];
}

const PARTY_COLORS: Record<string, string> = {
  R: '#EF4444', // red
  Republican: '#EF4444',
  D: '#3B82F6', // blue
  Democrat: '#3B82F6',
  Democratic: '#3B82F6',
  I: '#8B5CF6', // purple
  Independent: '#8B5CF6',
  L: '#F59E0B', // amber for Libertarian
  Libertarian: '#F59E0B',
  G: '#22C55E', // green
  Green: '#22C55E',
};

const PARTY_BG_COLORS: Record<string, string> = {
  R: 'bg-red-900/40 text-red-400 border-red-800',
  Republican: 'bg-red-900/40 text-red-400 border-red-800',
  D: 'bg-blue-900/40 text-blue-400 border-blue-800',
  Democrat: 'bg-blue-900/40 text-blue-400 border-blue-800',
  Democratic: 'bg-blue-900/40 text-blue-400 border-blue-800',
  I: 'bg-purple-900/40 text-purple-400 border-purple-800',
  Independent: 'bg-purple-900/40 text-purple-400 border-purple-800',
  L: 'bg-amber-900/40 text-amber-400 border-amber-800',
  Libertarian: 'bg-amber-900/40 text-amber-400 border-amber-800',
  G: 'bg-green-900/40 text-green-400 border-green-800',
  Green: 'bg-green-900/40 text-green-400 border-green-800',
};

const OFFICE_TYPES = [
  { value: '', label: 'All Offices' },
  { value: 'federal', label: 'Federal' },
  { value: 'senate', label: 'Senate' },
  { value: 'house', label: 'House' },
  { value: 'governor', label: 'Governor' },
  { value: 'state_legislature', label: 'State Legislature' },
  { value: 'local', label: 'Local' },
];

const PARTIES = [
  { value: '', label: 'All Parties' },
  { value: 'D', label: 'Democrat' },
  { value: 'R', label: 'Republican' },
  { value: 'I', label: 'Independent' },
];

// State codes to names mapping
const STATE_NAMES: Record<string, string> = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
  'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
  'DC': 'Washington DC', 'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii',
  'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
  'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine',
  'MD': 'Maryland', 'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota',
  'MS': 'Mississippi', 'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska',
  'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico',
  'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
  'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island',
  'SC': 'South Carolina', 'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas',
  'UT': 'Utah', 'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington',
  'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming',
  'AS': 'American Samoa', 'GU': 'Guam', 'MP': 'Northern Mariana Islands',
  'PR': 'Puerto Rico', 'VI': 'Virgin Islands',
};

function formatMoney(amount: number | null): string {
  if (!amount) return '-';
  if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(2)}B`;
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(2)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

function getPartyColor(party: string | null): string {
  if (!party) return '#6B7280';
  return PARTY_COLORS[party] || PARTY_COLORS[party.charAt(0).toUpperCase()] || '#6B7280';
}

function getPartyBgClass(party: string | null): string {
  if (!party) return 'bg-gray-800 text-gray-400 border-gray-700';
  return PARTY_BG_COLORS[party] || PARTY_BG_COLORS[party.charAt(0).toUpperCase()] || 'bg-gray-800 text-gray-400 border-gray-700';
}

function normalizePartyName(party: string): string {
  const upper = party.toUpperCase();
  if (upper === 'D' || upper.includes('DEMOCRAT')) return 'Democrat';
  if (upper === 'R' || upper.includes('REPUBLICAN')) return 'Republican';
  if (upper === 'I' || upper.includes('INDEPENDENT')) return 'Independent';
  if (upper === 'L' || upper.includes('LIBERTARIAN')) return 'Libertarian';
  if (upper === 'G' || upper.includes('GREEN')) return 'Green';
  return party;
}

export default function PoliticiansPage() {
  const [politicians, setPoliticians] = useState<Politician[]>([]);
  const [stats, setStats] = useState<PoliticiansResponse['stats'] | null>(null);
  const [contributionStats, setContributionStats] = useState<ContributionStats | null>(null);
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [party, setParty] = useState('');
  const [state, setState] = useState('');
  const [office, setOffice] = useState('');
  const [hasFraudLinks, setHasFraudLinks] = useState<string>('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    fetchPoliticians();
  }, [page, party, state, office, hasFraudLinks, search]);

  useEffect(() => {
    fetchContributionStats();
    fetchAvailableStates();
  }, []);

  const fetchAvailableStates = async () => {
    try {
      const res = await fetch('/api/politicians?statesOnly=true');
      if (res.ok) {
        const data = await res.json();
        setAvailableStates(data.states || []);
      }
    } catch (err) {
      console.error('Failed to fetch states:', err);
    }
  };

  const fetchContributionStats = async () => {
    try {
      // Fetch contribution totals from the donations RPC
      const res = await fetch('/api/contributions?stats=true');
      if (res.ok) {
        const data = await res.json();
        setContributionStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch contribution stats:', err);
    }
  };

  const fetchPoliticians = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '50',
      });
      if (party) params.set('party', party);
      if (state) params.set('state', state);
      if (office) params.set('office', office);
      if (hasFraudLinks) params.set('hasFraudLinks', hasFraudLinks);
      if (search) params.set('search', search);

      const res = await fetch(`/api/politicians?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data: PoliticiansResponse = await res.json();
      setPoliticians(data.data);
      setStats(data.stats);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error('Failed to fetch politicians:', err);
      setError('Failed to load politicians data.');
      setPoliticians([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  // Calculate fraud connection stats
  const fraudLinkedPoliticians = politicians.filter(p => p.fraud_connection_count > 0);
  const totalFraudLinkedAmount = fraudLinkedPoliticians.reduce((sum, p) => sum + p.total_fraud_linked_amount, 0);

  // Top recipients chart data
  const topRecipientsChartData = contributionStats?.topRecipients?.slice(0, 10).map(r => ({
    name: r.name.length > 20 ? r.name.substring(0, 20) + '...' : r.name,
    fullName: r.name,
    amount: r.total,
  })) || [];

  return (
    <div>
      {/* 7.1: Header with summary stats */}
      <div className="font-mono text-sm mb-10">
        <p className="text-gray-500">POLITICIANS_DATABASE</p>
        <div className="mt-2 text-gray-400">
          <p><span className="text-gray-600">├─</span> total_tracked <span className="text-white ml-4">{total.toLocaleString()}</span></p>
          <p><span className="text-gray-600">├─</span> fraud_linked <span className="text-red-500 ml-4">{stats?.fraudLinkedCount || 0}</span></p>
          <p><span className="text-gray-600">├─</span> fraud_amount <span className="text-green-500 ml-4">{formatMoney(totalFraudLinkedAmount)}</span></p>
          <p><span className="text-gray-600">└─</span> parties <span className="text-white ml-4">{Object.keys(stats?.partyBreakdown || {}).length}</span></p>
        </div>
      </div>

      {/* 7.2: Filters */}
      <div className="border border-gray-800 p-4 mb-8">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name..."
              className="bg-gray-900 border border-gray-700 px-3 py-2 text-sm focus:border-green-500 focus:outline-none w-48"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm"
            >
              Search
            </button>
          </form>

          {/* Party filter */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Party</label>
            <select
              value={party}
              onChange={(e) => { setParty(e.target.value); setPage(1); }}
              className="bg-gray-900 border border-gray-700 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
            >
              {PARTIES.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* State filter */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">State</label>
            <select
              value={state}
              onChange={(e) => { setState(e.target.value); setPage(1); }}
              className="bg-gray-900 border border-gray-700 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
            >
              <option value="">All States</option>
              {availableStates.map(s => (
                <option key={s} value={s}>{STATE_NAMES[s] || s}</option>
              ))}
            </select>
          </div>

          {/* Office filter */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Office</label>
            <select
              value={office}
              onChange={(e) => { setOffice(e.target.value); setPage(1); }}
              className="bg-gray-900 border border-gray-700 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
            >
              {OFFICE_TYPES.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Fraud connection filter */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Fraud Links</label>
            <select
              value={hasFraudLinks}
              onChange={(e) => { setHasFraudLinks(e.target.value); setPage(1); }}
              className="bg-gray-900 border border-gray-700 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
            >
              <option value="">All</option>
              <option value="true">Has fraud connections</option>
              <option value="false">No fraud connections</option>
            </select>
          </div>

          {/* Clear filters */}
          {(party || state || office || hasFraudLinks || search) && (
            <button
              onClick={() => {
                setParty('');
                setState('');
                setOffice('');
                setHasFraudLinks('');
                setSearch('');
                setSearchInput('');
                setPage(1);
              }}
              className="text-gray-400 hover:text-white text-sm py-2"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Campaign Contributions Stats + Top Recipients Chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Total Contributions Stat */}
        <div className="border border-gray-800 p-6">
          <h3 className="text-sm font-medium text-gray-400 mb-4">Campaign Contributions</h3>
          <div className="space-y-4">
            <div>
              <p className="text-green-500 font-mono text-4xl font-bold">
                {contributionStats ? formatMoney(contributionStats.totalAmount) : '-'}
              </p>
              <p className="text-gray-500 mt-1">Total contributions tracked</p>
            </div>
            <div>
              <p className="text-white font-mono text-2xl font-bold">
                {contributionStats?.totalCount?.toLocaleString() || '-'}
              </p>
              <p className="text-gray-500 mt-1">Individual donations</p>
            </div>
            <div className="pt-4 border-t border-gray-800">
              <Link href="/donations" className="text-green-500 hover:text-green-400 text-sm">
                View all donations →
              </Link>
            </div>
          </div>
        </div>

        {/* Top Recipients Bar Chart */}
        {topRecipientsChartData.length > 0 && (
          <div className="border border-gray-800 p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-4">Top Donation Recipients</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topRecipientsChartData} layout="vertical" margin={{ left: 10, right: 30 }}>
                  <XAxis
                    type="number"
                    stroke="#6B7280"
                    tickFormatter={(v) => formatMoney(v)}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#6B7280"
                    width={140}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                    labelStyle={{ color: '#9CA3AF' }}
                    formatter={(value) => [formatMoney(value as number), 'Total']}
                  />
                  <Bar dataKey="amount" fill="#22C55E" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="py-20 text-center">
          <p className="text-gray-500">Loading politicians...</p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="border border-gray-800 p-8 text-center mb-8">
          <p className="text-gray-400">{error}</p>
          <button
            onClick={fetchPoliticians}
            className="mt-4 px-4 py-2 border border-gray-700 text-sm text-gray-400 hover:text-white"
          >
            Retry
          </button>
        </div>
      )}

      {/* 7.4 & 7.5: Politicians table with ActBlue highlighting */}
      {!loading && !error && (
        <>
          <div className="border border-gray-800 overflow-hidden mb-8">
            <table className="w-full text-sm">
              <thead className="bg-gray-900">
                <tr>
                  <th className="text-left p-3 font-medium text-gray-400">Name</th>
                  <th className="text-left p-3 font-medium text-gray-400">Party</th>
                  <th className="text-left p-3 font-medium text-gray-400">Office</th>
                  <th className="text-center p-3 font-medium text-gray-400">State</th>
                  <th className="text-right p-3 font-medium text-gray-400">Fraud Links</th>
                  <th className="text-right p-3 font-medium text-gray-400">Fraud Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {politicians.map((p) => (
                  <tr
                    key={p.id}
                    className={`hover:bg-gray-900/50 ${
                      p.fraud_connection_count > 0 ? 'bg-red-950/20' : ''
                    }`}
                  >
                    <td className="p-3">
                      <Link
                        href={`/politician/${p.id}`}
                        className="font-medium text-white hover:text-green-400"
                      >
                        {p.name || 'Unknown'}
                      </Link>
                      {p.fec_candidate_id && (
                        <span className="ml-2 text-xs text-gray-600">FEC</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-xs border ${getPartyBgClass(p.party)}`}>
                        {p.party || '-'}
                      </span>
                    </td>
                    <td className="p-3 text-gray-300">
                      {p.office_title || p.office_type || '-'}
                    </td>
                    <td className="p-3 text-center text-gray-400">
                      {p.state || '-'}
                    </td>
                    <td className="p-3 text-right">
                      {p.fraud_connection_count > 0 ? (
                        <span className="text-red-400 font-mono">{p.fraud_connection_count}</span>
                      ) : (
                        <span className="text-gray-600">0</span>
                      )}
                    </td>
                    <td className="p-3 text-right font-mono">
                      {p.total_fraud_linked_amount > 0 ? (
                        <span className="text-red-400">{formatMoney(p.total_fraud_linked_amount)}</span>
                      ) : (
                        <span className="text-gray-600">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty state */}
          {politicians.length === 0 && (
            <div className="border border-gray-800 p-12 text-center mb-8">
              <p className="text-gray-400 mb-2">No politicians found</p>
              <p className="text-gray-600 text-sm">
                Politicians data is populated from FEC filings and Congress.gov records.
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {((page - 1) * 50) + 1} - {Math.min(page * 50, total)} of {total.toLocaleString()}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 border border-gray-700 text-sm text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm text-gray-400">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 border border-gray-700 text-sm text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* 7.5: ActBlue section - highlighting for ActBlue contributions */}
      {fraudLinkedPoliticians.length > 0 && (
        <div className="mt-12 border-t border-gray-800 pt-8">
          <h2 className="text-lg font-bold mb-4">Fraud-Connected Politicians</h2>
          <p className="text-gray-500 text-sm mb-6">
            Politicians with connections to fraud cases through campaign contributions or political committees.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {fraudLinkedPoliticians.slice(0, 6).map((p) => (
              <div
                key={p.id}
                className="border border-red-900/50 bg-red-950/20 p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded text-xs border ${getPartyBgClass(p.party)}`}>
                    {p.party || '-'}
                  </span>
                  <span className="text-gray-500 text-xs">{p.state}</span>
                </div>
                <Link
                  href={`/politician/${p.id}`}
                  className="font-medium text-white hover:text-green-400 block mb-1"
                >
                  {p.name || 'Unknown'}
                </Link>
                <p className="text-gray-500 text-xs mb-3">{p.office_title || p.office_type || '-'}</p>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">{p.fraud_connection_count} connection{p.fraud_connection_count !== 1 ? 's' : ''}</span>
                  <span className="text-red-400 font-mono">{formatMoney(p.total_fraud_linked_amount)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-8 pt-8 border-t border-gray-800">
        <h3 className="text-sm font-medium text-gray-400 mb-3">Party Colors</h3>
        <div className="flex flex-wrap gap-2">
          {PARTIES.filter(p => p.value).map((p) => (
            <span key={p.value} className={`px-2 py-0.5 rounded text-xs border ${getPartyBgClass(p.value)}`}>
              {p.label}
            </span>
          ))}
        </div>
      </div>

      {/* Data sources */}
      <div className="mt-8 pt-8 border-t border-gray-800 text-sm text-gray-500">
        <p className="font-medium text-gray-400 mb-2">Data Sources</p>
        <ul className="space-y-1">
          <li>
            <span className="text-white">FEC</span>
            <span className="text-gray-600"> - <a href="https://fec.gov" className="underline hover:text-gray-400" target="_blank" rel="noopener">Federal Election Commission</a></span>
          </li>
          <li>
            <span className="text-white">Congress.gov</span>
            <span className="text-gray-600"> - <a href="https://congress.gov" className="underline hover:text-gray-400" target="_blank" rel="noopener">Official Congressional Records</a></span>
          </li>
          <li>
            <span className="text-white">OpenSecrets</span>
            <span className="text-gray-600"> - <a href="https://opensecrets.org" className="underline hover:text-gray-400" target="_blank" rel="noopener">Campaign Finance Data</a></span>
          </li>
        </ul>
      </div>
    </div>
  );
}
