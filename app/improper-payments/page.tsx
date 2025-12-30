'use client';

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ImproperPayment {
  id: string;
  program_name: string;
  program_acronym: string | null;
  agency: string;
  sub_agency: string | null;
  fiscal_year: number;
  total_outlays: number | null;
  improper_payment_amount: number | null;
  improper_payment_rate: number | null;
  overpayment_amount: number | null;
  underpayment_amount: number | null;
  is_high_priority: boolean;
}

interface PaymentScorecard {
  program_name: string;
  agency: string;
  fiscal_year: number;
  fiscal_quarter: number;
  scorecard_url: string;
}

interface Stats {
  totalImproperPayments: number;
  totalPrograms: number;
  yearsOfData: number;
  topAgencies: Array<{ agency: string; total: number }>;
  trendByYear: Array<{ year: number; total: number; count: number }>;
}

function formatMoney(amount: number | null): string {
  if (!amount) return '-';
  if (amount >= 1000000000000) return `$${(amount / 1000000000000).toFixed(2)}T`;
  if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(2)}B`;
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

function formatRate(rate: number | null): string {
  if (!rate) return '-';
  return `${rate.toFixed(2)}%`;
}

export default function ImproperPaymentsPage() {
  const [payments, setPayments] = useState<ImproperPayment[]>([]);
  const [scorecards, setScorecards] = useState<PaymentScorecard[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'fiscal_year' | 'improper_payment_amount' | 'improper_payment_rate'>('fiscal_year');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [filterAgency, setFilterAgency] = useState('');
  const [filterProgram, setFilterProgram] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/improper-payments');
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      if (!data || !data.payments) {
        throw new Error('Invalid response format');
      }
      setPayments(data.payments);
      setScorecards(data.scorecards || []);
      setStats(data.stats);
    } catch (err) {
      console.error('Failed to fetch improper payments:', err);
      setError('Failed to load improper payments data. Please try again.');
      setPayments([]);
      setScorecards([]);
    } finally {
      setLoading(false);
    }
  };

  const sortedPayments = [...payments].sort((a, b) => {
    const aVal = a[sortField] || 0;
    const bVal = b[sortField] || 0;
    return sortDir === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
  });

  const filteredPayments = sortedPayments.filter((p) => {
    if (filterAgency && !p.agency?.toLowerCase().includes(filterAgency.toLowerCase())) {
      return false;
    }
    if (filterProgram && !p.program_name?.toLowerCase().includes(filterProgram.toLowerCase())) {
      return false;
    }
    return true;
  });

  const agencies = Array.from(new Set(payments.map(p => p.agency).filter(Boolean))).sort();

  if (loading) {
    return (
      <div className="py-20 text-center">
        <p className="text-gray-500">Loading improper payments data...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Terminal-style stats header */}
      <div className="font-mono text-sm mb-10">
        <p className="text-gray-500">IMPROPER_PAYMENTS_DATABASE</p>
        <div className="mt-2 text-gray-400">
          <p><span className="text-gray-600">├─</span> total_improper <span className="text-green-500 ml-4">{stats ? formatMoney(stats.totalImproperPayments) : '-'}</span></p>
          <p><span className="text-gray-600">├─</span> programs_tracked <span className="text-white ml-4">{stats?.totalPrograms?.toLocaleString() || '-'}</span></p>
          <p><span className="text-gray-600">├─</span> years_of_data <span className="text-white ml-4">{stats?.yearsOfData || '-'}</span></p>
          <p><span className="text-gray-600">└─</span> source <span className="text-white ml-4">PaymentAccuracy.gov</span></p>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="border border-gray-800 p-8 text-center mb-8">
          <p className="text-gray-400">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 border border-gray-700 rounded text-sm text-gray-400 hover:text-white"
          >
            Retry
          </button>
        </div>
      )}

      {/* Line Chart - Trend Over Time */}
      {!error && stats && stats.trendByYear.length > 0 && (
        <div className="mb-10 border border-gray-800 p-6">
          <h2 className="text-lg font-bold mb-4">Improper Payment Trends Over Time</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.trendByYear}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="year"
                stroke="#6b7280"
                tick={{ fill: '#6b7280' }}
              />
              <YAxis
                stroke="#6b7280"
                tick={{ fill: '#6b7280' }}
                tickFormatter={(value) => formatMoney(value)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#000',
                  border: '1px solid #374151',
                  borderRadius: '4px',
                }}
                labelStyle={{ color: '#fff' }}
                formatter={(value) => [formatMoney(Number(value)), 'Total']}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#22c55e"
                strokeWidth={2}
                dot={{ fill: '#22c55e', r: 3 }}
                name="Improper Payments"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Bar Chart - Top 10 Agencies */}
      {!error && stats && stats.topAgencies.length > 0 && (
        <div className="mb-10 border border-gray-800 p-6">
          <h2 className="text-lg font-bold mb-4">Top 10 Agencies by Improper Payment Amount</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={stats.topAgencies} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                type="number"
                stroke="#6b7280"
                tick={{ fill: '#6b7280' }}
                tickFormatter={(value) => formatMoney(value)}
              />
              <YAxis
                type="category"
                dataKey="agency"
                stroke="#6b7280"
                tick={{ fill: '#6b7280' }}
                width={150}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#000',
                  border: '1px solid #374151',
                  borderRadius: '4px',
                }}
                labelStyle={{ color: '#fff' }}
                formatter={(value) => [formatMoney(Number(value)), 'Total']}
              />
              <Bar dataKey="total" fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Filters */}
      {!error && (
        <div className="mb-6 flex flex-wrap gap-4 text-sm">
          <div>
            <label className="block text-gray-500 text-xs mb-1">Agency</label>
            <select
              value={filterAgency}
              onChange={(e) => setFilterAgency(e.target.value)}
              className="bg-black border border-gray-700 rounded px-3 py-2 focus:outline-none focus:border-gray-500"
            >
              <option value="">All Agencies</option>
              {agencies.map((agency) => (
                <option key={agency} value={agency}>
                  {agency}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-500 text-xs mb-1">Program</label>
            <input
              type="text"
              value={filterProgram}
              onChange={(e) => setFilterProgram(e.target.value)}
              placeholder="Search programs..."
              className="bg-black border border-gray-700 rounded px-3 py-2 focus:outline-none focus:border-gray-500"
            />
          </div>
        </div>
      )}

      {/* Data Table */}
      {!error && (
        <div className="border border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-900">
                <tr>
                  <th className="text-left p-3 font-medium text-gray-400">
                    <button
                      onClick={() => {
                        if (sortField === 'fiscal_year') {
                          setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortField('fiscal_year');
                          setSortDir('desc');
                        }
                      }}
                      className="hover:text-white"
                    >
                      FY {sortField === 'fiscal_year' && (sortDir === 'asc' ? '↑' : '↓')}
                    </button>
                  </th>
                  <th className="text-left p-3 font-medium text-gray-400">Agency</th>
                  <th className="text-left p-3 font-medium text-gray-400">Program</th>
                  <th className="text-right p-3 font-medium text-gray-400">
                    <button
                      onClick={() => {
                        if (sortField === 'improper_payment_amount') {
                          setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortField('improper_payment_amount');
                          setSortDir('desc');
                        }
                      }}
                      className="hover:text-white"
                    >
                      Amount {sortField === 'improper_payment_amount' && (sortDir === 'asc' ? '↑' : '↓')}
                    </button>
                  </th>
                  <th className="text-right p-3 font-medium text-gray-400">
                    <button
                      onClick={() => {
                        if (sortField === 'improper_payment_rate') {
                          setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortField('improper_payment_rate');
                          setSortDir('desc');
                        }
                      }}
                      className="hover:text-white"
                    >
                      Rate {sortField === 'improper_payment_rate' && (sortDir === 'asc' ? '↑' : '↓')}
                    </button>
                  </th>
                  <th className="text-right p-3 font-medium text-gray-400">Outlays</th>
                  <th className="text-center p-3 font-medium text-gray-400">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-gray-500">
                      No payments found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.slice(0, 100).map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-900/50">
                      <td className="p-3 text-white font-mono">{payment.fiscal_year}</td>
                      <td className="p-3 text-gray-400">
                        {payment.agency}
                        {payment.sub_agency && (
                          <span className="text-gray-600 text-xs block">{payment.sub_agency}</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="text-white">{payment.program_name}</span>
                        {payment.program_acronym && (
                          <span className="text-gray-500 text-xs ml-2">({payment.program_acronym})</span>
                        )}
                      </td>
                      <td className="p-3 text-right font-mono text-green-500">
                        {formatMoney(payment.improper_payment_amount)}
                      </td>
                      <td className="p-3 text-right font-mono text-gray-400">
                        {formatRate(payment.improper_payment_rate)}
                      </td>
                      <td className="p-3 text-right font-mono text-gray-500">
                        {formatMoney(payment.total_outlays)}
                      </td>
                      <td className="p-3 text-center text-gray-500 text-xs">
                        {payment.is_high_priority ? 'High' : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!error && filteredPayments.length > 100 && (
        <div className="mt-4 text-center text-gray-500 text-sm">
          Showing first 100 of {filteredPayments.length.toLocaleString()} records
        </div>
      )}

      {/* Quarterly Scorecards */}
      {!error && scorecards.length > 0 && (
        <div className="mt-10 pt-8 border-t border-gray-800">
          <h2 className="text-lg font-bold mb-2">Recent Quarterly Payment Integrity Scorecards</h2>
          <p className="text-gray-500 text-sm mb-6">
            Detailed quarterly reports on improper payment root causes, mitigation strategies, and recovery efforts
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scorecards.slice(0, 12).map((scorecard, idx) => (
              <a
                key={idx}
                href={scorecard.scorecard_url}
                target="_blank"
                rel="noopener noreferrer"
                className="border border-gray-800 p-4 hover:border-gray-600 group"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs text-gray-500">
                    FY{scorecard.fiscal_year} Q{scorecard.fiscal_quarter}
                  </span>
                  <svg
                    className="w-4 h-4 text-gray-600 group-hover:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </div>
                <p className="text-white text-sm mb-1 group-hover:text-green-400">
                  {scorecard.program_name.length > 60
                    ? scorecard.program_name.substring(0, 60) + '...'
                    : scorecard.program_name}
                </p>
                <p className="text-gray-600 text-xs">{scorecard.agency}</p>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Data Sources */}
      <div className="mt-10 pt-8 border-t border-gray-800 text-sm text-gray-500">
        <p className="text-gray-400 mb-2">Data Sources</p>
        <ul className="space-y-1">
          <li>
            <a
              href="https://www.paymentaccuracy.gov/payment-accuracy-high-priority-programs/"
              className="text-green-500 hover:text-green-400"
              target="_blank"
              rel="noopener noreferrer"
            >
              PaymentAccuracy.gov
            </a>
            {' '}- High-priority program improper payment data (FY2004-2024)
          </li>
          <li>
            {stats && (
              <span className="text-gray-600">
                {stats.totalPrograms} programs tracked across {stats.yearsOfData} years
              </span>
            )}
          </li>
          {scorecards.length > 0 && (
            <li>
              <span className="text-gray-600">
                {scorecards.length} quarterly scorecards available (FY2024-2025)
              </span>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
