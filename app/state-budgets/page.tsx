'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ToshiAdBanner from '../components/ToshiAdBanner';

interface StateBudget {
  id: string;
  state: string;
  state_name: string | null;
  fiscal_year: number;
  total_revenue: number | null;
  total_expenditure: number | null;
  tax_revenue: number | null;
  intergovernmental_revenue: number | null;
  public_welfare_expenditure: number | null;
  education_expenditure: number | null;
  health_expenditure: number | null;
  highways_expenditure: number | null;
  population: number | null;
  expenditure_per_capita: number | null;
  revenue_per_capita: number | null;
  total_debt: number | null;
  intergovernmental_pct: number | null;
  welfare_pct: number | null;
  education_pct: number | null;
}

interface StateBudgetResponse {
  budgets: StateBudget[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  stats: {
    totalExpenditure: number;
    totalRevenue: number;
    totalFederalAid: number;
    avgWelfarePct: number;
    avgEducationPct: number;
    fiscalYears: number[];
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
  DC: 'District of Columbia',
};

function formatMoney(amount: number | null): string {
  if (!amount) return '-';
  if (amount >= 1000000000000) return `$${(amount / 1000000000000).toFixed(2)}T`;
  if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(2)}B`;
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

function formatPercent(pct: number | null): string {
  if (!pct && pct !== 0) return '-';
  return `${pct.toFixed(1)}%`;
}

export default function StateBudgetsPage() {
  const [budgets, setBudgets] = useState<StateBudget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(0);

  // Filters
  const [selectedState, setSelectedState] = useState('');
  const [fiscalYear, setFiscalYear] = useState('');
  const [sortBy, setSortBy] = useState('total_expenditure');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Stats
  const [stats, setStats] = useState({
    totalExpenditure: 0,
    totalRevenue: 0,
    totalFederalAid: 0,
    avgWelfarePct: 0,
    avgEducationPct: 0,
    fiscalYears: [] as number[],
  });

  useEffect(() => {
    fetchBudgets();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedState, fiscalYear, page, pageSize, sortBy, sortDir]);

  const fetchBudgets = async () => {
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

      const res = await fetch(`/api/state-budgets?${params}`);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data: StateBudgetResponse = await res.json();

      if (!data || !data.budgets) {
        throw new Error('Invalid response format');
      }

      setBudgets(data.budgets);
      setTotalCount(data.total || 0);
      setTotalPages(data.totalPages || 0);
      setStats(data.stats || {
        totalExpenditure: 0,
        totalRevenue: 0,
        totalFederalAid: 0,
        avgWelfarePct: 0,
        avgEducationPct: 0,
        fiscalYears: [],
      });
    } catch (err) {
      console.error('Failed to fetch state budgets:', err);
      setError('Failed to load state budgets. Please try again.');
      setBudgets([]);
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
    setPage(1);
  };

  const hasFilters = selectedState || fiscalYear;

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link href="/" className="text-gray-500 hover:text-white text-sm">
          Home
        </Link>
        <span className="text-gray-600 mx-2">/</span>
        <span className="text-gray-400 text-sm">State Budgets</span>
      </div>

      {/* Header */}
      <h1 className="text-2xl font-bold mb-2">State Government Finances</h1>
      <p className="text-gray-500 mb-8">
        State-level revenue, expenditure, and debt data from the U.S. Census Bureau and NASBO State Expenditure Reports (FY2022-2024).
      </p>

      {/* Terminal-style stats header */}
      <div className="font-mono text-sm mb-10">
        <p className="text-gray-500">STATE_FINANCE_DATABASE</p>
        <div className="mt-2 text-gray-400">
          <p><span className="text-gray-600">|-</span> states_tracked <span className="text-white ml-4">51</span></p>
          <p><span className="text-gray-600">|-</span> total_expenditure <span className="text-green-500 ml-4">{formatMoney(stats.totalExpenditure)}</span></p>
          <p><span className="text-gray-600">|-</span> federal_aid_received <span className="text-cyan-500 ml-4">{formatMoney(stats.totalFederalAid)}</span></p>
          <p><span className="text-gray-600">|-</span> avg_welfare_spend <span className="text-white ml-4">{formatPercent(stats.avgWelfarePct)}</span></p>
          <p><span className="text-gray-600">|_</span> avg_education_spend <span className="text-white ml-4">{formatPercent(stats.avgEducationPct)}</span></p>
        </div>
      </div>

      {/* Toshi Sponsor Banner */}
      <ToshiAdBanner className="mb-8" />

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
          {loading ? 'Loading...' : error ? '' : `Showing ${budgets.length.toLocaleString()} of ${totalCount.toLocaleString()} records`}
        </p>
      </div>

      {/* Error State */}
      {error && (
        <div className="border border-gray-800 p-8 text-center mb-4">
          <p className="text-gray-400">{error}</p>
          <button
            onClick={fetchBudgets}
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
                    className="text-right p-3 font-medium text-gray-400 cursor-pointer hover:text-white"
                    onClick={() => toggleSort('total_expenditure')}
                  >
                    Expenditure {sortBy === 'total_expenditure' && (sortDir === 'desc' ? '↓' : '↑')}
                  </th>
                  <th
                    className="text-right p-3 font-medium text-gray-400 cursor-pointer hover:text-white"
                    onClick={() => toggleSort('total_revenue')}
                  >
                    Revenue {sortBy === 'total_revenue' && (sortDir === 'desc' ? '↓' : '↑')}
                  </th>
                  <th
                    className="text-right p-3 font-medium text-gray-400 cursor-pointer hover:text-white"
                    onClick={() => toggleSort('intergovernmental_revenue')}
                  >
                    Federal Aid {sortBy === 'intergovernmental_revenue' && (sortDir === 'desc' ? '↓' : '↑')}
                  </th>
                  <th
                    className="text-right p-3 font-medium text-gray-400 cursor-pointer hover:text-white"
                    onClick={() => toggleSort('public_welfare_expenditure')}
                  >
                    Welfare {sortBy === 'public_welfare_expenditure' && (sortDir === 'desc' ? '↓' : '↑')}
                  </th>
                  <th
                    className="text-right p-3 font-medium text-gray-400 cursor-pointer hover:text-white"
                    onClick={() => toggleSort('education_expenditure')}
                  >
                    Education {sortBy === 'education_expenditure' && (sortDir === 'desc' ? '↓' : '↑')}
                  </th>
                  <th
                    className="text-right p-3 font-medium text-gray-400 cursor-pointer hover:text-white"
                    onClick={() => toggleSort('expenditure_per_capita')}
                  >
                    Per Capita {sortBy === 'expenditure_per_capita' && (sortDir === 'desc' ? '↓' : '↑')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-gray-500">
                      Loading state budgets...
                    </td>
                  </tr>
                ) : budgets.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-gray-500">
                      No budget data found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  budgets.map((budget) => (
                    <tr key={budget.id} className="hover:bg-gray-900/50">
                      <td className="p-3">
                        <Link
                          href={`/state/${budget.state.toLowerCase()}`}
                          className="text-white hover:text-green-400"
                        >
                          {budget.state_name || budget.state}
                        </Link>
                      </td>
                      <td className="p-3 text-gray-400">
                        {budget.fiscal_year}
                      </td>
                      <td className="p-3 text-right font-mono text-green-500">
                        {formatMoney(budget.total_expenditure)}
                      </td>
                      <td className="p-3 text-right font-mono text-gray-400">
                        {formatMoney(budget.total_revenue)}
                      </td>
                      <td className="p-3 text-right font-mono text-cyan-500">
                        {formatMoney(budget.intergovernmental_revenue)}
                      </td>
                      <td className="p-3 text-right font-mono text-amber-500">
                        {formatMoney(budget.public_welfare_expenditure)}
                      </td>
                      <td className="p-3 text-right font-mono text-purple-400">
                        {formatMoney(budget.education_expenditure)}
                      </td>
                      <td className="p-3 text-right font-mono text-gray-400">
                        {budget.expenditure_per_capita ? `$${budget.expenditure_per_capita.toLocaleString()}` : '-'}
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

      {/* Info Section */}
      <div className="mt-8 pt-6 border-t border-gray-800">
        <p className="text-sm text-gray-500 mb-3">About State Finance Data</p>
        <div className="text-xs text-gray-600 space-y-2">
          <p>
            This data combines the U.S. Census Bureau&apos;s Annual Survey of State Government Finances
            with NASBO (National Association of State Budget Officers) State Expenditure Reports for the most current fiscal year data.
          </p>
          <p>
            <span className="text-gray-400">Intergovernmental revenue</span> represents federal aid received by states,
            including grants for Medicaid, education, transportation, and other programs.
          </p>
          <p>
            <span className="text-gray-400">Public welfare expenditure</span> includes spending on cash assistance,
            vendor payments, and other welfare services including Medicaid.
          </p>
          <p className="text-gray-500 mt-4">
            Sources: U.S. Census Bureau Annual Survey of State Government Finances, NASBO State Expenditure Report.
          </p>
        </div>
      </div>

      {/* Related Links */}
      <div className="mt-8 pt-6 border-t border-gray-800">
        <p className="text-sm text-gray-500 mb-3">Related Databases</p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/budgets"
            className="px-4 py-2 border border-gray-700 rounded text-sm text-gray-400 hover:text-white hover:border-gray-600"
          >
            Local Budgets
          </Link>
          <Link
            href="/ppp"
            className="px-4 py-2 border border-gray-700 rounded text-sm text-gray-400 hover:text-white hover:border-gray-600"
          >
            PPP Loans
          </Link>
          <Link
            href="/improper-payments"
            className="px-4 py-2 border border-gray-700 rounded text-sm text-gray-400 hover:text-white hover:border-gray-600"
          >
            Improper Payments
          </Link>
        </div>
      </div>
    </div>
  );
}
