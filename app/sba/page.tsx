'use client';

import { useEffect, useState } from 'react';

interface SBALoan {
  id: string;
  sba_loan_number: string;
  loan_program: string;
  loan_subprogram: string;
  borrower_name: string;
  borrower_address: string;
  borrower_city: string;
  borrower_state: string;
  borrower_zip: string;
  gross_approval: number;
  sba_guaranteed_amount: number | null;
  term_months: number | null;
  lender_name: string;
  naics_code: string;
  naics_description: string;
  business_type: string;
  jobs_supported: number | null;
  approval_date: string;
  is_fraud_prone_industry: boolean;
  industry_category: string | null;
}

interface SBASearchResponse {
  loans: SBALoan[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  stats: {
    totalAmount: number;
    avgLoan: number;
    fraudProneCount: number;
    by7a: number;
    by504: number;
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
};

function formatMoney(amount: number | null): string {
  if (!amount) return '-';
  if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(2)}B`;
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

export default function SBALoansPage() {
  const [loans, setLoans] = useState<SBALoan[]>([]);
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
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [program, setProgram] = useState('');
  const [fraudProneOnly, setFraudProneOnly] = useState(false);
  const [sortBy, setSortBy] = useState('gross_approval');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Stats
  const [stats, setStats] = useState({
    totalAmount: 0,
    avgLoan: 0,
    fraudProneCount: 0,
    by7a: 0,
    by504: 0,
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
    fetchLoans();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, selectedState, minAmount, maxAmount, program, fraudProneOnly, page, pageSize, sortBy, sortDir]);

  const fetchLoans = async () => {
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
      if (minAmount) params.set('minAmount', minAmount);
      if (maxAmount) params.set('maxAmount', maxAmount);
      if (program) params.set('program', program);
      if (fraudProneOnly) params.set('fraudProne', 'true');

      const res = await fetch(`/api/sba-loans?${params}`);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data: SBASearchResponse = await res.json();

      if (!data || !data.loans) {
        throw new Error('Invalid response format');
      }

      setLoans(data.loans);
      setTotalCount(data.total || 0);
      setTotalPages(data.totalPages || 0);
      setStats(data.stats || { totalAmount: 0, avgLoan: 0, fraudProneCount: 0, by7a: 0, by504: 0 });
    } catch (err) {
      console.error('Failed to fetch SBA loans:', err);
      setError('Failed to load SBA loans. Please try again.');
      setLoans([]);
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
    setMinAmount('');
    setMaxAmount('');
    setProgram('');
    setFraudProneOnly(false);
    setPage(1);
  };

  const hasFilters = searchTerm || selectedState || minAmount || maxAmount || program || fraudProneOnly;

  return (
    <div>
      {/* Terminal-style stats header */}
      <div className="font-mono text-sm mb-10">
        <p className="text-gray-500">SBA_LOANS_DATABASE</p>
        <div className="mt-2 text-gray-400">
          <p><span className="text-gray-600">├─</span> loans_tracked <span className="text-white ml-4">{totalCount.toLocaleString()}</span></p>
          <p><span className="text-gray-600">├─</span> programs <span className="text-amber-500 ml-4">7(a) &amp; 504</span></p>
          <p><span className="text-gray-600">├─</span> avg_loan <span className="text-green-500 ml-4">{formatMoney(stats.avgLoan)}</span></p>
          <p><span className="text-gray-600">└─</span> fraud_prone_industries <span className="text-white ml-4">{stats.fraudProneCount.toLocaleString()}</span></p>
        </div>
      </div>

      {/* Search Input */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by business name, address, or lender..."
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
          <label className="block text-gray-500 text-xs mb-1">Program</label>
          <select
            value={program}
            onChange={(e) => { setProgram(e.target.value); setPage(1); }}
            className="bg-black border border-gray-700 rounded px-3 py-2 focus:outline-none focus:border-gray-500"
          >
            <option value="">All Programs</option>
            <option value="7a">7(a) Loans</option>
            <option value="504">504 Loans</option>
          </select>
        </div>

        <div>
          <label className="block text-gray-500 text-xs mb-1">Min Amount</label>
          <input
            type="number"
            placeholder="$0"
            value={minAmount}
            onChange={(e) => { setMinAmount(e.target.value); setPage(1); }}
            className="w-28 px-3 py-2 bg-black border border-gray-700 rounded focus:outline-none focus:border-gray-500"
          />
        </div>

        <div>
          <label className="block text-gray-500 text-xs mb-1">Max Amount</label>
          <input
            type="number"
            placeholder="No limit"
            value={maxAmount}
            onChange={(e) => { setMaxAmount(e.target.value); setPage(1); }}
            className="w-28 px-3 py-2 bg-black border border-gray-700 rounded focus:outline-none focus:border-gray-500"
          />
        </div>

        <div className="flex items-end">
          <label className="flex items-center gap-2 px-3 py-2 border border-gray-700 rounded cursor-pointer hover:border-gray-600">
            <input
              type="checkbox"
              checked={fraudProneOnly}
              onChange={(e) => { setFraudProneOnly(e.target.checked); setPage(1); }}
              className="form-checkbox h-4 w-4 text-amber-500 bg-black border-gray-700 rounded"
            />
            <span className="text-gray-400">Fraud-Prone Industries</span>
          </label>
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
          {loading ? 'Loading...' : error ? '' : `Showing ${loans.length.toLocaleString()} of ${totalCount.toLocaleString()} results`}
        </p>
        {stats.fraudProneCount > 0 && !loading && !error && (
          <p className="text-gray-500">
            {stats.fraudProneCount.toLocaleString()} in fraud-prone industries
          </p>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="border border-gray-800 p-8 text-center mb-4">
          <p className="text-gray-400">{error}</p>
          <button
            onClick={fetchLoans}
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
                  <th className="text-left p-3 font-medium text-gray-400">Program</th>
                  <th
                    className="text-left p-3 font-medium text-gray-400 cursor-pointer hover:text-white"
                    onClick={() => toggleSort('borrower_name')}
                  >
                    Business Name {sortBy === 'borrower_name' && (sortDir === 'desc' ? '↓' : '↑')}
                  </th>
                  <th className="text-left p-3 font-medium text-gray-400">City / State</th>
                  <th
                    className="text-right p-3 font-medium text-gray-400 cursor-pointer hover:text-white"
                    onClick={() => toggleSort('gross_approval')}
                  >
                    Amount {sortBy === 'gross_approval' && (sortDir === 'desc' ? '↓' : '↑')}
                  </th>
                  <th
                    className="text-right p-3 font-medium text-gray-400 cursor-pointer hover:text-white"
                    onClick={() => toggleSort('jobs_supported')}
                  >
                    Jobs {sortBy === 'jobs_supported' && (sortDir === 'desc' ? '↓' : '↑')}
                  </th>
                  <th className="text-left p-3 font-medium text-gray-400">Industry</th>
                  <th className="text-left p-3 font-medium text-gray-400">Lender</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-gray-500">
                      Loading SBA loans...
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
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          loan.loan_program === '7a' 
                            ? 'bg-amber-900/40 text-amber-400'
                            : 'bg-blue-900/40 text-blue-400'
                        }`}>
                          {loan.loan_program === '7a' ? '7(a)' : '504'}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-white">{loan.borrower_name}</span>
                        {loan.is_fraud_prone_industry && (
                          <span className="ml-2 px-1.5 py-0.5 rounded text-xs bg-red-900/30 text-red-400">
                            ⚠
                          </span>
                        )}
                        <div className="text-xs text-gray-500 mt-0.5">{loan.business_type}</div>
                      </td>
                      <td className="p-3 text-gray-400">
                        {loan.borrower_city}, {loan.borrower_state}
                      </td>
                      <td className="p-3 text-right font-mono text-green-500">
                        {formatMoney(loan.gross_approval)}
                      </td>
                      <td className="p-3 text-right font-mono text-white">
                        {loan.jobs_supported || '-'}
                      </td>
                      <td className="p-3 text-gray-500 text-xs max-w-[200px] truncate">
                        {loan.naics_description || loan.industry_category || '-'}
                      </td>
                      <td className="p-3 text-gray-500 text-xs max-w-[150px] truncate">
                        {loan.lender_name}
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

          {stats.totalAmount > 0 && (
            <div className="text-gray-500">
              Total in results: <span className="text-green-500 font-mono">{formatMoney(stats.totalAmount)}</span>
            </div>
          )}
        </div>
      )}

      {/* Info Section */}
      <div className="mt-8 pt-6 border-t border-gray-800">
        <p className="text-sm text-gray-500 mb-3">About SBA Loans</p>
        <div className="text-xs text-gray-600 space-y-2">
          <p>
            <strong className="text-gray-400">7(a) Program:</strong> The SBA&apos;s primary business loan program for general-purpose financing. 
            Loans up to $5 million for working capital, equipment, real estate, and debt refinancing.
          </p>
          <p>
            <strong className="text-gray-400">504 Program:</strong> Long-term fixed-rate financing for major fixed assets like real estate and equipment. 
            Typically involves a bank, a CDC (Certified Development Company), and the borrower.
          </p>
          <p className="text-gray-500 mt-4">
            Note: This data covers standard SBA lending programs, separate from COVID-era PPP loans.
          </p>
        </div>
      </div>
    </div>
  );
}

