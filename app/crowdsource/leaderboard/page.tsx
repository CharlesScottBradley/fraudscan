'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface LeaderboardEntry {
  id: string;
  username: string;
  submissions_count: number;
  approved_count: number;
  points: number;
  rank: string;
  states_count: number;
  total_records_contributed: number;
  first_submission_at: string | null;
  last_submission_at: string | null;
  badges: Array<{ id: string; name: string; awarded_at: string }>;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPointsInfo, setShowPointsInfo] = useState(false);

  useEffect(() => {
    fetch('/api/crowdsource/leaderboard?limit=50')
      .then(res => res.json())
      .then(data => {
        setLeaderboard(data.contributors || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <Link href="/crowdsource" className="text-gray-500 hover:text-white text-sm mb-6 inline-block">
        Back to Crowdsourcing
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Contributor Leaderboard</h1>
        <p className="text-gray-500 text-sm">
          Contributors ranked by points earned from data submissions.
        </p>
      </div>

      {/* Points Info Toggle */}
      <div className="flex items-center gap-4 mb-6 text-sm">
        <button
          onClick={() => setShowPointsInfo(!showPointsInfo)}
          className="text-gray-500 hover:text-white"
        >
          {showPointsInfo ? 'Hide points info' : 'How points work'}
        </button>
      </div>

      {/* Points Info Panel */}
      {showPointsInfo && (
        <div className="border border-gray-800 p-6 mb-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Points Breakdown */}
            <div>
              <p className="text-gray-500 text-xs mb-4">POINTS_SYSTEM</p>
              <div className="font-mono text-sm space-y-1 text-gray-400">
                <p>Submit file (pending) <span className="text-white ml-4">+5</span></p>
                <p>Submit tip/lead (pending) <span className="text-white ml-4">+3</span></p>
                <p>Submission approved <span className="text-white ml-4">+20</span></p>
                <p>Tip leads to investigation <span className="text-white ml-4">+50</span></p>
                <p>Data imported <span className="text-white ml-4">+50</span></p>
                <p>Connection verified <span className="text-white ml-4">+30</span></p>
                <p>FOIA request fulfilled <span className="text-white ml-4">+100</span></p>
                <p>Critical gap completed <span className="text-white ml-4">+200</span></p>
                <p>First submission for state <span className="text-white ml-4">+25</span></p>
              </div>
            </div>

            {/* Ranks */}
            <div>
              <p className="text-gray-500 text-xs mb-4">RANKS</p>
              <div className="font-mono text-sm space-y-1 text-gray-400">
                <p>Contributor <span className="text-gray-600 ml-4">0-49 pts</span></p>
                <p>Data Hunter <span className="text-gray-600 ml-4">50-149 pts</span></p>
                <p>Research Analyst <span className="text-gray-600 ml-4">150-299 pts</span></p>
                <p>FOIA Warrior <span className="text-gray-600 ml-4">300-499 pts</span></p>
                <p>Fraud Fighter <span className="text-gray-600 ml-4">500-999 pts</span></p>
                <p>Master Investigator <span className="text-gray-600 ml-4">1000+ pts</span></p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      {loading ? (
        <div className="text-gray-500 py-8">Loading leaderboard...</div>
      ) : leaderboard.length === 0 ? (
        <div className="border border-gray-800 p-8 text-center">
          <p className="text-gray-500 mb-4">No contributors on the leaderboard yet.</p>
          <Link
            href="/crowdsource/submit"
            className="text-gray-400 hover:text-white text-sm"
          >
            Be the first to contribute
          </Link>
        </div>
      ) : (
        <div className="border border-gray-800">
          <table className="w-full text-sm">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left p-3 font-medium text-gray-400 w-16">#</th>
                <th className="text-left p-3 font-medium text-gray-400">Contributor</th>
                <th className="text-right p-3 font-medium text-gray-400">Points</th>
                <th className="text-right p-3 font-medium text-gray-400 hidden sm:table-cell">Approved</th>
                <th className="text-right p-3 font-medium text-gray-400 hidden md:table-cell">States</th>
                <th className="text-right p-3 font-medium text-gray-400 hidden lg:table-cell">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {leaderboard.map((entry, index) => (
                <tr key={entry.id} className="hover:bg-gray-900/50">
                  <td className="p-3 font-mono text-gray-500">{index + 1}</td>
                  <td className="p-3">
                    <div className="text-white">{entry.username}</div>
                    <div className="text-gray-600 text-xs">{entry.rank}</div>
                  </td>
                  <td className="p-3 text-right font-mono text-white">{entry.points.toLocaleString()}</td>
                  <td className="p-3 text-right text-gray-500 hidden sm:table-cell">
                    {entry.approved_count}/{entry.submissions_count}
                  </td>
                  <td className="p-3 text-right text-gray-500 hidden md:table-cell">
                    {entry.states_count}
                  </td>
                  <td className="p-3 text-right text-gray-600 text-xs hidden lg:table-cell">
                    {entry.first_submission_at
                      ? new Date(entry.first_submission_at).toLocaleDateString()
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CTA */}
      <div className="mt-8 border border-gray-800 p-6 flex items-center justify-between">
        <p className="text-gray-500 text-sm">
          Want to see your name on the leaderboard?
        </p>
        <Link
          href="/crowdsource/submit"
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded"
        >
          Submit Data
        </Link>
      </div>
    </div>
  );
}
