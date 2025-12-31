'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Submission {
  id: string;
  state_code: string;
  data_type: string;
  submission_type: string;
  tip_category: string | null;
  title: string;
  description: string | null;
  tip_content: string | null;
  file_name: string | null;
  file_size: number | null;
  submitter_email: string;
  status: string;
  created_at: string;
  contributor?: {
    id: string;
    username: string | null;
    email: string | null;
  };
}

interface AdminStats {
  pending: number;
  under_review: number;
  approved: number;
  rejected: number;
}

export default function AdminCrowdsourcePage() {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchSubmissions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/crowdsource/submissions?status=${statusFilter}`, {
        headers: {
          'Authorization': `Bearer ${password}`,
        },
      });

      if (res.status === 401) {
        setAuthenticated(false);
        setError('Invalid password');
        return;
      }

      if (!res.ok) {
        throw new Error('Failed to fetch submissions');
      }

      const data = await res.json();
      setSubmissions(data.submissions || []);
      setStats(data.stats || null);
      setAuthenticated(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetchSubmissions();
  };

  useEffect(() => {
    if (authenticated) {
      fetchSubmissions();
    }
  }, [statusFilter, authenticated]);

  const updateSubmissionStatus = async (id: string, status: string) => {
    try {
      const body: Record<string, string> = { status };
      if (status === 'approved') {
        body.review_notes = reviewNotes;
      }
      if (status === 'rejected') {
        body.rejection_reason = rejectionReason;
      }

      const res = await fetch(`/api/admin/crowdsource/submissions/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${password}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error('Failed to update submission');
      }

      // Refresh list
      await fetchSubmissions();
      setSelectedSubmission(null);
      setReviewNotes('');
      setRejectionReason('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An error occurred');
    }
  };

  // Login Screen
  if (!authenticated) {
    return (
      <div className="max-w-md mx-auto mt-20">
        <h1 className="text-2xl font-bold mb-6 text-center">Admin Login</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="border border-gray-800 p-3 text-gray-400 text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black border border-gray-700 rounded p-2.5 text-white focus:border-gray-500 focus:outline-none"
              placeholder="Enter admin password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-white rounded text-sm disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Crowdsource Admin</h1>
          <p className="text-gray-500 text-sm">Review and manage submissions</p>
        </div>
        <Link
          href="/crowdsource"
          className="text-gray-500 hover:text-white text-sm"
        >
          View Public Page
        </Link>
      </div>

      {/* Terminal-style Stats */}
      {stats && (
        <div className="font-mono text-sm mb-10">
          <p className="text-gray-500">SUBMISSION_QUEUE</p>
          <div className="mt-2 text-gray-400">
            <p><span className="text-gray-600">+-</span> pending <span className="text-white ml-4">{stats.pending}</span></p>
            <p><span className="text-gray-600">+-</span> under_review <span className="text-white ml-4">{stats.under_review}</span></p>
            <p><span className="text-gray-600">+-</span> approved <span className="text-white ml-4">{stats.approved}</span></p>
            <p><span className="text-gray-600">+-</span> rejected <span className="text-white ml-4">{stats.rejected}</span></p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6 text-sm">
        <span className="text-gray-500">Filter:</span>
        <button
          onClick={() => setStatusFilter('pending')}
          className={statusFilter === 'pending' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}
        >
          Pending ({stats?.pending || 0})
        </button>
        <button
          onClick={() => setStatusFilter('under_review')}
          className={statusFilter === 'under_review' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}
        >
          Under Review ({stats?.under_review || 0})
        </button>
        <button
          onClick={() => setStatusFilter('approved')}
          className={statusFilter === 'approved' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}
        >
          Approved ({stats?.approved || 0})
        </button>
        <button
          onClick={() => setStatusFilter('rejected')}
          className={statusFilter === 'rejected' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}
        >
          Rejected ({stats?.rejected || 0})
        </button>
      </div>

      {error && (
        <div className="border border-gray-800 p-4 mb-6">
          <p className="text-gray-400">{error}</p>
        </div>
      )}

      {/* Submissions List */}
      {loading ? (
        <div className="text-gray-500 py-8">Loading submissions...</div>
      ) : submissions.length === 0 ? (
        <div className="border border-gray-800 p-8 text-center text-gray-500">
          No {statusFilter.replace('_', ' ')} submissions found.
        </div>
      ) : (
        <div className="border border-gray-800">
          <table className="w-full text-sm">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left p-3 font-medium text-gray-400">State</th>
                <th className="text-left p-3 font-medium text-gray-400">Title</th>
                <th className="text-left p-3 font-medium text-gray-400">Type</th>
                <th className="text-left p-3 font-medium text-gray-400">Submitter</th>
                <th className="text-right p-3 font-medium text-gray-400">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {submissions.map((sub) => (
                <>
                  <tr 
                    key={sub.id} 
                    className={`hover:bg-gray-900/50 cursor-pointer ${selectedSubmission?.id === sub.id ? 'bg-gray-900/50' : ''}`}
                    onClick={() => setSelectedSubmission(selectedSubmission?.id === sub.id ? null : sub)}
                  >
                    <td className="p-3 font-mono text-gray-500">{sub.state_code}</td>
                    <td className="p-3 text-gray-300">{sub.title}</td>
                    <td className="p-3 text-gray-500 text-xs">{sub.submission_type.replace('_', ' ')}</td>
                    <td className="p-3 text-gray-500 text-xs">{sub.submitter_email}</td>
                    <td className="p-3 text-right text-gray-600 text-xs">
                      {new Date(sub.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                  {selectedSubmission?.id === sub.id && (
                    <tr className="bg-gray-900/30">
                      <td colSpan={5} className="p-4 border-t border-gray-800">
                        <div className="space-y-4">
                          {sub.description && (
                            <div>
                              <p className="text-gray-600 text-xs mb-1">Description</p>
                              <p className="text-gray-400 text-sm">{sub.description}</p>
                            </div>
                          )}

                          {sub.tip_content && (
                            <div>
                              <p className="text-gray-600 text-xs mb-1">Tip Content</p>
                              <pre className="text-gray-400 text-sm whitespace-pre-wrap bg-black p-3 rounded max-h-48 overflow-y-auto font-mono">
                                {sub.tip_content}
                              </pre>
                            </div>
                          )}

                          {sub.file_name && (
                            <div>
                              <p className="text-gray-600 text-xs mb-1">File</p>
                              <p className="text-gray-400 text-sm">{sub.file_name}</p>
                              <p className="text-gray-600 text-xs">
                                {sub.file_size ? `${(sub.file_size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'}
                              </p>
                            </div>
                          )}

                          {sub.contributor?.username && (
                            <div>
                              <p className="text-gray-600 text-xs mb-1">Username</p>
                              <p className="text-gray-400 text-sm">{sub.contributor.username}</p>
                            </div>
                          )}

                          {/* Action Buttons */}
                          {sub.status === 'pending' && (
                            <div className="space-y-4 pt-4 border-t border-gray-800">
                              <div>
                                <label className="block text-gray-600 text-xs mb-1">Review Notes</label>
                                <textarea
                                  value={reviewNotes}
                                  onChange={(e) => setReviewNotes(e.target.value)}
                                  className="w-full bg-black border border-gray-700 rounded p-2 text-white text-sm focus:border-gray-500 focus:outline-none resize-y"
                                  rows={2}
                                  placeholder="Optional notes"
                                />
                              </div>

                              <div className="flex gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateSubmissionStatus(sub.id, 'approved');
                                  }}
                                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateSubmissionStatus(sub.id, 'under_review');
                                  }}
                                  className="px-3 py-1.5 border border-gray-700 hover:border-gray-600 text-gray-400 hover:text-white text-sm rounded"
                                >
                                  Mark Under Review
                                </button>
                                <div className="flex-1"></div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const reason = prompt('Rejection reason:');
                                    if (reason) {
                                      setRejectionReason(reason);
                                      updateSubmissionStatus(sub.id, 'rejected');
                                    }
                                  }}
                                  className="px-3 py-1.5 border border-gray-700 hover:border-gray-600 text-gray-500 hover:text-white text-sm rounded"
                                >
                                  Reject
                                </button>
                              </div>
                            </div>
                          )}

                          {sub.status === 'under_review' && (
                            <div className="flex gap-2 pt-4 border-t border-gray-800">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateSubmissionStatus(sub.id, 'approved');
                                }}
                                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded"
                              >
                                Approve
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const reason = prompt('Rejection reason:');
                                  if (reason) {
                                    setRejectionReason(reason);
                                    updateSubmissionStatus(sub.id, 'rejected');
                                  }
                                }}
                                className="px-3 py-1.5 border border-gray-700 hover:border-gray-600 text-gray-500 hover:text-white text-sm rounded"
                              >
                                Reject
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateSubmissionStatus(sub.id, 'pending');
                                }}
                                className="px-3 py-1.5 border border-gray-700 hover:border-gray-600 text-gray-500 hover:text-white text-sm rounded"
                              >
                                Back to Pending
                              </button>
                            </div>
                          )}

                          {sub.status === 'approved' && (
                            <div className="flex gap-2 pt-4 border-t border-gray-800">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateSubmissionStatus(sub.id, 'imported');
                                }}
                                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded"
                              >
                                Mark as Imported
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
