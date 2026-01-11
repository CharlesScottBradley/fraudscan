'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface PACDetail {
  cmte_id: string;
  name: string | null;
  committee_type: string | null;
  party: string | null;
  state: string | null;
  description: string | null;
  fec_url: string;
  stats: {
    total_received: number;
    donation_count: number;
    avg_donation: number;
    donor_states_count: number;
    first_donation: string | null;
    last_donation: string | null;
  };
  linkedCandidates: {
    cand_id: string;
    cand_name: string | null;
    party: string | null;
    office: string | null;
    state: string | null;
    designation: string;
    designation_label: string;
    politician_id: string | null;
  }[];
  topDonors: {
    name: string;
    employer: string | null;
    occupation: string | null;
    city: string | null;
    state: string | null;
    total_amount: number;
    donation_count: number;
  }[];
}

const PARTY_COLORS: Record<string, string> = {
  Democratic: 'bg-blue-900/40 text-blue-400 border-blue-800',
  DEM: 'bg-blue-900/40 text-blue-400 border-blue-800',
  D: 'bg-blue-900/40 text-blue-400 border-blue-800',
  Republican: 'bg-red-900/40 text-red-400 border-red-800',
  REP: 'bg-red-900/40 text-red-400 border-red-800',
  R: 'bg-red-900/40 text-red-400 border-red-800',
};

function formatMoney(amount: number): string {
  if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(2)}B`;
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(2)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
  return `$${amount.toLocaleString()}`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function getPartyClass(party: string | null): string {
  if (!party) return 'bg-gray-800 text-gray-400 border-gray-700';
  return PARTY_COLORS[party] || 'bg-gray-800 text-gray-400 border-gray-700';
}

function getOfficeLabel(office: string | null): string {
  if (!office) return '';
  switch (office) {
    case 'H': return 'House';
    case 'S': return 'Senate';
    case 'P': return 'President';
    default: return office;
  }
}

export default function PACDetailPage() {
  const params = useParams();
  const cmte_id = params.cmte_id as string;

  const [pac, setPac] = useState<PACDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cmte_id) return;

    async function fetchPAC() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/pacs/${cmte_id}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError('Committee not found');
          } else {
            throw new Error(`HTTP ${res.status}`);
          }
          return;
        }
        const data = await res.json();
        setPac(data);
      } catch (err) {
        console.error('Failed to fetch PAC:', err);
        setError('Failed to load committee data');
      } finally {
        setLoading(false);
      }
    }

    fetchPAC();
  }, [cmte_id]);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <p className="text-gray-500">Loading committee data...</p>
      </div>
    );
  }

  if (error || !pac) {
    return (
      <div className="py-20 text-center">
        <p className="text-gray-400 mb-4">{error || 'Committee not found'}</p>
        <Link href="/pacs" className="text-green-500 hover:text-green-400">
          ← Back to PACs
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-6 text-sm">
        <Link href="/pacs" className="text-gray-500 hover:text-white">
          PACs
        </Link>
        <span className="text-gray-600 mx-2">/</span>
        <span className="text-gray-400">{pac.name || pac.cmte_id}</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              {pac.name || pac.cmte_id}
            </h1>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-gray-500 font-mono">{pac.cmte_id}</span>
              {pac.committee_type && (
                <span className="px-2 py-0.5 bg-gray-800 text-gray-400 text-xs">
                  {pac.committee_type}
                </span>
              )}
              {pac.party && (
                <span className={`px-2 py-0.5 rounded text-xs border ${getPartyClass(pac.party)}`}>
                  {pac.party}
                </span>
              )}
              {pac.state && (
                <span className="text-gray-500">{pac.state}</span>
              )}
            </div>
          </div>
          <a
            href={pac.fec_url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 border border-gray-700 text-sm text-gray-400 hover:text-white hover:border-gray-600"
          >
            View on FEC.gov →
          </a>
        </div>
        {pac.description && (
          <p className="mt-4 text-gray-500 text-sm">{pac.description}</p>
        )}
      </div>

      {/* Terminal-style PAC summary */}
      <div className="font-mono text-sm mb-10">
        <p className="text-gray-500">CMTE_{pac.cmte_id}</p>
        <div className="mt-2 text-gray-400">
          <p><span className="text-gray-600">├─</span> total_raised <span className="text-green-500 ml-4">{formatMoney(pac.stats.total_received)}</span></p>
          <p><span className="text-gray-600">├─</span> donations <span className="text-white ml-4">{pac.stats.donation_count.toLocaleString()}</span></p>
          <p><span className="text-gray-600">├─</span> avg_donation <span className="text-green-500 ml-4">{formatMoney(pac.stats.avg_donation)}</span></p>
          <p><span className="text-gray-600">├─</span> donor_regions <span className="text-white ml-4">{pac.stats.donor_states_count}</span></p>
          {(pac.stats.first_donation || pac.stats.last_donation) && (
            <p><span className="text-gray-600">└─</span> activity <span className="text-gray-400 ml-4">{formatDate(pac.stats.first_donation)} - {formatDate(pac.stats.last_donation)}</span></p>
          )}
          {!pac.stats.first_donation && !pac.stats.last_donation && (
            <p><span className="text-gray-600">└─</span> activity <span className="text-gray-500 ml-4">-</span></p>
          )}
        </div>
      </div>

      {/* Linked Candidates */}
      {pac.linkedCandidates.length > 0 && (
        <div className="mb-12">
          <h2 className="text-lg font-bold mb-4">Linked Candidates</h2>
          <div className="border border-gray-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-900">
                <tr>
                  <th className="text-left p-3 font-medium text-gray-400">Candidate</th>
                  <th className="text-left p-3 font-medium text-gray-400">Office</th>
                  <th className="text-left p-3 font-medium text-gray-400">Party</th>
                  <th className="text-left p-3 font-medium text-gray-400">Relationship</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {pac.linkedCandidates.map((candidate) => (
                  <tr key={candidate.cand_id} className="hover:bg-gray-900/50">
                    <td className="p-3">
                      {candidate.politician_id ? (
                        <Link
                          href={`/politician/${candidate.politician_id}`}
                          className="text-white hover:text-green-400"
                        >
                          {candidate.cand_name || candidate.cand_id}
                        </Link>
                      ) : (
                        <span className="text-white">
                          {candidate.cand_name || candidate.cand_id}
                        </span>
                      )}
                      {candidate.state && (
                        <span className="ml-2 text-gray-600 text-xs">
                          {candidate.state}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-gray-400">
                      {getOfficeLabel(candidate.office)}
                    </td>
                    <td className="p-3">
                      {candidate.party && (
                        <span className={`px-2 py-0.5 rounded text-xs border ${getPartyClass(candidate.party)}`}>
                          {candidate.party}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-gray-500 text-xs">
                      {candidate.designation_label}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Top Donors */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Top Donors</h2>
          {pac.topDonors.length >= 20 && (
            <span className="text-gray-600 text-sm">Showing top 20</span>
          )}
        </div>

        {pac.topDonors.length === 0 ? (
          <div className="border border-gray-800 p-8 text-center">
            <p className="text-gray-500">No donor data available</p>
          </div>
        ) : (
          <div className="border border-gray-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-900">
                <tr>
                  <th className="text-left p-3 font-medium text-gray-400">#</th>
                  <th className="text-left p-3 font-medium text-gray-400">Donor</th>
                  <th className="text-left p-3 font-medium text-gray-400">Employer</th>
                  <th className="text-left p-3 font-medium text-gray-400">Location</th>
                  <th className="text-right p-3 font-medium text-gray-400">Donations</th>
                  <th className="text-right p-3 font-medium text-gray-400">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {pac.topDonors.map((donor, index) => (
                  <tr key={`${donor.name}-${index}`} className="hover:bg-gray-900/50">
                    <td className="p-3 text-gray-600">{index + 1}</td>
                    <td className="p-3">
                      <span className="text-white">{donor.name}</span>
                      {donor.occupation && (
                        <span className="block text-gray-600 text-xs mt-0.5">
                          {donor.occupation}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-gray-400 text-xs">
                      {donor.employer || '-'}
                    </td>
                    <td className="p-3 text-gray-500 text-xs">
                      {[donor.city, donor.state].filter(Boolean).join(', ') || '-'}
                    </td>
                    <td className="p-3 text-right font-mono text-gray-400">
                      {donor.donation_count.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-mono">
                      <span className="text-green-400 font-bold">
                        {formatMoney(donor.total_amount)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Data Source */}
      <div className="pt-8 border-t border-gray-800 text-sm text-gray-500">
        <p className="font-medium text-gray-400 mb-2">Data Source</p>
        <p>
          <span className="text-white">FEC</span>
          <span className="text-gray-600"> - </span>
          <a
            href="https://www.fec.gov/data/browse-data/?tab=bulk-data"
            className="underline hover:text-gray-400"
            target="_blank"
            rel="noopener"
          >
            Federal Election Commission Bulk Data
          </a>
        </p>
      </div>
    </div>
  );
}
