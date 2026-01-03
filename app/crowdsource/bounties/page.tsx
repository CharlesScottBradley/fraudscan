'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Bounty {
  id: string;
  title: string;
  amount: number;
  slots: number; // How many of this bounty are available
  claimed: number; // How many have been claimed/completed
  status: 'open' | 'claimed' | 'completed';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  description: string;
  requirements: string[];
  deliverables: string[];
  sources: string[];
  notAccepted: string[];
}

const BOUNTIES: Bounty[] = [
  {
    id: 'corporate-ownership-map',
    title: 'Corporate Relationship Documentation Project',
    amount: 1000,
    slots: 3,
    claimed: 1,
    status: 'open',
    difficulty: 'advanced',
    description: 'Document the corporate ownership structure and business relationships among 10 or more providers appearing in state or federal enforcement databases, using exclusively public records.',
    requirements: [
      'Minimum 10 providers with documented enforcement actions (OIG exclusions, DOJ charges, state sanctions)',
      'Connections must be established through at least TWO of: shared business addresses, shared registered agents, shared principals/officers, shared ownership, or documented business transactions in court filings',
      'Shared registered agent alone is insufficient (e.g., CT Corporation connects thousands of legitimate companies)',
      'All data must be sourced from publicly available government records or verified news reports',
    ],
    deliverables: [
      'Structured data file (CSV or JSON) with columns: Entity Name, Entity Type, Enforcement Record Source, Connected Entities, Connection Type, Source Citation',
      'Visual network graph with nodes (entities), edges (relationships), color coding by connection type, and visible clustering',
      'Methodology document explaining: data collection process, connection criteria, limitations, and complete sources list',
    ],
    sources: [
      'Secretary of State business filings (cite state, entity name, filing number)',
      'OIG exclusion list entries (cite database name, date accessed, entry details)',
      'DOJ press releases and court documents (cite case number, district, date)',
      'State licensing databases (cite agency, license number, date accessed)',
      'PACER/court records (cite case number, docket entry)',
      'Published news articles (cite publication, author, date, URL)',
    ],
    notAccepted: [
      'Social media posts as primary sources',
      'Anonymous tips without corroboration',
      'Proprietary databases you do not have rights to share',
      'Information obtained through pretexting or unauthorized access',
      'Speculation or inference not supported by documentary evidence',
    ],
  },
  {
    id: 'fake-credential-verification',
    title: 'Fake Credential Documentation',
    amount: 500,
    slots: 2,
    claimed: 0,
    status: 'open',
    difficulty: 'intermediate',
    description: 'Verify that professionals listed on provider registrations hold valid licenses by cross-referencing against official licensing boards.',
    requirements: [
      'Minimum 5 credential mismatches from a single provider or network',
      'Each mismatch must show: claimed credential vs. actual licensing board status',
      'Must check official state licensing boards (not third-party verification sites)',
      'Include date of search and screenshot evidence',
    ],
    deliverables: [
      'Spreadsheet with columns: Provider Name, Professional Name, Claimed Credential, Source of Claim, Licensing Board Searched, Search Result, Screenshot Link',
      'Screenshots of each licensing board search (timestamped)',
      'Summary document explaining methodology and findings',
    ],
    sources: [
      'Minnesota Board of Behavioral Health registry',
      'BACB (Behavior Analyst Certification Board) registry',
      'Minnesota Board of Nursing',
      'Minnesota Board of Social Work',
      'Provider registration filings from DHS',
      'Provider websites and marketing materials (archived)',
    ],
    notAccepted: [
      'Third-party credential verification sites as primary source',
      'Claims without screenshot evidence',
      'Expired credentials listed as "fake" (must distinguish expired vs. never held)',
      'Speculation about credential validity without board verification',
    ],
  },
  {
    id: 'impossible-billing-analysis',
    title: 'Impossible Billing Documentation',
    amount: 500,
    slots: 2,
    claimed: 2,
    status: 'completed',
    difficulty: 'advanced',
    description: 'Mathematical analysis using public records showing that a provider billed for services that could not have physically occurred based on licensed capacity, operating hours, or geographic constraints.',
    requirements: [
      'Analysis must use ONLY publicly available records (licensing data, capacity limits, operating hours)',
      'Must demonstrate mathematical impossibility, not just implausibility',
      'Minimum 3 documented impossibilities per submission',
      'All calculations must be reproducible with cited sources',
    ],
    deliverables: [
      'Analysis document showing: Provider name, claimed billing volume (from court records/FOIA), licensed capacity/hours, calculation showing impossibility',
      'Source citations for all data points (license numbers, court case numbers, FOIA response references)',
      'Spreadsheet with calculations',
    ],
    sources: [
      'DHS licensing records (capacity limits, licensed hours)',
      'Court filings with billing data (from fraud cases)',
      'FOIA responses containing payment or billing summaries',
      'Published news reports citing billing figures',
      'State licensing requirements (sq ft per child, staff ratios)',
    ],
    notAccepted: [
      'Leaked internal billing documents',
      'Estimates or approximations without source data',
      'Implausibility arguments (must be mathematical impossibility)',
      'Data obtained through unauthorized access',
      'Analysis based on assumptions rather than documented facts',
    ],
  },
];

export default function BountyBoardPage() {
  const [expandedBounty, setExpandedBounty] = useState<string | null>(null);

  const openBounties = BOUNTIES.filter(b => b.status === 'open');
  const totalSlots = openBounties.reduce((sum, b) => sum + (b.slots - b.claimed), 0);
  const totalValue = openBounties.reduce((sum, b) => sum + (b.amount * (b.slots - b.claimed)), 0);

  const toggleBounty = (id: string) => {
    setExpandedBounty(expandedBounty === id ? null : id);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Link href="/crowdsource" className="text-gray-500 hover:text-white text-sm mb-6 inline-block">
        Back to Crowdsourcing
      </Link>

      <h1 className="text-2xl font-bold mb-2">Bounty Board</h1>
      <p className="text-gray-400 mb-6">
        Paid research projects for documenting public records data. Complete a bounty, get paid.
      </p>

      {/* Stats */}
      <div className="font-mono text-sm mb-10">
        <p className="text-gray-500">BOUNTY_STATUS</p>
        <div className="mt-2 text-gray-400">
          <p><span className="text-gray-600">├─</span> bounty_types <span className="text-white ml-4">{openBounties.length}</span></p>
          <p><span className="text-gray-600">├─</span> slots_available <span className="text-white ml-4">{totalSlots}</span></p>
          <p><span className="text-gray-600">└─</span> total_value <span className="text-green-500 ml-4">${totalValue.toLocaleString()}</span></p>
        </div>
      </div>

      {/* Recently Awarded */}
      <div className="border border-green-900/50 bg-green-950/20 rounded p-4 mb-8">
        <p className="text-green-400 font-medium text-sm mb-3">Recently Awarded</p>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="text-white">Impossible Billing Documentation</span>
              <span className="text-gray-500 ml-2">— Ruun Family Child Care, WA ($122K impossible payments)</span>
            </div>
            <span className="text-green-500 font-mono">$500</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="text-white">Impossible Billing Documentation</span>
              <span className="text-gray-500 ml-2">— WA Child Care Subsidy Analysis ($778K impossible payments, 3 providers)</span>
            </div>
            <span className="text-green-500 font-mono">$500</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="text-white">Corporate Relationship Documentation</span>
              <span className="text-gray-500 ml-2">— Forest Park Medical Center fraud network (19 entities, 50 connections)</span>
            </div>
            <span className="text-green-500 font-mono">$1,000</span>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="border border-yellow-900/50 bg-yellow-950/20 rounded p-4 mb-8 text-xs text-yellow-200/70">
        <p className="text-yellow-300 font-medium mb-2">Important Terms</p>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>U.S. residents only</strong> — Bounties are only available to individuals residing in the United States</li>
          <li>Submissions are independently verified before payment</li>
          <li>Site reserves the right to verify, modify, or decline publication</li>
          <li>Submission grants site perpetual license to use, modify, and publish</li>
          <li>Presence in documentation does not constitute accusation of wrongdoing</li>
          <li>Payment via crypto (SOL/ETH/BTC) after verification</li>
        </ul>
      </div>

      {/* Bounties List */}
      <div className="space-y-3">
        {BOUNTIES.map((bounty) => {
          const isExpanded = expandedBounty === bounty.id;
          const slotsAvailable = bounty.slots - bounty.claimed;

          return (
            <div key={bounty.id} className="border border-gray-800 rounded-lg overflow-hidden">
              {/* Collapsed Header - Always visible */}
              <button
                onClick={() => toggleBounty(bounty.id)}
                className="w-full bg-gray-900/50 p-4 flex items-center justify-between hover:bg-gray-900/70 transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <span className="text-gray-600 text-sm">{isExpanded ? '▼' : '▶'}</span>
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-white font-semibold">{bounty.title}</h2>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        slotsAvailable > 0
                          ? 'bg-green-900/50 text-green-400'
                          : 'bg-gray-800 text-gray-500'
                      }`}>
                        {slotsAvailable > 0 ? `${slotsAvailable} OPEN` : 'FILLED'}
                      </span>
                      <span className={`text-xs ${
                        bounty.difficulty === 'advanced' ? 'text-red-400' :
                        bounty.difficulty === 'intermediate' ? 'text-yellow-400' :
                        'text-green-400'
                      }`}>
                        {bounty.difficulty}
                      </span>
                    </div>
                    <p className="text-gray-500 text-xs mt-1 line-clamp-1">{bounty.description}</p>
                  </div>
                </div>
                <div className="text-right ml-4 flex-shrink-0">
                  <p className="text-xl font-bold text-green-500">${bounty.amount.toLocaleString()}</p>
                  <p className="text-xs text-gray-600">each</p>
                </div>
              </button>

              {/* Expanded Body */}
              {isExpanded && (
                <div className="p-4 space-y-5 border-t border-gray-800">
                  {/* Requirements */}
                  <div>
                    <h3 className="text-white font-medium text-sm mb-2">Requirements</h3>
                    <ul className="list-disc list-inside text-gray-500 text-xs space-y-1">
                      {bounty.requirements.map((req, i) => (
                        <li key={i}>{req}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Deliverables */}
                  <div>
                    <h3 className="text-white font-medium text-sm mb-2">Required Deliverables</h3>
                    <ul className="list-disc list-inside text-gray-500 text-xs space-y-1">
                      {bounty.deliverables.map((del, i) => (
                        <li key={i}>{del}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Acceptable Sources */}
                  <div>
                    <h3 className="text-white font-medium text-sm mb-2">Acceptable Sources</h3>
                    <ul className="list-disc list-inside text-gray-500 text-xs space-y-1">
                      {bounty.sources.map((src, i) => (
                        <li key={i}>{src}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Not Accepted */}
                  <div>
                    <h3 className="text-red-400 font-medium text-sm mb-2">Not Accepted</h3>
                    <ul className="list-disc list-inside text-gray-500 text-xs space-y-1">
                      {bounty.notAccepted.map((na, i) => (
                        <li key={i}>{na}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Submit CTA */}
                  {slotsAvailable > 0 && (
                    <div className="pt-4 border-t border-gray-800">
                      <Link
                        href="/crowdsource/submit"
                        className="inline-block px-4 py-2 bg-green-900/30 border border-green-800 rounded text-green-400 text-sm hover:bg-green-900/50 transition-colors"
                      >
                        Submit for this Bounty
                      </Link>
                      <p className="text-gray-600 text-xs mt-2">
                        Include &quot;BOUNTY: {bounty.id}&quot; in your submission
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* No bounties fallback */}
      {BOUNTIES.length === 0 && (
        <div className="border border-gray-800 p-8 text-center text-gray-500">
          No bounties currently available. Check back soon.
        </div>
      )}

      {/* Footer */}
      <div className="mt-12 pt-8 border-t border-gray-800">
        <h3 className="text-white font-medium mb-3">Have a bounty idea?</h3>
        <p className="text-gray-500 text-sm mb-4">
          Suggest research projects that would benefit public accountability.
          We may fund valuable investigations.
        </p>
        <Link
          href="/tip"
          className="text-gray-400 hover:text-white text-sm"
        >
          Submit a suggestion →
        </Link>
      </div>
    </div>
  );
}
