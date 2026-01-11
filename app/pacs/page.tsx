'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ToshiAdBanner from '../components/ToshiAdBanner';

interface PAC {
  cmte_id: string;
  name: string | null;
  committee_type: string | null;
  party: string | null;
  total_received: number;
  donation_count: number;
  avg_donation: number;
  donor_states_count: number;
}

interface PACsResponse {
  data: PAC[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  stats: {
    totalAmount: number;
    totalDonations: number;
    partyBreakdown: Record<string, number>;
    typeBreakdown: Record<string, number>;
  };
}

const PARTY_COLORS: Record<string, string> = {
  Democratic: 'bg-blue-900/40 text-blue-400 border-blue-800',
  Republican: 'bg-red-900/40 text-red-400 border-red-800',
};

const TYPE_FILTERS = [
  { value: '', label: 'All Types' },
  { value: 'PAC', label: 'PAC' },
  { value: 'Super PAC', label: 'Super PAC' },
  { value: 'Party', label: 'Party Committee' },
  { value: 'Principal Campaign', label: 'Campaign Committee' },
  { value: 'Joint', label: 'Joint Fundraiser' },
];

const PARTY_FILTERS = [
  { value: '', label: 'All Parties' },
  { value: 'Democratic', label: 'Democratic' },
  { value: 'Republican', label: 'Republican' },
];

function formatMoney(amount: number): string {
  if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(2)}B`;
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(2)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

function getPartyClass(party: string | null): string {
  if (!party) return 'bg-gray-800 text-gray-400 border-gray-700';
  return PARTY_COLORS[party] || 'bg-gray-800 text-gray-400 border-gray-700';
}

export default function PACsPage() {
  const [pacs, setPacs] = useState<PAC[]>([]);
  const [stats, setStats] = useState<PACsResponse['stats'] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [party, setParty] = useState('');
  const [type, setType] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    fetchPACs();
  }, [page, party, type, search]);

  const fetchPACs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '50',
      });
      if (party) params.set('party', party);
      if (type) params.set('type', type);
      if (search) params.set('search', search);

      const res = await fetch(`/api/pacs?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data: PACsResponse = await res.json();
      setPacs(data.data);
      setStats(data.stats);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error('Failed to fetch PACs:', err);
      setError('Failed to load PAC data.');
      setPacs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Political Action Committees</h1>
        <p className="text-gray-500">
          Browse PACs, Super PACs, and political committees by total contributions received
        </p>
      </div>

      {/* Toshi Sponsor Banner */}
      <ToshiAdBanner className="mb-8" />

      {/* Hero stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div>
          <p className="text-green-500 font-mono text-4xl font-bold">
            {stats ? formatMoney(stats.totalAmount) : '-'}
          </p>
          <p className="text-gray-500 mt-1">Total tracked</p>
        </div>
        <div>
          <p className="text-white font-mono text-4xl font-bold">
            {stats?.totalDonations?.toLocaleString() || '-'}
          </p>
          <p className="text-gray-500 mt-1">Individual donations</p>
        </div>
        <div>
          <p className="text-white font-mono text-4xl font-bold">
            {total.toLocaleString()}
          </p>
          <p className="text-gray-500 mt-1">Committees with donations</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end mb-8">
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
            {PARTY_FILTERS.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        {/* Type filter */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">Type</label>
          <select
            value={type}
            onChange={(e) => { setType(e.target.value); setPage(1); }}
            className="bg-gray-900 border border-gray-700 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
          >
            {TYPE_FILTERS.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* Clear filters */}
        {(party || type || search) && (
          <button
            onClick={() => {
              setParty('');
              setType('');
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

      {/* Loading state */}
      {loading && (
        <div className="py-20 text-center">
          <p className="text-gray-500">Loading PACs...</p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="border border-gray-800 p-8 text-center mb-8">
          <p className="text-gray-400">{error}</p>
          <button
            onClick={fetchPACs}
            className="mt-4 px-4 py-2 border border-gray-700 text-sm text-gray-400 hover:text-white"
          >
            Retry
          </button>
        </div>
      )}

      {/* PACs table */}
      {!loading && !error && (
        <>
          <div className="border border-gray-800 overflow-hidden mb-8">
            <table className="w-full text-sm">
              <thead className="bg-gray-900">
                <tr>
                  <th className="text-left p-3 font-medium text-gray-400 w-12">#</th>
                  <th className="text-left p-3 font-medium text-gray-400">Committee</th>
                  <th className="text-left p-3 font-medium text-gray-400">Type</th>
                  <th className="text-left p-3 font-medium text-gray-400">Party</th>
                  <th className="text-right p-3 font-medium text-gray-400">Donations</th>
                  <th className="text-right p-3 font-medium text-gray-400">Avg</th>
                  <th className="text-right p-3 font-medium text-gray-400">Total Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {pacs.map((pac, index) => (
                  <tr key={pac.cmte_id} className="hover:bg-gray-900/50">
                    <td className="p-3 text-gray-500">
                      {((page - 1) * 50) + index + 1}
                    </td>
                    <td className="p-3">
                      <Link
                        href={`/pac/${pac.cmte_id}`}
                        className="font-medium text-white hover:text-green-400"
                      >
                        {pac.name || pac.cmte_id}
                      </Link>
                      <span className="ml-2 text-xs text-gray-600">{pac.cmte_id}</span>
                    </td>
                    <td className="p-3 text-gray-400 text-xs">
                      {pac.committee_type || '-'}
                    </td>
                    <td className="p-3">
                      {pac.party ? (
                        <span className={`px-2 py-0.5 rounded text-xs border ${getPartyClass(pac.party)}`}>
                          {pac.party}
                        </span>
                      ) : (
                        <span className="text-gray-600">-</span>
                      )}
                    </td>
                    <td className="p-3 text-right font-mono text-gray-400">
                      {pac.donation_count.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-mono text-gray-400">
                      {formatMoney(pac.avg_donation)}
                    </td>
                    <td className="p-3 text-right font-mono">
                      <span className="text-green-400 font-bold">
                        {formatMoney(pac.total_received)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty state */}
          {pacs.length === 0 && (
            <div className="border border-gray-800 p-12 text-center mb-8">
              <p className="text-gray-400 mb-2">No PACs found</p>
              <p className="text-gray-600 text-sm">
                Try adjusting your filters or search term.
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

      {/* Data sources */}
      <div className="mt-8 pt-8 border-t border-gray-800 text-sm text-gray-500">
        <p className="font-medium text-gray-400 mb-2">Data Source</p>
        <p>
          <span className="text-white">FEC</span>
          <span className="text-gray-600"> - </span>
          <a
            href="https://www.fec.gov/data/browse-data/?tab=bulk-data"
            className="underline hover:text-gray-400"
            target="_blank"
            rel="noopener"
          >
            Federal Election Commission Bulk Data
          </a>
        </p>
      </div>
    </div>
  );
}
