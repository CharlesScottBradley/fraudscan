'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface BudgetState {
  id: string;
  name: string;
  jurisdiction_count: number;
  budget_count: number;
  total_org_count: number;
  total_ppp_amount: number;
  total_budget_expenditure: number;
  extracted_budget_count: number;
}

interface BudgetJurisdiction {
  id: string;
  name: string;
  type: string;
  state_id: string;
  state_name: string | null;
  population: number | null;
  org_count: number;
  ppp_loan_count: number;
  ppp_loan_total: number;
  childcare_count: number;
  total_budget_revenue: number | null;
  total_budget_expenditure: number | null;
  budget_fiscal_year: string | null;
  budget_confidence: number | null;
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

export default function BudgetsPage() {
  const [states, setStates] = useState<BudgetState[]>([]);
  const [jurisdictions, setJurisdictions] = useState<BudgetJurisdiction[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'states' | 'jurisdictions'>('states');

  // Filters
  const [selectedState, setSelectedState] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'county' | 'city'>('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'org_count' | 'ppp_loan_total' | 'population' | 'name' | 'total_budget_expenditure'>('total_budget_expenditure');
  const [showOnlyWithBudgets, setShowOnlyWithBudgets] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totals, setTotals] = useState({ states: 0, jurisdictions: 0, budgets: 0, orgs: 0, ppp: 0, budget_expenditure: 0, extracted_count: 0 });

  // Fetch states summary
  const fetchStates = useCallback(async () => {
    try {
      const res = await fetch('/api/budgets/states');
      if (!res.ok) throw new Error('Failed to fetch states');
      const data = await res.json();
      setStates(data.states || []);
      setTotals(data.totals || {});
    } catch (err) {
      console.error('States fetch error:', err);
    }
  }, []);

  // Fetch jurisdictions
  const fetchJurisdictions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '25',
        sortBy,
        sortDir: 'desc',
      });

      if (selectedState) params.set('state', selectedState);
      if (filterType !== 'all') params.set('type', filterType);
      if (search) params.set('search', search);
      if (showOnlyWithBudgets) params.set('hasBudgets', 'true');

      const res = await fetch(`/api/budgets?${params}`);
      if (!res.ok) throw new Error('Failed to fetch jurisdictions');
      const data = await res.json();
      setJurisdictions(data.jurisdictions || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Jurisdictions fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedState, filterType, search, sortBy, page, showOnlyWithBudgets]);

  useEffect(() => {
    fetchStates();
  }, [fetchStates]);

  useEffect(() => {
    if (view === 'jurisdictions' || selectedState) {
      fetchJurisdictions();
    }
  }, [view, selectedState, fetchJurisdictions]);

  const handleStateClick = (stateId: string) => {
    setSelectedState(stateId);
    setView('jurisdictions');
    setPage(1);
  };

  const handleBackToStates = () => {
    setSelectedState('');
    setView('states');
    setPage(1);
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/" className="hover:text-white">Home</Link>
          <span>/</span>
          <span className="text-white">Budget Documents</span>
        </div>
        <h1 className="text-2xl font-bold">Government Budget Documents</h1>
        <p className="text-gray-400 mt-1">
          Browse county and city budget documents linked to organizations and funding data
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="border border-gray-800 p-4">
          <p className="text-blue-500 font-mono text-xl font-bold">{totals.states}</p>
          <p className="text-gray-500 text-sm">States</p>
        </div>
        <div className="border border-gray-800 p-4">
          <p className="text-cyan-500 font-mono text-xl font-bold">{formatNumber(totals.jurisdictions)}</p>
          <p className="text-gray-500 text-sm">Jurisdictions</p>
        </div>
        <div className="border border-gray-800 p-4">
          <p className="text-amber-500 font-mono text-xl font-bold">{formatNumber(totals.extracted_count)}</p>
          <p className="text-gray-500 text-sm">Budgets Extracted</p>
        </div>
        <div className="border border-gray-800 p-4">
          <p className="text-green-500 font-mono text-xl font-bold">{formatMoney(totals.budget_expenditure)}</p>
          <p className="text-gray-500 text-sm">Total Expenditure</p>
        </div>
        <div className="border border-gray-800 p-4">
          <p className="text-purple-500 font-mono text-xl font-bold">{formatNumber(totals.budgets)}</p>
          <p className="text-gray-500 text-sm">Budget Docs</p>
        </div>
      </div>

      {/* View toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <button
            onClick={handleBackToStates}
            className={`px-4 py-2 text-sm rounded ${
              view === 'states' && !selectedState
                ? 'bg-gray-700 text-white'
                : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
            }`}
          >
            By State
          </button>
          <button
            onClick={() => { setView('jurisdictions'); setSelectedState(''); }}
            className={`px-4 py-2 text-sm rounded ${
              view === 'jurisdictions' && !selectedState
                ? 'bg-gray-700 text-white'
                : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
            }`}
          >
            All Jurisdictions
          </button>
        </div>

        {selectedState && (
          <button
            onClick={handleBackToStates}
            className="text-gray-400 hover:text-white text-sm"
          >
            ← Back to states
          </button>
        )}
      </div>

      {/* States view */}
      {view === 'states' && !selectedState && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {states.map((state) => (
            <button
              key={state.id}
              onClick={() => handleStateClick(state.id)}
              className="border border-gray-800 p-4 text-left hover:border-gray-600 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-lg">{state.name}</span>
                <span className="text-gray-500 text-xs uppercase">{state.id}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Jurisdictions:</span>
                  <span className="ml-2 text-cyan-400">{state.jurisdiction_count}</span>
                </div>
                <div>
                  <span className="text-gray-500">Extracted:</span>
                  <span className="ml-2 text-amber-400">{state.extracted_budget_count}</span>
                </div>
                <div>
                  <span className="text-gray-500">Total Budget:</span>
                  <span className="ml-2 text-green-400">{formatMoney(state.total_budget_expenditure)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Orgs:</span>
                  <span className="ml-2 text-purple-400">{formatNumber(state.total_org_count)}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Jurisdictions view */}
      {(view === 'jurisdictions' || selectedState) && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <input
              type="text"
              placeholder="Search jurisdictions..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm w-64 focus:outline-none focus:border-gray-500"
            />

            {!selectedState && (
              <select
                value={selectedState}
                onChange={(e) => { setSelectedState(e.target.value); setPage(1); }}
                className="px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm focus:outline-none"
              >
                <option value="">All States</option>
                {states.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            )}

            <div className="flex gap-1">
              <button
                onClick={() => { setFilterType('all'); setPage(1); }}
                className={`px-3 py-2 text-sm rounded ${
                  filterType === 'all' ? 'bg-gray-700 text-white' : 'bg-gray-900 text-gray-400'
                }`}
              >
                All
              </button>
              <button
                onClick={() => { setFilterType('county'); setPage(1); }}
                className={`px-3 py-2 text-sm rounded ${
                  filterType === 'county' ? 'bg-gray-700 text-white' : 'bg-gray-900 text-gray-400'
                }`}
              >
                Counties
              </button>
              <button
                onClick={() => { setFilterType('city'); setPage(1); }}
                className={`px-3 py-2 text-sm rounded ${
                  filterType === 'city' ? 'bg-gray-700 text-white' : 'bg-gray-900 text-gray-400'
                }`}
              >
                Cities
              </button>
            </div>

            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value as typeof sortBy); setPage(1); }}
              className="px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm focus:outline-none"
            >
              <option value="total_budget_expenditure">Sort by Budget</option>
              <option value="org_count">Sort by Orgs</option>
              <option value="ppp_loan_total">Sort by PPP</option>
              <option value="population">Sort by Population</option>
              <option value="name">Sort by Name</option>
            </select>

            <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={showOnlyWithBudgets}
                onChange={(e) => { setShowOnlyWithBudgets(e.target.checked); setPage(1); }}
                className="w-4 h-4 rounded bg-gray-800 border-gray-600 text-green-500 focus:ring-green-500 focus:ring-offset-0"
              />
              Only show extracted budgets
            </label>
          </div>

          {/* Table */}
          <div className="border border-gray-800 rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-900">
                <tr>
                  <th className="text-left p-3 font-medium text-gray-400">Jurisdiction</th>
                  <th className="text-left p-3 font-medium text-gray-400">State</th>
                  <th className="text-left p-3 font-medium text-gray-400">Type</th>
                  <th className="text-right p-3 font-medium text-gray-400">Population</th>
                  <th className="text-right p-3 font-medium text-gray-400">Budget</th>
                  <th className="text-right p-3 font-medium text-gray-400">FY</th>
                  <th className="text-right p-3 font-medium text-gray-400">Orgs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : jurisdictions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      No jurisdictions with extracted budgets found
                    </td>
                  </tr>
                ) : (
                  jurisdictions.map((j) => (
                    <tr key={j.id} className="hover:bg-gray-900/50">
                      <td className="p-3">
                        <Link
                          href={`/budgets/${j.id}`}
                          className="text-blue-400 hover:text-blue-300 font-medium"
                        >
                          {j.name}
                        </Link>
                      </td>
                      <td className="p-3 text-gray-400">
                        <Link
                          href={`/state/${j.state_id}`}
                          className="hover:text-white"
                        >
                          {j.state_name || j.state_id.toUpperCase()}
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
                        {formatMoney(j.total_budget_expenditure)}
                      </td>
                      <td className="p-3 text-right text-gray-400 text-xs">
                        {j.budget_fiscal_year || '-'}
                      </td>
                      <td className="p-3 text-right font-mono text-purple-400">
                        {formatNumber(j.org_count)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="px-4 py-2 bg-gray-800 rounded text-sm disabled:opacity-50 hover:bg-gray-700"
            >
              Previous
            </button>
            <span className="text-gray-500 text-sm">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
              className="px-4 py-2 bg-gray-800 rounded text-sm disabled:opacity-50 hover:bg-gray-700"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
