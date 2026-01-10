'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface StateBudget {
  id: string;
  fiscal_year: number;
  total_revenue: number | null;
  total_expenditure: number | null;
  intergovernmental_revenue: number | null;
  public_welfare_expenditure: number | null;
  education_expenditure: number | null;
  health_expenditure: number | null;
  hospitals_expenditure: number | null;
  highways_expenditure: number | null;
  police_expenditure: number | null;
  corrections_expenditure: number | null;
  tax_revenue: number | null;
  population: number | null;
  expenditure_per_capita: number | null;
  total_debt: number | null;
  welfare_pct: number | null;
  education_pct: number | null;
  intergovernmental_pct: number | null;
}

interface Props {
  stateCode: string;
  stateName: string;
}

function formatMoney(amount: number | null): string {
  if (!amount) return '-';
  if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(2)}B`;
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

function formatPercent(pct: number | null): string {
  if (!pct && pct !== 0) return '-';
  return `${pct.toFixed(1)}%`;
}

export default function StateBudgetSection({ stateCode, stateName }: Props) {
  const [budgets, setBudgets] = useState<StateBudget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        state: stateCode,
        pageSize: '10',
        sortBy: 'fiscal_year',
        sortDir: 'desc',
      });

      const res = await fetch(`/api/state-budgets?${params}`);
      if (!res.ok) {
        setError('No state budget data available');
        return;
      }

      const data = await res.json();
      setBudgets(data.budgets || []);
      if (data.budgets?.length > 0) {
        setSelectedYear(data.budgets[0].fiscal_year);
      }
      setError(null);
    } catch (err) {
      console.error('State budget fetch error:', err);
      setError('Failed to load state budget data');
    } finally {
      setLoading(false);
    }
  }, [stateCode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && budgets.length === 0) {
    return (
      <div className="mt-8">
        <h2 className="text-lg font-bold mb-4">State Budget</h2>
        <div className="border border-gray-800 p-8 text-center text-gray-500">
          Loading state budget data...
        </div>
      </div>
    );
  }

  if (error || budgets.length === 0) {
    return null; // Don't show section if error or no data
  }

  const currentBudget = budgets.find(b => b.fiscal_year === selectedYear) || budgets[0];

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">{stateName} State Budget</h2>
        {budgets.length > 1 && (
          <select
            value={selectedYear || ''}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-1 text-sm bg-gray-900 border border-gray-700 rounded focus:outline-none"
          >
            {budgets.map(b => (
              <option key={b.fiscal_year} value={b.fiscal_year}>
                FY {b.fiscal_year}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Summary stats - Terminal Style */}
      <div className="font-mono text-sm mb-6">
        <p className="text-gray-500">STATE_FINANCES_FY{currentBudget.fiscal_year}</p>
        <div className="mt-2 text-gray-400">
          <p><span className="text-gray-600">|-</span> total_expenditure <span className="text-green-500 ml-4">{formatMoney(currentBudget.total_expenditure)}</span></p>
          <p><span className="text-gray-600">|-</span> total_revenue <span className="text-white ml-4">{formatMoney(currentBudget.total_revenue)}</span></p>
          <p><span className="text-gray-600">|-</span> federal_aid <span className="text-cyan-500 ml-4">{formatMoney(currentBudget.intergovernmental_revenue)}</span> <span className="text-gray-600">({formatPercent(currentBudget.intergovernmental_pct)} of revenue)</span></p>
          <p><span className="text-gray-600">|-</span> state_debt <span className="text-red-400 ml-4">{formatMoney(currentBudget.total_debt)}</span></p>
          <p><span className="text-gray-600">|_</span> expenditure_per_capita <span className="text-white ml-4">{currentBudget.expenditure_per_capita ? `$${currentBudget.expenditure_per_capita.toLocaleString()}` : '-'}</span></p>
        </div>
      </div>

      {/* Expenditure breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="border border-gray-800 p-4">
          <p className="text-amber-500 font-mono text-lg font-bold">{formatMoney(currentBudget.public_welfare_expenditure)}</p>
          <p className="text-gray-500 text-xs mt-1">Public Welfare</p>
          <p className="text-gray-600 text-xs">{formatPercent(currentBudget.welfare_pct)} of spending</p>
        </div>
        <div className="border border-gray-800 p-4">
          <p className="text-purple-400 font-mono text-lg font-bold">{formatMoney(currentBudget.education_expenditure)}</p>
          <p className="text-gray-500 text-xs mt-1">Education</p>
          <p className="text-gray-600 text-xs">{formatPercent(currentBudget.education_pct)} of spending</p>
        </div>
        <div className="border border-gray-800 p-4">
          <p className="text-blue-400 font-mono text-lg font-bold">{formatMoney(currentBudget.health_expenditure)}</p>
          <p className="text-gray-500 text-xs mt-1">Health</p>
        </div>
        <div className="border border-gray-800 p-4">
          <p className="text-gray-300 font-mono text-lg font-bold">{formatMoney(currentBudget.highways_expenditure)}</p>
          <p className="text-gray-500 text-xs mt-1">Highways</p>
        </div>
      </div>

      {/* Additional categories */}
      <div className="border border-gray-800 rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-900">
            <tr>
              <th className="text-left p-3 font-medium text-gray-400">Category</th>
              <th className="text-right p-3 font-medium text-gray-400">Expenditure</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            <tr className="hover:bg-gray-900/50">
              <td className="p-3 text-gray-400">Hospitals</td>
              <td className="p-3 text-right font-mono text-white">{formatMoney(currentBudget.hospitals_expenditure)}</td>
            </tr>
            <tr className="hover:bg-gray-900/50">
              <td className="p-3 text-gray-400">Police Protection</td>
              <td className="p-3 text-right font-mono text-white">{formatMoney(currentBudget.police_expenditure)}</td>
            </tr>
            <tr className="hover:bg-gray-900/50">
              <td className="p-3 text-gray-400">Corrections</td>
              <td className="p-3 text-right font-mono text-white">{formatMoney(currentBudget.corrections_expenditure)}</td>
            </tr>
            <tr className="bg-gray-900/30">
              <td className="p-3 text-gray-300 font-medium">Tax Revenue</td>
              <td className="p-3 text-right font-mono text-green-400">{formatMoney(currentBudget.tax_revenue)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Population context */}
      {currentBudget.population && (
        <p className="mt-4 text-gray-600 text-xs">
          Population: {currentBudget.population.toLocaleString()} (FY {currentBudget.fiscal_year})
        </p>
      )}

      {/* Link to full page */}
      <div className="mt-4 pt-4 border-t border-gray-800 text-center">
        <Link
          href={`/state-budgets?state=${stateCode}`}
          className="text-blue-400 hover:text-blue-300 text-sm"
        >
          View detailed state finance data →
        </Link>
      </div>
    </div>
  );
}
