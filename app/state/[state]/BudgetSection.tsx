'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface BudgetJurisdiction {
  id: string;
  name: string;
  type: string;
  state_id: string;
  population: number | null;
  org_count: number;
  ppp_loan_count: number;
  ppp_loan_total: number;
  childcare_count: number;
}

interface Props {
  stateCode: string;
  stateName: string;
}

function formatMoney(amount: number | null): string {
  if (!amount) return '-';
  if (amount >= 1000000000) {
    return `$${(amount / 1000000000).toFixed(2)}B`;
  }
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return `$${amount.toLocaleString()}`;
}

function formatNumber(num: number | null): string {
  if (!num) return '0';
  return num.toLocaleString();
}

export default function BudgetSection({ stateCode, stateName }: Props) {
  const [jurisdictions, setJurisdictions] = useState<BudgetJurisdiction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'county' | 'city'>('all');
  const [sortBy, setSortBy] = useState<'org_count' | 'ppp_loan_total' | 'population'>('org_count');
  const [totalStats, setTotalStats] = useState({ jurisdictions: 0, orgs: 0, ppp: 0 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        state: stateCode.toLowerCase(),
        pageSize: showAll ? '500' : '10',
        sortBy,
        sortDir: 'desc',
      });

      if (filterType !== 'all') {
        params.set('type', filterType);
      }

      const res = await fetch(`/api/budgets?${params}`);
      if (!res.ok) throw new Error('Failed to fetch budget data');

      const data = await res.json();
      setJurisdictions(data.jurisdictions || []);
      setTotalStats({
        jurisdictions: data.total || 0,
        orgs: data.stats?.totalOrgCount || 0,
        ppp: data.stats?.totalPPPAmount || 0,
      });
      setError(null);
    } catch (err) {
      console.error('Budget fetch error:', err);
      setError('Failed to load budget data');
    } finally {
      setLoading(false);
    }
  }, [stateCode, showAll, filterType, sortBy]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && jurisdictions.length === 0) {
    return (
      <div className="mt-8">
        <h2 className="text-lg font-bold mb-4">Budget Documents by Jurisdiction</h2>
        <div className="border border-gray-800 p-8 text-center text-gray-500">
          Loading budget data...
        </div>
      </div>
    );
  }

  if (error && jurisdictions.length === 0) {
    return null; // Don't show section if no data
  }

  if (totalStats.jurisdictions === 0) {
    return null; // No budget data for this state
  }

  return (
    <div className="mt-8">
      <h2 className="text-lg font-bold mb-4">Budget Documents by Jurisdiction</h2>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="border border-gray-800 p-3">
          <p className="text-blue-500 font-mono text-lg font-bold">
            {formatNumber(totalStats.jurisdictions)}
          </p>
          <p className="text-gray-500 text-xs">Counties & Cities</p>
        </div>
        <div className="border border-gray-800 p-3">
          <p className="text-green-500 font-mono text-lg font-bold">
            {formatNumber(totalStats.orgs)}
          </p>
          <p className="text-gray-500 text-xs">Organizations Linked</p>
        </div>
        <div className="border border-gray-800 p-3">
          <p className="text-purple-500 font-mono text-lg font-bold">
            {formatMoney(totalStats.ppp)}
          </p>
          <p className="text-gray-500 text-xs">PPP Loans</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex gap-1">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 text-xs rounded ${
              filterType === 'all' ? 'bg-gray-700 text-white' : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterType('county')}
            className={`px-3 py-1 text-xs rounded ${
              filterType === 'county' ? 'bg-gray-700 text-white' : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
            }`}
          >
            Counties
          </button>
          <button
            onClick={() => setFilterType('city')}
            className={`px-3 py-1 text-xs rounded ${
              filterType === 'city' ? 'bg-gray-700 text-white' : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
            }`}
          >
            Cities
          </button>
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="px-2 py-1 text-xs bg-gray-900 border border-gray-700 rounded focus:outline-none"
        >
          <option value="org_count">Sort by Orgs</option>
          <option value="ppp_loan_total">Sort by PPP</option>
          <option value="population">Sort by Population</option>
        </select>
      </div>

      {/* Jurisdictions table */}
      <div className="border border-gray-800 rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-900">
            <tr>
              <th className="text-left p-3 font-medium text-gray-400">Jurisdiction</th>
              <th className="text-left p-3 font-medium text-gray-400">Type</th>
              <th className="text-right p-3 font-medium text-gray-400">Population</th>
              <th className="text-right p-3 font-medium text-gray-400">Orgs</th>
              <th className="text-right p-3 font-medium text-gray-400">PPP Loans</th>
              <th className="text-right p-3 font-medium text-gray-400">PPP Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {jurisdictions.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  No jurisdictions found
                </td>
              </tr>
            ) : (
              jurisdictions.map((j) => (
                <tr key={j.id} className="hover:bg-gray-900/50">
                  <td className="p-3">
                    <Link
                      href={`/budgets/${j.id}`}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      {j.name}
                    </Link>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      j.type === 'county'
                        ? 'bg-amber-900/40 text-amber-400'
                        : 'bg-cyan-900/40 text-cyan-400'
                    }`}>
                      {j.type}
                    </span>
                  </td>
                  <td className="p-3 text-right text-gray-400 font-mono">
                    {j.population ? j.population.toLocaleString() : '-'}
                  </td>
                  <td className="p-3 text-right font-mono text-green-500">
                    {formatNumber(j.org_count)}
                  </td>
                  <td className="p-3 text-right font-mono text-gray-400">
                    {formatNumber(j.ppp_loan_count)}
                  </td>
                  <td className="p-3 text-right font-mono text-purple-400">
                    {formatMoney(j.ppp_loan_total)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Show more/less */}
      {totalStats.jurisdictions > 10 && (
        <div className="mt-3 text-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-gray-400 hover:text-white text-sm"
          >
            {showAll
              ? '← Show less'
              : `View all ${totalStats.jurisdictions} jurisdictions in ${stateName} →`
            }
          </button>
        </div>
      )}

      {/* Link to full budgets page */}
      <div className="mt-4 pt-4 border-t border-gray-800 text-center">
        <Link
          href={`/budgets?state=${stateCode.toLowerCase()}`}
          className="text-blue-400 hover:text-blue-300 text-sm"
        >
          Explore all budget documents in {stateName} →
        </Link>
      </div>
    </div>
  );
}
