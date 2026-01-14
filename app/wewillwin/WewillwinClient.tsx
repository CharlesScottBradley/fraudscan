'use client';

import { useState } from 'react';
import Link from 'next/link';
import overviewData from './data/overview.json';
import contractorsData from './data/contractors.json';
import spendingData from './data/spending.json';
import timelineData from './data/timeline.json';
import deloitteData from './data/deloitte.json';

type Tab = 'overview' | 'contractors' | 'spending' | 'timeline' | 'deloitte';

// Export functions
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

function exportJSON() {
  const data = {
    exportDate: new Date().toISOString(),
    title: 'Florida DeSantis Investigation',
    overview: overviewData,
    contractors: contractorsData,
    spending: spendingData,
    timeline: timelineData,
    deloitte: deloitteData,
  };
  downloadFile(JSON.stringify(data, null, 2), 'florida-desantis-investigation.json', 'application/json');
}

function exportCSV() {
  const rows: string[][] = [];

  // Header
  rows.push(['Florida DeSantis Investigation - Export']);
  rows.push(['Generated', new Date().toISOString()]);
  rows.push([]);

  // Stats
  rows.push(['=== KEY STATISTICS ===']);
  rows.push(['Metric', 'Value', 'Details']);
  rows.push(['Missing Contract Documentation', overviewData.stats.missingContracts.value, `${overviewData.stats.missingContracts.count} contracts`]);
  rows.push(['Political Ads Diverted', overviewData.stats.politicalAds.value, overviewData.stats.politicalAds.description]);
  rows.push(['Voucher Funds Unaccounted', overviewData.stats.voucherUnaccounted.value, `${overviewData.stats.voucherUnaccounted.students} students`]);
  rows.push(['Audits Conducted', `${overviewData.stats.auditsRequired.conducted} of ${overviewData.stats.auditsRequired.required}`, overviewData.stats.auditsRequired.description]);
  rows.push([]);

  // Investigations
  rows.push(['=== ACTIVE INVESTIGATIONS ===']);
  rows.push(['Name', 'Status', 'Amount', 'Allegations']);
  overviewData.investigations.forEach(inv => {
    rows.push([inv.name, inv.status, inv.amount, inv.allegations.join('; ')]);
  });
  rows.push([]);

  // Contractors
  rows.push(['=== CONTRACTORS ===']);
  rows.push(['Name', 'Headquarters', 'Donations Total', 'Contracts Total', 'ROI', 'Documentation Status']);
  contractorsData.contractors.forEach(c => {
    rows.push([c.name, c.headquarters, c.donations.total, c.contracts.total, c.roi || 'N/A', c.documentation]);
  });
  rows.push([]);

  // Contractor donations detail
  rows.push(['=== CONTRACTOR DONATIONS DETAIL ===']);
  rows.push(['Contractor', 'Recipient', 'Amount']);
  contractorsData.contractors.forEach(c => {
    c.donations.breakdown.forEach(d => {
      rows.push([c.name, d.recipient, d.amount]);
    });
  });
  rows.push([]);

  // Spending categories
  rows.push(['=== SPENDING CATEGORIES ===']);
  rows.push(['Category', 'Total']);
  spendingData.categories.forEach(cat => {
    rows.push([cat.name, cat.total]);
  });
  rows.push([]);

  // Timeline
  rows.push(['=== TIMELINE ===']);
  rows.push(['Date', 'Title', 'Description', 'Amount', 'Category']);
  timelineData.events.forEach(e => {
    rows.push([e.date, e.title, e.description, e.amount || '', e.category]);
  });
  rows.push([]);

  // Deloitte
  rows.push(['=== DELOITTE CONNECTION ===']);
  rows.push(['CONNECT System Original Contract', deloitteData.connectSystem.originalContract]);
  rows.push(['CONNECT System Final Cost', deloitteData.connectSystem.finalCost]);
  rows.push(['New Contract (2020)', deloitteData.newContract.amount]);
  rows.push(['Past Performance Score', deloitteData.newContract.pastPerformanceScore]);
  rows.push([]);
  rows.push(['Key Players']);
  deloitteData.keyPlayers.forEach(p => {
    rows.push([p.name, p.role, p.whereAfter || '']);
  });

  // Convert to CSV
  const csv = rows.map(row => row.map(cell => {
    const str = String(cell || '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }).join(',')).join('\n');

  downloadFile(csv, 'florida-desantis-investigation.csv', 'text/csv');
}

function printReport() {
  window.print();
}

export default function WewillwinClient() {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [showExport, setShowExport] = useState(false);

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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="max-w-md w-full p-8">
          <div className="font-mono text-sm text-gray-500 mb-8 text-center">
            <p>ACCESS_RESTRICTED</p>
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

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'contractors', label: 'Contractors' },
    { id: 'spending', label: 'Spending' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'deloitte', label: 'Deloitte' },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="text-sm text-gray-500 mb-6">
          <Link href="/investigation" className="hover:text-gray-300">Investigations</Link>
          <span className="mx-2">/</span>
          <span className="text-white">Florida</span>
        </div>

        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-medium mb-2">Florida: The DeSantis Investigation</h1>
            <p className="text-gray-500 text-sm">Following the money from donors to contracts</p>
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
                  href="/wewillwin/report"
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
                  onClick={() => { printReport(); setShowExport(false); }}
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
          <p className="text-gray-500">FL_DESANTIS_INVESTIGATION</p>
          <div className="mt-2 text-gray-400">
            <p><span className="text-gray-600">├─</span> missing_contracts <span className="text-green-500 ml-4">{overviewData.stats.missingContracts.value}</span> <span className="text-gray-600">({overviewData.stats.missingContracts.count} contracts)</span></p>
            <p><span className="text-gray-600">├─</span> political_ads_diverted <span className="text-green-500 ml-4">{overviewData.stats.politicalAds.value}</span></p>
            <p><span className="text-gray-600">├─</span> voucher_unaccounted <span className="text-green-500 ml-4">{overviewData.stats.voucherUnaccounted.value}</span> <span className="text-gray-600">({overviewData.stats.voucherUnaccounted.students.toLocaleString()} students)</span></p>
            <p><span className="text-gray-600">├─</span> audits_conducted <span className="text-white ml-4">{overviewData.stats.auditsRequired.conducted} of {overviewData.stats.auditsRequired.required}</span></p>
            <p><span className="text-gray-600">└─</span> last_updated <span className="text-gray-500 ml-4">{overviewData.lastUpdated}</span></p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-800 mb-8">
          <nav className="flex space-x-6 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
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
          {activeTab === 'overview' && <OverviewSection />}
          {activeTab === 'contractors' && <ContractorsSection />}
          {activeTab === 'spending' && <SpendingSection />}
          {activeTab === 'timeline' && <TimelineSection />}
          {activeTab === 'deloitte' && <DeloitteSection />}
        </div>
      </div>
    </div>
  );
}

function OverviewSection() {
  const { investigations, thePattern, keyQuote, sources } = overviewData;

  return (
    <div className="space-y-8">
      {/* Context */}
      <div className="text-gray-400 text-sm leading-relaxed max-w-3xl">
        <p className="mb-4">
          This investigation documents patterns in Florida state contracting under the DeSantis administration (2019-present).
          It focuses on emergency contract awards, political donor relationships, and accountability gaps.
        </p>
        <p>
          Key finding: Over $6 billion in emergency contracts lack required public documentation.
          Despite signing a law in 2021 requiring audits of emergency spending, zero audits have been conducted.
        </p>
      </div>

      {/* Active Investigations */}
      <div>
        <h3 className="text-sm font-medium text-gray-400 mb-4">Active Investigations</h3>
        <div className="border border-gray-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-900/50">
              <tr>
                <th className="text-left p-3 font-medium text-gray-400">Investigation</th>
                <th className="text-left p-3 font-medium text-gray-400">Allegations</th>
                <th className="text-right p-3 font-medium text-gray-400">Amount</th>
                <th className="text-left p-3 font-medium text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {investigations.map((inv, i) => (
                <tr key={i} className="hover:bg-gray-900/30">
                  <td className="p-3 text-white">{inv.name}</td>
                  <td className="p-3 text-gray-400 text-xs">{inv.allegations.join(', ')}</td>
                  <td className="p-3 text-right font-mono text-green-500">{inv.amount}</td>
                  <td className="p-3 text-gray-400 text-xs">{inv.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* The Pattern */}
      <div className="border border-gray-800 p-4">
        <h3 className="text-white font-medium mb-3">{thePattern.title}</h3>
        <div className="space-y-2 text-sm text-gray-400">
          {thePattern.steps.map((step, i) => (
            <p key={i}>
              <span className="text-gray-600">{i + 1}.</span> {step}
            </p>
          ))}
        </div>
      </div>

      {/* Key Quote */}
      <blockquote className="border-l-2 border-gray-700 pl-4 py-2">
        <p className="text-gray-300 italic">&ldquo;{keyQuote.text}&rdquo;</p>
        <cite className="text-gray-500 text-sm mt-2 block">— {keyQuote.attribution}</cite>
      </blockquote>

      {/* Sources */}
      <div className="text-sm">
        <h3 className="text-gray-400 font-medium mb-2">Sources</h3>
        <div className="space-y-2">
          {sources.map((source, i) => (
            <div key={i}>
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-500 hover:underline"
              >
                {source.name}: {source.title}
              </a>
              {source.date && <span className="text-gray-600 ml-2">({source.date})</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ContractorsSection() {
  const { contractors } = contractorsData;
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <p className="text-gray-400 text-sm mb-6 max-w-3xl">
        Analysis of major state contractors and their political relationships.
        Click to expand details including donations, contracts awarded, and documentation status.
      </p>

      {contractors.map((contractor) => (
        <div key={contractor.id} className="border border-gray-800">
          <button
            onClick={() => setExpanded(expanded === contractor.id ? null : contractor.id)}
            className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-900/30 transition"
          >
            <div>
              <h3 className="font-medium text-white">{contractor.name}</h3>
              <p className="text-gray-500 text-sm">{contractor.headquarters}</p>
            </div>
            <div className="text-right font-mono text-sm">
              <p className="text-green-500">{contractor.contracts.total}</p>
              <p className="text-gray-500">donated: {contractor.donations.total}</p>
            </div>
          </button>

          {expanded === contractor.id && (
            <div className="px-4 pb-4 border-t border-gray-800 pt-4 text-sm">
              {/* Executives */}
              {contractor.executives.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-gray-400 mb-2">Key Executives</h4>
                  <div className="space-y-1 text-gray-300">
                    {contractor.executives.map((exec, i) => (
                      <p key={i}>
                        {exec.name} <span className="text-gray-500">— {exec.title}</span>
                        {'note' in exec && exec.note && <span className="text-gray-500"> ({exec.note})</span>}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Donations */}
              {contractor.donations.breakdown.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-gray-400 mb-2">Political Donations</h4>
                  <table className="w-full">
                    <tbody className="text-gray-300">
                      {contractor.donations.breakdown.map((d, i) => (
                        <tr key={i}>
                          <td className="py-1">{d.recipient}</td>
                          <td className="py-1 text-right font-mono text-green-500">{d.amount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Contracts */}
              <div className="mb-4">
                <h4 className="text-gray-400 mb-2">Contracts Awarded</h4>
                <table className="w-full">
                  <tbody className="text-gray-300">
                    {contractor.contracts.breakdown.map((c, i) => (
                      <tr key={i}>
                        <td className="py-1">{(c as { description?: string; facility?: string }).description || (c as { facility?: string }).facility || ''}</td>
                        <td className="py-1 text-right font-mono text-green-500">{c.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Red Flags */}
              {contractor.redFlags && contractor.redFlags.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-gray-400 mb-2">Concerns</h4>
                  <ul className="space-y-1 text-gray-400">
                    {contractor.redFlags.map((flag, i) => (
                      <li key={i}>— {flag}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* ROI & Documentation */}
              <div className="pt-3 border-t border-gray-800 text-gray-500">
                {contractor.roi && <p>ROI: <span className="text-white">{contractor.roi}</span></p>}
                <p>Documentation: <span className={contractor.documentation.includes('MISSING') ? 'text-white' : 'text-gray-400'}>{contractor.documentation}</span></p>
              </div>

              {/* Sources */}
              {contractor.sources && contractor.sources.length > 0 && (
                <div className="pt-3 mt-3 border-t border-gray-800">
                  <h4 className="text-gray-500 text-xs mb-1">Sources</h4>
                  <div className="space-y-1">
                    {contractor.sources.map((source, i) => (
                      <a
                        key={i}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-green-500 hover:underline text-xs"
                      >
                        {source.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function SpendingSection() {
  const { categories, totals } = spendingData;
  const [expandedCategory, setExpandedCategory] = useState<string | null>('covid');

  return (
    <div className="space-y-6">
      {/* Totals */}
      <div className="font-mono text-sm border border-gray-800 p-4">
        <p className="text-gray-500">SPENDING_SUMMARY</p>
        <div className="mt-2 text-gray-400">
          <p><span className="text-gray-600">├─</span> missing_documentation <span className="text-green-500 ml-4">{totals.missingDocumentation}</span></p>
          <p><span className="text-gray-600">├─</span> contract_count <span className="text-white ml-4">{totals.contractCount}</span></p>
          <p><span className="text-gray-600">├─</span> audits_required <span className="text-white ml-4">{totals.auditsRequired}</span></p>
          <p><span className="text-gray-600">└─</span> audits_conducted <span className="text-white ml-4">{totals.auditsConducted}</span> <span className="text-gray-600">(law signed 2021)</span></p>
        </div>
      </div>

      <p className="text-gray-400 text-sm">
        Breakdown of major spending categories. Click to expand details.
      </p>

      {/* Categories */}
      {categories.map((category) => (
        <div key={category.id} className="border border-gray-800">
          <button
            onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
            className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-900/30 transition"
          >
            <h3 className="font-medium text-white">{category.name}</h3>
            <span className="font-mono text-green-500">{category.total}</span>
          </button>

          {expandedCategory === category.id && (
            <div className="px-4 pb-4 border-t border-gray-800 pt-4 text-sm">
              {/* Contracts */}
              {category.contracts && (
                <table className="w-full mb-4">
                  <thead>
                    <tr className="text-gray-500 text-left text-xs">
                      <th className="pb-2">Contractor</th>
                      <th className="pb-2 text-right">Amount</th>
                      <th className="pb-2">Description</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-300">
                    {category.contracts.map((c, i) => (
                      <tr key={i} className="border-t border-gray-800">
                        <td className="py-2">{c.contractor}</td>
                        <td className="py-2 text-right font-mono text-green-500">{c.amount}</td>
                        <td className="py-2 text-gray-500">{(c as { description?: string; facility?: string }).description || (c as { facility?: string }).facility || ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Spending (for vouchers) */}
              {category.spending && (
                <table className="w-full mb-4">
                  <thead>
                    <tr className="text-gray-500 text-left text-xs">
                      <th className="pb-2">Year</th>
                      <th className="pb-2 text-right">Amount</th>
                      <th className="pb-2 text-right">Students</th>
                      <th className="pb-2">Note</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-300">
                    {category.spending.map((s, i) => (
                      <tr key={i} className="border-t border-gray-800">
                        <td className="py-2">{s.year}</td>
                        <td className="py-2 text-right font-mono text-green-500">{s.amount}</td>
                        <td className="py-2 text-right">{typeof s.students === 'number' ? s.students.toLocaleString() : s.students}</td>
                        <td className="py-2 text-gray-500">{s.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Sources (for political ads) */}
              {category.sources && (
                <div className="mb-4">
                  <h4 className="text-gray-400 mb-2">Fund Sources</h4>
                  <table className="w-full">
                    <tbody className="text-gray-300">
                      {category.sources.map((s, i) => (
                        <tr key={i} className="border-t border-gray-800">
                          <td className="py-2">{s.agency}</td>
                          <td className="py-2 text-right font-mono text-green-500">{s.amount}</td>
                          <td className="py-2 text-gray-500">intended: {s.intended}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Money Flow (for Hope Florida) */}
              {category.flow && (
                <div className="mb-4">
                  <h4 className="text-gray-400 mb-2">Money Flow</h4>
                  <div className="space-y-1 text-gray-300">
                    {category.flow.map((step, i) => (
                      <p key={i}>
                        <span className="text-gray-600">{step.step}.</span> {step.entity} → {step.action}
                        {step.amount && <span className="font-mono text-green-500 ml-2">{step.amount}</span>}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {category.notes && (
                <div className="text-gray-500 mt-4 pt-4 border-t border-gray-800">
                  {category.notes.map((note, i) => (
                    <p key={i}>• {note}</p>
                  ))}
                </div>
              )}

              {/* Audit Findings (vouchers) */}
              {category.auditFindings && (
                <div className="mt-4">
                  <h4 className="text-gray-400 mb-2">Audit Findings (Nov 2025)</h4>
                  <div className="space-y-1">
                    {category.auditFindings.map((f, i) => (
                      <p key={i} className="text-gray-400">
                        {f.finding}: <span className="text-white">{f.amount}</span>
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Fraud Examples (vouchers) */}
              {category.fraudExamples && (
                <div className="mt-4">
                  <h4 className="text-gray-400 mb-2">Documented Fraud Examples</h4>
                  <ul className="space-y-1 text-gray-400">
                    {category.fraudExamples.map((f, i) => (
                      <li key={i}>— {f}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Legal Status (Hope Florida) */}
              {category.legalStatus && (
                <div className="mt-4">
                  <h4 className="text-gray-400 mb-2">Legal Status</h4>
                  <table className="w-full">
                    <tbody className="text-gray-300">
                      {category.legalStatus.map((l, i) => (
                        <tr key={i} className="border-t border-gray-800">
                          <td className="py-2">{l.action}</td>
                          <td className="py-2 text-gray-500">{l.date}</td>
                          <td className="py-2 text-gray-400">{l.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function TimelineSection() {
  const { events } = timelineData;
  const years = [...new Set(events.map(e => e.year))].sort();

  return (
    <div className="space-y-8">
      <p className="text-gray-400 text-sm mb-6 max-w-3xl">
        Chronological timeline of key events, contracts, and investigations from 2019 to present.
      </p>

      {years.map(year => (
        <div key={year}>
          <h2 className="text-lg font-medium mb-4 text-white">{year}</h2>
          <div className="border border-gray-800 divide-y divide-gray-800">
            {events
              .filter(e => e.year === year)
              .map((event, i) => (
                <div key={i} className={`p-4 ${event.highlight ? 'bg-gray-900/50' : ''}`}>
                  <div className="flex gap-4">
                    <span className="text-gray-500 font-mono text-sm w-24 shrink-0">{event.date}</span>
                    <div className="flex-1">
                      <h3 className="text-white font-medium">{event.title}</h3>
                      <p className="text-gray-400 text-sm">{event.description}</p>
                    </div>
                    {event.amount && (
                      <span className="text-green-500 font-mono text-sm shrink-0">{event.amount}</span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function DeloitteSection() {
  const { title, subtitle, theContradiction, connectSystem, newContract, keyPlayers, desantisExcuse, unansweredQuestions, sources } = deloitteData;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-medium text-white">{title}</h2>
        <p className="text-gray-500">{subtitle}</p>
      </div>

      {/* Context */}
      <div className="text-gray-400 text-sm leading-relaxed max-w-3xl">
        <p>
          In 2020, Florida was simultaneously suing Deloitte for the failed CONNECT unemployment system
          while awarding them a new $135 million Medicaid contract. This section documents the contradiction
          and the revolving door between state government and Deloitte.
        </p>
      </div>

      {/* The Contradiction */}
      <div className="border border-gray-800 p-4">
        <h3 className="text-white font-medium mb-4">The Contradiction</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-gray-500 text-sm mb-3">What DeSantis Said</h4>
            <div className="space-y-3">
              {theContradiction.publicStatements.map((stmt, i) => (
                <blockquote key={i} className="border-l-2 border-gray-700 pl-3">
                  <p className="text-gray-300 text-sm italic">&ldquo;{stmt.quote}&rdquo;</p>
                  <cite className="text-gray-500 text-xs">— {stmt.date}</cite>
                </blockquote>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-gray-500 text-sm mb-3">What Actually Happened</h4>
            <div className="space-y-2 text-sm">
              {theContradiction.whatActuallyHappened.map((event, i) => (
                <div key={i} className="flex gap-4">
                  <span className="text-gray-500 font-mono w-20 shrink-0">{event.date}</span>
                  <span className="text-gray-300">{event.action}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-800">
          <p className="text-white text-sm">{theContradiction.summary}</p>
        </div>
      </div>

      {/* CONNECT vs New Contract */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="border border-gray-800 p-4">
          <h3 className="text-white font-medium mb-3">CONNECT System (2011-2015)</h3>
          <div className="space-y-2 text-sm mb-4">
            <p className="text-gray-400">Original Contract: <span className="text-green-500 font-mono">{connectSystem.originalContract}</span></p>
            <p className="text-gray-400">Final Cost: <span className="text-green-500 font-mono">{connectSystem.finalCost}</span></p>
            <p className="text-gray-400">Purpose: <span className="text-gray-300">{connectSystem.purpose}</span></p>
          </div>
          <h4 className="text-gray-500 text-xs mb-2">Problems</h4>
          <ul className="space-y-1 text-gray-400 text-sm">
            {connectSystem.problems.map((p, i) => (
              <li key={i}>— {p}</li>
            ))}
          </ul>
        </div>

        <div className="border border-gray-800 p-4">
          <h3 className="text-white font-medium mb-3">New Contract (August 2020)</h3>
          <div className="space-y-2 text-sm mb-4">
            <p className="text-gray-400">Amount: <span className="text-green-500 font-mono">{newContract.amount}</span></p>
            <p className="text-gray-400">Purpose: <span className="text-gray-300">{newContract.purpose}</span></p>
            <p className="text-gray-400">Duration: <span className="text-gray-300">{newContract.duration}</span></p>
            <p className="text-gray-400">Competitors: <span className="text-gray-300">{newContract.competingBidders.join(', ')}</span></p>
          </div>
          <div className="pt-3 border-t border-gray-800">
            <p className="text-gray-400 text-sm">Past Performance Score: <span className="text-white">{newContract.pastPerformanceScore}</span></p>
            <p className="text-gray-500 text-xs">{newContract.note}</p>
          </div>
        </div>
      </div>

      {/* Key Players */}
      <div className="border border-gray-800 p-4">
        <h3 className="text-white font-medium mb-4">Key Players</h3>
        <div className="space-y-6">
          {keyPlayers.map((player, i) => (
            <div key={i} className="pb-4 border-b border-gray-800 last:border-0 last:pb-0">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="text-white font-medium">{player.name}</h4>
                  <p className="text-gray-500 text-sm">{player.role}</p>
                </div>
                {player.whereAfter && (
                  <span className="text-gray-400 text-sm">→ {player.whereAfter}</span>
                )}
              </div>

              {player.timeline && (
                <div className="mt-3 space-y-1 text-sm">
                  {player.timeline.map((t, j) => (
                    <div key={j} className="flex text-gray-400">
                      <span className="text-gray-500 w-24 shrink-0 font-mono">{t.period}</span>
                      <span className="w-40 shrink-0">{t.role}</span>
                      <span className="text-gray-300">{t.action}</span>
                    </div>
                  ))}
                </div>
              )}

              {player.background && (
                <ul className="mt-2 text-sm text-gray-500">
                  {player.background.map((b, j) => (
                    <li key={j}>— {b}</li>
                  ))}
                </ul>
              )}

              {player.concern && (
                <p className="mt-2 text-sm text-gray-400">Concern: {player.concern}</p>
              )}

              {player.pattern && (
                <p className="mt-2 text-sm text-gray-400">Pattern: {player.pattern}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* DeSantis's Excuse */}
      <div className="border border-gray-800 p-4">
        <h3 className="text-white font-medium mb-3">DeSantis&apos;s Explanation</h3>
        <blockquote className="border-l-2 border-gray-700 pl-3 mb-4">
          <p className="text-gray-300 text-sm italic">&ldquo;{desantisExcuse.quote}&rdquo;</p>
        </blockquote>
        <h4 className="text-gray-500 text-xs mb-2">Issues with this explanation</h4>
        <ul className="space-y-1 text-gray-400 text-sm">
          {desantisExcuse.problems.map((p, i) => (
            <li key={i}>— {p}</li>
          ))}
        </ul>
      </div>

      {/* Unanswered Questions */}
      <div className="border border-gray-800 p-4">
        <h3 className="text-white font-medium mb-3">Unanswered Questions</h3>
        <ol className="space-y-2 text-sm text-gray-400">
          {unansweredQuestions.map((q, i) => (
            <li key={i}>
              <span className="text-gray-600">{i + 1}.</span> {q}
            </li>
          ))}
        </ol>
      </div>

      {/* Sources */}
      <div>
        <h3 className="text-gray-400 font-medium text-sm mb-2">Sources</h3>
        <div className="space-y-1">
          {sources.map((source, i) => (
            <a
              key={i}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-green-500 hover:underline text-sm"
            >
              {source.name}: {source.title}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
