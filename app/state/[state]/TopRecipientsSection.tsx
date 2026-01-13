'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

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

export default function TopRecipientsSection({ stateCode, stateName }: Props) {
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

      if (!data.topRecipients || data.topRecipients.length === 0) {
        setHasData(false);
        return;
      }

      setRecipients(data.topRecipients);
      setHasData(true);
    } catch (err) {
      console.error('Top recipients fetch error:', err);
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

  if (!hasData || recipients.length === 0) {
    return null;
  }

  const displayRecipients = showAll ? recipients : recipients.slice(0, 10);

  return (
    <div className="mb-10">
      {/* Terminal-style header */}
      <div className="font-mono text-sm mb-4">
        <p className="text-gray-500">{stateCode}_TOP_FUNDING_RECIPIENTS</p>
        <div className="mt-2 text-gray-400">
          <p>
            <span className="text-gray-600">├─</span> recipients_shown{' '}
            <span className="text-white ml-4">{displayRecipients.length}</span>
          </p>
          <p>
            <span className="text-gray-600">└─</span> total_available{' '}
            <span className="text-white ml-4">{recipients.length}</span>
          </p>
        </div>
      </div>

      {/* Recipients table */}
      <div className="border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left p-3 font-medium text-gray-400">Recipient</th>
                <th className="text-right p-3 font-medium text-gray-400">State Payments</th>
                <th className="text-right p-3 font-medium text-gray-400 hidden md:table-cell">PPP</th>
                <th className="text-right p-3 font-medium text-gray-400 hidden lg:table-cell">Federal</th>
                <th className="text-right p-3 font-medium text-gray-400 hidden lg:table-cell">SBA</th>
                <th className="text-right p-3 font-medium text-gray-400">Total</th>
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
                  <td className="p-3 text-right font-mono text-gray-400 hidden md:table-cell">
                    {formatMoney(recipient.ppp_amount)}
                  </td>
                  <td className="p-3 text-right font-mono text-gray-400 hidden lg:table-cell">
                    {formatMoney(recipient.federal_grants)}
                  </td>
                  <td className="p-3 text-right font-mono text-gray-400 hidden lg:table-cell">
                    {formatMoney(recipient.sba_amount)}
                  </td>
                  <td className="p-3 text-right font-mono text-green-400 font-medium">
                    {formatMoney(recipient.total_funding)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Show more/less toggle */}
      {recipients.length > 10 && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-gray-400 hover:text-white text-sm"
          >
            {showAll ? 'Show fewer recipients' : `Show all ${recipients.length} recipients`}
          </button>
        </div>
      )}
    </div>
  );
}
