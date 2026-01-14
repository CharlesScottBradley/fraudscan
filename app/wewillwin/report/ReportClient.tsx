'use client';

import { useState } from 'react';
import overviewData from '../data/overview.json';
import contractorsData from '../data/contractors.json';
import spendingData from '../data/spending.json';
import timelineData from '../data/timeline.json';
import deloitteData from '../data/deloitte.json';

export default function ReportClient() {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/wewillwin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        setAuthenticated(true);
      } else {
        setError('Invalid password');
      }
    } catch {
      setError('Error verifying password');
    } finally {
      setLoading(false);
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center print:hidden">
        <div className="max-w-md w-full p-8">
          <div className="font-mono text-sm text-gray-500 mb-8 text-center">
            <p>REPORT_ACCESS_RESTRICTED</p>
            <p className="text-gray-600 mt-1">Authentication required</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-3 bg-black border border-gray-800 text-white placeholder-gray-600 focus:outline-none focus:border-gray-600 font-mono"
              autoFocus
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

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-white text-black print:bg-white print:text-black">
      {/* Print Controls - hidden when printing */}
      <div className="no-print bg-gray-900 text-white p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="font-medium">Florida Investigation Report</h1>
            <p className="text-gray-400 text-sm">Print-optimized executive briefing</p>
          </div>
          <div className="flex gap-3">
            <a
              href="/wewillwin"
              className="px-4 py-2 text-sm border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500"
            >
              ← Back
            </a>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 text-sm bg-white text-black hover:bg-gray-200"
            >
              Print / Save as PDF
            </button>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="max-w-4xl mx-auto px-8 py-12 print:p-0 print:max-w-none">
        {/* Page 1: Executive Summary */}
        <section className="print-page">
          <header className="text-center mb-12 print:mb-8">
            <p className="text-sm text-gray-500 tracking-widest mb-2">SOMALISCAN INVESTIGATIONS</p>
            <h1 className="text-3xl font-bold mb-2 print:text-2xl">FLORIDA STATE CONTRACTING INVESTIGATION</h1>
            <p className="text-lg text-gray-600">Executive Briefing</p>
            <p className="text-sm text-gray-500 mt-4">{currentDate}</p>
            <p className="text-xs text-gray-400 mt-1 tracking-widest">CONFIDENTIAL</p>
          </header>

          <div className="mb-10">
            <h2 className="text-lg font-bold border-b-2 border-black pb-1 mb-4">KEY FINDINGS</h2>
            <div className="font-mono text-sm space-y-1">
              <p>├─ <strong>{overviewData.stats.missingContracts.value}</strong> in emergency contracts missing documentation ({overviewData.stats.missingContracts.count} contracts)</p>
              <p>├─ <strong>{overviewData.stats.politicalAds.value}</strong> diverted from state funds to political ads</p>
              <p>├─ <strong>{overviewData.stats.voucherUnaccounted.value}</strong> in voucher funds unaccounted ({overviewData.stats.voucherUnaccounted.students.toLocaleString()} students)</p>
              <p>└─ <strong>{overviewData.stats.auditsRequired.conducted} of {overviewData.stats.auditsRequired.required}</strong> required audits conducted (law signed 2021)</p>
            </div>
          </div>

          <div className="mb-10">
            <h2 className="text-lg font-bold border-b-2 border-black pb-1 mb-4">ACTIVE INVESTIGATIONS</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-semibold">Investigation</th>
                  <th className="text-left py-2 font-semibold">Status</th>
                  <th className="text-right py-2 font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {overviewData.investigations.map((inv, i) => (
                  <tr key={i} className="border-b border-gray-200">
                    <td className="py-2">{inv.name}</td>
                    <td className="py-2 text-gray-600">{inv.status}</td>
                    <td className="py-2 text-right font-mono">{inv.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mb-10">
            <h2 className="text-lg font-bold border-b-2 border-black pb-1 mb-4">THE PAY-TO-PLAY PATTERN</h2>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              {overviewData.thePattern.steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>

          <blockquote className="border-l-4 border-gray-400 pl-4 py-2 italic text-gray-700 text-sm">
            &ldquo;{overviewData.keyQuote.text}&rdquo;
            <cite className="block mt-2 not-italic text-gray-500">— {overviewData.keyQuote.attribution}</cite>
          </blockquote>
        </section>

        {/* Page Break */}
        <div className="page-break" />

        {/* Page 2: Contractor Analysis */}
        <section className="print-page">
          <h2 className="text-2xl font-bold mb-6 print:text-xl">TOP CONTRACTORS BY POLITICAL ROI</h2>

          <div className="space-y-8">
            {contractorsData.contractors.map((contractor) => (
              <div key={contractor.id} className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-bold">{contractor.name}</h3>
                <p className="text-sm text-gray-500 mb-3">{contractor.headquarters}</p>

                <div className="font-mono text-sm mb-3 bg-gray-50 p-3 print:bg-gray-100">
                  <p>├─ Donated: <strong>{contractor.donations.total}</strong></p>
                  <p>├─ Contracts: <strong>{contractor.contracts.total}</strong></p>
                  {contractor.roi && <p>└─ ROI: <strong>{contractor.roi}</strong></p>}
                </div>

                {contractor.executives.length > 0 && (
                  <p className="text-sm mb-2">
                    <span className="font-semibold">Key Executives:</span>{' '}
                    {contractor.executives.map(e => e.name).join(', ')}
                  </p>
                )}

                {contractor.redFlags && contractor.redFlags.length > 0 && (
                  <div className="text-sm text-gray-700">
                    <p className="font-semibold">Concerns:</p>
                    <ul className="list-disc list-inside ml-2">
                      {contractor.redFlags.slice(0, 3).map((flag, i) => (
                        <li key={i}>{flag}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className="text-xs text-gray-500 mt-2">
                  Documentation: {contractor.documentation}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Page Break */}
        <div className="page-break" />

        {/* Page 3: Spending Breakdown */}
        <section className="print-page">
          <h2 className="text-2xl font-bold mb-6 print:text-xl">SPENDING BY CATEGORY</h2>

          <div className="font-mono text-sm mb-8 bg-gray-50 p-4 print:bg-gray-100">
            <p className="font-bold mb-2">ACCOUNTABILITY SUMMARY</p>
            <p>├─ Missing documentation: {spendingData.totals.missingDocumentation}</p>
            <p>├─ Contract count: {spendingData.totals.contractCount}</p>
            <p>├─ Audits required: {spendingData.totals.auditsRequired}</p>
            <p>└─ Audits conducted: {spendingData.totals.auditsConducted} (law signed 2021)</p>
          </div>

          <div className="space-y-6">
            {spendingData.categories.map((category) => (
              <div key={category.id} className="border-b border-gray-200 pb-4">
                <div className="flex justify-between items-baseline mb-2">
                  <h3 className="font-bold">{category.name}</h3>
                  <span className="font-mono font-bold">{category.total}</span>
                </div>

                {category.contracts && (
                  <table className="w-full text-sm">
                    <tbody>
                      {category.contracts.slice(0, 5).map((c, i) => (
                        <tr key={i} className="border-t border-gray-100">
                          <td className="py-1">{c.contractor}</td>
                          <td className="py-1 text-right font-mono">{c.amount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {category.spending && (
                  <table className="w-full text-sm">
                    <tbody>
                      {category.spending.map((s, i) => (
                        <tr key={i} className="border-t border-gray-100">
                          <td className="py-1">{s.year}</td>
                          <td className="py-1 text-right font-mono">{s.amount}</td>
                          <td className="py-1 text-right text-gray-500">{typeof s.students === 'number' ? s.students.toLocaleString() : s.students} students</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {category.auditFindings && (
                  <div className="mt-2 text-sm bg-gray-50 p-2 print:bg-gray-100">
                    <p className="font-semibold text-xs">AUDIT FINDINGS:</p>
                    {category.auditFindings.map((f, i) => (
                      <p key={i}>{f.finding}: {f.amount}</p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Page Break */}
        <div className="page-break" />

        {/* Page 4: Timeline */}
        <section className="print-page">
          <h2 className="text-2xl font-bold mb-6 print:text-xl">KEY EVENTS TIMELINE</h2>

          {[...new Set(timelineData.events.map(e => e.year))].sort().map(year => (
            <div key={year} className="mb-6">
              <h3 className="font-bold text-lg border-b border-black mb-2">{year}</h3>
              <div className="space-y-2 text-sm">
                {timelineData.events
                  .filter(e => e.year === year)
                  .map((event, i) => (
                    <div key={i} className={`flex gap-4 ${event.highlight ? 'bg-gray-100 p-2 -mx-2' : ''}`}>
                      <span className="font-mono text-gray-500 w-24 shrink-0">{event.date}</span>
                      <div className="flex-1">
                        <span className="font-semibold">{event.title}</span>
                        {event.amount && <span className="font-mono ml-2">{event.amount}</span>}
                        <p className="text-gray-600 text-xs">{event.description}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </section>

        {/* Page Break */}
        <div className="page-break" />

        {/* Page 5: Deloitte Connection */}
        <section className="print-page">
          <h2 className="text-2xl font-bold mb-2 print:text-xl">{deloitteData.title.toUpperCase()}</h2>
          <p className="text-gray-600 mb-6">{deloitteData.subtitle}</p>

          <div className="grid grid-cols-2 gap-8 mb-8 print:gap-4">
            <div>
              <h3 className="font-bold border-b border-black pb-1 mb-3">PUBLIC STATEMENTS</h3>
              <div className="space-y-3 text-sm">
                {deloitteData.theContradiction.publicStatements.map((stmt, i) => (
                  <blockquote key={i} className="border-l-2 border-gray-300 pl-2">
                    <p className="italic">&ldquo;{stmt.quote}&rdquo;</p>
                    <cite className="text-gray-500 text-xs">— {stmt.date}</cite>
                  </blockquote>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-bold border-b border-black pb-1 mb-3">WHAT HAPPENED</h3>
              <div className="space-y-1 text-sm font-mono">
                {deloitteData.theContradiction.whatActuallyHappened.map((event, i) => (
                  <p key={i}>
                    <span className="text-gray-500">{event.date}:</span> {event.action}
                  </p>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-gray-100 p-4 mb-8 print:bg-gray-100">
            <p className="font-bold text-center">{deloitteData.theContradiction.summary}</p>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8 print:gap-4">
            <div className="text-sm">
              <h3 className="font-bold mb-2">CONNECT System (2011-2015)</h3>
              <p>Original: {deloitteData.connectSystem.originalContract}</p>
              <p>Final: {deloitteData.connectSystem.finalCost}</p>
              <p className="text-gray-600 mt-2">Problems:</p>
              <ul className="list-disc list-inside text-xs">
                {deloitteData.connectSystem.problems.slice(0, 3).map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>

            <div className="text-sm">
              <h3 className="font-bold mb-2">New Contract (August 2020)</h3>
              <p>Amount: {deloitteData.newContract.amount}</p>
              <p>Duration: {deloitteData.newContract.duration}</p>
              <p className="mt-2 font-semibold">Past Performance Score: {deloitteData.newContract.pastPerformanceScore}</p>
              <p className="text-xs text-gray-600">{deloitteData.newContract.note}</p>
            </div>
          </div>

          <div>
            <h3 className="font-bold border-b border-black pb-1 mb-3">KEY PLAYERS (REVOLVING DOOR)</h3>
            <div className="space-y-3 text-sm">
              {deloitteData.keyPlayers.map((player, i) => (
                <div key={i} className="flex justify-between">
                  <div>
                    <span className="font-semibold">{player.name}</span>
                    <span className="text-gray-500 ml-2">{player.role}</span>
                  </div>
                  {player.whereAfter && (
                    <span className="text-gray-600">→ {player.whereAfter}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Page Break */}
        <div className="page-break" />

        {/* Page 6: Sources & Methodology */}
        <section className="print-page">
          <h2 className="text-2xl font-bold mb-6 print:text-xl">SOURCES & METHODOLOGY</h2>

          <div className="grid grid-cols-2 gap-8 mb-8 print:gap-4">
            <div>
              <h3 className="font-bold border-b border-black pb-1 mb-3">PRIMARY REPORTING</h3>
              <ul className="text-sm space-y-2">
                {overviewData.sources.filter(s => s.date).map((source, i) => (
                  <li key={i}>
                    <span className="font-semibold">{source.name}</span>
                    <br />
                    <span className="text-gray-600">{source.title}</span>
                    <br />
                    <span className="text-gray-500 text-xs">{source.date}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-bold border-b border-black pb-1 mb-3">PUBLIC RECORDS</h3>
              <ul className="text-sm space-y-1">
                <li>Florida FACTS Contract Database</li>
                <li>State campaign finance records</li>
                <li>FEC contribution data</li>
                <li>Corporate registration records</li>
                <li>Court filings and settlements</li>
                <li>Legislative audit reports</li>
              </ul>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="font-bold border-b border-black pb-1 mb-3">METHODOLOGY</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              This report compiles publicly available data from state contract databases,
              campaign finance records, and investigative journalism. All figures are sourced
              from official government records or credible news organizations. Dollar amounts
              represent contracted values as documented in state systems; actual disbursements
              may vary. The &ldquo;ROI&rdquo; calculations compare documented political donations to
              contracted amounts and should be interpreted as illustrative of relationships,
              not as evidence of quid pro quo.
            </p>
          </div>

          <div className="mb-8">
            <h3 className="font-bold border-b border-black pb-1 mb-3">UNANSWERED QUESTIONS</h3>
            <ol className="text-sm space-y-1 list-decimal list-inside">
              {deloitteData.unansweredQuestions.slice(0, 5).map((q, i) => (
                <li key={i} className="text-gray-700">{q}</li>
              ))}
            </ol>
          </div>

          <footer className="border-t border-gray-300 pt-4 mt-12">
            <div className="flex justify-between text-xs text-gray-500">
              <p>Generated: {currentDate}</p>
              <p>SomaliScan Investigations</p>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              This document is for informational purposes only and does not constitute legal advice or accusation of wrongdoing.
            </p>
          </footer>
        </section>
      </div>
    </div>
  );
}
