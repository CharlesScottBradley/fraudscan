'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface FlaggedPPPLoan {
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
  flags: {
    HIGH_DOLLAR_PER_EMPLOYEE?: { per_employee: number; severity: string };
    SOLE_PROP_HIGH_LOAN?: { amount: number; severity: string };
    ZERO_EMPLOYEES?: { amount: number; severity: string };
    CHARGED_OFF?: { severity: string };
    FORGIVENESS_EXCEEDS_LOAN?: { ratio: number; severity: string };
    CHILDCARE_ANOMALY?: { per_employee: number; severity: string };
    MISMATCHED_ENTITY_TYPE?: { severity: string };
  };
  flag_types: string[];
}

interface FlaggedPPPResponse {
  loans: FlaggedPPPLoan[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  stats: {
    totalFlagged: number;
    totalAmount: number;
    byFlag: Record<string, { count: number; amount: number }>;
    byState: Record<string, { count: number; amount: number }>;
    bySeverity: {
      high: number;
      medium: number;
      low: number;
    };
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

const FLAG_LABELS: Record<string, string> = {
  'HIGH_DOLLAR_PER_EMPLOYEE': 'High $/Employee',
  'SOLE_PROP_HIGH_LOAN': 'Sole Prop High Loan',
  'ZERO_EMPLOYEES': 'Zero Employees',
  'CHARGED_OFF': 'Charged Off',
  'FORGIVENESS_EXCEEDS_LOAN': 'Excess Forgiveness',
  'CHILDCARE_ANOMALY': 'Childcare Anomaly',
  'MISMATCHED_ENTITY_TYPE': 'Entity Type Mismatch',
};

function formatMoney(amount: number | null): string {
  if (!amount) return '-';
  if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(2)}B`;
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

export default function FlaggedPPPLoansPage() {
  const [loans, setLoans] = useState<FlaggedPPPLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(0);

  // Filters
  const [selectedState, setSelectedState] = useState('');
  const [selectedFlagType, setSelectedFlagType] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('');
  const [minScore, setMinScore] = useState('25');
  const [sortBy, setSortBy] = useState('fraud_score');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Stats
  const [stats, setStats] = useState<FlaggedPPPResponse['stats'] | null>(null);

  // Fetch data
  useEffect(() => {
    fetchFlaggedLoans();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedState, selectedFlagType, selectedSeverity, minScore, page, pageSize, sortBy, sortDir]);

  const fetchFlaggedLoans = async () => {
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
      if (selectedFlagType) params.set('flagType', selectedFlagType);
      if (selectedSeverity) params.set('severity', selectedSeverity);
      if (minScore) params.set('minScore', minScore);

      const res = await fetch(`/api/ppp/flagged?${params}`);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data: FlaggedPPPResponse = await res.json();

      if (!data || !data.loans) {
        throw new Error('Invalid response format');
      }

      setLoans(data.loans);
      setTotalCount(data.total || 0);
      setTotalPages(data.totalPages || 0);
      setStats(data.stats || null);
    } catch (err) {
      console.error('Failed to fetch flagged PPP loans:', err);
      setError('Failed to load flagged loans. Please try again.');
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
    setSelectedState('');
    setSelectedFlagType('');
    setSelectedSeverity('');
    setMinScore('25');
    setPage(1);
  };

  const hasFilters = selectedState || selectedFlagType || selectedSeverity || minScore !== '25';

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-6 text-sm text-gray-500">
        <Link href="/ppp" className="hover:text-green-400">PPP Loans</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-400">Flagged</span>
      </div>

      {/* Terminal-style stats header */}
      <div className="font-mono text-sm mb-10">
        <p className="text-gray-500">FLAGGED_PPP_LOANS</p>
        <div className="mt-2 text-gray-400">
          <p><span className="text-gray-600">├─</span> total_flagged <span className="text-white ml-4">{stats?.totalFlagged?.toLocaleString() || '-'}</span></p>
          <p><span className="text-gray-600">├─</span> total_amount <span className="text-green-500 ml-4">{formatMoney(stats?.totalAmount || 0)}</span></p>
          <p><span className="text-gray-600">├─</span> high_severity <span className="text-white ml-4">{stats?.bySeverity?.high?.toLocaleString() || '-'}</span></p>
          <p><span className="text-gray-600">├─</span> medium_severity <span className="text-white ml-4">{stats?.bySeverity?.medium?.toLocaleString() || '-'}</span></p>
          <p><span className="text-gray-600">└─</span> low_severity <span className="text-white ml-4">{stats?.bySeverity?.low?.toLocaleString() || '-'}</span></p>
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
            <option value="">All Flag Types</option>
            {Object.entries(FLAG_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
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
          <label className="block text-gray-500 text-xs mb-1">Min Fraud Score</label>
          <input
            type="number"
            min="0"
            max="100"
            value={minScore}
            onChange={(e) => { setMinScore(e.target.value); setPage(1); }}
            className="w-20 px-3 py-2 bg-black border border-gray-700 rounded focus:outline-none focus:border-gray-500"
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
      <div className="mb-4 text-sm">
        <p className="text-gray-500">
          {loading ? 'Loading...' : error ? '' : `Showing ${loans.length.toLocaleString()} of ${totalCount.toLocaleString()} flagged loans`}
        </p>
      </div>

      {/* Error State */}
      {error && (
        <div className="border border-gray-800 p-8 text-center mb-4">
          <p className="text-gray-400">{error}</p>
          <button
            onClick={fetchFlaggedLoans}
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
                    onClick={() => toggleSort('fraud_score')}
                  >
                    Score {sortBy === 'fraud_score' && (sortDir === 'desc' ? '↓' : '↑')}
                  </th>
                  <th className="text-left p-3 font-medium text-gray-400">Severity</th>
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
                  <th className="text-right p-3 font-medium text-gray-400">$/Employee</th>
                  <th className="text-left p-3 font-medium text-gray-400">Loan Status</th>
                  <th className="text-right p-3 font-medium text-gray-400">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-gray-500">
                      Loading flagged loans...
                    </td>
                  </tr>
                ) : loans.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-gray-500">
                      No flagged loans found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  loans.map((loan) => {
                    const primaryFlag = loan.flag_types[0];
                    const primaryFlagData = primaryFlag ? loan.flags[primaryFlag as keyof typeof loan.flags] : undefined;
                    const severity = primaryFlagData?.severity || 'medium';

                    return (
                      <tr key={loan.id} className="hover:bg-gray-900/50">
                        <td className="p-3 font-mono text-white">
                          {loan.fraud_score}
                        </td>
                        <td className="p-3 text-gray-500 text-xs">
                          {severity}
                          {loan.flag_types.length > 1 && (
                            <span className="text-gray-600 ml-1">+{loan.flag_types.length - 1}</span>
                          )}
                        </td>
                        <td className="p-3">
                          <Link
                            href={`/ppp/${loan.loan_number}`}
                            className="text-white hover:text-green-400"
                          >
                            {loan.borrower_name}
                          </Link>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {FLAG_LABELS[primaryFlag] || primaryFlag}
                          </div>
                        </td>
                        <td className="p-3 text-gray-400">
                          {loan.borrower_city}, {loan.borrower_state}
                        </td>
                        <td className="p-3 text-right font-mono text-green-500">
                          {formatMoney(loan.initial_approval_amount)}
                        </td>
                        <td className="p-3 text-right font-mono text-white">
                          {loan.amount_per_employee ? formatMoney(loan.amount_per_employee) : '-'}
                        </td>
                        <td className="p-3 text-gray-500 text-xs">
                          {loan.loan_status}
                        </td>
                        <td className="p-3 text-right">
                          <Link
                            href={`/ppp/${loan.loan_number}`}
                            className="text-gray-500 hover:text-white text-xs"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })
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
        <div className="flex gap-3">
          <Link
            href="/ppp"
            className="px-4 py-2 border border-gray-700 rounded text-sm text-gray-400 hover:text-white hover:border-gray-600"
          >
            Back to All PPP Loans
          </Link>
        </div>
      </div>
    </div>
  );
}
