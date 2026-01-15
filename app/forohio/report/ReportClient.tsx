'use client';

import { useState } from 'react';
import Link from 'next/link';
import overview from '../data/overview.json';
import contractors from '../data/contractors.json';
import timeline from '../data/timeline.json';
import players from '../data/players.json';
import sources from '../data/sources.json';

function formatMoney(amount: number): string {
  if (amount >= 1e9) return `$${(amount / 1e9).toFixed(1)}B`;
  if (amount >= 1e6) return `$${(amount / 1e6).toFixed(1)}M`;
  if (amount >= 1e3) return `$${(amount / 1e3).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

export default function ReportClient() {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  // Password gate
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="border border-gray-800 p-8">
            <h1 className="text-2xl font-bold text-white mb-2">For Ohio</h1>
            <p className="text-gray-400 mb-6">Investigation Report - PDF View</p>

            <form onSubmit={handleSubmit}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-gray-900 border border-gray-700 text-white px-4 py-3 mb-4 focus:outline-none focus:border-green-500"
                disabled={loading}
              />
              {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 font-medium transition-colors disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Access Report'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Print-optimized report
  return (
    <div className="min-h-screen bg-white text-black print:bg-white">
      {/* Print controls - hidden when printing */}
      <div className="print:hidden bg-gray-900 text-white p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <Link href="/forohio" className="text-green-500 hover:underline">
              ← Back to Investigation
            </Link>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => window.print()}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 text-sm"
            >
              Print / Save as PDF
            </button>
          </div>
        </div>
      </div>

      {/* Report content */}
      <div className="max-w-4xl mx-auto p-8 print:p-0 print:max-w-none">
        {/* Header */}
        <div className="text-center mb-8 border-b-2 border-black pb-6">
          <h1 className="text-3xl font-bold mb-2">OHIO STATE SPENDING INVESTIGATION</h1>
          <p className="text-gray-600">Fiscal Years 2017-2020 Analysis</p>
          <p className="text-sm text-gray-500 mt-2">Generated January 2026</p>
        </div>

        {/* Executive Summary */}
        <section className="mb-8 page-break-inside-avoid">
          <h2 className="text-xl font-bold border-b border-gray-300 pb-2 mb-4">EXECUTIVE SUMMARY</h2>
          <div className="bg-gray-100 p-4 mb-4">
            <p className="font-medium">{overview.thesis}</p>
            <p className="text-sm mt-2 text-gray-700">{overview.subtitle}</p>
          </div>
          <p className="text-sm mb-4">{overview.elevatorPitch}</p>
          <p className="text-sm italic font-medium">{overview.conclusion}</p>
        </section>

        {/* Key Statistics */}
        <section className="mb-8 page-break-inside-avoid">
          <h2 className="text-xl font-bold border-b border-gray-300 pb-2 mb-4">KEY STATISTICS</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="border p-3">
              <div className="text-sm text-gray-500">Medicaid MCO Payments</div>
              <div className="text-xl font-bold">{formatMoney(overview.keyStats.totalMedicaidMCO)}</div>
            </div>
            <div className="border p-3">
              <div className="text-sm text-gray-500">Unemployment Fraud (Deloitte System)</div>
              <div className="text-xl font-bold text-red-700">{formatMoney(overview.keyStats.unemploymentFraud)}</div>
            </div>
            <div className="border p-3">
              <div className="text-sm text-gray-500">Deloitte Payments</div>
              <div className="text-xl font-bold">{formatMoney(overview.keyStats.deloittePayments)}</div>
            </div>
            <div className="border p-3">
              <div className="text-sm text-gray-500">CoreCivic Payments</div>
              <div className="text-xl font-bold">{formatMoney(overview.keyStats.corecivicPayments)}</div>
            </div>
            <div className="border p-3">
              <div className="text-sm text-gray-500">Huffman Total PAC Receipts</div>
              <div className="text-xl font-bold">{formatMoney(overview.keyStats.huffmanTotalPAC)}</div>
            </div>
            <div className="border p-3">
              <div className="text-sm text-gray-500">JMOC Dissolution</div>
              <div className="text-xl font-bold">June 25, 2025 at 2:00 AM</div>
            </div>
          </div>
        </section>

        {/* Verdict Tests */}
        <section className="mb-8 page-break-inside-avoid">
          <h2 className="text-xl font-bold border-b border-gray-300 pb-2 mb-4">ACCOUNTABILITY TESTS</h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">Test</th>
                <th className="border p-2 text-center w-20">Result</th>
                <th className="border p-2 text-left">Evidence</th>
              </tr>
            </thead>
            <tbody>
              {overview.verdictTests.map((test, i) => (
                <tr key={i}>
                  <td className="border p-2">{test.test}</td>
                  <td className="border p-2 text-center font-bold text-red-700">{test.result}</td>
                  <td className="border p-2">{test.evidence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Return on Investment */}
        <section className="mb-8 page-break-inside-avoid">
          <h2 className="text-xl font-bold border-b border-gray-300 pb-2 mb-4">RETURN ON INVESTMENT ANALYSIS</h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">Source</th>
                <th className="border p-2 text-right">Investment</th>
                <th className="border p-2 text-left">Recipient</th>
                <th className="border p-2 text-left">Return</th>
                <th className="border p-2 text-right">ROI</th>
              </tr>
            </thead>
            <tbody>
              {overview.roi.map((r, i) => (
                <tr key={i}>
                  <td className="border p-2">{r.source}</td>
                  <td className="border p-2 text-right">{formatMoney(r.investment)}</td>
                  <td className="border p-2">{r.recipient}</td>
                  <td className="border p-2">{r.return}</td>
                  <td className="border p-2 text-right font-bold">{r.multiple.toLocaleString()}x</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Industries with Wasteful Spending */}
        <section className="mb-8">
          <h2 className="text-xl font-bold border-b border-gray-300 pb-2 mb-4">INDUSTRIES WITH WASTEFUL SPENDING</h2>
          {overview.industries.map((industry, i) => (
            <div key={i} className="mb-4 border p-3">
              <div className="flex justify-between mb-2">
                <span className="font-bold">{industry.name}</span>
                <span className="font-bold">{formatMoney(industry.total)}</span>
              </div>
              <p className="text-sm mb-2">{industry.description}</p>
              <p className="text-sm mb-2"><span className="font-medium">Pattern:</span> {industry.pattern}</p>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border p-1 text-left">Contractor</th>
                    <th className="border p-1 text-right">Amount</th>
                    <th className="border p-1 text-left">Issue</th>
                  </tr>
                </thead>
                <tbody>
                  {industry.topContractors.map((c, j) => (
                    <tr key={j}>
                      <td className="border p-1">{c.name}</td>
                      <td className="border p-1 text-right">{formatMoney(c.amount)}</td>
                      <td className="border p-1 text-red-700">{c.issue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </section>

        {/* Page break before scandals */}
        <div className="page-break-before" />

        {/* Major Scandals */}
        <section className="mb-8">
          <h2 className="text-xl font-bold border-b border-gray-300 pb-2 mb-4">MAJOR SCANDALS</h2>
          {overview.scandals.map((scandal, i) => (
            <div key={i} className="mb-4 border p-3">
              <div className="flex justify-between mb-1">
                <span className="font-bold">{scandal.name}</span>
                <span className="text-gray-500">{scandal.year}</span>
              </div>
              {'amount' in scandal && scandal.amount && (
                <div className="text-red-700 font-bold mb-2">{formatMoney(scandal.amount)}</div>
              )}
              <p className="text-sm mb-2">{scandal.summary}</p>
              <ul className="text-sm list-disc ml-5 mb-2">
                {scandal.details.map((detail, j) => (
                  <li key={j}>{detail}</li>
                ))}
              </ul>
              <div className="bg-gray-100 p-2">
                <span className="font-medium">Outcome: </span>{scandal.outcome}
              </div>
              {scandal.quote && (
                <p className="text-sm italic mt-2">&quot;{scandal.quote}&quot; — {scandal.quoteSource}</p>
              )}
            </div>
          ))}
        </section>

        {/* Page break before contractors */}
        <div className="page-break-before" />

        {/* Contractors */}
        <section className="mb-8">
          <h2 className="text-xl font-bold border-b border-gray-300 pb-2 mb-4">CONTRACTOR ANALYSIS</h2>
          {contractors.contractors.map((c, idx) => (
            <div key={c.name} className={`mb-4 ${idx > 0 && idx % 3 === 0 ? 'page-break-before' : ''}`}>
              <div className="bg-gray-100 p-2 flex justify-between">
                <span className="font-bold">{c.name}</span>
                <span className="font-bold">{formatMoney(c.total)}</span>
              </div>
              <div className="border border-t-0 p-3 text-sm">
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {Object.entries(c.byYear).map(([year, amt]) => (
                    <div key={year}>
                      <span className="text-gray-500">{year}:</span> {formatMoney(amt as number)}
                    </div>
                  ))}
                </div>
                {c.growth && (
                  <div className="text-red-700 mb-2">
                    Growth: +{c.growth.percentChange}% (Pre-DeWine → Post-DeWine)
                  </div>
                )}
                <div>
                  <span className="font-medium">Issues:</span>
                  <ul className="list-disc ml-5">
                    {c.issues.map((issue, i) => (
                      <li key={i}>{issue}</li>
                    ))}
                  </ul>
                </div>
                {c.outcome && (
                  <div className="mt-2 bg-yellow-50 p-2 border border-yellow-200">
                    <span className="font-medium">Outcome:</span> {c.outcome}
                  </div>
                )}
              </div>
            </div>
          ))}
        </section>

        {/* Page break before timeline */}
        <div className="page-break-before" />

        {/* Timeline */}
        <section className="mb-8">
          <h2 className="text-xl font-bold border-b border-gray-300 pb-2 mb-4">TIMELINE OF EVENTS</h2>
          {timeline.events.map(yearGroup => (
            <div key={yearGroup.year} className="mb-4">
              <h3 className="font-bold bg-gray-200 p-2">{yearGroup.year}</h3>
              <div className="border border-t-0">
                {yearGroup.events.map((event, i) => (
                  <div key={i} className="p-3 border-b last:border-b-0">
                    <div className="font-medium">{event.title}</div>
                    <div className="text-sm text-gray-600">{event.description}</div>
                    {'amount' in event && event.amount && (
                      <div className="text-sm font-medium mt-1">Amount: {formatMoney(event.amount)}</div>
                    )}
                    {'impact' in event && event.impact && (
                      <div className="text-sm text-red-700 mt-1">Impact: {event.impact}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* Page break before players */}
        <div className="page-break-before" />

        {/* Key Players */}
        <section className="mb-8">
          <h2 className="text-xl font-bold border-b border-gray-300 pb-2 mb-4">KEY PLAYERS</h2>
          <div className="grid grid-cols-1 gap-4">
            {players.players.map(player => (
              <div key={player.name} className="border p-3">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-bold">{player.name}</span>
                    <span className="text-gray-500 ml-2">- {player.role}</span>
                  </div>
                  {player.pacMoney && (
                    <span className="font-bold">{formatMoney(player.pacMoney)} PAC</span>
                  )}
                </div>
                {player.beforeGov && (
                  <div className="text-sm"><span className="text-gray-500">Before:</span> {player.beforeGov}</div>
                )}
                {player.afterGov && (
                  <div className="text-sm"><span className="text-gray-500">After:</span> {player.afterGov}</div>
                )}
                {player.keyActions && (
                  <ul className="text-sm list-disc ml-5 mt-2">
                    {player.keyActions.map((action, i) => (
                      <li key={i}>{action}</li>
                    ))}
                  </ul>
                )}
                {player.conflicts && (
                  <div className="mt-2 bg-red-50 p-2 text-sm border border-red-200">
                    <span className="font-medium text-red-700">Conflicts:</span>
                    <ul className="list-disc ml-5">
                      {player.conflicts.map((conflict, i) => (
                        <li key={i}>{conflict}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="text-sm mt-2 italic">{player.significance}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Page break before sources */}
        <div className="page-break-before" />

        {/* Sources */}
        <section className="mb-8">
          <h2 className="text-xl font-bold border-b border-gray-300 pb-2 mb-4">DATA SOURCES</h2>

          <div className="mb-4">
            <h3 className="font-bold mb-2">Primary Sources</h3>
            <ul className="text-sm list-disc ml-5">
              {sources.primarySources.map((source, i) => (
                <li key={i} className="mb-1">
                  <span className="font-medium">{source.name}</span> - {source.description}
                  <br />
                  <span className="text-gray-500">{source.url}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-4">
            <h3 className="font-bold mb-2">News Sources</h3>
            <ul className="text-sm list-disc ml-5">
              {sources.newsAndReporting.map((source, i) => (
                <li key={i} className="mb-1">
                  <span className="font-medium">{source.title}</span> - {source.source} ({source.date})
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-4">
            <h3 className="font-bold mb-2">Methodology</h3>
            <div className="text-sm space-y-2">
              <p><span className="font-medium">Contract Data:</span> {sources.methodology.contractData}</p>
              <p><span className="font-medium">Campaign Finance:</span> {sources.methodology.campaignFinance}</p>
              <p><span className="font-medium">Cross-Reference:</span> {sources.methodology.crossReference}</p>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 p-3">
            <h3 className="font-bold mb-2">Limitations</h3>
            <ul className="text-sm list-disc ml-5">
              {sources.methodology.limitations.map((limit, i) => (
                <li key={i}>{limit}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* Footer */}
        <div className="border-t-2 border-black pt-4 text-center text-sm text-gray-500">
          <p>{sources.attribution}</p>
          <p className="mt-2">This document is for informational purposes only.</p>
        </div>
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          .page-break-before {
            page-break-before: always;
          }
          .page-break-inside-avoid {
            page-break-inside: avoid;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}
