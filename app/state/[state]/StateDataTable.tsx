'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

type DataType = 'all' | 'providers' | 'ppp_loans';

interface DataItem {
  id: string;
  type: 'provider' | 'ppp_loan';
  name: string;
  city: string | null;
  category: string | null;
  amount: number;
  license_number?: string;
  jobs_reported?: number | null;
}

interface Props {
  stateCode: string;
  stateName: string;
  initialProviderCount: number;
  initialPPPCount: number;
}

function formatMoney(amount: number | null): string {
  if (!amount) return '-';
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(2)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return `$${amount.toLocaleString()}`;
}

export default function StateDataTable({ stateCode, stateName, initialProviderCount, initialPPPCount }: Props) {
  const [dataType, setDataType] = useState<DataType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [sortBy, setSortBy] = useState<'amount' | 'name'>('amount');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [data, setData] = useState<DataItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [providerCount, setProviderCount] = useState(initialProviderCount);
  const [pppCount, setPPPCount] = useState(initialPPPCount);
  const [loading, setLoading] = useState(true);

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        type: dataType,
        search: debouncedSearch,
        sortBy,
        sortDir,
      });

      if (minAmount) params.set('minAmount', minAmount);
      if (maxAmount) params.set('maxAmount', maxAmount);

      const res = await fetch(`/api/state/${stateCode}/data?${params}`);
      const result = await res.json();

      setData(result.data);
      setTotalCount(result.totalCount);
      setProviderCount(result.providerCount);
      setPPPCount(result.pppCount);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }, [stateCode, page, pageSize, dataType, debouncedSearch, minAmount, maxAmount, sortBy, sortDir]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const toggleSort = (field: 'amount' | 'name') => {
    if (sortBy === field) {
      setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
    setPage(1);
  };

  const handleTypeChange = (type: DataType) => {
    setDataType(type);
    setPage(1);
  };

  const handleAmountChange = (field: 'min' | 'max', value: string) => {
    if (field === 'min') {
      setMinAmount(value);
    } else {
      setMaxAmount(value);
    }
    setPage(1);
  };

  return (
    <div>
      <h2 className="text-lg font-bold mb-4">Organizations & Loans in {stateName}</h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4">
        {/* Data type filter */}
        <div className="flex gap-2">
          <button
            onClick={() => handleTypeChange('all')}
            className={`px-3 py-1.5 text-sm rounded ${
              dataType === 'all'
                ? 'bg-green-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            All ({(providerCount + pppCount).toLocaleString()})
          </button>
          <button
            onClick={() => handleTypeChange('providers')}
            className={`px-3 py-1.5 text-sm rounded ${
              dataType === 'providers'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Providers ({providerCount.toLocaleString()})
          </button>
          <button
            onClick={() => handleTypeChange('ppp_loans')}
            className={`px-3 py-1.5 text-sm rounded ${
              dataType === 'ppp_loans'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            PPP Loans ({pppCount.toLocaleString()})
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search by name or city..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-3 py-1.5 bg-gray-900 border border-gray-700 rounded text-sm w-64 focus:outline-none focus:border-gray-500"
        />

        {/* Amount filters */}
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min $"
            value={minAmount}
            onChange={(e) => handleAmountChange('min', e.target.value)}
            className="px-3 py-1.5 bg-gray-900 border border-gray-700 rounded text-sm w-24 focus:outline-none focus:border-gray-500"
          />
          <span className="text-gray-500">-</span>
          <input
            type="number"
            placeholder="Max $"
            value={maxAmount}
            onChange={(e) => handleAmountChange('max', e.target.value)}
            className="px-3 py-1.5 bg-gray-900 border border-gray-700 rounded text-sm w-24 focus:outline-none focus:border-gray-500"
          />
        </div>
      </div>

      {/* Results count */}
      <p className="text-gray-500 text-sm mb-3">
        {loading ? 'Loading...' : `Showing ${data.length} of ${totalCount.toLocaleString()} results`}
      </p>

      {/* Table */}
      <div className="border border-gray-800 overflow-hidden rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-900">
            <tr>
              <th className="text-left p-3 font-medium text-gray-400">Type</th>
              <th
                className="text-left p-3 font-medium text-gray-400 cursor-pointer hover:text-white"
                onClick={() => toggleSort('name')}
              >
                Name {sortBy === 'name' && (sortDir === 'desc' ? '↓' : '↑')}
              </th>
              <th className="text-left p-3 font-medium text-gray-400">City</th>
              <th className="text-left p-3 font-medium text-gray-400">Category</th>
              <th
                className="text-right p-3 font-medium text-gray-400 cursor-pointer hover:text-white"
                onClick={() => toggleSort('amount')}
              >
                Amount {sortBy === 'amount' && (sortDir === 'desc' ? '↓' : '↑')}
              </th>
              <th className="text-right p-3 font-medium text-gray-400">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  No data found matching your filters.
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={`${item.type}-${item.id}`} className="hover:bg-gray-900/50">
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      item.type === 'provider'
                        ? 'bg-blue-900/40 text-blue-400'
                        : 'bg-purple-900/40 text-purple-400'
                    }`}>
                      {item.type === 'provider' ? 'Provider' : 'PPP'}
                    </span>
                  </td>
                  <td className="p-3 font-medium">{item.name}</td>
                  <td className="p-3 text-gray-400">{item.city || '-'}</td>
                  <td className="p-3 text-gray-400 text-xs">{item.category || '-'}</td>
                  <td className="p-3 text-right font-mono text-green-500">
                    {formatMoney(item.amount)}
                  </td>
                  <td className="p-3 text-right">
                    {item.type === 'provider' && item.license_number ? (
                      <Link
                        href={`/provider/${item.license_number}`}
                        className="text-gray-400 hover:text-white text-xs"
                      >
                        View →
                      </Link>
                    ) : item.type === 'ppp_loan' ? (
                      <span className="text-gray-500 text-xs">
                        {item.jobs_reported ? `${item.jobs_reported} jobs` : '-'}
                      </span>
                    ) : (
                      <span className="text-gray-500 text-xs">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            className="px-4 py-2 bg-gray-800 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
          >
            Previous
          </button>
          <span className="text-gray-500 text-sm">
            Page {page} of {totalPages || 1}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || totalPages === 0 || loading}
            className="px-4 py-2 bg-gray-800 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
          >
            Next
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-sm">Show:</span>
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-gray-500"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="text-gray-500 text-sm">per page</span>
        </div>
      </div>
    </div>
  );
}
