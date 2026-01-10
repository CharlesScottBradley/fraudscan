'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface CheckbookRecord {
  id: number;
  state: string;
  county: string | null;
  fiscal_year: number | null;
  vendor_name: string;
  vendor_name_normalized: string | null;
  amount: number;
  agency: string | null;
  division: string | null;
  expenditure_category: string | null;
  payment_date: string | null;
  fund_name: string | null;
  organization_id: string | null;
}

interface CheckbookResponse {
  records: CheckbookRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  stats: {
    totalAmount: number;
    recordCount: number;
    uniqueVendors: number;
    uniqueAgencies: number;
    statesAvailable: string[];
    fiscalYears: number[];
  };
}

const US_STATES: Record<string, string> = {
  NC: 'North Carolina',
  NY: 'New York',
  TX: 'Texas',
};

function formatMoney(amount: number | null): string {
  if (!amount) return '-';
  if (amount >= 1000000000000) return `$${(amount / 1000000000000).toFixed(2)}T`;
  if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(2)}B`;
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
  return `$${amount.toLocaleString()}`;
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
}

export default function CheckbookPage() {
  const [records, setRecords] = useState<CheckbookRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(0);

  // Filters
  const [selectedState, setSelectedState] = useState('');
  const [fiscalYear, setFiscalYear] = useState('');
  const [vendorSearch, setVendorSearch] = useState('');
  const [agencySearch, setAgencySearch] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [sortBy, setSortBy] = useState('amount');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Stats
  const [stats, setStats] = useState({
    totalAmount: 0,
    recordCount: 0,
    uniqueVendors: 0,
    uniqueAgencies: 0,
    statesAvailable: [] as string[],
    fiscalYears: [] as number[],
  });

  useEffect(() => {
    fetchRecords();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedState, fiscalYear, page, pageSize, sortBy, sortDir]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (vendorSearch.length >= 3 || vendorSearch.length === 0) {
        setPage(1);
        fetchRecords();
      }
    }, 500);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (agencySearch.length >= 3 || agencySearch.length === 0) {
        setPage(1);
        fetchRecords();
      }
    }, 500);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agencySearch]);

  const fetchRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        sortBy,
        sortDir,
      });

      if (selectedState) params.set('state', selectedState);
      if (fiscalYear) params.set('fiscalYear', fiscalYear);
      if (vendorSearch && vendorSearch.length >= 3) params.set('vendor', vendorSearch);
      if (agencySearch && agencySearch.length >= 3) params.set('agency', agencySearch);
      if (minAmount) params.set('minAmount', minAmount);

      const res = await fetch(`/api/state-checkbook?${params}`);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data: CheckbookResponse = await res.json();

      if (!data || !data.records) {
        throw new Error('Invalid response format');
      }

      setRecords(data.records);
      setTotalCount(data.total || 0);
      setTotalPages(data.totalPages || 0);
      setStats(data.stats || {
        totalAmount: 0,
        recordCount: 0,
        uniqueVendors: 0,
        uniqueAgencies: 0,
        statesAvailable: [],
        fiscalYears: [],
      });
    } catch (err) {
      console.error('Failed to fetch checkbook data:', err);
      setError('Failed to load checkbook data. Please try again.');
      setRecords([]);
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
    setSelectedState('');
    setFiscalYear('');
    setVendorSearch('');
    setAgencySearch('');
    setMinAmount('');
    setPage(1);
  };

  const hasFilters = selectedState || fiscalYear || vendorSearch || agencySearch || minAmount;

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link href="/" className="text-gray-500 hover:text-white text-sm">
          Home
        </Link>
        <span className="text-gray-600 mx-2">/</span>
        <span className="text-gray-400 text-sm">State Checkbook</span>
      </div>

      {/* Header */}
      <h1 className="text-2xl font-bold mb-2">State Government Checkbook</h1>
      <p className="text-gray-500 mb-8">
        Vendor payment transactions from state transparency portals. Search 54+ million records from TX, NY, and NC.
      </p>

      {/* Terminal-style stats header */}
      <div className="font-mono text-sm mb-10">
        <p className="text-gray-500">STATE_CHECKBOOK_DATABASE</p>
        <div className="mt-2 text-gray-400">
          <p><span className="text-gray-600">|-</span> total_records <span className="text-white ml-4">{formatNumber(stats.recordCount)}</span></p>
          <p><span className="text-gray-600">|-</span> total_payments <span className="text-green-500 ml-4">{formatMoney(stats.totalAmount)}</span></p>
          <p><span className="text-gray-600">|-</span> unique_vendors <span className="text-cyan-500 ml-4">{formatNumber(stats.uniqueVendors)}</span></p>
          <p><span className="text-gray-600">|-</span> states_available <span className="text-white ml-4">{stats.statesAvailable.join(', ') || '-'}</span></p>
          <p><span className="text-gray-600">|_</span> fiscal_years <span className="text-white ml-4">{stats.fiscalYears.length > 0 ? `${Math.min(...stats.fiscalYears)}-${Math.max(...stats.fiscalYears)}` : '-'}</span></p>
        </div>
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
            {stats.statesAvailable.map(code => (
              <option key={code} value={code}>{US_STATES[code] || code}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-gray-500 text-xs mb-1">Fiscal Year</label>
          <select
            value={fiscalYear}
            onChange={(e) => { setFiscalYear(e.target.value); setPage(1); }}
            className="bg-black border border-gray-700 rounded px-3 py-2 focus:outline-none focus:border-gray-500"
          >
            <option value="">All Years</option>
            {stats.fiscalYears.map(fy => (
              <option key={fy} value={fy}>FY {fy}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-gray-500 text-xs mb-1">Vendor Name</label>
          <input
            type="text"
            value={vendorSearch}
            onChange={(e) => setVendorSearch(e.target.value)}
            placeholder="Search vendors..."
            className="bg-black border border-gray-700 rounded px-3 py-2 focus:outline-none focus:border-gray-500 w-48"
          />
        </div>

        <div>
          <label className="block text-gray-500 text-xs mb-1">Agency</label>
          <input
            type="text"
            value={agencySearch}
            onChange={(e) => setAgencySearch(e.target.value)}
            placeholder="Search agencies..."
            className="bg-black border border-gray-700 rounded px-3 py-2 focus:outline-none focus:border-gray-500 w-48"
          />
        </div>

        <div>
          <label className="block text-gray-500 text-xs mb-1">Min Amount</label>
          <select
            value={minAmount}
            onChange={(e) => { setMinAmount(e.target.value); setPage(1); fetchRecords(); }}
            className="bg-black border border-gray-700 rounded px-3 py-2 focus:outline-none focus:border-gray-500"
          >
            <option value="">Any</option>
            <option value="10000">$10K+</option>
            <option value="100000">$100K+</option>
            <option value="1000000">$1M+</option>
            <option value="10000000">$10M+</option>
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
      <div className="mb-4 text-sm">
        <p className="text-gray-500">
          {loading ? 'Loading...' : error ? '' : `Showing ${records.length.toLocaleString()} of ${totalCount.toLocaleString()} records`}
        </p>
      </div>

      {/* Error State */}
      {error && (
        <div className="border border-gray-800 p-8 text-center mb-4">
          <p className="text-gray-400">{error}</p>
          <button
            onClick={fetchRecords}
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
                    onClick={() => toggleSort('state')}
                  >
                    State {sortBy === 'state' && (sortDir === 'desc' ? '↓' : '↑')}
                  </th>
                  <th
                    className="text-left p-3 font-medium text-gray-400 cursor-pointer hover:text-white"
                    onClick={() => toggleSort('fiscal_year')}
                  >
                    FY {sortBy === 'fiscal_year' && (sortDir === 'desc' ? '↓' : '↑')}
                  </th>
                  <th
                    className="text-left p-3 font-medium text-gray-400 cursor-pointer hover:text-white max-w-xs"
                    onClick={() => toggleSort('vendor_name')}
                  >
                    Vendor {sortBy === 'vendor_name' && (sortDir === 'desc' ? '↓' : '↑')}
                  </th>
                  <th
                    className="text-right p-3 font-medium text-gray-400 cursor-pointer hover:text-white"
                    onClick={() => toggleSort('amount')}
                  >
                    Amount {sortBy === 'amount' && (sortDir === 'desc' ? '↓' : '↑')}
                  </th>
                  <th className="text-left p-3 font-medium text-gray-400 max-w-xs">
                    Agency
                  </th>
                  <th className="text-left p-3 font-medium text-gray-400">
                    Category
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-gray-500">
                      Loading checkbook records...
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-gray-500">
                      No records found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  records.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-900/50">
                      <td className="p-3">
                        <Link
                          href={`/state/${record.state.toLowerCase()}`}
                          className="text-white hover:text-green-400"
                        >
                          {record.state}
                        </Link>
                      </td>
                      <td className="p-3 text-gray-400">
                        {record.fiscal_year || '-'}
                      </td>
                      <td className="p-3 max-w-xs">
                        <div className="truncate text-white" title={record.vendor_name}>
                          {record.vendor_name}
                        </div>
                        {record.organization_id && (
                          <Link
                            href={`/organization/${record.organization_id}`}
                            className="text-xs text-cyan-500 hover:underline"
                          >
                            View Organization
                          </Link>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <span className={record.amount >= 1000000 ? 'text-green-400' : 'text-white'}>
                          {formatMoney(record.amount)}
                        </span>
                      </td>
                      <td className="p-3 max-w-xs">
                        <div className="truncate text-gray-400" title={record.agency || ''}>
                          {record.agency || '-'}
                        </div>
                      </td>
                      <td className="p-3 text-gray-500">
                        {record.expenditure_category || '-'}
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
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-500">
            Page {page} of {totalPages.toLocaleString()}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              className="px-3 py-1.5 border border-gray-700 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:border-gray-600"
            >
              First
            </button>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 border border-gray-700 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:border-gray-600"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 border border-gray-700 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:border-gray-600"
            >
              Next
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              className="px-3 py-1.5 border border-gray-700 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:border-gray-600"
            >
              Last
            </button>
          </div>
        </div>
      )}

      {/* Data Sources */}
      <div className="mt-12 pt-8 border-t border-gray-800">
        <h2 className="text-lg font-semibold mb-4">Data Sources</h2>
        <div className="text-sm text-gray-500 space-y-2">
          <p>
            <strong className="text-gray-400">Texas:</strong>{' '}
            <a href="https://comptroller.texas.gov" target="_blank" rel="noopener noreferrer" className="text-cyan-500 hover:underline">
              Texas Comptroller
            </a>{' '}
            - State agency expenditure data
          </p>
          <p>
            <strong className="text-gray-400">New York:</strong>{' '}
            <a href="https://openbudget.ny.gov" target="_blank" rel="noopener noreferrer" className="text-cyan-500 hover:underline">
              NY Open Budget
            </a>{' '}
            - Vendor payment transactions
          </p>
          <p>
            <strong className="text-gray-400">North Carolina:</strong>{' '}
            <a href="https://www.nc.gov/transparency" target="_blank" rel="noopener noreferrer" className="text-cyan-500 hover:underline">
              NC Transparency Portal
            </a>{' '}
            - State government spending
          </p>
        </div>
      </div>

      {/* Related Links */}
      <div className="mt-8 pt-6 border-t border-gray-800">
        <h2 className="text-lg font-semibold mb-4">Related</h2>
        <div className="flex flex-wrap gap-4">
          <Link href="/state-budgets" className="text-cyan-500 hover:underline text-sm">
            State Budgets (Aggregate)
          </Link>
          <Link href="/budgets" className="text-cyan-500 hover:underline text-sm">
            Local Government Budgets
          </Link>
          <Link href="/ppp" className="text-cyan-500 hover:underline text-sm">
            PPP Loans
          </Link>
        </div>
      </div>
    </div>
  );
}
