'use client';

import { useState, useEffect, useCallback } from 'react';

interface AgencyBudget {
  agency_name: string;
  total_appropriated: number;
  item_count: number;
  programs: string[];
}

interface LineItem {
  id: string;
  agency_name: string;
  program_name: string;
  fund_type: string;
  amount_appropriated: number;
  amount_budgeted: number;
  amount_prior_year: number;
  source_page: number;
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

export default function AppropriationsSection({ stateCode, stateName }: Props) {
  const [agencies, setAgencies] = useState<AgencyBudget[]>([]);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAgency, setSelectedAgency] = useState<string | null>(null);
  const [totalAppropriated, setTotalAppropriated] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all line items for this state
      const params = new URLSearchParams({
        state: stateCode,
        pageSize: '100',
        sortBy: 'amount_appropriated',
        sortDir: 'desc',
      });

      const res = await fetch(`/api/state-budget-line-items?${params}`);
      if (!res.ok) {
        setError('No appropriations data available');
        return;
      }

      const data = await res.json();
      const records = data.records || [];

      if (records.length === 0) {
        setError('No appropriations data');
        return;
      }

      // Aggregate by agency
      const agencyMap: Record<string, AgencyBudget> = {};
      let total = 0;

      records.forEach((item: LineItem) => {
        const agency = item.agency_name || 'Unknown';
        if (!agencyMap[agency]) {
          agencyMap[agency] = {
            agency_name: agency,
            total_appropriated: 0,
            item_count: 0,
            programs: [],
          };
        }
        agencyMap[agency].total_appropriated += item.amount_appropriated || 0;
        agencyMap[agency].item_count += 1;
        if (item.program_name && !agencyMap[agency].programs.includes(item.program_name)) {
          agencyMap[agency].programs.push(item.program_name);
        }
        total += item.amount_appropriated || 0;
      });

      const sortedAgencies = Object.values(agencyMap)
        .sort((a, b) => b.total_appropriated - a.total_appropriated);

      setAgencies(sortedAgencies);
      setLineItems(records);
      setTotalAppropriated(total);
      setTotalItems(data.total || records.length);
      setError(null);
    } catch (err) {
      console.error('Appropriations fetch error:', err);
      setError('Failed to load appropriations data');
    } finally {
      setLoading(false);
    }
  }, [stateCode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && agencies.length === 0) {
    return (
      <div className="mt-8">
        <h2 className="text-lg font-bold mb-4">Budget Appropriations</h2>
        <div className="border border-gray-800 p-8 text-center text-gray-500">
          Loading appropriations data...
        </div>
      </div>
    );
  }

  if (error || agencies.length === 0) {
    return null;
  }

  const filteredLineItems = selectedAgency
    ? lineItems.filter(item => item.agency_name === selectedAgency)
    : [];

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">{stateName} Budget Appropriations</h2>
        <span className="text-gray-500 text-sm">
          {totalItems.toLocaleString()} line items | {formatMoney(totalAppropriated)} biennial
        </span>
      </div>

      {/* Summary stats - Terminal Style */}
      <div className="font-mono text-sm mb-6">
        <p className="text-gray-500">BUDGET_APPROPRIATIONS_FY2024-25</p>
        <div className="mt-2 text-gray-400">
          <p><span className="text-gray-600">├─</span> total_appropriated <span className="text-green-500 ml-4">{formatMoney(totalAppropriated)}</span></p>
          <p><span className="text-gray-600">├─</span> agencies <span className="text-white ml-4">{agencies.length}</span></p>
          <p><span className="text-gray-600">└─</span> line_items <span className="text-white ml-4">{totalItems.toLocaleString()}</span></p>
        </div>
      </div>

      {/* Top agencies grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {agencies.slice(0, 4).map((agency, idx) => {
          const pct = ((agency.total_appropriated / totalAppropriated) * 100).toFixed(1);
          const colors = ['text-green-500', 'text-blue-400', 'text-purple-400', 'text-amber-500'];
          return (
            <div
              key={agency.agency_name}
              className="border border-gray-800 p-4 cursor-pointer hover:border-gray-600 transition-colors"
              onClick={() => setSelectedAgency(selectedAgency === agency.agency_name ? null : agency.agency_name)}
            >
              <p className={`font-mono text-lg font-bold ${colors[idx]}`}>
                {formatMoney(agency.total_appropriated)}
              </p>
              <p className="text-gray-400 text-xs mt-1 truncate" title={agency.agency_name}>
                {agency.agency_name.length > 30
                  ? agency.agency_name.substring(0, 30) + '...'
                  : agency.agency_name
                }
              </p>
              <p className="text-gray-600 text-xs">{pct}% of total</p>
            </div>
          );
        })}
      </div>

      {/* Agency list table */}
      <div className="border border-gray-800 rounded overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead className="bg-gray-900">
            <tr>
              <th className="text-left p-3 font-medium text-gray-400">Agency</th>
              <th className="text-right p-3 font-medium text-gray-400">Items</th>
              <th className="text-right p-3 font-medium text-gray-400">Appropriated</th>
              <th className="text-right p-3 font-medium text-gray-400">% Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {agencies.slice(0, 15).map((agency) => {
              const pct = ((agency.total_appropriated / totalAppropriated) * 100).toFixed(1);
              const isSelected = selectedAgency === agency.agency_name;
              return (
                <tr
                  key={agency.agency_name}
                  className={`cursor-pointer transition-colors ${isSelected ? 'bg-gray-800' : 'hover:bg-gray-900/50'}`}
                  onClick={() => setSelectedAgency(isSelected ? null : agency.agency_name)}
                >
                  <td className="p-3 text-gray-300">
                    <span className="mr-2">{isSelected ? '▼' : '▶'}</span>
                    {agency.agency_name}
                  </td>
                  <td className="p-3 text-right text-gray-500">{agency.item_count}</td>
                  <td className="p-3 text-right font-mono text-green-500">{formatMoney(agency.total_appropriated)}</td>
                  <td className="p-3 text-right text-gray-500">{pct}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Expanded line items for selected agency */}
      {selectedAgency && filteredLineItems.length > 0 && (
        <div className="border border-gray-700 rounded overflow-hidden bg-gray-900/50 mb-6">
          <div className="px-4 py-3 bg-gray-800 border-b border-gray-700">
            <h3 className="font-bold text-white">{selectedAgency}</h3>
            <p className="text-gray-500 text-xs">{filteredLineItems.length} line items</p>
          </div>
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-900 sticky top-0">
                <tr>
                  <th className="text-left p-3 font-medium text-gray-400">Program/Strategy</th>
                  <th className="text-left p-3 font-medium text-gray-400">Fund Type</th>
                  <th className="text-right p-3 font-medium text-gray-400">Biennial</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredLineItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-800/50">
                    <td className="p-3 text-gray-300 text-xs">
                      {item.program_name || 'General'}
                    </td>
                    <td className="p-3 text-gray-500 text-xs">
                      {item.fund_type || '-'}
                    </td>
                    <td className="p-3 text-right font-mono text-green-400 text-xs">
                      {formatMoney(item.amount_appropriated)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Data source note */}
      <p className="text-gray-600 text-xs">
        Source: Legislative Budget Board FY2024-25 Appropriations. Click an agency to see line items.
      </p>
    </div>
  );
}
