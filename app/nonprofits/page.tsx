'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Nonprofit {
  id: string;
  ein: string;
  ein_formatted: string;
  name: string;
  city: string;
  state: string;
  zip: string;
  subsection: string;
  subsection_desc: string;
  ruling_date: string;
  deductibility_desc: string;
  foundation_desc: string;
  status_desc: string;
  asset_amount: number;
  income_amount: number;
  revenue_amount: number;
  ntee_code: string;
  ntee_desc: string;
  organization_id: string | null;
}

interface Stats {
  total: number;
  bySubsection: { code: string; count: number; desc: string }[];
  topStates: { state: string; count: number }[];
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

const SUBSECTIONS = [
  { code: '03', desc: '501(c)(3) - Charitable' },
  { code: '04', desc: '501(c)(4) - Social Welfare' },
  { code: '05', desc: '501(c)(5) - Labor/Agricultural' },
  { code: '06', desc: '501(c)(6) - Business Leagues' },
  { code: '07', desc: '501(c)(7) - Social Clubs' },
  { code: '08', desc: '501(c)(8) - Fraternal' },
  { code: '10', desc: '501(c)(10) - Fraternal Societies' },
  { code: '13', desc: '501(c)(13) - Cemetery' },
  { code: '19', desc: '501(c)(19) - Veterans' },
];

function formatNumber(num: number): string {
  return num.toLocaleString();
}

function formatMoney(amount: number | null): string {
  if (!amount || amount === 0) return '-';
  if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(2)}B`;
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

export default function NonprofitsPage() {
  const [nonprofits, setNonprofits] = useState<Nonprofit[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
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
  const [subsection, setSubsection] = useState('');
  const [minAssets, setMinAssets] = useState('');
  const [maxAssets, setMaxAssets] = useState('');
  const [minIncome, setMinIncome] = useState('');
  const [maxIncome, setMaxIncome] = useState('');
  const [debouncedFilters, setDebouncedFilters] = useState({ minAssets: '', maxAssets: '', minIncome: '', maxIncome: '' });
  const [sortBy, setSortBy] = useState('asset_amount');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Debounce number filters
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters({ minAssets, maxAssets, minIncome, maxIncome });
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [minAssets, maxAssets, minIncome, maxIncome]);

  // Fetch stats on mount
  useEffect(() => {
    fetch('/api/nonprofits/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error('Failed to load stats:', err));
  }, []);

  // Fetch nonprofits
  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, selectedState, subsection, debouncedFilters, page, pageSize, sortBy, sortDir]);

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
      if (subsection) params.set('subsection', subsection);
      if (debouncedFilters.minAssets) params.set('minAssets', debouncedFilters.minAssets);
      if (debouncedFilters.maxAssets) params.set('maxAssets', debouncedFilters.maxAssets);
      if (debouncedFilters.minIncome) params.set('minIncome', debouncedFilters.minIncome);
      if (debouncedFilters.maxIncome) params.set('maxIncome', debouncedFilters.maxIncome);

      const res = await fetch(`/api/nonprofits?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      setNonprofits(data.nonprofits || []);
      setTotalCount(data.total || 0);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      console.error('Failed to fetch nonprofits:', err);
      setError('Failed to load nonprofit data.');
      setNonprofits([]);
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
    setSubsection('');
    setMinAssets('');
    setMaxAssets('');
    setMinIncome('');
    setMaxIncome('');
    setPage(1);
  };

  const hasFilters = searchTerm || selectedState || subsection || minAssets || maxAssets || minIncome || maxIncome;

  return (
    <div className="max-w-6xl">
      {/* Terminal-style header */}
      <div className="font-mono text-sm mb-8">
        <p className="text-gray-500">NONPROFIT_REGISTRY</p>
        <div className="mt-2 text-gray-400">
          <p><span className="text-gray-600">├─</span> total_organizations <span className="text-white ml-4">{formatNumber(stats?.total || 0)}</span></p>
          <p><span className="text-gray-600">├─</span> tax_exempt_types <span className="text-white ml-4">{stats?.bySubsection?.length || 0}</span></p>
          <p><span className="text-gray-600">├─</span> states_covered <span className="text-white ml-4">{stats?.topStates?.length || 0}+</span></p>
          <p><span className="text-gray-600">└─</span> data_source <span className="text-blue-400 ml-4">IRS Exempt Organizations BMF</span></p>
        </div>
      </div>

      {/* Search Input */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name, EIN, or city..."
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
          <label className="block text-gray-500 text-xs mb-1">Tax Code</label>
          <select
            value={subsection}
            onChange={(e) => { setSubsection(e.target.value); setPage(1); }}
            className="bg-black border border-gray-700 rounded px-3 py-2 focus:outline-none focus:border-gray-500"
          >
            <option value="">All Types</option>
            {SUBSECTIONS.map(s => (
              <option key={s.code} value={s.code}>{s.desc}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-gray-500 text-xs mb-1">Assets Min</label>
          <input
            type="number"
            placeholder="e.g. 100000"
            value={minAssets}
            onChange={(e) => { setMinAssets(e.target.value); setPage(1); }}
            className="bg-black border border-gray-700 rounded px-3 py-2 w-28 focus:outline-none focus:border-gray-500"
          />
        </div>

        <div>
          <label className="block text-gray-500 text-xs mb-1">Assets Max</label>
          <input
            type="number"
            placeholder="e.g. 1000000"
            value={maxAssets}
            onChange={(e) => { setMaxAssets(e.target.value); setPage(1); }}
            className="bg-black border border-gray-700 rounded px-3 py-2 w-28 focus:outline-none focus:border-gray-500"
          />
        </div>

        <div>
          <label className="block text-gray-500 text-xs mb-1">Income Min</label>
          <input
            type="number"
            placeholder="e.g. 50000"
            value={minIncome}
            onChange={(e) => { setMinIncome(e.target.value); setPage(1); }}
            className="bg-black border border-gray-700 rounded px-3 py-2 w-28 focus:outline-none focus:border-gray-500"
          />
        </div>

        <div>
          <label className="block text-gray-500 text-xs mb-1">Income Max</label>
          <input
            type="number"
            placeholder="e.g. 500000"
            value={maxIncome}
            onChange={(e) => { setMaxIncome(e.target.value); setPage(1); }}
            className="bg-black border border-gray-700 rounded px-3 py-2 w-28 focus:outline-none focus:border-gray-500"
          />
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
      <div className="mb-4 text-sm text-gray-500">
        {loading ? 'Loading...' : error ? '' : `Showing ${nonprofits.length.toLocaleString()} of ${totalCount.toLocaleString()} nonprofits`}
      </div>

      {/* Error State */}
      {error && (
        <div className="border border-gray-800 p-8 text-center mb-4">
          <p className="text-gray-400">{error}</p>
          <button onClick={fetchData} className="mt-4 px-4 py-2 border border-gray-700 rounded text-sm text-gray-400 hover:text-white">
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
                  <th
                    className="text-left p-3 font-medium text-gray-400 cursor-pointer hover:text-white"
                    onClick={() => toggleSort('name')}
                  >
                    Organization {sortBy === 'name' && (sortDir === 'desc' ? '↓' : '↑')}
                  </th>
                  <th className="text-left p-3 font-medium text-gray-400">Location</th>
                  <th className="text-left p-3 font-medium text-gray-400">Type</th>
                  <th
                    className="text-right p-3 font-medium text-gray-400 cursor-pointer hover:text-white"
                    onClick={() => toggleSort('asset_amount')}
                  >
                    Assets {sortBy === 'asset_amount' && (sortDir === 'desc' ? '↓' : '↑')}
                  </th>
                  <th
                    className="text-right p-3 font-medium text-gray-400 cursor-pointer hover:text-white"
                    onClick={() => toggleSort('income_amount')}
                  >
                    Income {sortBy === 'income_amount' && (sortDir === 'desc' ? '↓' : '↑')}
                  </th>
                  <th
                    className="text-left p-3 font-medium text-gray-400 cursor-pointer hover:text-white"
                    onClick={() => toggleSort('ruling_date')}
                  >
                    Since {sortBy === 'ruling_date' && (sortDir === 'desc' ? '↓' : '↑')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-gray-500">
                      Loading nonprofit data...
                    </td>
                  </tr>
                ) : nonprofits.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-gray-500">
                      No nonprofits found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  nonprofits.map((np) => (
                    <tr key={np.id} className="hover:bg-gray-900/50">
                      <td className="p-3">
                        <Link
                          href={`/nonprofits/${np.ein}`}
                          className="text-white hover:text-green-400"
                        >
                          {np.name}
                        </Link>
                        <div className="text-xs text-gray-500 mt-0.5 font-mono">
                          EIN: {np.ein_formatted}
                        </div>
                      </td>
                      <td className="p-3 text-gray-400">
                        {np.city}, {np.state}
                        {np.zip && <span className="text-gray-600 text-xs ml-1">{np.zip.slice(0, 5)}</span>}
                      </td>
                      <td className="p-3 text-gray-500 text-xs max-w-[150px]">
                        {np.subsection_desc || `501(c)(${np.subsection})`}
                      </td>
                      <td className="p-3 text-right font-mono text-green-500">
                        {formatMoney(np.asset_amount)}
                      </td>
                      <td className="p-3 text-right font-mono text-white">
                        {formatMoney(np.income_amount)}
                      </td>
                      <td className="p-3 text-gray-500 text-xs">
                        {np.ruling_date ? new Date(np.ruling_date).getFullYear() : '-'}
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

      {/* Related Links */}
      <div className="mt-8 pt-6 border-t border-gray-800">
        <p className="text-sm text-gray-500 mb-3">Related</p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/organizations"
            className="px-4 py-2 border border-gray-700 rounded text-sm text-gray-400 hover:text-white hover:border-gray-600"
          >
            Organizations Registry
          </Link>
          <Link
            href="/federal-grants"
            className="px-4 py-2 border border-gray-700 rounded text-sm text-gray-400 hover:text-white hover:border-gray-600"
          >
            Federal Grants
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
        <p>IRS Exempt Organizations Business Master File (EO BMF).</p>
        <p className="mt-1">Includes 501(c)(3) charities, 501(c)(4) social welfare orgs, veterans organizations, and other tax-exempt entities.</p>
      </div>
    </div>
  );
}
