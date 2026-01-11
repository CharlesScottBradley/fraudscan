'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ToshiAdBanner from '../components/ToshiAdBanner';

interface SnapRetailer {
  id: string;
  store_name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  county: string;
  store_type: string;
  authorization_date: string;
  end_date: string | null;
  is_currently_authorized: boolean;
  latitude: number | null;
  longitude: number | null;
}

interface SnapStats {
  totalRetailers: number;
  activeRetailers: number;
  inactiveRetailers: number;
  topStates: { state: string; count: number }[];
  storeTypes: { type: string; count: number }[];
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
  DC: 'District of Columbia', PR: 'Puerto Rico', VI: 'Virgin Islands', GU: 'Guam',
};

function formatNumber(num: number): string {
  return num.toLocaleString();
}

export default function SnapRetailersPage() {
  const [retailers, setRetailers] = useState<SnapRetailer[]>([]);
  const [stats, setStats] = useState<SnapStats | null>(null);
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
  const [storeType, setStoreType] = useState('');
  const [activeOnly, setActiveOnly] = useState(true);
  const [sortBy, setSortBy] = useState('store_name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch stats on mount
  useEffect(() => {
    fetch('/api/snap-retailers/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error('Failed to load stats:', err));
  }, []);

  // Fetch retailers
  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, selectedState, storeType, activeOnly, page, pageSize, sortBy, sortDir]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        sortBy,
        sortDir,
        activeOnly: activeOnly.toString(),
      });

      if (debouncedSearch) params.set('search', debouncedSearch);
      if (selectedState) params.set('state', selectedState);
      if (storeType) params.set('storeType', storeType);

      const res = await fetch(`/api/snap-retailers?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      setRetailers(data.retailers || []);
      setTotalCount(data.total || 0);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      console.error('Failed to fetch retailers:', err);
      setError('Failed to load SNAP retailer data.');
      setRetailers([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
    setPage(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setSelectedState('');
    setStoreType('');
    setActiveOnly(true);
    setPage(1);
  };

  const hasFilters = searchTerm || selectedState || storeType || !activeOnly;

  return (
    <div>
      {/* Terminal-style header */}
      <div className="font-mono text-sm mb-6">
        <p className="text-gray-500">SNAP_EBT_RETAILERS</p>
        <div className="mt-2 text-gray-400">
          <p><span className="text-gray-600">├─</span> total_retailers <span className="text-white ml-4">{formatNumber(stats?.totalRetailers || 0)}</span></p>
          <p><span className="text-gray-600">├─</span> currently_authorized <span className="text-green-400 ml-4">{formatNumber(stats?.activeRetailers || 0)}</span></p>
          <p><span className="text-gray-600">├─</span> inactive <span className="text-gray-500 ml-4">{formatNumber(stats?.inactiveRetailers || 0)}</span></p>
          <p><span className="text-gray-600">└─</span> data_source <span className="text-blue-400 ml-4">USDA FNS</span></p>
        </div>
      </div>

      {/* Toshi Sponsor Banner */}
      <ToshiAdBanner className="mb-8" />

      {/* Search Input */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by store name, address, or city..."
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
          <label className="block text-gray-500 text-xs mb-1">Store Type</label>
          <select
            value={storeType}
            onChange={(e) => { setStoreType(e.target.value); setPage(1); }}
            className="bg-black border border-gray-700 rounded px-3 py-2 focus:outline-none focus:border-gray-500"
          >
            <option value="">All Types</option>
            {stats?.storeTypes.map(t => (
              <option key={t.type} value={t.type}>{t.type}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-gray-500 text-xs mb-1">Status</label>
          <select
            value={activeOnly ? 'active' : 'all'}
            onChange={(e) => { setActiveOnly(e.target.value === 'active'); setPage(1); }}
            className="bg-black border border-gray-700 rounded px-3 py-2 focus:outline-none focus:border-gray-500"
          >
            <option value="active">Active Only</option>
            <option value="all">All (incl. Inactive)</option>
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
      <div className="mb-4 text-sm text-gray-500">
        {loading ? 'Loading...' : error ? '' : `Showing ${retailers.length.toLocaleString()} of ${totalCount.toLocaleString()} retailers`}
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
                  <th className="text-left p-3 font-medium text-gray-400">#</th>
                  <th
                    className="text-left p-3 font-medium text-gray-400 cursor-pointer hover:text-white"
                    onClick={() => toggleSort('store_name')}
                  >
                    Store Name {sortBy === 'store_name' && (sortDir === 'desc' ? '↓' : '↑')}
                  </th>
                  <th className="text-left p-3 font-medium text-gray-400">Type</th>
                  <th
                    className="text-left p-3 font-medium text-gray-400 cursor-pointer hover:text-white"
                    onClick={() => toggleSort('city')}
                  >
                    Location {sortBy === 'city' && (sortDir === 'desc' ? '↓' : '↑')}
                  </th>
                  <th className="text-left p-3 font-medium text-gray-400">Status</th>
                  <th
                    className="text-left p-3 font-medium text-gray-400 cursor-pointer hover:text-white"
                    onClick={() => toggleSort('authorization_date')}
                  >
                    Auth Date {sortBy === 'authorization_date' && (sortDir === 'desc' ? '↓' : '↑')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-gray-500">
                      Loading retailer data...
                    </td>
                  </tr>
                ) : retailers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-gray-500">
                      No retailers found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  retailers.map((retailer, idx) => (
                    <tr key={retailer.id} className="hover:bg-gray-900/50">
                      <td className="p-3 text-gray-600 font-mono">
                        {((page - 1) * pageSize) + idx + 1}
                      </td>
                      <td className="p-3">
                        <span className="text-white">{retailer.store_name}</span>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {retailer.address}
                        </div>
                      </td>
                      <td className="p-3 text-gray-400 text-xs">
                        {retailer.store_type || '-'}
                      </td>
                      <td className="p-3 text-gray-400">
                        {retailer.city}, {retailer.state} {retailer.zip_code}
                        {retailer.county && (
                          <div className="text-xs text-gray-600">{retailer.county} County</div>
                        )}
                      </td>
                      <td className="p-3">
                        {retailer.is_currently_authorized ? (
                          <span className="px-2 py-0.5 text-xs bg-green-900/50 text-green-400 rounded">Active</span>
                        ) : (
                          <span className="px-2 py-0.5 text-xs bg-gray-800 text-gray-500 rounded">Inactive</span>
                        )}
                      </td>
                      <td className="p-3 text-gray-400 font-mono text-xs">
                        {retailer.authorization_date || '-'}
                        {retailer.end_date && (
                          <div className="text-gray-600">End: {retailer.end_date}</div>
                        )}
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
        <p className="text-sm text-gray-500 mb-3">Related</p>
        <div className="flex gap-3">
          <Link
            href="/ppp"
            className="px-4 py-2 border border-gray-700 rounded text-sm text-gray-400 hover:text-white hover:border-gray-600"
          >
            PPP Loans
          </Link>
          <Link
            href="/sba"
            className="px-4 py-2 border border-gray-700 rounded text-sm text-gray-400 hover:text-white hover:border-gray-600"
          >
            SBA Loans
          </Link>
        </div>
      </div>

      {/* Data Notes */}
      <div className="mt-8 pt-6 border-t border-gray-800 text-xs text-gray-600">
        <p>SNAP (Supplemental Nutrition Assistance Program) authorized retailers from USDA FNS.</p>
        <p className="mt-1">Historical data 2004-2024. Includes stores, farmers markets, and other food retailers.</p>
      </div>
    </div>
  );
}
