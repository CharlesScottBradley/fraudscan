'use client';

import { useState } from 'react';
import Link from 'next/link';
import overview from './data/overview.json';
import contractors from './data/contractors.json';
import timeline from './data/timeline.json';
import players from './data/players.json';
import sources from './data/sources.json';

type TabType = 'summary' | 'money' | 'contractors' | 'timeline' | 'players' | 'sources';

function formatMoney(amount: number): string {
  if (amount >= 1e9) return `$${(amount / 1e9).toFixed(1)}B`;
  if (amount >= 1e6) return `$${(amount / 1e6).toFixed(1)}M`;
  if (amount >= 1e3) return `$${(amount / 1e3).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function ForohioClient() {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('summary');
  const [showExport, setShowExport] = useState(false);
  const [expandedContractor, setExpandedContractor] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/forohio/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        setAuthenticated(true);
      } else {
        setError('Invalid password');
      }
    } catch {
      setError('Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const exportJSON = () => {
    const data = { overview, contractors, timeline, players, sources };
    downloadFile(JSON.stringify(data, null, 2), 'ohio-investigation.json', 'application/json');
    setShowExport(false);
  };

  const exportCSV = () => {
    const rows = [['Contractor', 'Category', 'Total', '2017', '2018', '2019', '2020', 'Growth %', 'Issues']];
    contractors.contractors.forEach(c => {
      rows.push([
        c.name,
        c.category,
        c.total.toString(),
        (c.byYear['2017'] || 0).toString(),
        (c.byYear['2018'] || 0).toString(),
        (c.byYear['2019'] || 0).toString(),
        (c.byYear['2020'] || 0).toString(),
        (c.growth?.percentChange || 0).toString(),
        c.issues.join('; ')
      ]);
    });
    const csv = rows.map(r => r.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
    downloadFile(csv, 'ohio-investigation.csv', 'text/csv');
    setShowExport(false);
  };

  // Password gate
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="max-w-md w-full p-8">
          <div className="font-mono text-sm text-gray-500 mb-8 text-center">
            <p>ACCESS_RESTRICTED</p>
            <p className="text-gray-600 mt-1">Ohio State Spending Investigation</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-3 bg-black border border-gray-800 text-white placeholder-gray-600 focus:outline-none focus:border-gray-600 font-mono"
              autoFocus
              disabled={loading}
            />
            {error && <p className="text-gray-400 text-sm font-mono">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gray-900 border border-gray-800 text-white font-mono hover:bg-gray-800 transition disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Submit'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Main content
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="text-sm text-gray-500 mb-6">
          <Link href="/investigation" className="hover:text-gray-300">Investigations</Link>
          <span className="mx-2">/</span>
          <span className="text-white">Ohio</span>
        </div>

        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-medium mb-2">Ohio: Follow the Money</h1>
            <p className="text-gray-500 text-sm">State spending investigation 2017-2020</p>
          </div>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExport(!showExport)}
              className="px-3 py-2 text-sm border border-gray-800 text-gray-400 hover:text-white hover:border-gray-600 transition"
            >
              Export ↓
            </button>
            {showExport && (
              <div className="absolute right-0 mt-1 w-48 border border-gray-800 bg-black z-10">
                <Link
                  href="/forohio/report"
                  className="block w-full px-4 py-2 text-left text-sm text-gray-400 hover:text-white hover:bg-gray-900"
                >
                  View Report (PDF)
                </Link>
                <button
                  onClick={() => { exportJSON(); setShowExport(false); }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-400 hover:text-white hover:bg-gray-900"
                >
                  Download JSON
                </button>
                <button
                  onClick={() => { exportCSV(); setShowExport(false); }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-400 hover:text-white hover:bg-gray-900"
                >
                  Download CSV
                </button>
                <button
                  onClick={() => { window.print(); setShowExport(false); }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-400 hover:text-white hover:bg-gray-900"
                >
                  Print This Page
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Terminal Stats */}
        <div className="font-mono text-sm mb-8 border border-gray-800 p-4">
          <p className="text-gray-500">OH_SPENDING_INVESTIGATION</p>
          <div className="mt-2 text-gray-400">
            <p><span className="text-gray-600">├─</span> medicaid_mcos <span className="text-green-500 ml-4">{formatMoney(overview.keyStats.totalMedicaidMCO)}</span></p>
            <p><span className="text-gray-600">├─</span> unemployment_fraud <span className="text-red-500 ml-4">{formatMoney(overview.keyStats.unemploymentFraud)}</span> <span className="text-gray-600">(Deloitte system)</span></p>
            <p><span className="text-gray-600">├─</span> deloitte_payments <span className="text-green-500 ml-4">{formatMoney(overview.keyStats.deloittePayments)}</span> <span className="text-gray-600">(+149% after fraud)</span></p>
            <p><span className="text-gray-600">├─</span> huffman_pac_money <span className="text-green-500 ml-4">{formatMoney(overview.keyStats.huffmanTotalPAC)}</span> <span className="text-gray-600">(3.5x any other official)</span></p>
            <p><span className="text-gray-600">└─</span> data_range <span className="text-gray-500 ml-4">2017-2020</span></p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-800 mb-8">
          <nav className="flex space-x-6 overflow-x-auto">
            {[
              { id: 'summary', label: 'Summary' },
              { id: 'money', label: 'Money Loop' },
              { id: 'contractors', label: 'Contractors' },
              { id: 'timeline', label: 'Timeline' },
              { id: 'players', label: 'Players' },
              { id: 'sources', label: 'Sources' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`pb-3 text-sm font-medium whitespace-nowrap transition border-b-2 -mb-px ${
                  activeTab === tab.id
                    ? 'text-white border-white'
                    : 'text-gray-500 border-transparent hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="pb-16">
          {/* Executive Summary Tab */}
          {activeTab === 'summary' && (
            <div className="space-y-6">
              {/* The Thesis */}
              <div className="border border-gray-800 p-4">
                <h2 className="text-white font-medium mb-3">The Thesis</h2>
                <p className="text-gray-300 leading-relaxed">{overview.thesis}</p>
                <p className="text-gray-500 mt-3 text-sm">{overview.subtitle}</p>
              </div>

              {/* Elevator Pitch */}
              <div className="border border-gray-800 p-4">
                <h3 className="text-gray-500 text-sm mb-3">The 30-Second Explanation</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{overview.elevatorPitch}</p>
              </div>

              {/* The Irrational Spending Test */}
              <div className="border border-gray-800 p-4">
                <h3 className="text-white font-medium mb-2">The Irrational Spending Test</h3>
                <p className="text-gray-500 text-sm mb-4">If spending were legitimate, it would pass these tests. Ohio fails all of them.</p>
                <div className="space-y-3">
                  {overview.irrationalSpendingTests.map((test, i) => (
                    <div key={i} className="border border-gray-800 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-300 text-sm">{test.test}</span>
                        <span className="text-red-500 font-mono text-sm">{test.verdict}</span>
                      </div>
                      <div className="grid md:grid-cols-2 gap-2 text-sm mb-2">
                        <div>
                          <span className="text-gray-600">Expected: </span>
                          <span className="text-gray-400">{test.expected}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Actual: </span>
                          <span className="text-gray-400">{test.actual}</span>
                        </div>
                      </div>
                      <div className="text-gray-500 text-sm italic">{test.implication}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Wasteful Industries */}
              <div className="border border-gray-800 p-4">
                <h3 className="text-white font-medium mb-4">Industries with Wasteful Spending</h3>
                <div className="space-y-4">
                  {overview.industries.map((industry, i) => (
                    <div key={i} className="border border-gray-800 p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="text-gray-300">{industry.name}</h4>
                          <p className="text-gray-500 text-sm">{industry.description}</p>
                        </div>
                        <span className="text-green-500 font-mono">{formatMoney(industry.total)}</span>
                      </div>
                      <div className="text-sm text-gray-500 mb-3">Pattern: {industry.pattern}</div>
                      <div className="space-y-1">
                        {industry.topContractors.map((c, j) => (
                          <div key={j} className="flex justify-between text-sm">
                            <span className="text-gray-400">{c.name}</span>
                            <span className="text-gray-500">{c.issue}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Major Scandals */}
              <div className="border border-gray-800 p-4">
                <h3 className="text-white font-medium mb-4">The Scandals</h3>
                <div className="space-y-4">
                  {overview.scandals.map((scandal, i) => (
                    <div key={i} className="border border-gray-800 p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="text-gray-300">{scandal.name}</h4>
                          <span className="text-gray-600 text-sm">{scandal.year}</span>
                        </div>
                        {'amount' in scandal && scandal.amount && (
                          <span className="text-green-500 font-mono">{formatMoney(scandal.amount)}</span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm mb-3">{scandal.summary}</p>
                      <ul className="text-sm space-y-1 mb-3">
                        {scandal.details.slice(0, 3).map((detail, j) => (
                          <li key={j} className="text-gray-500">• {detail}</li>
                        ))}
                      </ul>
                      <div className="border-t border-gray-800 pt-2 mt-2">
                        <span className="text-gray-500 text-sm">Outcome: </span>
                        <span className="text-gray-400 text-sm">{scandal.outcome}</span>
                      </div>
                      {scandal.quote && (
                        <div className="mt-2 text-sm italic text-gray-600">
                          &quot;{scandal.quote}&quot; — {scandal.quoteSource}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Conclusion */}
              <div className="border border-gray-800 p-4">
                <p className="text-gray-400 text-center">{overview.conclusion}</p>
              </div>
            </div>
          )}

        {/* Money Loop Tab */}
        {activeTab === 'money' && (
          <div className="space-y-6">
            <div className="border border-gray-800 p-4">
              <h2 className="text-white font-medium mb-4">Return on Investment</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-gray-800">
                      <th className="pb-2">Investment</th>
                      <th className="pb-2">Recipient</th>
                      <th className="pb-2">Return</th>
                      <th className="pb-2 text-right">ROI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview.roi.map((r, i) => (
                      <tr key={i} className="border-b border-gray-800">
                        <td className="py-2">
                          <span className="text-gray-300">{r.source}</span>
                          <span className="text-green-500 ml-2">{formatMoney(r.investment)}</span>
                        </td>
                        <td className="py-2 text-gray-400">{r.recipient}</td>
                        <td className="py-2 text-gray-400">{r.return}</td>
                        <td className="py-2 text-right text-gray-300 font-mono">{r.multiple.toLocaleString()}x</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border border-gray-800 p-4 font-mono text-sm">
              <h3 className="text-white font-medium mb-4">The Loop</h3>
              <div className="space-y-4 text-gray-400">
                <div className="border border-gray-800 p-3">
                  <div className="text-gray-300 mb-2">Step 1: PAC Donations</div>
                  <div>OHCA PAC → $68K → Huffman ($45K) + McColley</div>
                  <div>Vorys PAC → $211K → Multiple politicians</div>
                  <div>Deloitte PAC → $48K → DeWine, Yost, Sprague</div>
                </div>
                <div className="text-center text-gray-600">↓</div>
                <div className="border border-gray-800 p-3">
                  <div className="text-gray-300 mb-2">Step 2: Protection</div>
                  <div>Huffman + McColley → Dissolved JMOC at 2 AM</div>
                  <div>DeWine → Appointed Corcoran (stock conflicts)</div>
                  <div>Yost → &quot;No evidence of wrongdoing&quot; by Deloitte</div>
                </div>
                <div className="text-center text-gray-600">↓</div>
                <div className="border border-gray-800 p-3">
                  <div className="text-gray-300 mb-2">Step 3: Billions</div>
                  <div>5 Medicaid MCOs: <span className="text-green-500">$53.7 BILLION</span></div>
                  <div>Deloitte: <span className="text-green-500">$166M</span> (payments DOUBLED after fraud)</div>
                  <div>CoreCivic: <span className="text-green-500">$174M</span> (+91% despite violence)</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contractors Tab */}
        {activeTab === 'contractors' && (
          <div className="space-y-4">
            {contractors.contractors.map(c => (
              <div key={c.name} className="border border-gray-800">
                <button
                  onClick={() => setExpandedContractor(expandedContractor === c.name ? null : c.name)}
                  className="w-full p-4 text-left hover:bg-gray-900/50 flex justify-between items-center"
                >
                  <div>
                    <span className="text-white font-medium">{c.name}</span>
                    <span className="text-gray-500 ml-2">({c.category})</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-green-500 font-mono">{formatMoney(c.total)}</span>
                    {c.growth && (
                      <span className={`text-sm ${c.growth.percentChange > 50 ? 'text-red-400' : 'text-gray-400'}`}>
                        +{c.growth.percentChange}%
                      </span>
                    )}
                    <span className="text-gray-500">{expandedContractor === c.name ? '▼' : '▶'}</span>
                  </div>
                </button>
                {expandedContractor === c.name && (
                  <div className="p-4 border-t border-gray-800 bg-gray-900/30">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-gray-400 text-sm mb-2">Payments by Year</h4>
                        <div className="font-mono text-sm space-y-1">
                          {Object.entries(c.byYear).map(([year, amt]) => (
                            <div key={year} className="flex justify-between">
                              <span className="text-gray-500">{year}</span>
                              <span className="text-green-500">{formatMoney(amt as number)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-gray-400 text-sm mb-2">Issues</h4>
                        <ul className="text-sm space-y-1">
                          {c.issues.map((issue, i) => (
                            <li key={i} className="text-red-400">• {issue}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="mt-4">
                      <h4 className="text-gray-400 text-sm mb-2">Agencies</h4>
                      <div className="flex flex-wrap gap-2">
                        {c.agencies.map((agency, i) => (
                          <span key={i} className="bg-gray-800 px-2 py-1 text-xs text-gray-300">{agency}</span>
                        ))}
                      </div>
                    </div>
                    {c.outcome && (
                      <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-800/50">
                        <span className="text-yellow-400 text-sm">Outcome: {c.outcome}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Timeline Tab */}
        {activeTab === 'timeline' && (
          <div className="space-y-6">
            {timeline.events.map(yearGroup => (
              <div key={yearGroup.year} className="border border-gray-800 p-4">
                <h3 className="text-xl font-bold text-white mb-4">{yearGroup.year}</h3>
                <div className="space-y-4">
                  {yearGroup.events.map((event, i) => (
                    <div key={i} className={`border-l-2 pl-4 ${
                      event.category === 'fraud' ? 'border-red-500' :
                      event.category === 'political' ? 'border-yellow-500' :
                      event.category === 'appointments' ? 'border-purple-500' :
                      'border-gray-600'
                    }`}>
                      <div className="text-white font-medium">{event.title}</div>
                      <div className="text-gray-400 text-sm mt-1">{event.description}</div>
                      {'amount' in event && event.amount && (
                        <div className="text-green-500 text-sm mt-1">{formatMoney(event.amount)}</div>
                      )}
                      {'impact' in event && event.impact && (
                        <div className="text-yellow-400 text-sm mt-1">→ {event.impact}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Players Tab */}
        {activeTab === 'players' && (
          <div className="space-y-4">
            {players.players.map(player => (
              <div key={player.name} className="border border-gray-800 p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-white font-medium">{player.name}</h3>
                    <p className="text-gray-400 text-sm">{player.role}</p>
                  </div>
                  {player.pacMoney && (
                    <span className="text-green-500 font-mono">{formatMoney(player.pacMoney)}</span>
                  )}
                </div>
                {player.beforeGov && (
                  <div className="text-sm mb-2">
                    <span className="text-gray-500">Before Gov:</span>
                    <span className="text-purple-400 ml-2">{player.beforeGov}</span>
                  </div>
                )}
                {player.afterGov && (
                  <div className="text-sm mb-2">
                    <span className="text-gray-500">After Gov:</span>
                    <span className="text-purple-400 ml-2">{player.afterGov}</span>
                  </div>
                )}
                {player.keyActions && (
                  <div className="mt-3">
                    <div className="text-gray-500 text-sm mb-1">Key Actions:</div>
                    <ul className="text-sm space-y-1">
                      {player.keyActions.map((action, i) => (
                        <li key={i} className="text-gray-300">• {action}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {player.conflicts && (
                  <div className="mt-3 p-2 bg-red-900/20 border border-red-800/50">
                    <div className="text-red-400 text-sm mb-1">Conflicts of Interest:</div>
                    <ul className="text-sm space-y-1">
                      {player.conflicts.map((conflict, i) => (
                        <li key={i} className="text-red-300">• {conflict}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="mt-3 text-yellow-400 text-sm">{player.significance}</div>
              </div>
            ))}
          </div>
        )}

        {/* Sources Tab */}
        {activeTab === 'sources' && (
          <div className="space-y-6">
            <div className="border border-gray-800 p-4">
              <h3 className="text-white font-medium mb-4">Primary Data Sources</h3>
              <div className="space-y-3">
                {sources.primarySources.map((source, i) => (
                  <div key={i} className="border-b border-gray-800/50 pb-3 last:border-0">
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-500 hover:underline"
                    >
                      {source.name}
                    </a>
                    <p className="text-gray-400 text-sm">{source.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-gray-800 p-4">
              <h3 className="text-white font-medium mb-4">News & Reporting</h3>
              <div className="space-y-3">
                {sources.newsAndReporting.map((source, i) => (
                  <div key={i} className="border-b border-gray-800/50 pb-3 last:border-0">
                    <div className="text-white">{source.title}</div>
                    <div className="text-gray-500 text-sm">{source.source} • {source.date}</div>
                    <p className="text-gray-400 text-sm">{source.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-gray-800 p-4">
              <h3 className="text-white font-medium mb-4">Methodology</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-gray-400 font-medium">Contract Data</div>
                  <p className="text-gray-500">{sources.methodology.contractData}</p>
                </div>
                <div>
                  <div className="text-gray-400 font-medium">Campaign Finance</div>
                  <p className="text-gray-500">{sources.methodology.campaignFinance}</p>
                </div>
                <div>
                  <div className="text-gray-400 font-medium">Cross-Reference</div>
                  <p className="text-gray-500">{sources.methodology.crossReference}</p>
                </div>
              </div>
            </div>

            <div className="border border-gray-800 p-4">
              <h3 className="text-gray-400 font-medium mb-2">Limitations</h3>
              <ul className="text-sm space-y-1">
                {sources.methodology.limitations.map((limit, i) => (
                  <li key={i} className="text-gray-500">• {limit}</li>
                ))}
              </ul>
            </div>

            <div className="text-gray-600 text-sm text-center">
              {sources.attribution}
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
