'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface PPPLoan {
  id: string;
  loan_number: string;
  borrower_name: string;
  borrower_address: string;
  borrower_city: string;
  borrower_state: string;
  borrower_zip: string;
  initial_approval_amount: number;
  forgiveness_amount: number | null;
  jobs_reported: number;
  amount_per_employee: number | null;
  business_type: string;
  naics_code: string;
  loan_status: string;
  date_approved: string;
  forgiveness_date: string | null;
  fraud_score: number;
  is_flagged: boolean;
  flags: Record<string, unknown>;
}

interface PPPSearchResponse {
  loans: PPPLoan[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  stats: {
    totalAmount: number;
    avgLoan: number;
    flaggedCount: number;
    chargedOffCount: number;
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
  DC: 'District of Columbia', PR: 'Puerto Rico', VI: 'Virgin Islands', GU: 'Guam',
  AS: 'American Samoa', MP: 'Northern Mariana Islands',
};

function formatMoney(amount: number | null): string {
  if (!amount) return '-';
  if (amount >= 1000000000) {
    return `$${(amount / 1000000000).toFixed(2)}B`;
  }
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(2)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return `$${amount.toLocaleString()}`;
}

export default function PPPSearchPage() {
  const [loans, setLoans] = useState<PPPLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [naicsCode, setNaicsCode] = useState('');
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [sortBy, setSortBy] = useState('fraud_score');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Stats
  const [stats, setStats] = useState({
    totalAmount: 0,
    avgLoan: 0,
    flaggedCount: 0,
    chargedOffCount: 0,
  });

  // Quick stats for header (hardcoded from context)
  const TOTAL_LOANS = 6760000; // 6.76M
  const TOTAL_AMOUNT = 674000000000; // $674B
  const FLAGGED_COUNT = 8536;
  const STATES_COVERED = 59;

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
    fetchLoans();
  }, [debouncedSearch, selectedState, minAmount, maxAmount, naicsCode, flaggedOnly, page, pageSize, sortBy, sortDir]);

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        sortBy,
        sortDir,
      });

      if (debouncedSearch) params.set('search', debouncedSearch);
      if (selectedState) params.set('state', selectedState);
      if (minAmount) params.set('minAmount', minAmount);
      if (maxAmount) params.set('maxAmount', maxAmount);
      if (naicsCode) params.set('naics', naicsCode);
      if (flaggedOnly) params.set('flagged', 'true');

      const res = await fetch(`/api/ppp?${params}`);
      const data: PPPSearchResponse = await res.json();

      setLoans(data.loans);
      setTotalCount(data.total);
      setTotalPages(data.totalPages);
      setStats(data.stats);
    } catch (error) {
      console.error('Failed to fetch PPP loans:', error);
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
    setMinAmount('');
    setMaxAmount('');
    setNaicsCode('');
    setFlaggedOnly(false);
    setPage(1);
  };

  const hasFilters = searchTerm || selectedState || minAmount || maxAmount || naicsCode || flaggedOnly;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">PPP Loans Database</h1>
        <p className="text-gray-500">
          Search and analyze Paycheck Protection Program loans
        </p>
      </div>

      {/* Quick Stats Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-800 border border-gray-700 p-4">
          <p className="text-xs text-gray-400 mb-1">TOTAL LOANS</p>
          <p className="text-2xl font-mono font-bold text-white">{(TOTAL_LOANS / 1000000).toFixed(2)}M</p>
          <p className="text-xs text-gray-500 mt-1">Paycheck Protection Program</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 p-4">
          <p className="text-xs text-gray-400 mb-1">TOTAL AMOUNT</p>
          <p className="text-2xl font-mono font-bold text-green-500">${(TOTAL_AMOUNT / 1000000000).toFixed(0)}B</p>
          <p className="text-xs text-gray-500 mt-1">Approved funding</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 p-4">
          <p className="text-xs text-gray-400 mb-1">FLAGGED FOR REVIEW</p>
          <p className="text-2xl font-mono font-bold text-amber-500">{FLAGGED_COUNT.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">Suspicious loans</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 p-4">
          <p className="text-xs text-gray-400 mb-1">STATES COVERED</p>
          <p className="text-2xl font-mono font-bold text-white">{STATES_COVERED}</p>
          <p className="text-xs text-gray-500 mt-1">Including territories</p>
        </div>
      </div>

      {/* Search Input */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by business name, address, or loan number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded text-sm focus:outline-none focus:border-green-500"
        />
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block text-gray-400 text-xs mb-1">State</label>
          <select
            value={selectedState}
            onChange={(e) => { setSelectedState(e.target.value); setPage(1); }}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-green-500"
          >
            <option value="">All States</option>
            {Object.entries(US_STATES).sort((a, b) => a[1].localeCompare(b[1])).map(([code, name]) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-gray-400 text-xs mb-1">Min Amount</label>
          <input
            type="number"
            placeholder="$0"
            value={minAmount}
            onChange={(e) => { setMinAmount(e.target.value); setPage(1); }}
            className="w-32 px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm focus:outline-none focus:border-green-500"
          />
        </div>

        <div>
          <label className="block text-gray-400 text-xs mb-1">Max Amount</label>
          <input
            type="number"
            placeholder="No limit"
            value={maxAmount}
            onChange={(e) => { setMaxAmount(e.target.value); setPage(1); }}
            className="w-32 px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm focus:outline-none focus:border-green-500"
          />
        </div>

        <div>
          <label className="block text-gray-400 text-xs mb-1">NAICS Code</label>
          <input
            type="text"
            placeholder="e.g. 624410"
            value={naicsCode}
            onChange={(e) => { setNaicsCode(e.target.value); setPage(1); }}
            className="w-32 px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm focus:outline-none focus:border-green-500"
          />
        </div>

        <div className="flex items-end">
          <label className="flex items-center gap-2 px-3 py-2 bg-gray-800 border border-gray-700 rounded cursor-pointer hover:bg-gray-700">
            <input
              type="checkbox"
              checked={flaggedOnly}
              onChange={(e) => { setFlaggedOnly(e.target.checked); setPage(1); }}
              className="form-checkbox h-4 w-4 text-amber-500 bg-gray-900 border-gray-700 rounded focus:ring-amber-500"
            />
            <span className="text-sm text-gray-300">Flagged Only</span>
          </label>
        </div>

        <div>
          <label className="block text-gray-400 text-xs mb-1">Per Page</label>
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-green-500"
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
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-gray-400 hover:bg-gray-700 hover:text-white"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-gray-500 text-sm">
          {loading ? 'Loading...' : `Showing ${loans.length.toLocaleString()} of ${totalCount.toLocaleString()} results`}
        </p>
        {stats.flaggedCount > 0 && (
          <p className="text-amber-500 text-sm">
            {stats.flaggedCount.toLocaleString()} flagged in filtered results
          </p>
        )}
      </div>

      {/* Results Table */}
      <div className="border border-gray-800 overflow-hidden rounded">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left p-3 font-medium text-gray-400">Status</th>
                <th
                  className="text-left p-3 font-medium text-gray-400 cursor-pointer hover:text-white"
                  onClick={() => toggleSort('borrower_name')}
                >
                  Business Name {sortBy === 'borrower_name' && (sortDir === 'desc' ? '↓' : '↑')}
                </th>
                <th className="text-left p-3 font-medium text-gray-400">City / State</th>
                <th
                  className="text-right p-3 font-medium text-gray-400 cursor-pointer hover:text-white"
                  onClick={() => toggleSort('initial_approval_amount')}
                >
                  Amount {sortBy === 'initial_approval_amount' && (sortDir === 'desc' ? '↓' : '↑')}
                </th>
                <th
                  className="text-right p-3 font-medium text-gray-400 cursor-pointer hover:text-white"
                  onClick={() => toggleSort('jobs_reported')}
                >
                  Jobs {sortBy === 'jobs_reported' && (sortDir === 'desc' ? '↓' : '↑')}
                </th>
                <th className="text-left p-3 font-medium text-gray-400">Loan Status</th>
                <th className="text-right p-3 font-medium text-gray-400">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-gray-500">
                    Loading PPP loans...
                  </td>
                </tr>
              ) : loans.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-gray-500">
                    No loans found matching your search criteria.
                  </td>
                </tr>
              ) : (
                loans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-gray-900/50">
                    <td className="p-3">
                      {loan.is_flagged ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-amber-900/40 text-amber-400 border border-amber-800">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          Flagged
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-green-900/40 text-green-400 border border-green-800">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Clear
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <Link
                        href={`/ppp/${loan.loan_number}`}
                        className="font-medium text-white hover:text-green-400"
                      >
                        {loan.borrower_name}
                      </Link>
                      <div className="text-xs text-gray-500 mt-0.5">{loan.business_type}</div>
                    </td>
                    <td className="p-3 text-gray-400">
                      {loan.borrower_city}, {loan.borrower_state}
                    </td>
                    <td className="p-3 text-right font-mono text-green-500">
                      {formatMoney(loan.initial_approval_amount)}
                    </td>
                    <td className="p-3 text-right font-mono text-white">
                      {loan.jobs_reported || '-'}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        loan.loan_status === 'Paid in Full' || loan.loan_status === 'Exemption 4'
                          ? 'bg-green-900/40 text-green-400 border border-green-800'
                          : loan.loan_status === 'Charged Off'
                          ? 'bg-red-900/40 text-red-400 border border-red-800'
                          : 'bg-gray-800 text-gray-400 border border-gray-700'
                      }`}>
                        {loan.loan_status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <Link
                        href={`/ppp/${loan.loan_number}`}
                        className="text-gray-400 hover:text-white text-xs"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
          >
            Previous
          </button>
          <span className="text-gray-500 text-sm">
            Page {page.toLocaleString()} of {totalPages.toLocaleString() || 1}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || totalPages === 0 || loading}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
          >
            Next
          </button>
        </div>

        {stats.totalAmount > 0 && (
          <div className="text-sm text-gray-500">
            Total in results: <span className="text-green-500 font-mono">{formatMoney(stats.totalAmount)}</span>
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="mt-8 pt-6 border-t border-gray-800">
        <p className="text-sm text-gray-500 mb-3">Quick Links</p>
        <div className="flex gap-3">
          <Link
            href="/ppp/flagged"
            className="px-4 py-2 bg-amber-900/40 text-amber-400 border border-amber-800 rounded text-sm hover:bg-amber-900/60"
          >
            View Flagged Loans ({FLAGGED_COUNT.toLocaleString()})
          </Link>
        </div>
      </div>
    </div>
  );
}
