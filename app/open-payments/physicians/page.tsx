'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ToshiAdBanner from '../../components/ToshiAdBanner';

interface Physician {
  npi: string;
  firstName: string;
  lastName: string;
  city: string;
  state: string;
  specialty: string;
  totalReceived: number;
  paymentCount: number;
}

interface PhysiciansResponse {
  physicians: Physician[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
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

function formatCurrency(amount: number | null): string {
  if (!amount) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatNumber(num: number | null): string {
  if (!num) return '-';
  return num.toLocaleString();
}

export default function PhysiciansPage() {
  const [physicians, setPhysicians] = useState<Physician[]>([]);
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
  const [minTotal, setMinTotal] = useState('');
  const [sortBy, setSortBy] = useState('total_received');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

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
  }, [debouncedSearch, selectedState, minTotal, page, pageSize, sortBy, sortDir]);

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
      if (minTotal) params.set('minTotal', minTotal);

      const res = await fetch(`/api/open-payments/physicians?${params}`);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data: PhysiciansResponse = await res.json();

      if (!data || !data.physicians) {
        throw new Error('Invalid response format');
      }

      setPhysicians(data.physicians);
      setTotalCount(data.total || 0);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      console.error('Failed to fetch physicians:', err);
      setError('Failed to load physician data. Please try again.');
      setPhysicians([]);
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
    setMinTotal('');
    setPage(1);
  };

  const hasFilters = searchTerm || selectedState || minTotal;

  return (
    <div>
      {/* Terminal-style header */}
      <div className="font-mono text-sm mb-10">
        <p className="text-gray-500">TOP_PAYMENT_RECIPIENTS</p>
        <div className="mt-2 text-gray-400">
          <p><span className="text-gray-600">├─</span> unique_recipients <span className="text-white ml-4">{formatNumber(totalCount)}</span></p>
          <p><span className="text-gray-600">├─</span> data_source <span className="text-white ml-4">CMS Open Payments</span></p>
          <p><span className="text-gray-600">└─</span> aggregated_by <span className="text-blue-400 ml-4">NPI</span></p>
        </div>
      </div>

      {/* Toshi Sponsor Banner */}
      <ToshiAdBanner className="mb-8" />

      {/* Search Input */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by physician name..."
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
          <label className="block text-gray-500 text-xs mb-1">Min Total Received</label>
          <input
            type="number"
            placeholder="$0"
            value={minTotal}
            onChange={(e) => { setMinTotal(e.target.value); setPage(1); }}
            className="w-32 px-3 py-2 bg-black border border-gray-700 rounded focus:outline-none focus:border-gray-500"
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
          {loading ? 'Loading...' : error ? '' : `Showing ${physicians.length.toLocaleString()} of ${totalCount.toLocaleString()} recipients`}
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
                  <th className="text-left p-3 font-medium text-gray-400">#</th>
                  <th
                    className="text-left p-3 font-medium text-gray-400 cursor-pointer hover:text-white"
                    onClick={() => toggleSort('name')}
                  >
                    Physician {sortBy === 'name' && (sortDir === 'desc' ? '↓' : '↑')}
                  </th>
                  <th className="text-left p-3 font-medium text-gray-400">Specialty</th>
                  <th className="text-left p-3 font-medium text-gray-400">Location</th>
                  <th
                    className="text-right p-3 font-medium text-gray-400 cursor-pointer hover:text-white"
                    onClick={() => toggleSort('payment_count')}
                  >
                    Payments {sortBy === 'payment_count' && (sortDir === 'desc' ? '↓' : '↑')}
                  </th>
                  <th
                    className="text-right p-3 font-medium text-gray-400 cursor-pointer hover:text-white"
                    onClick={() => toggleSort('total_received')}
                  >
                    Total Received {sortBy === 'total_received' && (sortDir === 'desc' ? '↓' : '↑')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-gray-500">
                      Loading physician data...
                    </td>
                  </tr>
                ) : physicians.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-gray-500">
                      No physicians found matching your search criteria.
                    </td>
                  </tr>
                ) : (
                  physicians.map((physician, idx) => (
                    <tr key={physician.npi} className="hover:bg-gray-900/50">
                      <td className="p-3 text-gray-600 font-mono">
                        {((page - 1) * pageSize) + idx + 1}
                      </td>
                      <td className="p-3">
                        <span className="text-white">
                          {physician.firstName} {physician.lastName}
                        </span>
                        <div className="text-xs text-gray-500 mt-0.5">
                          NPI: {physician.npi}
                        </div>
                      </td>
                      <td className="p-3 text-gray-400 text-xs max-w-xs">
                        {physician.specialty?.split('|')[0] || '-'}
                      </td>
                      <td className="p-3 text-gray-400">
                        {physician.city && `${physician.city}, `}{physician.state || '-'}
                      </td>
                      <td className="p-3 text-right font-mono text-gray-400">
                        {formatNumber(physician.paymentCount)}
                      </td>
                      <td className="p-3 text-right font-mono">
                        <span className={physician.totalReceived >= 100000 ? 'text-green-400' : physician.totalReceived >= 10000 ? 'text-yellow-400' : 'text-white'}>
                          {formatCurrency(physician.totalReceived)}
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
        </div>
      )}

      {/* Quick Links */}
      <div className="mt-8 pt-6 border-t border-gray-800">
        <p className="text-sm text-gray-500 mb-3">Quick Links</p>
        <div className="flex gap-3">
          <Link
            href="/open-payments"
            className="px-4 py-2 border border-gray-700 rounded text-sm text-gray-400 hover:text-white hover:border-gray-600"
          >
            All Payments
          </Link>
          <Link
            href="/open-payments/manufacturers"
            className="px-4 py-2 border border-gray-700 rounded text-sm text-gray-400 hover:text-white hover:border-gray-600"
          >
            Top Manufacturers
          </Link>
        </div>
      </div>

      {/* Data Notes */}
      <div className="mt-8 pt-6 border-t border-gray-800 text-xs text-gray-600">
        <p>Aggregated by National Provider Identifier (NPI) across all available years.</p>
        <p className="mt-1">Amounts shown are totals from general payments only (excludes research).</p>
      </div>
    </div>
  );
}
