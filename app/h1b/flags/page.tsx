'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface H1BFraudFlag {
  id: string;
  employer_name: string;
  employer_name_normalized: string;
  state: string | null;
  flag_type: string;
  flag_reason: string;
  severity: string;
  evidence: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface FlagsResponse {
  flags: H1BFraudFlag[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  stats: {
    totalFlags: number;
    byFlagType: { type: string; count: number }[];
    bySeverity: { severity: string; count: number }[];
  };
}

const US_STATES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
  MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
  OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  DC: 'District of Columbia', PR: 'Puerto Rico',
};

const FLAG_TYPES: Record<string, string> = {
  high_volume_sponsor: 'High Volume Sponsor',
  high_denial_rate: 'High Denial Rate',
  body_shop: 'Body Shop Pattern',
  ppp_h1b_mismatch: 'PPP/H-1B Mismatch',
  rapid_growth: 'Rapid Growth',
  low_wage: 'Low Wage',
};

const SEVERITY_COLORS: Record<string, string> = {
  high: 'text-red-500',
  medium: 'text-yellow-500',
  low: 'text-blue-400',
};

export default function H1BFlagsPage() {
  const [flags, setFlags] = useState<H1BFraudFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedFlagType, setSelectedFlagType] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Stats
  const [stats, setStats] = useState({
    totalFlags: 0,
    byFlagType: [] as { type: string; count: number }[],
    bySeverity: [] as { severity: string; count: number }[],
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch data
  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, selectedState, selectedFlagType, selectedSeverity, page, pageSize, sortBy, sortDir]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        sortBy,
        sortDir,
      });

      if (debouncedSearch) params.set('search', debouncedSearch);
      if (selectedState) params.set('state', selectedState);
      if (selectedFlagType) params.set('flagType', selectedFlagType);
      if (selectedSeverity) params.set('severity', selectedSeverity);

      const res = await fetch(`/api/h1b/flags?${params}`);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data: FlagsResponse = await res.json();

      if (!data || !data.flags) {
        throw new Error('Invalid response format');
      }

      setFlags(data.flags);
      setTotalCount(data.total || 0);
      setTotalPages(data.totalPages || 0);
      setStats(data.stats || { totalFlags: 0, byFlagType: [], bySeverity: [] });
    } catch (err) {
      console.error('Failed to fetch H-1B flags:', err);
      setError('Failed to load H-1B fraud flags. Please try again.');
      setFlags([]);
      setTotalCount(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
    setPage(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setSelectedState('');
    setSelectedFlagType('');
    setSelectedSeverity('');
    setPage(1);
  };

  const hasFilters = searchTerm || selectedState || selectedFlagType || selectedSeverity;

  return (
    <div>
      {/* Terminal-style header */}
      <div className="font-mono text-sm mb-10">
        <p className="text-gray-500">H1B_FRAUD_FLAGS</p>
        <div className="mt-2 text-gray-400">
          <p><span className="text-gray-600">├─</span> total_flags <span className="text-yellow-500 ml-4">{stats.totalFlags.toLocaleString()}</span></p>
          {stats.byFlagType.map((f, i) => (
            <p key={f.type}>
              <span className="text-gray-600">{i === stats.byFlagType.length - 1 ? '└─' : '├─'}</span> {FLAG_TYPES[f.type] || f.type} <span className="text-white ml-4">{f.count.toLocaleString()}</span>
            </p>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by employer name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 bg-black border border-gray-700 rounded text-sm focus:outline-none focus:border-gray-500"
        />
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap gap-4 mb-6 text-sm">
        <div>
          <label className="block text-gray-500 text-xs mb-1">State</label>
          <select
            value={selectedState}
            onChange={(e) => { setSelectedState(e.target.value); setPage(1); }}
            className="bg-black border border-gray-700 rounded px-3 py-2 focus:outline-none focus:border-gray-500"
          >
            <option value="">All States</option>
            {Object.entries(US_STATES).sort((a, b) => a[1].localeCompare(b[1])).map(([code, name]) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-gray-500 text-xs mb-1">Flag Type</label>
          <select
            value={selectedFlagType}
            onChange={(e) => { setSelectedFlagType(e.target.value); setPage(1); }}
            className="bg-black border border-gray-700 rounded px-3 py-2 focus:outline-none focus:border-gray-500"
          >
            <option value="">All Types</option>
            {Object.entries(FLAG_TYPES).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-gray-500 text-xs mb-1">Severity</label>
          <select
            value={selectedSeverity}
            onChange={(e) => { setSelectedSeverity(e.target.value); setPage(1); }}
            className="bg-black border border-gray-700 rounded px-3 py-2 focus:outline-none focus:border-gray-500"
          >
            <option value="">All Severities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div>
          <label className="block text-gray-500 text-xs mb-1">Per Page</label>
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
            className="bg-black border border-gray-700 rounded px-3 py-2 focus:outline-none focus:border-gray-500"
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        {hasFilters && (
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="px-4 py-2 border border-gray-700 rounded text-gray-400 hover:text-white hover:border-gray-600"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="mb-4 flex items-center justify-between text-sm">
        <p className="text-gray-500">
          {loading ? 'Loading...' : error ? '' : `Showing ${flags.length.toLocaleString()} of ${totalCount.toLocaleString()} flags`}
        </p>
      </div>

      {/* Error State */}
      {error && (
        <div className="border border-gray-800 p-8 text-center mb-4">
          <p className="text-gray-400">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 border border-gray-700 rounded text-sm text-gray-400 hover:text-white"
          >
            Retry
          </button>
        </div>
      )}

      {/* Results Table */}
      {!error && (
        <div className="border border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-900">
                <tr>
                  <th className="text-left p-3 font-medium text-gray-400">Severity</th>
                  <th
                    className="text-left p-3 font-medium text-gray-400 cursor-pointer hover:text-white"
                    onClick={() => toggleSort('employer_name')}
                  >
                    Employer {sortBy === 'employer_name' && (sortDir === 'desc' ? '↓' : '↑')}
                  </th>
                  <th className="text-left p-3 font-medium text-gray-400">State</th>
                  <th
                    className="text-left p-3 font-medium text-gray-400 cursor-pointer hover:text-white"
                    onClick={() => toggleSort('flag_type')}
                  >
                    Flag Type {sortBy === 'flag_type' && (sortDir === 'desc' ? '↓' : '↑')}
                  </th>
                  <th className="text-left p-3 font-medium text-gray-400">Reason</th>
                  <th
                    className="text-left p-3 font-medium text-gray-400 cursor-pointer hover:text-white"
                    onClick={() => toggleSort('created_at')}
                  >
                    Flagged {sortBy === 'created_at' && (sortDir === 'desc' ? '↓' : '↑')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-gray-500">
                      Loading fraud flags...
                    </td>
                  </tr>
                ) : flags.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-gray-500">
                      No flags found matching your search criteria.
                    </td>
                  </tr>
                ) : (
                  flags.map((flag) => (
                    <tr key={flag.id} className="hover:bg-gray-900/50">
                      <td className="p-3">
                        <span className={`uppercase text-xs font-medium ${SEVERITY_COLORS[flag.severity] || 'text-gray-400'}`}>
                          {flag.severity}
                        </span>
                      </td>
                      <td className="p-3 text-white">
                        {flag.employer_name}
                      </td>
                      <td className="p-3 text-gray-400">
                        {flag.state || '-'}
                      </td>
                      <td className="p-3 text-gray-400">
                        {FLAG_TYPES[flag.flag_type] || flag.flag_type}
                      </td>
                      <td className="p-3 text-gray-500 text-xs max-w-xs truncate" title={flag.flag_reason}>
                        {flag.flag_reason}
                      </td>
                      <td className="p-3 text-gray-500 text-xs">
                        {new Date(flag.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!error && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="px-4 py-2 border border-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:border-gray-600 text-gray-400 hover:text-white"
            >
              Previous
            </button>
            <span className="text-gray-500">
              Page {page.toLocaleString()} of {totalPages.toLocaleString() || 1}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || totalPages === 0 || loading}
              className="px-4 py-2 border border-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:border-gray-600 text-gray-400 hover:text-white"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="mt-8 pt-6 border-t border-gray-800">
        <p className="text-sm text-gray-500 mb-3">Quick Links</p>
        <div className="flex gap-3">
          <Link
            href="/h1b"
            className="px-4 py-2 border border-gray-700 rounded text-sm text-gray-400 hover:text-white hover:border-gray-600"
          >
            H-1B Employers
          </Link>
          <Link
            href="/ppp"
            className="px-4 py-2 border border-gray-700 rounded text-sm text-gray-400 hover:text-white hover:border-gray-600"
          >
            PPP Loans
          </Link>
        </div>
      </div>

      {/* Data Notes */}
      <div className="mt-8 pt-6 border-t border-gray-800 text-xs text-gray-600">
        <p>Fraud flags are generated automatically based on analysis of H-1B petition patterns.</p>
        <p className="mt-1">Flag types: High volume sponsors, high denial rates, body shop patterns, PPP/H-1B mismatches.</p>
      </div>
    </div>
  );
}
