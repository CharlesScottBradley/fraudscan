'use client';

import Link from 'next/link';

interface Grant {
  id: string;
  title: string;
  amount: number;
  slots: number;
  claimed: number;
  description: string;
  eligibility: string[];
  deliverables: string[];
  howToApply: string;
  learnMoreLink?: string;
  learnMoreText?: string;
}

const GRANTS: Grant[] = [
  {
    id: 'provider-accountability',
    title: 'Provider Accountability Grant',
    amount: 20000,
    slots: 1,
    claimed: 0,
    description: 'Legal cost assistance for legitimate service providers pursuing competitive injury claims against fraudulent operators who harmed their business.',
    eligibility: [
      'Licensed provider in childcare, HCBS, autism care, senior care, PCA, or related Medicaid-funded services',
      'Already retained an attorney OR already filed a case (not pre-litigation funding)',
      'Claim involves competitive harm from providers charged, indicted, or convicted of fraud',
      'Can provide documentation: signed retainer agreement, court filing, or proof of case initiation',
    ],
    deliverables: [
      'Proof of case initiation (retainer agreement or court filing)',
      'Provider license information',
      'Brief description of competitive harm suffered',
    ],
    howToApply: 'Submit via tip form with "ACCOUNTABILITY GRANT" in your message.',
    learnMoreLink: '/competitive-injury',
    learnMoreText: 'Learn about competitive injury claims',
  },
  {
    id: 'beneficiary-storytelling',
    title: 'Beneficiary Storytelling Grant',
    amount: 2500,
    slots: 2,
    claimed: 0,
    description: 'Funding for individuals whose benefits were cut, denied, or delayed to share their story publicly and advocate for stronger fraud prevention and program accountability.',
    eligibility: [
      'Personally experienced benefit reduction, denial, or delay (childcare subsidies, Medicaid, SNAP, etc.)',
      'Willing to have your story published (name can be anonymized if needed)',
      'Able to provide basic documentation of benefit loss (denial letter, cut-off notice, etc.)',
      'Available for a 30-60 minute recorded interview OR willing to write a first-person account',
      'U.S. resident who received benefits from a state or federal program',
    ],
    deliverables: [
      'Recorded video/audio interview (30-60 min) OR written account (1,500+ words)',
      'Documentation showing benefit denial/reduction (redacted for privacy as needed)',
      'Signed release allowing publication (anonymized version available)',
      'Brief timeline of events',
    ],
    howToApply: 'Submit via tip form with "STORYTELLING GRANT" in your message.',
  },
];

export default function GrantsPage() {
  const totalAvailable = GRANTS.reduce((sum, g) => sum + (g.amount * (g.slots - g.claimed)), 0);
  const totalSlots = GRANTS.reduce((sum, g) => sum + (g.slots - g.claimed), 0);

  return (
    <div className="max-w-4xl mx-auto">
      <Link href="/" className="text-gray-500 hover:text-white text-sm mb-6 inline-block">
        Back to Home
      </Link>

      <h1 className="text-2xl font-bold mb-2">Grants</h1>
      <p className="text-gray-400 mb-8">
        Financial support for accountability work — legal action, storytelling, and advocacy.
      </p>

      {/* Total Available */}
      <div className="border-2 border-green-900/50 bg-green-950/20 rounded-lg p-6 mb-8">
        <div className="text-center">
          <p className="text-gray-500 text-sm mb-1">Total Grant Funding Available</p>
          <p className="text-4xl font-bold text-green-400">${totalAvailable.toLocaleString()}</p>
          <p className="text-gray-500 text-sm mt-2">{totalSlots} grant{totalSlots !== 1 ? 's' : ''} available</p>
        </div>
      </div>

      {/* Primary Disclaimer */}
      <div className="border border-yellow-900/50 bg-yellow-950/20 rounded p-4 mb-8 text-xs text-yellow-200/70">
        <p className="text-yellow-300 font-medium mb-2">Important</p>
        <ul className="list-disc list-inside space-y-1">
          <li>SomaliScan does <strong>not</strong> provide legal advice or evaluate case merit</li>
          <li>Grant decisions are based on eligibility verification only</li>
          <li>Limited funds — awarded to first eligible applicants</li>
          <li>U.S. residents only</li>
        </ul>
      </div>

      {/* Grants List */}
      <div className="space-y-6">
        {GRANTS.map((grant) => {
          const slotsAvailable = grant.slots - grant.claimed;
          const isAvailable = slotsAvailable > 0;

          return (
            <div
              key={grant.id}
              className={`border rounded-lg overflow-hidden ${
                isAvailable ? 'border-gray-700' : 'border-gray-800 opacity-60'
              }`}
            >
              {/* Header */}
              <div className="bg-gray-900/50 p-4 border-b border-gray-800">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-lg font-semibold text-white">{grant.title}</h2>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        isAvailable
                          ? 'bg-green-900/50 text-green-400'
                          : 'bg-gray-800 text-gray-500'
                      }`}>
                        {isAvailable ? `${slotsAvailable} AVAILABLE` : 'CLAIMED'}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm">{grant.description}</p>
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    <p className="text-2xl font-bold text-green-500">${grant.amount.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-4 space-y-4">
                {/* Eligibility */}
                <div>
                  <h3 className="text-white font-medium text-sm mb-2">Eligibility</h3>
                  <ul className="list-disc list-inside text-gray-500 text-xs space-y-1">
                    {grant.eligibility.map((req, i) => (
                      <li key={i}>{req}</li>
                    ))}
                  </ul>
                </div>

                {/* Deliverables */}
                <div>
                  <h3 className="text-white font-medium text-sm mb-2">Required to Apply</h3>
                  <ul className="list-disc list-inside text-gray-500 text-xs space-y-1">
                    {grant.deliverables.map((del, i) => (
                      <li key={i}>{del}</li>
                    ))}
                  </ul>
                </div>

                {/* How to Apply */}
                <div className="pt-3 border-t border-gray-800 flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-xs">{grant.howToApply}</p>
                    {grant.learnMoreLink && (
                      <Link
                        href={grant.learnMoreLink}
                        className="text-green-500 hover:underline text-xs mt-1 inline-block"
                      >
                        {grant.learnMoreText || 'Learn more'} →
                      </Link>
                    )}
                  </div>
                  {isAvailable && (
                    <Link
                      href="/tip"
                      className="px-4 py-2 bg-green-900/30 border border-green-800 rounded text-green-400 text-sm hover:bg-green-900/50 transition-colors"
                    >
                      Apply
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* What We Don't Do */}
      <div className="mt-10 border border-gray-800 bg-gray-900/30 rounded-lg p-5">
        <h3 className="text-white font-medium mb-3">What SomaliScan Does NOT Do</h3>
        <ul className="space-y-2 text-sm text-gray-500">
          <li className="flex gap-2">
            <span className="text-red-500">✕</span>
            <span>Provide legal advice or evaluate the merit of potential claims</span>
          </li>
          <li className="flex gap-2">
            <span className="text-red-500">✕</span>
            <span>Refer cases to attorneys or receive referral fees</span>
          </li>
          <li className="flex gap-2">
            <span className="text-red-500">✕</span>
            <span>Have any financial stake in litigation outcomes</span>
          </li>
          <li className="flex gap-2">
            <span className="text-red-500">✕</span>
            <span>Guarantee any outcome from storytelling or advocacy</span>
          </li>
        </ul>
      </div>

      {/* Related Links */}
      <div className="mt-10 pt-8 border-t border-gray-800">
        <h3 className="text-white font-medium mb-4">Related</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/competitive-injury"
            className="border border-gray-800 rounded p-4 hover:border-gray-700 transition-colors"
          >
            <h4 className="text-white font-medium mb-1">Competitive Injury</h4>
            <p className="text-gray-500 text-xs">
              Educational info for providers harmed by fraudulent competitors.
            </p>
          </Link>
          <Link
            href="/crowdsource/bounties"
            className="border border-gray-800 rounded p-4 hover:border-gray-700 transition-colors"
          >
            <h4 className="text-white font-medium mb-1">Bounty Board</h4>
            <p className="text-gray-500 text-xs">
              Paid research projects for documenting public records.
            </p>
          </Link>
          <Link
            href="/tip"
            className="border border-gray-800 rounded p-4 hover:border-gray-700 transition-colors"
          >
            <h4 className="text-white font-medium mb-1">Submit a Tip</h4>
            <p className="text-gray-500 text-xs">
              Report fraud or submit information anonymously.
            </p>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 pt-8 border-t border-gray-800 flex gap-6 text-sm">
        <Link href="/terms" className="text-gray-500 hover:text-white">Terms</Link>
        <Link href="/privacy" className="text-gray-500 hover:text-white">Privacy</Link>
        <Link href="/about" className="text-gray-500 hover:text-white">About</Link>
      </div>
    </div>
  );
}
