'use client';

import { useState, useEffect, useCallback } from 'react';

interface SpendingOverview {
  source: string;
  total_amount: number;
  record_count: number;
  unique_recipients: number;
}

interface Props {
  stateCode: string;
  stateName: string;
}

function formatMoney(amount: number | null): string {
  if (!amount) return '$0';
  if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(2)}B`;
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

function formatCount(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toLocaleString();
}

const SOURCE_LABELS: Record<string, string> = {
  state_payments: 'state_payments',
  ppp_loans: 'ppp_loans',
  federal_grants: 'federal_grants',
  sba_loans: 'sba_loans',
};

export default function SpendingOverviewSection({ stateCode, stateName }: Props) {
  const [overview, setOverview] = useState<SpendingOverview[]>([]);
  const [totalTracked, setTotalTracked] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/state-spending?state=${stateCode}`);
      if (!res.ok) {
        setHasData(false);
        return;
      }

      const data = await res.json();

      if (!data.overview || data.overview.length === 0) {
        setHasData(false);
        return;
      }

      setOverview(data.overview);
      setTotalTracked(data.totalTracked || 0);
      setHasData(true);
    } catch (err) {
      console.error('Spending overview fetch error:', err);
      setHasData(false);
    } finally {
      setLoading(false);
    }
  }, [stateCode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return null;
  }

  if (!hasData || overview.length === 0) {
    return null;
  }

  return (
    <div className="mb-10">
      {/* Terminal-style stats */}
      <div className="font-mono text-sm">
        <p className="text-gray-500">{stateCode}_GOVERNMENT_SPENDING</p>
        <div className="mt-2 text-gray-400">
          {overview.map((item, index) => {
            const isLast = index === overview.length - 1;
            const connector = isLast ? '└─' : '├─';
            const sourceLabel = SOURCE_LABELS[item.source] || item.source;

            return (
              <p key={item.source}>
                <span className="text-gray-600">{connector}</span>{' '}
                <span className="inline-block w-36">{sourceLabel}</span>
                <span className="text-green-500 ml-4">{formatMoney(item.total_amount)}</span>
                <span className="text-gray-600 ml-4">
                  ({formatCount(item.record_count)} records)
                </span>
              </p>
            );
          })}
          <p className="mt-2 border-t border-gray-800 pt-2">
            <span className="text-gray-600">   </span>{' '}
            <span className="inline-block w-36 text-white">total_tracked</span>
            <span className="text-green-400 ml-4 font-bold">{formatMoney(totalTracked)}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
