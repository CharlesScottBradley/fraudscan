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
    howToApply: 'Submit via tip form with "ACCOUNTABILITY GRANT" in your message. See legal information below.',
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

      {/* Legal Information Section */}
      <div className="mt-16 pt-10 border-t border-gray-800">
        <h2 className="text-xl font-bold text-white mb-6">Legal Information for Providers</h2>

        {/* Primary Disclaimer */}
        <div className="border-2 border-red-900/70 bg-red-950/30 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-3 mb-4">
            <div className="text-red-500 text-2xl">!</div>
            <div>
              <p className="text-red-200 text-base font-bold">Important Legal Disclaimers</p>
            </div>
          </div>

          <div className="space-y-4 text-xs text-red-200/70">
            <div className="border-l-2 border-red-800 pl-4">
              <p className="text-red-200/90 font-semibold mb-1">This Is Not Legal Advice</p>
              <p>
                This page provides general educational information only. Nothing here constitutes legal advice,
                creates an attorney-client relationship, or should be relied upon as a substitute for consultation
                with a licensed attorney. Laws vary by jurisdiction and change frequently.
              </p>
            </div>

            <div className="border-l-2 border-red-800 pl-4">
              <p className="text-red-200/90 font-semibold mb-1">No Encouragement to Sue</p>
              <p>
                This page should <strong>not</strong> be construed as encouragement or solicitation to file lawsuits.
                Whether you have a viable legal claim depends on facts specific to your situation. Many factors affect
                whether litigation is advisable, including costs, time, likelihood of success, and collectability.
                <strong> Most civil cases do not result in recovery for the plaintiff.</strong>
              </p>
            </div>

            <div className="border-l-2 border-red-800 pl-4">
              <p className="text-red-200/90 font-semibold mb-1">Conflicts of Interest Notice</p>
              <p>
                SomaliScan publishes information about providers based on public records. This information is not
                verified and should not be used as evidence without independent verification from official government
                sources. If you pursue litigation involving entities listed on this site, you may be asked about your
                use of this site during discovery.
              </p>
            </div>
          </div>
        </div>

        {/* What is Competitive Injury */}
        <section className="mb-10">
          <h3 className="text-lg font-semibold text-white mb-4 border-b border-gray-800 pb-2">
            What is Competitive Injury?
          </h3>
          <div className="text-gray-400 text-sm space-y-3">
            <p>
              <strong className="text-white">Competitive injury</strong> occurs when a business suffers economic harm because
              a competitor gained an unfair advantage through unlawful conduct. In the context of Medicaid fraud,
              legitimate service providers may have been harmed when fraudulent operators:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-2 text-gray-500">
              <li>Received grants, subsidies, reimbursements, or contracts that would otherwise have been available to legitimate providers</li>
              <li>Undercut legitimate providers&apos; pricing by subsidizing operations with fraudulently obtained funds</li>
              <li>Saturated markets with phantom capacity, depressing enrollment at real facilities</li>
              <li>Created artificial competition that forced legitimate providers to reduce services or close</li>
              <li>Damaged the reputation of entire industries, reducing client/patient trust in legitimate providers</li>
            </ul>
          </div>
        </section>

        {/* Legal Theories */}
        <section className="mb-10">
          <h3 className="text-lg font-semibold text-white mb-4 border-b border-gray-800 pb-2">
            Potential Legal Theories
          </h3>
          <p className="text-gray-500 text-xs mb-4">
            The following legal theories may be available depending on jurisdiction and specific facts.
            Each has significant requirements and limitations. Consult an attorney before pursuing any claim.
          </p>
          <div className="space-y-4">
            <div className="border border-gray-800 rounded p-4">
              <h4 className="text-white font-medium mb-2">Unfair Competition</h4>
              <p className="text-gray-500 text-xs">
                State Uniform Deceptive Trade Practices Acts and similar laws prohibit unfair competitive practices.
                Requires showing direct competitive harm, not just that fraud existed.
              </p>
            </div>

            <div className="border border-gray-800 rounded p-4">
              <h4 className="text-white font-medium mb-2">Tortious Interference with Business</h4>
              <p className="text-gray-500 text-xs">
                Applies when a third party intentionally interferes with existing or prospective business relationships.
                Requires showing the fraudster specifically interfered with your relationships, not just that they competed in the same market.
              </p>
            </div>

            <div className="border border-yellow-900/50 bg-yellow-950/20 rounded p-4">
              <h4 className="text-white font-medium mb-2">Civil RICO (18 U.S.C. § 1964)</h4>
              <div className="text-yellow-200/80 text-xs mb-2 p-2 bg-yellow-900/20 rounded">
                <strong>WARNING:</strong> Civil RICO claims are among the most frequently sanctioned in federal court.
                Courts routinely impose Rule 11 sanctions on plaintiffs who allege RICO without meeting its stringent
                requirements. Only pursue with an attorney experienced in RICO litigation.
              </div>
              <p className="text-gray-500 text-xs">
                For injuries caused by patterns of racketeering activity. Successful plaintiffs may recover treble
                damages and attorney&apos;s fees, but the burden of proof is extremely high.
              </p>
            </div>

            <div className="border border-gray-800 rounded p-4">
              <h4 className="text-white font-medium mb-2">State False Claims Act (Qui Tam)</h4>
              <p className="text-gray-500 text-xs">
                State False Claims Acts allow private parties to file suit on behalf of the government. Has specific
                procedural requirements including filing under seal. Primarily focused on recovering funds for the
                government, not compensating injured competitors.
              </p>
            </div>
          </div>
        </section>

        {/* Potential Damages */}
        <section className="mb-10">
          <h3 className="text-lg font-semibold text-white mb-4 border-b border-gray-800 pb-2">
            Potential Damages
          </h3>
          <p className="text-gray-500 text-xs mb-4">
            Recovery depends on proving causation between the fraud and your specific losses.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-800 rounded p-4">
              <h4 className="text-green-400 font-medium mb-2">Lost Profits</h4>
              <p className="text-gray-500 text-xs">
                Revenue you would have earned absent the fraudulent competition. Requires showing specific
                clients or contracts were diverted to the fraudulent provider.
              </p>
            </div>
            <div className="border border-gray-800 rounded p-4">
              <h4 className="text-green-400 font-medium mb-2">Denied Grants/Subsidies</h4>
              <p className="text-gray-500 text-xs">
                If you applied for and were denied funding that was instead awarded to a fraudulent provider.
              </p>
            </div>
            <div className="border border-gray-800 rounded p-4">
              <h4 className="text-green-400 font-medium mb-2">Business Closure Damages</h4>
              <p className="text-gray-500 text-xs">
                If fraud-driven competition contributed to closure or significant downsizing.
              </p>
            </div>
            <div className="border border-gray-800 rounded p-4">
              <h4 className="text-green-400 font-medium mb-2">Attorney&apos;s Fees</h4>
              <p className="text-gray-500 text-xs">
                Certain statutes provide for fee-shifting. Many attorneys take competitive injury cases on contingency.
              </p>
            </div>
          </div>
        </section>

        {/* Documenting Your Situation */}
        <section className="mb-10">
          <h3 className="text-lg font-semibold text-white mb-4 border-b border-gray-800 pb-2">
            Documenting Your Situation
          </h3>
          <p className="text-gray-400 text-sm mb-4">
            If you believe your business was harmed, preserve the following for consultation with an attorney:
          </p>
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="text-green-500 font-mono text-sm">1.</div>
              <div>
                <p className="text-white text-sm font-medium">Financial Records</p>
                <p className="text-gray-500 text-xs">Tax returns, P&L statements, enrollment/client records showing changes</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="text-green-500 font-mono text-sm">2.</div>
              <div>
                <p className="text-white text-sm font-medium">Grant/Contract Applications</p>
                <p className="text-gray-500 text-xs">Applications denied, with documentation of who received awards instead</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="text-green-500 font-mono text-sm">3.</div>
              <div>
                <p className="text-white text-sm font-medium">Market Information</p>
                <p className="text-gray-500 text-xs">Names of providers in your area who have been charged or are under investigation</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="text-green-500 font-mono text-sm">4.</div>
              <div>
                <p className="text-white text-sm font-medium">Timeline</p>
                <p className="text-gray-500 text-xs">When your business began declining, correlated with when fraudulent providers entered your market</p>
              </div>
            </div>
          </div>
        </section>

        {/* Important Considerations */}
        <section className="mb-10">
          <h3 className="text-lg font-semibold text-white mb-4 border-b border-gray-800 pb-2">
            Important Considerations
          </h3>
          <div className="space-y-4 text-sm text-gray-400">
            <div className="border-l-2 border-gray-700 pl-4">
              <p className="text-white font-medium mb-1">Statute of Limitations</p>
              <p className="text-xs text-gray-500">
                Most claims have filing deadlines (often 2-6 years). Consult an attorney promptly.
              </p>
            </div>
            <div className="border-l-2 border-gray-700 pl-4">
              <p className="text-white font-medium mb-1">Collectability</p>
              <p className="text-xs text-gray-500">
                Many defendants may be judgment-proof. Winning a judgment does not guarantee collecting money.
              </p>
            </div>
            <div className="border-l-2 border-gray-700 pl-4">
              <p className="text-white font-medium mb-1">Costs and Time</p>
              <p className="text-xs text-gray-500">
                Litigation is expensive. Federal cases can take 2-5 years. Consider whether recovery justifies the investment.
              </p>
            </div>
          </div>
        </section>

        {/* What We Don't Do */}
        <div className="border border-gray-800 bg-gray-900/30 rounded-lg p-5">
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
              <span>Verify the accuracy of public records displayed on this site</span>
            </li>
          </ul>
        </div>

        {/* Resources */}
        <div className="mt-8">
          <h3 className="text-white font-medium mb-3">Resources for Finding Legal Help</h3>
          <div className="space-y-2 text-sm">
            <a href="https://www.americanbar.org/groups/legal_services/flh-home/" target="_blank" rel="noopener noreferrer" className="block text-green-500 hover:underline">
              ABA Free Legal Help Directory
            </a>
            <a href="https://www.lawhelpmn.org/" target="_blank" rel="noopener noreferrer" className="block text-green-500 hover:underline">
              LawHelpMN - Free Legal Resources
            </a>
            <a href="https://www.sba.gov/local-assistance" target="_blank" rel="noopener noreferrer" className="block text-green-500 hover:underline">
              SBA Local Assistance - Small Business Resources
            </a>
          </div>
        </div>
      </div>

      {/* Related Links */}
      <div className="mt-10 pt-8 border-t border-gray-800">
        <h3 className="text-white font-medium mb-4">Related</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
