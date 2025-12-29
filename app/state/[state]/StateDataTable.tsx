'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

type DataType = 'all' | 'providers' | 'ppp_loans';

interface Provider {
  id: string;
  name: string;
  city: string | null;
  license_type: string | null;
  total_funding: number;
  type: 'provider';
}

interface PPPLoan {
  id: string;
  loan_number: string;
  borrower_name: string;
  borrower_city: string | null;
  business_type: string | null;
  current_approval_amount: number | null;
  forgiveness_amount: number | null;
  jobs_reported: number | null;
  loan_status: string | null;
  type: 'ppp_loan';
}

type DataItem = Provider | PPPLoan;

interface Props {
  providers: Provider[];
  pppLoans: PPPLoan[];
  stateName: string;
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

export default function StateDataTable({ providers, pppLoans, stateName }: Props) {
  const [dataType, setDataType] = useState<DataType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [sortBy, setSortBy] = useState<'amount' | 'name'>('amount');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const filteredData = useMemo(() => {
    let data: DataItem[] = [];

    if (dataType === 'all' || dataType === 'providers') {
      data = [...data, ...providers];
    }
    if (dataType === 'all' || dataType === 'ppp_loans') {
      data = [...data, ...pppLoans];
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      data = data.filter(item => {
        if (item.type === 'provider') {
          return item.name.toLowerCase().includes(term) ||
                 item.city?.toLowerCase().includes(term);
        } else {
          return item.borrower_name.toLowerCase().includes(term) ||
                 item.borrower_city?.toLowerCase().includes(term);
        }
      });
    }

    // Amount filter
    const minAmt = parseFloat(minAmount) || 0;
    const maxAmt = parseFloat(maxAmount) || Infinity;
    data = data.filter(item => {
      const amount = item.type === 'provider'
        ? item.total_funding
        : (item.current_approval_amount || 0);
      return amount >= minAmt && amount <= maxAmt;
    });

    // Sort
    data.sort((a, b) => {
      if (sortBy === 'amount') {
        const amtA = a.type === 'provider' ? a.total_funding : (a.current_approval_amount || 0);
        const amtB = b.type === 'provider' ? b.total_funding : (b.current_approval_amount || 0);
        return sortDir === 'desc' ? amtB - amtA : amtA - amtB;
      } else {
        const nameA = a.type === 'provider' ? a.name : a.borrower_name;
        const nameB = b.type === 'provider' ? b.name : b.borrower_name;
        return sortDir === 'desc'
          ? nameB.localeCompare(nameA)
          : nameA.localeCompare(nameB);
      }
    });

    return data;
  }, [providers, pppLoans, dataType, searchTerm, minAmount, maxAmount, sortBy, sortDir]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page]);

  const totalPages = Math.ceil(filteredData.length / pageSize);

  const toggleSort = (field: 'amount' | 'name') => {
    if (sortBy === field) {
      setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
  };

  return (
    <div>
      <h2 className="text-lg font-bold mb-4">Organizations & Loans in {stateName}</h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4">
        {/* Data type filter */}
        <div className="flex gap-2">
          <button
            onClick={() => { setDataType('all'); setPage(1); }}
            className={`px-3 py-1.5 text-sm rounded ${
              dataType === 'all'
                ? 'bg-green-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            All ({providers.length + pppLoans.length})
          </button>
          <button
            onClick={() => { setDataType('providers'); setPage(1); }}
            className={`px-3 py-1.5 text-sm rounded ${
              dataType === 'providers'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Providers ({providers.length})
          </button>
          <button
            onClick={() => { setDataType('ppp_loans'); setPage(1); }}
            className={`px-3 py-1.5 text-sm rounded ${
              dataType === 'ppp_loans'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            PPP Loans ({pppLoans.length})
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search by name or city..."
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
          className="px-3 py-1.5 bg-gray-900 border border-gray-700 rounded text-sm w-64 focus:outline-none focus:border-gray-500"
        />

        {/* Amount filters */}
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min $"
            value={minAmount}
            onChange={(e) => { setMinAmount(e.target.value); setPage(1); }}
            className="px-3 py-1.5 bg-gray-900 border border-gray-700 rounded text-sm w-24 focus:outline-none focus:border-gray-500"
          />
          <span className="text-gray-500">-</span>
          <input
            type="number"
            placeholder="Max $"
            value={maxAmount}
            onChange={(e) => { setMaxAmount(e.target.value); setPage(1); }}
            className="px-3 py-1.5 bg-gray-900 border border-gray-700 rounded text-sm w-24 focus:outline-none focus:border-gray-500"
          />
        </div>
      </div>

      {/* Results count */}
      <p className="text-gray-500 text-sm mb-3">
        Showing {paginatedData.length} of {filteredData.length.toLocaleString()} results
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
            {paginatedData.map((item) => (
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
                <td className="p-3 font-medium">
                  {item.type === 'provider' ? item.name : item.borrower_name}
                </td>
                <td className="p-3 text-gray-400">
                  {item.type === 'provider' ? item.city : item.borrower_city}
                </td>
                <td className="p-3 text-gray-400 text-xs">
                  {item.type === 'provider'
                    ? item.license_type
                    : item.business_type}
                </td>
                <td className="p-3 text-right font-mono text-green-500">
                  {item.type === 'provider'
                    ? formatMoney(item.total_funding)
                    : formatMoney(item.current_approval_amount)}
                </td>
                <td className="p-3 text-right">
                  {item.type === 'provider' ? (
                    <Link
                      href={`/provider/${item.id}`}
                      className="text-gray-400 hover:text-white text-xs"
                    >
                      View →
                    </Link>
                  ) : (
                    <span className="text-gray-500 text-xs">
                      {item.jobs_reported ? `${item.jobs_reported} jobs` : '-'}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-gray-800 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
          >
            Previous
          </button>
          <span className="text-gray-500 text-sm">
            Page {page} of {totalPages || 1}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || totalPages === 0}
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

      {filteredData.length === 0 && (
        <p className="text-gray-500 text-center py-8">
          No data found matching your filters.
        </p>
      )}
    </div>
  );
}
