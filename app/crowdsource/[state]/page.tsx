'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';

interface DataGap {
  id: string;
  data_type: string;
  category: string | null;
  priority: string;
  difficulty: string;
  status: string;
  title: string;
  description: string | null;
  source_urls: Array<{ url: string; label: string }>;
  acquisition_method: string | null;
  requires_foia: boolean;
  foia_agency: string | null;
  foia_template_key: string | null;
  required_fields: string[];
  submissions_count: number;
  last_submission_at: string | null;
  completed_at: string | null;
  completed_by: string | null;
}

interface Submission {
  id: string;
  title: string;
  submission_type: string;
  status: string;
  created_at: string;
  contributor?: {
    username: string | null;
  };
}

interface StateData {
  state_code: string;
  state_name: string;
  gaps: DataGap[];
  completion: {
    total: number;
    completed: number;
    partial: number;
    needed: number;
    completionPct: number;
    criticalNeeded: number;
  };
  submissions_count: number;
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

const CATEGORY_LABELS: Record<string, string> = {
  providers: 'Providers',
  payments: 'Payments',
  fraud_cases: 'Fraud Cases',
  political: 'Political',
  business: 'Business',
};

function DataGapRow({ gap, stateCode, expanded, onToggle }: { 
  gap: DataGap; 
  stateCode: string; 
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr 
        className={`hover:bg-gray-900/50 cursor-pointer ${gap.status === 'complete' ? 'opacity-50' : ''}`}
        onClick={onToggle}
      >
        <td className="p-3">
          <span className={`inline-block w-4 h-4 border ${
            gap.status === 'complete' ? 'border-gray-600 bg-gray-700' : 'border-gray-700'
          } text-center text-xs leading-4`}>
            {gap.status === 'complete' ? 'x' : gap.status === 'partial' ? '-' : ''}
          </span>
        </td>
        <td className="p-3 text-gray-300">{gap.title}</td>
        <td className="p-3 text-gray-500 text-xs uppercase">{gap.priority}</td>
        <td className="p-3 text-gray-500 text-xs">
          {gap.requires_foia ? 'FOIA' : gap.difficulty}
        </td>
        <td className="p-3 text-gray-500 text-xs">{gap.status.replace('_', ' ')}</td>
        <td className="p-3 text-gray-600 text-xs text-right">{gap.submissions_count}</td>
      </tr>
      {expanded && (
        <tr className="bg-gray-900/30">
          <td colSpan={6} className="p-4 border-t border-gray-800">
            <div className="space-y-4 text-sm">
              {gap.description && (
                <p className="text-gray-400">{gap.description}</p>
              )}

              {gap.requires_foia && gap.foia_agency && (
                <div>
                  <p className="text-gray-600 text-xs mb-1">FOIA Agency</p>
                  <p className="text-gray-400">{gap.foia_agency}</p>
                  {gap.foia_template_key && (
                    <Link
                      href={`/foia?state=${stateCode}&template=${gap.foia_template_key}`}
                      className="text-gray-500 hover:text-white text-xs mt-1 inline-block"
                    >
                      Generate FOIA request
                    </Link>
                  )}
                </div>
              )}

              {gap.source_urls && gap.source_urls.length > 0 && (
                <div>
                  <p className="text-gray-600 text-xs mb-1">Data Sources</p>
                  <div className="space-y-1">
                    {gap.source_urls.map((source, i) => (
                      <a
                        key={i}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-500 hover:text-white text-sm block"
                      >
                        {source.label || source.url}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {gap.required_fields && gap.required_fields.length > 0 && (
                <div>
                  <p className="text-gray-600 text-xs mb-1">Required Fields</p>
                  <p className="text-gray-500 text-xs">{gap.required_fields.join(', ')}</p>
                </div>
              )}

              {gap.acquisition_method && (
                <div>
                  <p className="text-gray-600 text-xs mb-1">How to Get This</p>
                  <p className="text-gray-500">
                    {gap.acquisition_method === 'download' && 'Direct download from state portal'}
                    {gap.acquisition_method === 'scrape' && 'Web scraping required'}
                    {gap.acquisition_method === 'foia' && 'Submit a FOIA/public records request'}
                    {gap.acquisition_method === 'manual' && 'Manual data collection'}
                  </p>
                </div>
              )}

              {gap.completed_by && gap.completed_at && (
                <p className="text-gray-600 text-xs">
                  Completed by {gap.completed_by} on {new Date(gap.completed_at).toLocaleDateString()}
                </p>
              )}

              {gap.status !== 'complete' && (
                <Link
                  href={`/crowdsource/submit?state=${stateCode}&gap=${gap.id}`}
                  className="inline-block px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white text-xs rounded"
                >
                  Submit Data
                </Link>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function StateCrowdsourcePage({ params }: { params: Promise<{ state: string }> }) {
  const resolvedParams = use(params);
  const stateCode = resolvedParams.state.toUpperCase();
  
  const [stateData, setStateData] = useState<StateData | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedGap, setExpandedGap] = useState<string | null>(null);

  // Validate state code
  if (!STATE_NAMES[stateCode]) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="border border-gray-800 p-8 text-center">
          <p className="text-white mb-2">Invalid state code: {stateCode}</p>
          <Link href="/crowdsource" className="text-gray-500 hover:text-white">
            Back to Crowdsourcing
          </Link>
        </div>
      </div>
    );
  }

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [gapsRes, submissionsRes] = await Promise.all([
          fetch(`/api/crowdsource/gaps/${stateCode}`),
          fetch(`/api/crowdsource/submissions?state=${stateCode}&status=approved`),
        ]);

        if (!gapsRes.ok) {
          throw new Error('Failed to fetch state data');
        }

        const gapsData = await gapsRes.json();
        setStateData(gapsData);

        if (submissionsRes.ok) {
          const submissionsData = await submissionsRes.json();
          setSubmissions(submissionsData.submissions || []);
        }
      } catch (e) {
        console.error('Error fetching state data:', e);
        setError('Failed to load state data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [stateCode]);

  // Filter gaps
  const filteredGaps = stateData?.gaps.filter(gap => {
    if (categoryFilter !== 'all' && gap.category !== categoryFilter) return false;
    if (statusFilter !== 'all' && gap.status !== statusFilter) return false;
    return true;
  }) || [];

  // Get unique categories
  const categories = [...new Set(stateData?.gaps.map(g => g.category).filter(Boolean) || [])];

  return (
    <div className="max-w-4xl mx-auto">
      <Link href="/crowdsource" className="text-gray-500 hover:text-white text-sm mb-6 inline-block">
        Back to Crowdsourcing
      </Link>

      {/* State Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">{STATE_NAMES[stateCode]}</h1>
        <p className="text-gray-500 text-sm">
          Data collection status for {STATE_NAMES[stateCode]}
        </p>
      </div>

      {/* Terminal-style Stats */}
      {stateData && (
        <div className="font-mono text-sm mb-10">
          <p className="text-gray-500">{stateCode}_DATA_STATUS</p>
          <div className="mt-2 text-gray-400">
            <p><span className="text-gray-600">+-</span> total_gaps <span className="text-white ml-4">{stateData.completion.total}</span></p>
            <p><span className="text-gray-600">+-</span> completed <span className="text-white ml-4">{stateData.completion.completed}</span></p>
            <p><span className="text-gray-600">+-</span> partial <span className="text-white ml-4">{stateData.completion.partial}</span></p>
            <p><span className="text-gray-600">+-</span> needed <span className="text-white ml-4">{stateData.completion.needed}</span></p>
            <p><span className="text-gray-600">+-</span> critical_needed <span className="text-white ml-4">{stateData.completion.criticalNeeded}</span></p>
            <p><span className="text-gray-600">+-</span> submissions <span className="text-white ml-4">{stateData.submissions_count}</span></p>
            <p><span className="text-gray-600">+-</span> completion <span className="text-white ml-4">{stateData.completion.completionPct}%</span></p>
          </div>
        </div>
      )}

      {loading && (
        <div className="text-gray-500 py-8">Loading state data...</div>
      )}

      {error && (
        <div className="border border-gray-800 p-4 mb-8">
          <p className="text-gray-400">{error}</p>
        </div>
      )}

      {stateData && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4 mb-4 text-sm">
            <span className="text-gray-500">Filter:</span>
            <button
              onClick={() => setCategoryFilter('all')}
              className={categoryFilter === 'all' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat!)}
                className={categoryFilter === cat ? 'text-white' : 'text-gray-500 hover:text-gray-300'}
              >
                {CATEGORY_LABELS[cat!] || cat}
              </button>
            ))}
            <span className="text-gray-700">|</span>
            <button
              onClick={() => setStatusFilter('all')}
              className={statusFilter === 'all' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}
            >
              All Status
            </button>
            <button
              onClick={() => setStatusFilter('needed')}
              className={statusFilter === 'needed' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}
            >
              Needed
            </button>
            <button
              onClick={() => setStatusFilter('complete')}
              className={statusFilter === 'complete' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}
            >
              Complete
            </button>
            <div className="flex-1"></div>
            <Link
              href={`/crowdsource/submit?state=${stateCode}`}
              className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded"
            >
              Submit Data
            </Link>
          </div>

          {/* Data Gaps Table */}
          <div className="border border-gray-800 mb-12">
            {filteredGaps.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                {stateData.gaps.length === 0
                  ? 'No data needs defined for this state yet.'
                  : 'No gaps match your filters.'}
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="text-left p-3 font-medium text-gray-400 w-10"></th>
                    <th className="text-left p-3 font-medium text-gray-400">Data Needed</th>
                    <th className="text-left p-3 font-medium text-gray-400">Priority</th>
                    <th className="text-left p-3 font-medium text-gray-400">Difficulty</th>
                    <th className="text-left p-3 font-medium text-gray-400">Status</th>
                    <th className="text-right p-3 font-medium text-gray-400">Subs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filteredGaps.map((gap) => (
                    <DataGapRow 
                      key={gap.id} 
                      gap={gap} 
                      stateCode={stateCode}
                      expanded={expandedGap === gap.id}
                      onToggle={() => setExpandedGap(expandedGap === gap.id ? null : gap.id)}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Recent Submissions */}
          {submissions.length > 0 && (
            <div className="mb-12">
              <h2 className="text-lg font-semibold mb-4">Submissions</h2>
              <div className="border border-gray-800">
                <table className="w-full text-sm">
                  <thead className="bg-gray-900">
                    <tr>
                      <th className="text-left p-3 font-medium text-gray-400">Title</th>
                      <th className="text-left p-3 font-medium text-gray-400">Type</th>
                      <th className="text-left p-3 font-medium text-gray-400">Contributor</th>
                      <th className="text-right p-3 font-medium text-gray-400">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {submissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-gray-900/50">
                        <td className="p-3 text-gray-300">{sub.title}</td>
                        <td className="p-3 text-gray-500 text-xs">{sub.submission_type.replace('_', ' ')}</td>
                        <td className="p-3 text-gray-500">{sub.contributor?.username || 'Anonymous'}</td>
                        <td className="p-3 text-right text-gray-600 text-xs">
                          {new Date(sub.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* FOIA Help */}
          <div className="border border-gray-800 p-6">
            <p className="text-white mb-2">Need help with FOIA?</p>
            <p className="text-gray-500 text-sm mb-4">
              Many data needs require filing a public records request.
            </p>
            <Link
              href={`/foia?state=${stateCode}`}
              className="text-gray-400 hover:text-white text-sm"
            >
              FOIA Request Generator for {STATE_NAMES[stateCode]}
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
