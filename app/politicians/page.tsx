'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ToshiAdBanner from '../components/ToshiAdBanner';

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
  contribution_count: number;
  total_contributions: number;
  earmark_count: number;
  earmark_total: number;
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
    totalContributions: number;
    totalContributionAmount: number;
  };
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
  const [hasEarmarks, setHasEarmarks] = useState(false);

  useEffect(() => {
    fetchPoliticians();
  }, [page, party, state, office, hasEarmarks]);

  useEffect(() => {
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
      if (hasEarmarks) params.set('hasEarmarks', 'true');

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

  // Calculate contribution stats for current page
  const pageContributionCount = politicians.reduce((sum, p) => sum + p.contribution_count, 0);
  const pageContributionAmount = politicians.reduce((sum, p) => sum + p.total_contributions, 0);


  return (
    <div>
      {/* 7.1: Header with summary stats */}
      <div className="font-mono text-sm mb-6">
        <p className="text-gray-500">POLITICIANS_DATABASE</p>
        <div className="mt-2 text-gray-400">
          <p><span className="text-gray-600">├─</span> total_tracked <span className="text-white ml-4">{total.toLocaleString()}</span></p>
          <p><span className="text-gray-600">├─</span> contributions <span className="text-green-500 ml-4">{(stats?.totalContributions || 0).toLocaleString()}</span></p>
          <p><span className="text-gray-600">├─</span> total_raised <span className="text-green-500 ml-4">{formatMoney(stats?.totalContributionAmount || 0)}</span></p>
          <p><span className="text-gray-600">└─</span> parties <span className="text-white ml-4">{Object.keys(stats?.partyBreakdown || {}).length}</span></p>
        </div>
      </div>

      {/* Toshi Sponsor Banner */}
      <ToshiAdBanner className="mb-8" />

      {/* 7.2: Filters */}
      <div className="border border-gray-800 p-4 mb-8">
        <div className="flex flex-wrap gap-4 items-end">
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

          {/* Jurisdiction filter */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Jurisdiction</label>
            <select
              value={state}
              onChange={(e) => { setState(e.target.value); setPage(1); }}
              className="bg-gray-900 border border-gray-700 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
            >
              <option value="">All Jurisdictions</option>
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

          {/* Has Earmarks filter */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="hasEarmarks"
              checked={hasEarmarks}
              onChange={(e) => { setHasEarmarks(e.target.checked); setPage(1); }}
              className="w-4 h-4 rounded border-gray-700 bg-gray-900 text-green-500 focus:ring-green-500"
            />
            <label htmlFor="hasEarmarks" className="text-sm text-gray-400 cursor-pointer">
              Has Earmarks
            </label>
          </div>

          {/* Clear filters */}
          {(party || state || office || hasEarmarks) && (
            <button
              onClick={() => {
                setParty('');
                setState('');
                setOffice('');
                setHasEarmarks(false);
                setPage(1);
              }}
              className="text-gray-400 hover:text-white text-sm py-2"
            >
              Clear all
            </button>
          )}
        </div>
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
                  <th className="text-center p-3 font-medium text-gray-400">Jurisdiction</th>
                  <th className="text-right p-3 font-medium text-gray-400">Contributions</th>
                  <th className="text-right p-3 font-medium text-gray-400">Total Raised</th>
                  <th className="text-right p-3 font-medium text-gray-400">Earmarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {politicians.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-gray-900/50"
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
                      {p.contribution_count > 0 ? (
                        <span className="text-green-400 font-mono">{p.contribution_count.toLocaleString()}</span>
                      ) : (
                        <span className="text-gray-600">0</span>
                      )}
                    </td>
                    <td className="p-3 text-right font-mono">
                      {p.total_contributions > 0 ? (
                        <span className="text-green-400">{formatMoney(p.total_contributions)}</span>
                      ) : (
                        <span className="text-gray-600">-</span>
                      )}
                    </td>
                    <td className="p-3 text-right font-mono">
                      {p.earmark_total > 0 ? (
                        <span className="text-amber-400">{formatMoney(p.earmark_total)}</span>
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
