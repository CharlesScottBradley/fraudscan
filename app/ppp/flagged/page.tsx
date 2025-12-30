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

function getSeverityBadge(severity: string) {
  const colors: Record<string, string> = {
    high: 'bg-red-900/40 text-red-400 border-red-800',
    medium: 'bg-amber-900/40 text-amber-400 border-amber-800',
    low: 'bg-yellow-900/40 text-yellow-400 border-yellow-800',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs border ${colors[severity] || colors.medium}`}>
      {severity.toUpperCase()}
    </span>
  );
}

export default function FlaggedPPPLoansPage() {
  const [loans, setLoans] = useState<FlaggedPPPLoan[]>([]);
  const [loading, setLoading] = useState(true);
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
  }, [selectedState, selectedFlagType, selectedSeverity, minScore, page, pageSize, sortBy, sortDir]);

  const fetchFlaggedLoans = async () => {
    setLoading(true);
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
      const data: FlaggedPPPResponse = await res.json();

      setLoans(data.loans);
      setTotalCount(data.total);
      setTotalPages(data.totalPages);
      setStats(data.stats);
    } catch (error) {
      console.error('Failed to fetch flagged PPP loans:', error);
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
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold">Flagged PPP Loans</h1>
          <Link
            href="/ppp"
            className="text-sm text-gray-400 hover:text-white"
          >
            ← Back to All Loans
          </Link>
        </div>
        <p className="text-gray-500">
          PPP loans flagged for potential fraud indicators
        </p>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-gray-800 border border-gray-700 p-4">
            <p className="text-xs text-gray-400 mb-1">TOTAL FLAGGED</p>
            <p className="text-2xl font-mono font-bold text-amber-500">
              {stats.totalFlagged.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">Suspicious loans</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 p-4">
            <p className="text-xs text-gray-400 mb-1">TOTAL AMOUNT</p>
            <p className="text-2xl font-mono font-bold text-green-500">
              {formatMoney(stats.totalAmount)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Flagged funding</p>
          </div>
          <div className="bg-red-900/20 border border-red-800 p-4">
            <p className="text-xs text-gray-400 mb-1">HIGH SEVERITY</p>
            <p className="text-2xl font-mono font-bold text-red-400">
              {stats.bySeverity.high.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">Critical flags</p>
          </div>
          <div className="bg-amber-900/20 border border-amber-800 p-4">
            <p className="text-xs text-gray-400 mb-1">MEDIUM SEVERITY</p>
            <p className="text-2xl font-mono font-bold text-amber-400">
              {stats.bySeverity.medium.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">Moderate flags</p>
          </div>
          <div className="bg-yellow-900/20 border border-yellow-800 p-4">
            <p className="text-xs text-gray-400 mb-1">LOW SEVERITY</p>
            <p className="text-2xl font-mono font-bold text-yellow-400">
              {stats.bySeverity.low.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">Minor flags</p>
          </div>
        </div>
      )}

      {/* Top Flags Breakdown */}
      {stats && Object.keys(stats.byFlag).length > 0 && (
        <div className="mb-8 bg-gray-800 border border-gray-700 rounded p-6">
          <h2 className="text-lg font-bold mb-4">Flag Type Breakdown</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(stats.byFlag)
              .sort((a, b) => b[1].count - a[1].count)
              .slice(0, 6)
              .map(([flagType, data]) => (
                <div key={flagType} className="bg-gray-900 border border-gray-700 p-4 rounded">
                  <p className="text-xs text-gray-400 mb-1">{FLAG_LABELS[flagType] || flagType}</p>
                  <p className="text-xl font-mono font-bold text-white mb-1">
                    {data.count.toLocaleString()}
                  </p>
                  <p className="text-sm text-green-500 font-mono">
                    {formatMoney(data.amount)}
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Filters Row */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block text-gray-400 text-xs mb-1">State</label>
          <select
            value={selectedState}
            onChange={(e) => { setSelectedState(e.target.value); setPage(1); }}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
          >
            <option value="">All States</option>
            {Object.entries(US_STATES).sort((a, b) => a[1].localeCompare(b[1])).map(([code, name]) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-gray-400 text-xs mb-1">Flag Type</label>
          <select
            value={selectedFlagType}
            onChange={(e) => { setSelectedFlagType(e.target.value); setPage(1); }}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
          >
            <option value="">All Flag Types</option>
            {Object.entries(FLAG_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-gray-400 text-xs mb-1">Severity</label>
          <select
            value={selectedSeverity}
            onChange={(e) => { setSelectedSeverity(e.target.value); setPage(1); }}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
          >
            <option value="">All Severities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div>
          <label className="block text-gray-400 text-xs mb-1">Min Fraud Score</label>
          <input
            type="number"
            min="0"
            max="100"
            value={minScore}
            onChange={(e) => { setMinScore(e.target.value); setPage(1); }}
            className="w-24 px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm focus:outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <label className="block text-gray-400 text-xs mb-1">Per Page</label>
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
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
      <div className="mb-4">
        <p className="text-gray-500 text-sm">
          {loading ? 'Loading...' : `Showing ${loans.length.toLocaleString()} of ${totalCount.toLocaleString()} flagged loans`}
        </p>
      </div>

      {/* Results Table */}
      <div className="border border-gray-800 overflow-hidden rounded">
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
                <th className="text-left p-3 font-medium text-gray-400">Flags</th>
                <th
                  className="text-left p-3 font-medium text-gray-400 cursor-pointer hover:text-white"
                  onClick={() => toggleSort('initial_approval_amount')}
                >
                  Business Name {sortBy === 'initial_approval_amount' && (sortDir === 'desc' ? '↓' : '↑')}
                </th>
                <th className="text-left p-3 font-medium text-gray-400">City / State</th>
                <th className="text-right p-3 font-medium text-gray-400">Amount</th>
                <th className="text-right p-3 font-medium text-gray-400">$/Employee</th>
                <th className="text-left p-3 font-medium text-gray-400">Status</th>
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
                      <td className="p-3">
                        <span className={`font-mono font-bold ${
                          loan.fraud_score >= 75 ? 'text-red-400' :
                          loan.fraud_score >= 50 ? 'text-amber-400' :
                          'text-yellow-400'
                        }`}>
                          {loan.fraud_score}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {getSeverityBadge(severity)}
                          {loan.flag_types.length > 1 && (
                            <span className="px-2 py-0.5 rounded text-xs bg-gray-700 text-gray-300 border border-gray-600">
                              +{loan.flag_types.length - 1}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <Link
                          href={`/ppp/${loan.loan_number}`}
                          className="font-medium text-white hover:text-amber-400"
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
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          loan.loan_status === 'Charged Off'
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
                  );
                })
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
      </div>
    </div>
  );
}
