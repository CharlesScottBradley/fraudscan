'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import CrowdsourceMap, { StateCoverage } from '../components/CrowdsourceMap';

interface TopNeed {
  id: string;
  state_code: string;
  title: string;
  priority: string;
  difficulty: string;
  requires_foia: boolean;
}

interface RecentSubmission {
  id: string;
  state_code: string;
  title: string;
  submission_type: string;
  created_at: string;
  username: string | null;
}

interface CrowdsourceStats {
  total_submissions: number;
  approved_submissions: number;
  total_contributors: number;
  total_gaps: number;
  completed_gaps: number;
  critical_gaps: number;
  foia_required_gaps: number;
  top_needs: TopNeed[];
  recent_submissions: RecentSubmission[];
  state_coverage: StateCoverage[];
}

const STATE_NAMES: Record<string, string> = {
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
  DC: 'District of Columbia'
};

export default function CrowdsourcePage() {
  const [stats, setStats] = useState<CrowdsourceStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/crowdsource/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-2xl font-bold mb-2">Crowdsourcing</h1>
        <p className="text-gray-400">
          Help us collect public records data that exposes how tax dollars are spent.
        </p>
      </div>

      {/* Terminal-style Stats */}
      {stats && (
        <div className="font-mono text-sm mb-10">
          <p className="text-gray-500">CROWDSOURCE_STATUS</p>
          <div className="mt-2 text-gray-400">
            <p><span className="text-gray-600">+-</span> submissions <span className="text-white ml-4">{stats.total_submissions}</span></p>
            <p><span className="text-gray-600">+-</span> contributors <span className="text-white ml-4">{stats.total_contributors}</span></p>
            <p><span className="text-gray-600">+-</span> data_gaps <span className="text-white ml-4">{stats.total_gaps}</span></p>
            <p><span className="text-gray-600">+-</span> completed <span className="text-white ml-4">{stats.completed_gaps}</span></p>
            <p><span className="text-gray-600">+-</span> critical_needed <span className="text-white ml-4">{stats.critical_gaps}</span></p>
            <p><span className="text-gray-600">+-</span> foia_required <span className="text-white ml-4">{stats.foia_required_gaps}</span></p>
          </div>
        </div>
      )}

      {/* Priority Data Needs */}
      <div className="mb-12">
        <h2 className="text-lg font-semibold mb-4">Priority Data Needs</h2>
        <p className="text-gray-500 text-sm mb-4">
          Critical data gaps across all states. Many require FOIA requests.
        </p>
        
        {loading ? (
          <div className="text-gray-500">Loading...</div>
        ) : stats?.top_needs && stats.top_needs.length > 0 ? (
          <div className="border border-gray-800">
            <table className="w-full text-sm">
              <thead className="bg-gray-900">
                <tr>
                  <th className="text-left p-3 font-medium text-gray-400">State</th>
                  <th className="text-left p-3 font-medium text-gray-400">Data Needed</th>
                  <th className="text-left p-3 font-medium text-gray-400">Priority</th>
                  <th className="text-left p-3 font-medium text-gray-400">Difficulty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {stats.top_needs.map((need) => (
                  <tr key={need.id} className="hover:bg-gray-900/50">
                    <td className="p-3">
                      <Link href={`/crowdsource/${need.state_code.toLowerCase()}`} className="text-white hover:text-gray-300">
                        {need.state_code}
                      </Link>
                    </td>
                    <td className="p-3 text-gray-300">
                      <Link href={`/crowdsource/${need.state_code.toLowerCase()}`} className="hover:text-white">
                        {need.title}
                      </Link>
                    </td>
                    <td className="p-3 text-gray-500 text-xs uppercase">{need.priority}</td>
                    <td className="p-3 text-gray-500 text-xs">
                      {need.requires_foia ? 'FOIA required' : need.difficulty}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-gray-500 border border-gray-800 p-8 text-center">
            No critical data needs currently. Check back soon or browse by state below.
          </div>
        )}
      </div>

      {/* Interactive Map */}
      <div className="mb-12">
        <h2 className="text-lg font-semibold mb-4">Data Coverage by State</h2>
        <p className="text-gray-500 text-sm mb-4">
          Click on any state to see specific data needs and submit contributions.
        </p>
        
        <div className="border border-gray-800">
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-6 p-4 border-b border-gray-800 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-[#1f1f1f]"></span>
              <span>Needs data</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-[#374151]"></span>
              <span>Partial</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-[#4b5563]"></span>
              <span>Near complete</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-[#1a1a1a]"></span>
              <span>Not defined</span>
            </div>
          </div>

          {/* Map */}
          <div className="p-4">
            <CrowdsourceMap stateCoverage={stats?.state_coverage || []} />
          </div>

          {/* State list for mobile / accessibility */}
          <div className="p-4 border-t border-gray-800">
            <p className="text-gray-600 text-xs mb-2">All states:</p>
            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-13 gap-1">
              {Object.entries(STATE_NAMES).sort((a, b) => a[0].localeCompare(b[0])).map(([code]) => (
                <Link
                  key={code}
                  href={`/crowdsource/${code.toLowerCase()}`}
                  className="px-2 py-1 text-xs text-gray-500 hover:text-white text-center"
                >
                  {code}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* How to Help */}
      <div className="mb-12">
        <h2 className="text-lg font-semibold mb-4">How to Contribute</h2>
        <div className="border border-gray-800 divide-y divide-gray-800">
          <div className="p-4">
            <div className="text-gray-600 text-xs mb-1">5 MINUTES</div>
            <p className="text-white mb-1">Submit a tip or lead</p>
            <p className="text-gray-500 text-sm">Share information worth investigating. No file required.</p>
          </div>
          
          <div className="p-4">
            <div className="text-gray-600 text-xs mb-1">10 MINUTES</div>
            <p className="text-white mb-1">Download and upload open data</p>
            <p className="text-gray-500 text-sm">Some data is freely available on state portals.</p>
          </div>
          
          <div className="p-4">
            <div className="text-gray-600 text-xs mb-1">1 HOUR</div>
            <p className="text-white mb-1">Scrape a state portal</p>
            <p className="text-gray-500 text-sm">Technical skills needed to extract paginated data.</p>
          </div>
          
          <div className="p-4">
            <div className="text-gray-600 text-xs mb-1">ONGOING</div>
            <p className="text-white mb-1">File FOIA requests</p>
            <p className="text-gray-500 text-sm">
              Critical data is hidden behind public records requests.{' '}
              <Link href="/foia" className="text-gray-400 hover:text-white">
                Use our FOIA generator
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Recent Contributions */}
      <div className="mb-12">
        <h2 className="text-lg font-semibold mb-4">Recent Contributions</h2>
        {loading ? (
          <div className="text-gray-500">Loading...</div>
        ) : stats?.recent_submissions && stats.recent_submissions.length > 0 ? (
          <div className="border border-gray-800">
            <table className="w-full text-sm">
              <thead className="bg-gray-900">
                <tr>
                  <th className="text-left p-3 font-medium text-gray-400">State</th>
                  <th className="text-left p-3 font-medium text-gray-400">Title</th>
                  <th className="text-left p-3 font-medium text-gray-400">Type</th>
                  <th className="text-left p-3 font-medium text-gray-400">Contributor</th>
                  <th className="text-right p-3 font-medium text-gray-400">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {stats.recent_submissions.map((submission) => (
                  <tr key={submission.id} className="hover:bg-gray-900/50">
                    <td className="p-3 font-mono text-gray-500">{submission.state_code}</td>
                    <td className="p-3 text-gray-300">{submission.title}</td>
                    <td className="p-3 text-gray-500 text-xs">{submission.submission_type.replace('_', ' ')}</td>
                    <td className="p-3 text-gray-500">{submission.username || 'Anonymous'}</td>
                    <td className="p-3 text-right text-gray-600 text-xs">
                      {new Date(submission.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-gray-500 border border-gray-800 p-8 text-center">
            No contributions yet. Be the first to submit data.
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="border border-gray-800 p-6 flex items-center justify-between">
        <p className="text-gray-400">
          Ready to contribute?
        </p>
        <div className="flex gap-4">
          <Link
            href="/crowdsource/submit"
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded text-sm"
          >
            Submit Data
          </Link>
          <Link
            href="/crowdsource/leaderboard"
            className="px-4 py-2 border border-gray-700 hover:border-gray-600 text-gray-400 hover:text-white rounded text-sm"
          >
            Leaderboard
          </Link>
        </div>
      </div>
    </div>
  );
}
