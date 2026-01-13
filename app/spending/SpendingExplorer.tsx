'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

interface SpendingRecipient {
  name: string;
  normalizedName: string | null;
  totalAmount: number;
  transactionCount: number;
  sources: string[];
  state: string | null;
  organizationId: string | null;
}

interface SpendingData {
  recipients: SpendingRecipient[];
  summary: {
    totalAmount: number;
    totalTransactions: number;
    uniqueRecipients: number;
    byCategory: Record<string, { amount: number; count: number }>;
  };
  filters: {
    level: string;
    category: string;
    state: string | null;
    yearStart: number | null;
    yearEnd: number | null;
  };
  availableFilters: {
    states: string[];
    years: number[];
    categories: string[];
  };
}

const LEVELS = [
  { id: 'all', label: 'All Levels' },
  { id: 'federal', label: 'Federal' },
  { id: 'state', label: 'State' },
];

const CATEGORIES = [
  { id: 'all', label: 'All Categories' },
  { id: 'checkbook', label: 'State Checkbook' },
  { id: 'federal_grants', label: 'Federal Grants' },
  { id: 'ppp', label: 'PPP Loans' },
  { id: 'sba', label: 'SBA Loans' },
  { id: 'open_payments', label: 'Open Payments' },
];

const CATEGORY_LABELS: Record<string, string> = {
  checkbook: 'State Checkbook',
  federal_grants: 'Federal Grants',
  ppp: 'PPP Loans',
  sba: 'SBA Loans',
  open_payments: 'Open Payments',
};

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
];

function formatMoney(amount: number): string {
  if (amount >= 1000000000000) return `$${(amount / 1000000000000).toFixed(2)}T`;
  if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(2)}B`;
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

function formatNumber(num: number): string {
  return num.toLocaleString();
}

export default function SpendingExplorer() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get initial values from URL
  const [level, setLevel] = useState(searchParams.get('level') || 'all');
  const [category, setCategory] = useState(searchParams.get('category') || 'all');
  const [state, setState] = useState(searchParams.get('state') || '');
  const [yearStart, setYearStart] = useState(searchParams.get('yearStart') || '');
  const [yearEnd, setYearEnd] = useState(searchParams.get('yearEnd') || '');

  const [data, setData] = useState<SpendingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Update URL when filters change
  const updateUrl = useCallback((params: Record<string, string>) => {
    const url = new URL(window.location.href);
    Object.entries(params).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== '') {
        url.searchParams.set(key, value);
      } else {
        url.searchParams.delete(key);
      }
    });
    router.replace(url.pathname + url.search, { scroll: false });
  }, [router]);

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (level !== 'all') params.set('level', level);
    if (category !== 'all') params.set('category', category);
    if (state) params.set('state', state);
    if (yearStart) params.set('yearStart', yearStart);
    if (yearEnd) params.set('yearEnd', yearEnd);
    params.set('limit', '50');

    try {
      const res = await fetch(`/api/spending?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch data');
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [level, category, state, yearStart, yearEnd]);

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchData();
    updateUrl({ level, category, state, yearStart, yearEnd });
  }, [fetchData, updateUrl, level, category, state, yearStart, yearEnd]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 p-4 border border-gray-800 bg-gray-900/50">
        {/* Level */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">Level</label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="bg-black border border-gray-700 text-white px-3 py-2 text-sm rounded focus:border-green-500 focus:outline-none"
          >
            {LEVELS.map(l => (
              <option key={l.id} value={l.id}>{l.label}</option>
            ))}
          </select>
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-black border border-gray-700 text-white px-3 py-2 text-sm rounded focus:border-green-500 focus:outline-none"
          >
            {CATEGORIES.map(c => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* State */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">State</label>
          <select
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="bg-black border border-gray-700 text-white px-3 py-2 text-sm rounded focus:border-green-500 focus:outline-none"
          >
            <option value="">All States</option>
            {US_STATES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Year Range */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">Year From</label>
          <select
            value={yearStart}
            onChange={(e) => setYearStart(e.target.value)}
            className="bg-black border border-gray-700 text-white px-3 py-2 text-sm rounded focus:border-green-500 focus:outline-none"
          >
            <option value="">Any</option>
            {[2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Year To</label>
          <select
            value={yearEnd}
            onChange={(e) => setYearEnd(e.target.value)}
            className="bg-black border border-gray-700 text-white px-3 py-2 text-sm rounded focus:border-green-500 focus:outline-none"
          >
            <option value="">Any</option>
            {[2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* Reset */}
        <div className="flex items-end">
          <button
            onClick={() => {
              setLevel('all');
              setCategory('all');
              setState('');
              setYearStart('');
              setYearEnd('');
            }}
            className="px-3 py-2 text-sm text-gray-400 hover:text-white border border-gray-700 rounded hover:border-gray-600"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 border border-red-800 bg-red-900/20 text-red-400">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-8 text-gray-500">
          Loading spending data...
        </div>
      )}

      {/* Data */}
      {!loading && data && (
        <>
          {/* Terminal-style Summary Stats */}
          <div className="font-mono text-sm mb-8">
            <p className="text-gray-500">SPENDING_DATABASE</p>
            <div className="mt-2 text-gray-400">
              <p><span className="text-gray-600">├─</span> total_tracked <span className="text-green-500 ml-4">{formatMoney(data.summary.totalAmount)}</span></p>
              <p><span className="text-gray-600">├─</span> transactions <span className="text-white ml-4">{formatNumber(data.summary.totalTransactions)}</span></p>
              <p><span className="text-gray-600">├─</span> recipients <span className="text-white ml-4">{formatNumber(data.summary.uniqueRecipients)}</span></p>
              <p><span className="text-gray-600">└─</span> data_sources <span className="text-white ml-4">{Object.keys(data.summary.byCategory).length}</span></p>
            </div>
          </div>

          {/* Category Breakdown - Terminal style */}
          {Object.keys(data.summary.byCategory).length > 1 && (
            <div className="font-mono text-sm mb-8">
              <p className="text-gray-500">BY_CATEGORY</p>
              <div className="mt-2 text-gray-400">
                {Object.entries(data.summary.byCategory).map(([cat, stats], idx, arr) => (
                  <p key={cat}>
                    <span className="text-gray-600">{idx === arr.length - 1 ? '└─' : '├─'}</span>
                    {' '}{cat.replace('_', ' ')}
                    <span className="text-green-500 ml-4">{formatMoney(stats.amount)}</span>
                    <span className="text-gray-600 ml-2">({formatNumber(stats.count)} rows)</span>
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Recipients Table */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-3">Top Recipients</h3>
            <div className="border border-gray-800 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="text-left p-3 font-medium text-gray-400">Recipient</th>
                    <th className="text-left p-3 font-medium text-gray-400">State</th>
                    <th className="text-right p-3 font-medium text-gray-400">Amount</th>
                    <th className="text-right p-3 font-medium text-gray-400">Count</th>
                    <th className="text-left p-3 font-medium text-gray-400">Sources</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {data.recipients.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500">
                        No data found for the selected filters
                      </td>
                    </tr>
                  ) : (
                    data.recipients.map((recipient, idx) => (
                      <tr key={idx} className="hover:bg-gray-900/50">
                        <td className="p-3">
                          {recipient.organizationId ? (
                            <Link
                              href={`/organizations/${recipient.organizationId}`}
                              className="text-white hover:text-green-400"
                            >
                              {recipient.name.length > 50
                                ? recipient.name.slice(0, 50) + '...'
                                : recipient.name}
                            </Link>
                          ) : (
                            <span className="text-white">
                              {recipient.name.length > 50
                                ? recipient.name.slice(0, 50) + '...'
                                : recipient.name}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-gray-400">{recipient.state || '-'}</td>
                        <td className="p-3 text-right font-mono text-green-500">
                          {formatMoney(recipient.totalAmount)}
                        </td>
                        <td className="p-3 text-right font-mono text-white">
                          {formatNumber(recipient.transactionCount)}
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {recipient.sources.map(src => (
                              <span
                                key={src}
                                className="px-1.5 py-0.5 text-xs bg-gray-800 text-gray-400 rounded"
                              >
                                {CATEGORY_LABELS[src] || src}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Data Sources Note */}
          <div className="text-xs text-gray-600 border-t border-gray-800 pt-4">
            <p>
              Data sources: State checkbook transactions (138M), Federal grants (5.2M),
              PPP loans (7.5M), SBA loans (1.8M), Open Payments (28M).
              Results limited to top 50 recipients per query.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
