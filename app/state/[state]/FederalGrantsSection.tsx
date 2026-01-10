'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface FederalGrant {
  id: string;
  award_id: string;
  recipient_name: string;
  recipient_city: string | null;
  award_amount: number;
  awarding_agency: string | null;
  cfda_title: string | null;
  award_date: string | null;
  fiscal_year: number | null;
  is_fraud_prone_industry: boolean;
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

function formatNumber(num: number | null): string {
  if (!num) return '0';
  return num.toLocaleString();
}

export default function FederalGrantsSection({ stateCode, stateName }: Props) {
  const [grants, setGrants] = useState<FederalGrant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [totalStats, setTotalStats] = useState({ total: 0, totalAmount: 0, fraudProneCount: 0 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        state: stateCode,
        pageSize: showAll ? '100' : '10',
        sortBy: 'award_amount',
        sortDir: 'desc',
      });

      const res = await fetch(`/api/grants?${params}`);
      if (!res.ok) {
        setError('No federal grants data available');
        return;
      }

      const data = await res.json();
      setGrants(data.grants || []);
      setTotalStats({
        total: data.total || 0,
        totalAmount: data.stats?.totalAmount || 0,
        fraudProneCount: data.stats?.fraudProneCount || 0,
      });
      setError(null);
    } catch (err) {
      console.error('Federal grants fetch error:', err);
      setError('Failed to load federal grants');
    } finally {
      setLoading(false);
    }
  }, [stateCode, showAll]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && grants.length === 0) {
    return (
      <div className="mt-8">
        <h2 className="text-lg font-bold mb-4">Federal Grants</h2>
        <div className="border border-gray-800 p-8 text-center text-gray-500">
          Loading federal grants...
        </div>
      </div>
    );
  }

  if (error || totalStats.total === 0) {
    return null; // Don't show section if error or no data
  }

  return (
    <div className="mt-8">
      <h2 className="text-lg font-bold mb-4">Federal Grants to {stateName}</h2>

      {/* Summary stats - Terminal Style */}
      <div className="font-mono text-sm mb-6">
        <p className="text-gray-500">FEDERAL_GRANTS</p>
        <div className="mt-2 text-gray-400">
          <p><span className="text-gray-600">|-</span> grants_awarded <span className="text-white ml-4">{formatNumber(totalStats.total)}</span></p>
          <p><span className="text-gray-600">|-</span> total_amount <span className="text-green-500 ml-4">{formatMoney(totalStats.totalAmount)}</span></p>
          <p><span className="text-gray-600">|_</span> fraud_prone_industries <span className="text-white ml-4">{formatNumber(totalStats.fraudProneCount)}</span></p>
        </div>
      </div>

      {/* Grants table */}
      <div className="border border-gray-800 rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-900">
            <tr>
              <th className="text-left p-3 font-medium text-gray-400">Recipient</th>
              <th className="text-left p-3 font-medium text-gray-400">City</th>
              <th className="text-right p-3 font-medium text-gray-400">Amount</th>
              <th className="text-left p-3 font-medium text-gray-400">Agency</th>
              <th className="text-left p-3 font-medium text-gray-400">Program</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {grants.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">
                  No federal grants found
                </td>
              </tr>
            ) : (
              grants.map((g) => (
                <tr key={g.id} className="hover:bg-gray-900/50">
                  <td className="p-3">
                    <Link
                      href={`/federal-grants/${g.award_id}`}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      {g.recipient_name}
                    </Link>
                    {g.is_fraud_prone_industry && (
                      <span className="ml-2 text-gray-500 text-xs">flagged</span>
                    )}
                  </td>
                  <td className="p-3 text-gray-500 text-xs">
                    {g.recipient_city || '-'}
                  </td>
                  <td className="p-3 text-right font-mono text-green-500">
                    {formatMoney(g.award_amount)}
                  </td>
                  <td className="p-3 text-gray-500 text-xs max-w-[120px] truncate">
                    {g.awarding_agency || '-'}
                  </td>
                  <td className="p-3 text-gray-500 text-xs max-w-[150px] truncate">
                    {g.cfda_title || '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Show more/less */}
      {totalStats.total > 10 && (
        <div className="mt-3 text-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-gray-400 hover:text-white text-sm"
          >
            {showAll
              ? '← Show less'
              : `View top ${Math.min(100, totalStats.total)} grants →`
            }
          </button>
        </div>
      )}

      {/* Link to full page */}
      <div className="mt-4 pt-4 border-t border-gray-800 text-center">
        <Link
          href={`/federal-grants?state=${stateCode}`}
          className="text-blue-400 hover:text-blue-300 text-sm"
        >
          Explore all {formatNumber(totalStats.total)} federal grants in {stateName} →
        </Link>
      </div>
    </div>
  );
}
