'use client';

import { useEffect, useState } from 'react';

interface Organization {
  id: string;
  legal_name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  total_government_funding: number;
  created_at: string;
}

interface MergeCandidate {
  id: string;
  org_id_1: string;
  org_id_2: string;
  confidence_score: number;
  match_reason: string;
  name_similarity: number;
  same_state: boolean;
  same_city: boolean;
  same_zip: boolean;
  status: string;
  created_at: string;
  org1: Organization;
  org2: Organization;
}

interface MergeResponse {
  candidates: MergeCandidate[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  stats: {
    pending: number;
    approved: number;
    rejected: number;
    auto_merged: number;
  };
}

const US_STATES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
  MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
  OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  DC: 'District of Columbia', PR: 'Puerto Rico',
};

function formatMoney(amount: number | null): string {
  if (!amount) return '$0';
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function AdminMergesPage() {
  const [candidates, setCandidates] = useState<MergeCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  // Filters
  const [minConfidence, setMinConfidence] = useState('0.8');
  const [selectedState, setSelectedState] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('pending');

  // Stats
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    auto_merged: 0,
  });

  // Processing state
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCandidates();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, minConfidence, selectedState, selectedStatus]);

  const fetchCandidates = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        minConfidence: minConfidence,
        status: selectedStatus,
      });

      if (selectedState) params.set('state', selectedState);

      const res = await fetch(`/api/admin/merges?${params}`);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data: MergeResponse = await res.json();

      setCandidates(data.candidates);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setStats(data.stats);
    } catch (err) {
      console.error('Failed to fetch merge candidates:', err);
      setError('Failed to load merge candidates');
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (candidateId: string) => {
    if (!confirm('Are you sure you want to approve this merge? This will consolidate all funding records into one organization.')) {
      return;
    }

    setProcessingId(candidateId);
    try {
      const res = await fetch(`/api/admin/merges/${candidateId}/approve`, {
        method: 'POST',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to approve merge');
      }

      await fetchCandidates();
    } catch (err) {
      console.error('Failed to approve merge:', err);
      alert(err instanceof Error ? err.message : 'Failed to approve merge');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (candidateId: string) => {
    const notes = prompt('Rejection reason (optional):');
    if (notes === null) return; // User cancelled

    setProcessingId(candidateId);
    try {
      const res = await fetch(`/api/admin/merges/${candidateId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to reject merge');
      }

      await fetchCandidates();
    } catch (err) {
      console.error('Failed to reject merge:', err);
      alert(err instanceof Error ? err.message : 'Failed to reject merge');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div>
      {/* Terminal-style stats */}
      <div className="font-mono text-sm mb-10">
        <p className="text-gray-500">ORGANIZATION_MERGE_REVIEW</p>
        <div className="mt-2 text-gray-400">
          <p><span className="text-gray-600">├─</span> pending_review <span className="text-white ml-4">{stats.pending}</span></p>
          <p><span className="text-gray-600">├─</span> approved <span className="text-white ml-4">{stats.approved}</span></p>
          <p><span className="text-gray-600">├─</span> rejected <span className="text-white ml-4">{stats.rejected}</span></p>
          <p><span className="text-gray-600">└─</span> auto_merged <span className="text-white ml-4">{stats.auto_merged}</span></p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6 text-sm">
        <div>
          <label className="block text-gray-500 text-xs mb-1">Status</label>
          <select
            value={selectedStatus}
            onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
            className="bg-black border border-gray-700 rounded px-3 py-2 focus:outline-none focus:border-gray-500"
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="auto_merged">Auto-merged</option>
          </select>
        </div>

        <div>
          <label className="block text-gray-500 text-xs mb-1">Min Confidence</label>
          <select
            value={minConfidence}
            onChange={(e) => { setMinConfidence(e.target.value); setPage(1); }}
            className="bg-black border border-gray-700 rounded px-3 py-2 focus:outline-none focus:border-gray-500"
          >
            <option value="0">All</option>
            <option value="0.7">70%+</option>
            <option value="0.8">80%+</option>
            <option value="0.9">90%+</option>
          </select>
        </div>

        <div>
          <label className="block text-gray-500 text-xs mb-1">State</label>
          <select
            value={selectedState}
            onChange={(e) => { setSelectedState(e.target.value); setPage(1); }}
            className="bg-black border border-gray-700 rounded px-3 py-2 focus:outline-none focus:border-gray-500"
          >
            <option value="">All States</option>
            {Object.entries(US_STATES).sort((a, b) => a[1].localeCompare(b[1])).map(([code, name]) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-sm text-gray-500">
        {loading ? 'Loading...' : error ? '' : `Showing ${candidates.length} of ${total.toLocaleString()} results`}
      </div>

      {/* Error State */}
      {error && (
        <div className="border border-gray-800 p-8 text-center mb-4">
          <p className="text-gray-400">{error}</p>
          <button
            onClick={fetchCandidates}
            className="mt-4 px-4 py-2 border border-gray-700 rounded text-sm text-gray-400 hover:text-white"
          >
            Retry
          </button>
        </div>
      )}

      {/* Candidates List */}
      {!error && (
        <div className="space-y-6">
          {loading ? (
            <div className="border border-gray-800 p-12 text-center text-gray-500">
              Loading merge candidates...
            </div>
          ) : candidates.length === 0 ? (
            <div className="border border-gray-800 p-12 text-center text-gray-500">
              No merge candidates found
            </div>
          ) : (
            candidates.map((candidate) => {
              const olderOrg = new Date(candidate.org1.created_at) <= new Date(candidate.org2.created_at) ? candidate.org1 : candidate.org2;
              const newerOrg = new Date(candidate.org1.created_at) <= new Date(candidate.org2.created_at) ? candidate.org2 : candidate.org1;
              const isProcessing = processingId === candidate.id;

              return (
                <div key={candidate.id} className="border border-gray-800 p-6">
                  {/* Confidence Score & Match Reason */}
                  <div className="mb-4 pb-4 border-b border-gray-800">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-mono text-lg">
                        <span className="text-gray-500">Confidence:</span>{' '}
                        <span className="text-white">{(candidate.confidence_score * 100).toFixed(0)}%</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Name similarity: {(candidate.name_similarity * 100).toFixed(0)}%
                      </div>
                    </div>
                    <p className="text-sm text-gray-400">{candidate.match_reason}</p>
                    <div className="mt-2 flex gap-3 text-xs">
                      {candidate.same_state && <span className="text-gray-500">Same state</span>}
                      {candidate.same_city && <span className="text-gray-500">Same city</span>}
                      {candidate.same_zip && <span className="text-gray-500">Same ZIP</span>}
                    </div>
                  </div>

                  {/* Side-by-side comparison */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    {/* Organization 1 (Keep if older) */}
                    <div>
                      <div className="mb-2">
                        <span className="text-xs text-gray-500">
                          {olderOrg.id === candidate.org1.id ? 'Organization 1 (will be kept)' : 'Organization 2 (will be merged)'}
                        </span>
                      </div>
                      <h3 className="text-white font-medium mb-3">{candidate.org1.legal_name}</h3>
                      <div className="space-y-1.5 text-sm">
                        <p className="text-gray-400">
                          {candidate.org1.address}<br />
                          {candidate.org1.city}, {candidate.org1.state} {candidate.org1.zip_code}
                        </p>
                        <p className="font-mono text-green-500">
                          {formatMoney(candidate.org1.total_government_funding)}
                        </p>
                        <p className="text-gray-500 text-xs">
                          Created: {formatDate(candidate.org1.created_at)}
                        </p>
                      </div>
                    </div>

                    {/* Organization 2 */}
                    <div>
                      <div className="mb-2">
                        <span className="text-xs text-gray-500">
                          {olderOrg.id === candidate.org2.id ? 'Organization 2 (will be kept)' : 'Organization 1 (will be merged)'}
                        </span>
                      </div>
                      <h3 className="text-white font-medium mb-3">{candidate.org2.legal_name}</h3>
                      <div className="space-y-1.5 text-sm">
                        <p className="text-gray-400">
                          {candidate.org2.address}<br />
                          {candidate.org2.city}, {candidate.org2.state} {candidate.org2.zip_code}
                        </p>
                        <p className="font-mono text-green-500">
                          {formatMoney(candidate.org2.total_government_funding)}
                        </p>
                        <p className="text-gray-500 text-xs">
                          Created: {formatDate(candidate.org2.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {candidate.status === 'pending' && (
                    <div className="flex gap-3 pt-4 border-t border-gray-800">
                      <button
                        onClick={() => handleApprove(candidate.id)}
                        disabled={isProcessing}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        {isProcessing ? 'Processing...' : 'Approve Merge'}
                      </button>
                      <button
                        onClick={() => handleReject(candidate.id)}
                        disabled={isProcessing}
                        className="px-4 py-2 border border-gray-700 text-gray-400 rounded hover:text-white hover:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {candidate.status !== 'pending' && (
                    <div className="pt-4 border-t border-gray-800 text-sm text-gray-500">
                      Status: {candidate.status}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Pagination */}
      {!error && totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 text-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="px-4 py-2 border border-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:border-gray-600 text-gray-400 hover:text-white"
            >
              Previous
            </button>
            <span className="text-gray-500">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
              className="px-4 py-2 border border-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:border-gray-600 text-gray-400 hover:text-white"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
