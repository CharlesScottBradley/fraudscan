'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface CheckbookRecord {
  id: number;
  vendor_name: string;
  amount: number;
  agency: string | null;
  fiscal_year: number | null;
  expenditure_category: string | null;
}

interface CheckbookStats {
  totalAmount: number;
  recordCount: number;
  uniqueVendors: number;
  uniqueAgencies: number;
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

export default function CheckbookSection({ stateCode, stateName }: Props) {
  const [records, setRecords] = useState<CheckbookRecord[]>([]);
  const [stats, setStats] = useState<CheckbookStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch top records and stats for this state
      const params = new URLSearchParams({
        state: stateCode,
        pageSize: '10',
        sortBy: 'amount',
        sortDir: 'desc',
      });

      const res = await fetch(`/api/state-checkbook?${params}`);
      if (!res.ok) {
        setHasData(false);
        return;
      }

      const data = await res.json();

      if (!data.records || data.records.length === 0) {
        setHasData(false);
        return;
      }

      setRecords(data.records);
      setStats(data.stats);
      setHasData(true);
    } catch (err) {
      console.error('Checkbook fetch error:', err);
      setHasData(false);
    } finally {
      setLoading(false);
    }
  }, [stateCode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Don't render section if no data
  if (loading) {
    return null; // Don't show loading state, just hide if no data
  }

  if (!hasData || !stats || stats.recordCount === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">{stateName} State Checkbook</h2>
        <Link
          href={`/checkbook?state=${stateCode}`}
          className="text-blue-400 hover:text-blue-300 text-sm"
        >
          View all transactions →
        </Link>
      </div>

      {/* Summary stats - Terminal Style */}
      <div className="font-mono text-sm mb-6">
        <p className="text-gray-500">{stateCode}_VENDOR_PAYMENTS</p>
        <div className="mt-2 text-gray-400">
          <p><span className="text-gray-600">├─</span> total_spent <span className="text-green-500 ml-4">{formatMoney(stats.totalAmount)}</span></p>
          <p><span className="text-gray-600">├─</span> transactions <span className="text-white ml-4">{stats.recordCount.toLocaleString()}</span></p>
          <p><span className="text-gray-600">├─</span> unique_vendors <span className="text-white ml-4">{stats.uniqueVendors.toLocaleString()}</span></p>
          <p><span className="text-gray-600">└─</span> unique_agencies <span className="text-white ml-4">{stats.uniqueAgencies.toLocaleString()}</span></p>
        </div>
      </div>

      {/* Top vendor payments */}
      <div className="border border-gray-800 rounded overflow-hidden">
        <div className="bg-gray-900 px-4 py-2 border-b border-gray-800">
          <span className="text-gray-400 text-sm">Largest vendor payments</span>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-900/50">
            <tr>
              <th className="text-left p-3 font-medium text-gray-400">Vendor</th>
              <th className="text-left p-3 font-medium text-gray-400 hidden md:table-cell">Agency</th>
              <th className="text-right p-3 font-medium text-gray-400">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {records.map((record) => (
              <tr key={record.id} className="hover:bg-gray-900/50">
                <td className="p-3">
                  <span className="text-white">{record.vendor_name || 'Unknown Vendor'}</span>
                  {record.fiscal_year && (
                    <span className="text-gray-600 text-xs ml-2">FY{record.fiscal_year}</span>
                  )}
                </td>
                <td className="p-3 text-gray-400 hidden md:table-cell truncate max-w-[200px]">
                  {record.agency || '-'}
                </td>
                <td className="p-3 text-right font-mono text-green-400">
                  {formatMoney(record.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Data source note */}
      <p className="mt-4 text-gray-600 text-xs">
        Source: {stateName} State Comptroller / Open Checkbook Data
      </p>
    </div>
  );
}
