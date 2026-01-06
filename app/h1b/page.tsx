'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface H1BEmployerStat {
  id: string;
  employer_name: string;
  employer_name_normalized: string;
  city: string | null;
  state: string | null;
  zip: string | null;
  naics_code: string | null;
  fiscal_year: number;
  initial_approvals: number;
  initial_denials: number;
  continuing_approvals: number;
  continuing_denials: number;
  total_petitions: number;
  total_approvals: number;
  total_denials: number;
  approval_rate: number;
}

interface H1BSearchResponse {
  employers: H1BEmployerStat[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  stats: {
    totalRecords: number;
    totalApprovals: number;
    totalDenials: number;
    avgApprovalRate: number;
    topStates: { state: string; count: number }[];
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

const FISCAL_YEARS = [2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010, 2009];

function formatNumber(num: number | null): string {
  if (!num) return '-';
  return num.toLocaleString();
}

export default function H1BSearchPage() {
  const [employers, setEmployers] = useState<H1BEmployerStat[]>([]);
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
  const [selectedYear, setSelectedYear] = useState('');
  const [minApprovals, setMinApprovals] = useState('');
  const [maxApprovalRate, setMaxApprovalRate] = useState('');
  const [naicsCode, setNaicsCode] = useState('');
  const [sortBy, setSortBy] = useState('total_approvals');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Stats
  const [stats, setStats] = useState({
    totalRecords: 0,
    totalApprovals: 0,
    totalDenials: 0,
    avgApprovalRate: 0,
    topStates: [] as { state: string; count: number }[],
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
  }, [debouncedSearch, selectedState, selectedYear, minApprovals, maxApprovalRate, naicsCode, page, pageSize, sortBy, sortDir]);

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
      if (selectedYear) params.set('fiscalYear', selectedYear);
      if (minApprovals) params.set('minApprovals', minApprovals);
      if (maxApprovalRate) params.set('maxApprovalRate', maxApprovalRate);
      if (naicsCode) params.set('naics', naicsCode);

      const res = await fetch(`/api/h1b?${params}`);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data: H1BSearchResponse = await res.json();

      if (!data || !data.employers) {
        throw new Error('Invalid response format');
      }

      setEmployers(data.employers);
      setTotalCount(data.total || 0);
      setTotalPages(data.totalPages || 0);
      setStats(data.stats || { totalRecords: 0, totalApprovals: 0, totalDenials: 0, avgApprovalRate: 0, topStates: [] });
    } catch (err) {
      console.error('Failed to fetch H-1B data:', err);
      setError('Failed to load H-1B employer data. Please try again.');
      setEmployers([]);
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
    setSelectedYear('');
    setMinApprovals('');
    setMaxApprovalRate('');
    setNaicsCode('');
    setPage(1);
  };

  const hasFilters = searchTerm || selectedState || selectedYear || minApprovals || maxApprovalRate || naicsCode;

  return (
    <div>
      {/* Terminal-style stats header */}
      <div className="font-mono text-sm mb-10">
        <p className="text-gray-500">H1B_EMPLOYER_DATABASE</p>
        <div className="mt-2 text-gray-400">
          <p><span className="text-gray-600">├─</span> total_records <span className="text-white ml-4">753,216</span></p>
          <p><span className="text-gray-600">├─</span> fiscal_years <span className="text-white ml-4">2009-2023</span></p>
          <p><span className="text-gray-600">├─</span> data_source <span className="text-white ml-4">USCIS Employer Data Hub</span></p>
          <p><span className="text-gray-600">├─</span> fraud_flags <span className="text-yellow-500 ml-4">1,439</span></p>
          <p><span className="text-gray-600">└─</span> ppp_crossrefs <span className="text-blue-400 ml-4">87</span></p>
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
          <label className="block text-gray-500 text-xs mb-1">Fiscal Year</label>
          <select
            value={selectedYear}
            onChange={(e) => { setSelectedYear(e.target.value); setPage(1); }}
            className="bg-black border border-gray-700 rounded px-3 py-2 focus:outline-none focus:border-gray-500"
          >
            <option value="">All Years</option>
            {FISCAL_YEARS.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-gray-500 text-xs mb-1">Min Approvals</label>
          <input
            type="number"
            placeholder="0"
            value={minApprovals}
            onChange={(e) => { setMinApprovals(e.target.value); setPage(1); }}
            className="w-24 px-3 py-2 bg-black border border-gray-700 rounded focus:outline-none focus:border-gray-500"
          />
        </div>

        <div>
          <label className="block text-gray-500 text-xs mb-1">Max Approval %</label>
          <input
            type="number"
            placeholder="100"
            value={maxApprovalRate}
            onChange={(e) => { setMaxApprovalRate(e.target.value); setPage(1); }}
            className="w-24 px-3 py-2 bg-black border border-gray-700 rounded focus:outline-none focus:border-gray-500"
          />
        </div>

        <div>
          <label className="block text-gray-500 text-xs mb-1">NAICS Code</label>
          <input
            type="text"
            placeholder="e.g. 541511"
            value={naicsCode}
            onChange={(e) => { setNaicsCode(e.target.value); setPage(1); }}
            className="w-28 px-3 py-2 bg-black border border-gray-700 rounded focus:outline-none focus:border-gray-500"
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
      <div className="mb-4 flex items-center justify-between text-sm">
        <p className="text-gray-500">
          {loading ? 'Loading...' : error ? '' : `Showing ${employers.length.toLocaleString()} of ${totalCount.toLocaleString()} results`}
        </p>
        {stats.avgApprovalRate > 0 && !loading && !error && (
          <p className="text-gray-500">
            Avg approval rate: <span className="text-green-500">{stats.avgApprovalRate}%</span>
          </p>
        )}
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
                  <th
                    className="text-left p-3 font-medium text-gray-400 cursor-pointer hover:text-white"
                    onClick={() => toggleSort('employer_name')}
                  >
                    Employer {sortBy === 'employer_name' && (sortDir === 'desc' ? '↓' : '↑')}
                  </th>
                  <th className="text-left p-3 font-medium text-gray-400">City / State</th>
                  <th
                    className="text-center p-3 font-medium text-gray-400 cursor-pointer hover:text-white"
                    onClick={() => toggleSort('fiscal_year')}
                  >
                    FY {sortBy === 'fiscal_year' && (sortDir === 'desc' ? '↓' : '↑')}
                  </th>
                  <th
                    className="text-right p-3 font-medium text-gray-400 cursor-pointer hover:text-white"
                    onClick={() => toggleSort('total_petitions')}
                  >
                    Petitions {sortBy === 'total_petitions' && (sortDir === 'desc' ? '↓' : '↑')}
                  </th>
                  <th
                    className="text-right p-3 font-medium text-gray-400 cursor-pointer hover:text-white"
                    onClick={() => toggleSort('total_approvals')}
                  >
                    Approvals {sortBy === 'total_approvals' && (sortDir === 'desc' ? '↓' : '↑')}
                  </th>
                  <th
                    className="text-right p-3 font-medium text-gray-400 cursor-pointer hover:text-white"
                    onClick={() => toggleSort('total_denials')}
                  >
                    Denials {sortBy === 'total_denials' && (sortDir === 'desc' ? '↓' : '↑')}
                  </th>
                  <th
                    className="text-right p-3 font-medium text-gray-400 cursor-pointer hover:text-white"
                    onClick={() => toggleSort('approval_rate')}
                  >
                    Rate {sortBy === 'approval_rate' && (sortDir === 'desc' ? '↓' : '↑')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-gray-500">
                      Loading H-1B employer data...
                    </td>
                  </tr>
                ) : employers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-gray-500">
                      No employers found matching your search criteria.
                    </td>
                  </tr>
                ) : (
                  employers.map((emp) => (
                    <tr key={emp.id} className="hover:bg-gray-900/50">
                      <td className="p-3">
                        <span className="text-white">{emp.employer_name}</span>
                        {emp.naics_code && (
                          <div className="text-xs text-gray-500 mt-0.5">NAICS: {emp.naics_code}</div>
                        )}
                      </td>
                      <td className="p-3 text-gray-400">
                        {emp.city && `${emp.city}, `}{emp.state || '-'}
                      </td>
                      <td className="p-3 text-center text-gray-400 font-mono">
                        {emp.fiscal_year}
                      </td>
                      <td className="p-3 text-right font-mono text-white">
                        {formatNumber(emp.total_petitions)}
                      </td>
                      <td className="p-3 text-right font-mono text-green-500">
                        {formatNumber(emp.total_approvals)}
                      </td>
                      <td className="p-3 text-right font-mono text-red-400">
                        {formatNumber(emp.total_denials)}
                      </td>
                      <td className="p-3 text-right font-mono">
                        <span className={emp.approval_rate >= 90 ? 'text-green-500' : emp.approval_rate >= 70 ? 'text-yellow-500' : 'text-red-400'}>
                          {emp.approval_rate?.toFixed(1) || '-'}%
                        </span>
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

          {stats.totalApprovals > 0 && (
            <div className="text-gray-500">
              Total approvals: <span className="text-green-500 font-mono">{formatNumber(stats.totalApprovals)}</span>
            </div>
          )}
        </div>
      )}

      {/* Quick Links */}
      <div className="mt-8 pt-6 border-t border-gray-800">
        <p className="text-sm text-gray-500 mb-3">Quick Links</p>
        <div className="flex gap-3">
          <Link
            href="/h1b/flags"
            className="px-4 py-2 border border-gray-700 rounded text-sm text-gray-400 hover:text-white hover:border-gray-600"
          >
            View Fraud Flags
          </Link>
          <Link
            href="/ppp"
            className="px-4 py-2 border border-gray-700 rounded text-sm text-gray-400 hover:text-white hover:border-gray-600"
          >
            Cross-Reference PPP
          </Link>
        </div>
      </div>

      {/* Data Notes */}
      <div className="mt-8 pt-6 border-t border-gray-800 text-xs text-gray-600">
        <p>Data source: USCIS H-1B Employer Data Hub (FY2009-2023)</p>
        <p className="mt-1">This database contains employer-level H-1B petition statistics, not individual applications.</p>
      </div>
    </div>
  );
}
