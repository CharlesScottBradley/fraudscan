'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface SpendingOverview {
  source: string;
  total_amount: number;
  record_count: number;
  unique_recipients: number;
}

interface TopRecipient {
  recipient_name: string;
  organization_id: string | null;
  state_payments: number;
  ppp_amount: number;
  federal_grants: number;
  sba_amount: number;
  total_funding: number;
}

interface Props {
  stateCode: string;
  stateName: string;
}

function formatMoney(amount: number | null): string {
  if (!amount || amount === 0) return '-';
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

// State spending = money from state treasury
const STATE_SOURCES = ['state_payments'];

// Federal programs = money from federal government (separate tracking)
const FEDERAL_SOURCES = ['ppp_loans', 'sba_loans'];

// Pass-through = federal money administered by states
const PASSTHROUGH_SOURCES = ['federal_grants'];

const SOURCE_LABELS: Record<string, string> = {
  state_payments: 'vendor_payments',
  federal_grants: 'federal_grants',
};

export default function StateSpendingWrapper({ stateCode, stateName }: Props) {
  const [overview, setOverview] = useState<SpendingOverview[]>([]);
  const [recipients, setRecipients] = useState<TopRecipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);
  const [showAll, setShowAll] = useState(false);

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
      setRecipients(data.topRecipients || []);
      setHasData(true);
    } catch (err) {
      console.error('State spending fetch error:', err);
      setHasData(false);
    } finally {
      setLoading(false);
    }
  }, [stateCode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="mb-10 font-mono text-sm text-gray-500">
        Loading spending data...
      </div>
    );
  }

  if (!hasData) {
    return null;
  }

  // Separate state spending from federal programs
  const stateSpending = overview.filter(o => STATE_SOURCES.includes(o.source));
  const passThrough = overview.filter(o => PASSTHROUGH_SOURCES.includes(o.source));

  // Calculate totals
  const stateTotal = stateSpending.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
  const passThroughTotal = passThrough.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

  // Only show recipients with state payments
  const stateRecipients = recipients.filter(r => r.state_payments > 0);
  const displayRecipients = showAll ? stateRecipients : stateRecipients.slice(0, 10);

  // Don't show if no state spending data
  if (stateTotal === 0 && passThroughTotal === 0) {
    return null;
  }

  return (
    <>
      {/* State Spending Overview */}
      {(stateTotal > 0 || passThroughTotal > 0) && (
        <div className="mb-10">
          <div className="font-mono text-sm">
            <p className="text-gray-500">{stateCode}_STATE_SPENDING</p>
            <p className="text-gray-600 text-xs mt-1">Money flowing through {stateName} government</p>
            <div className="mt-3 text-gray-400">
              {stateSpending.map((item, index) => (
                <p key={item.source}>
                  <span className="text-gray-600">├─</span>{' '}
                  <span className="inline-block w-36">{SOURCE_LABELS[item.source] || item.source}</span>
                  <span className="text-green-500 ml-4">{formatMoney(item.total_amount)}</span>
                  <span className="text-gray-600 ml-4">
                    ({formatCount(item.record_count)} payments to {formatCount(item.unique_recipients)} vendors)
                  </span>
                </p>
              ))}
              {passThrough.map((item) => (
                <p key={item.source}>
                  <span className="text-gray-600">├─</span>{' '}
                  <span className="inline-block w-36">{SOURCE_LABELS[item.source] || item.source}</span>
                  <span className="text-blue-400 ml-4">{formatMoney(item.total_amount)}</span>
                  <span className="text-gray-600 ml-4">
                    ({formatCount(item.record_count)} grants)
                  </span>
                </p>
              ))}
              <p className="mt-2 border-t border-gray-800 pt-2">
                <span className="text-gray-600">└─</span>{' '}
                <span className="inline-block w-36 text-white">total_tracked</span>
                <span className="text-green-400 ml-4 font-bold">{formatMoney(stateTotal + passThroughTotal)}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Top State Payment Recipients */}
      {stateRecipients.length > 0 && (
        <div className="mb-10">
          <div className="font-mono text-sm mb-4">
            <p className="text-gray-500">{stateCode}_TOP_STATE_VENDORS</p>
            <p className="text-gray-600 text-xs mt-1">Largest recipients of state payments</p>
            <div className="mt-3 text-gray-400">
              <p>
                <span className="text-gray-600">├─</span> showing{' '}
                <span className="text-white ml-4">{displayRecipients.length}</span>
              </p>
              <p>
                <span className="text-gray-600">└─</span> total_vendors{' '}
                <span className="text-white ml-4">{stateRecipients.length}</span>
              </p>
            </div>
          </div>

          <div className="border border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="text-left p-3 font-medium text-gray-400">Vendor</th>
                    <th className="text-right p-3 font-medium text-gray-400">State Payments</th>
                    <th className="text-right p-3 font-medium text-gray-400 hidden md:table-cell">Federal Grants</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {displayRecipients.map((recipient, index) => (
                    <tr key={index} className="hover:bg-gray-900/50">
                      <td className="p-3">
                        {recipient.organization_id ? (
                          <Link
                            href={`/organizations/${recipient.organization_id}`}
                            className="text-white hover:text-green-400"
                          >
                            {recipient.recipient_name}
                          </Link>
                        ) : (
                          <span className="text-gray-300">{recipient.recipient_name}</span>
                        )}
                      </td>
                      <td className="p-3 text-right font-mono text-green-500">
                        {formatMoney(recipient.state_payments)}
                      </td>
                      <td className="p-3 text-right font-mono text-blue-400 hidden md:table-cell">
                        {formatMoney(recipient.federal_grants)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {stateRecipients.length > 10 && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setShowAll(!showAll)}
                className="text-gray-400 hover:text-white text-sm"
              >
                {showAll ? 'Show fewer vendors' : `Show all ${stateRecipients.length} vendors`}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
