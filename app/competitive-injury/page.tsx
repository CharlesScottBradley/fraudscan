'use client';

import Link from 'next/link';

export default function CompetitiveInjuryPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <Link href="/" className="text-gray-500 hover:text-white text-sm mb-6 inline-block">
        Back to Map
      </Link>

      <h1 className="text-2xl font-bold mb-2">Competitive Injury: Know Your Rights</h1>
      <p className="text-gray-400 mb-6">
        Educational information for legitimate service providers about competitive harm caused by fraudulent operators.
      </p>

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
        <h2 className="text-lg font-semibold text-white mb-4 border-b border-gray-800 pb-2">
          What is Competitive Injury?
        </h2>
        <div className="text-gray-400 text-sm space-y-3">
          <p>
            <strong className="text-white">Competitive injury</strong> occurs when a business suffers economic harm because
            a competitor gained an unfair advantage through unlawful conduct. In the context of Medicaid fraud in Minnesota
            and other states, legitimate service providers may have been harmed when fraudulent operators:
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

      {/* Affected Industries */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-white mb-4 border-b border-gray-800 pb-2">
          Affected Industries
        </h2>
        <p className="text-gray-400 text-sm mb-4">
          Medicaid fraud affects legitimate providers across multiple service categories:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="border border-gray-800 rounded p-3">
            <h3 className="text-white font-medium text-sm">Childcare Providers</h3>
            <p className="text-gray-500 text-xs mt-1">
              Licensed family and center-based childcare receiving CCAP (Child Care Assistance Program) subsidies
            </p>
          </div>

          <div className="border border-gray-800 rounded p-3">
            <h3 className="text-white font-medium text-sm">HCBS Providers</h3>
            <p className="text-gray-500 text-xs mt-1">
              Home and Community Based Services including 245D licensed disability services
            </p>
          </div>

          <div className="border border-gray-800 rounded p-3">
            <h3 className="text-white font-medium text-sm">Autism Care (EIDBI)</h3>
            <p className="text-gray-500 text-xs mt-1">
              Early Intensive Developmental and Behavioral Intervention providers and ABA therapy services
            </p>
          </div>

          <div className="border border-gray-800 rounded p-3">
            <h3 className="text-white font-medium text-sm">Senior Home Care</h3>
            <p className="text-gray-500 text-xs mt-1">
              Elderly Waiver, home health aides, and aging services providers
            </p>
          </div>

          <div className="border border-gray-800 rounded p-3">
            <h3 className="text-white font-medium text-sm">PCA Services</h3>
            <p className="text-gray-500 text-xs mt-1">
              Personal Care Attendant agencies serving disabled and elderly individuals
            </p>
          </div>

          <div className="border border-gray-800 rounded p-3">
            <h3 className="text-white font-medium text-sm">Mental Health Services</h3>
            <p className="text-gray-500 text-xs mt-1">
              ARMHS (Adult Rehabilitative Mental Health Services), day treatment, residential programs
            </p>
          </div>

          <div className="border border-gray-800 rounded p-3">
            <h3 className="text-white font-medium text-sm">Nursing Facilities</h3>
            <p className="text-gray-500 text-xs mt-1">
              Skilled nursing facilities and assisted living receiving Medicaid reimbursement
            </p>
          </div>

          <div className="border border-gray-800 rounded p-3">
            <h3 className="text-white font-medium text-sm">Transportation Providers</h3>
            <p className="text-gray-500 text-xs mt-1">
              Non-emergency medical transportation (NEMT) services
            </p>
          </div>
        </div>
      </section>

      {/* Legal Theories */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-white mb-4 border-b border-gray-800 pb-2">
          Potential Legal Theories
        </h2>
        <p className="text-gray-500 text-xs mb-4">
          The following legal theories may be available depending on jurisdiction and specific facts.
          Each has significant requirements and limitations. Consult an attorney before pursuing any claim.
        </p>
        <div className="space-y-4">
          <div className="border border-gray-800 rounded p-4">
            <h3 className="text-white font-medium mb-2">Unfair Competition</h3>
            <p className="text-gray-500 text-xs">
              Minnesota&apos;s Uniform Deceptive Trade Practices Act (Minn. Stat. § 325D) and similar state laws
              prohibit unfair competitive practices. Requires showing direct competitive harm, not just that fraud existed.
            </p>
          </div>

          <div className="border border-gray-800 rounded p-4">
            <h3 className="text-white font-medium mb-2">Tortious Interference with Business</h3>
            <p className="text-gray-500 text-xs">
              Applies when a third party intentionally interferes with existing or prospective business relationships.
              Requires showing the fraudster specifically interfered with your relationships, not just that they competed in the same market.
            </p>
          </div>

          {/* RICO with strong warning */}
          <div className="border border-yellow-900/50 bg-yellow-950/20 rounded p-4">
            <h3 className="text-white font-medium mb-2">Civil RICO (18 U.S.C. § 1964)</h3>
            <div className="text-yellow-200/80 text-xs mb-2 p-2 bg-yellow-900/20 rounded">
              <strong>WARNING:</strong> Civil RICO claims are among the most frequently sanctioned in federal court.
              Courts routinely impose Rule 11 sanctions on plaintiffs who allege RICO without meeting its stringent
              requirements (pattern of racketeering activity, enterprise, proximate causation). Many RICO claims
              are dismissed with prejudice. Only pursue with an attorney experienced in RICO litigation.
            </div>
            <p className="text-gray-500 text-xs">
              For injuries caused by patterns of racketeering activity. Successful plaintiffs may recover treble
              damages and attorney&apos;s fees, but the burden of proof is extremely high.
            </p>
          </div>

          <div className="border border-gray-800 rounded p-4">
            <h3 className="text-white font-medium mb-2">State False Claims Act (Qui Tam)</h3>
            <p className="text-gray-500 text-xs">
              Minnesota False Claims Act (Minn. Stat. § 15C) allows private parties to file suit on behalf of
              the government. Has specific procedural requirements including filing under seal and DOJ notification.
              Primarily focused on recovering funds for the government, not compensating injured competitors.
            </p>
          </div>

          <div className="border border-gray-800 rounded p-4">
            <h3 className="text-white font-medium mb-2">Negligent/Intentional Misrepresentation</h3>
            <p className="text-gray-500 text-xs">
              If fraudulent providers made false statements to clients, grant administrators, or licensing agencies
              that you reasonably relied upon to your detriment. Requires showing actual reliance and damages.
            </p>
          </div>
        </div>
      </section>

      {/* Types of Damages */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-white mb-4 border-b border-gray-800 pb-2">
          Potential Damages
        </h2>
        <p className="text-gray-500 text-xs mb-4">
          Recovery depends on proving causation between the fraud and your specific losses. General market
          harm affecting all providers may not be sufficient.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-800 rounded p-4">
            <h3 className="text-green-400 font-medium mb-2">Lost Profits</h3>
            <p className="text-gray-500 text-xs">
              Revenue you would have earned absent the fraudulent competition. Requires showing specific
              clients or contracts were diverted to the fraudulent provider.
            </p>
          </div>

          <div className="border border-gray-800 rounded p-4">
            <h3 className="text-green-400 font-medium mb-2">Denied Grants/Subsidies</h3>
            <p className="text-gray-500 text-xs">
              If you applied for and were denied funding that was instead awarded to a fraudulent provider,
              you may recover the value of those funds.
            </p>
          </div>

          <div className="border border-gray-800 rounded p-4">
            <h3 className="text-green-400 font-medium mb-2">Business Closure Damages</h3>
            <p className="text-gray-500 text-xs">
              If fraud-driven competition contributed to closure or significant downsizing, including lost
              investment, wind-down costs, and lost business value.
            </p>
          </div>

          <div className="border border-gray-800 rounded p-4">
            <h3 className="text-green-400 font-medium mb-2">Attorney&apos;s Fees</h3>
            <p className="text-gray-500 text-xs">
              Certain statutes provide for fee-shifting. Many attorneys also take competitive injury cases
              on contingency (no fee unless you win).
            </p>
          </div>
        </div>
      </section>

      {/* Documenting Your Situation */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-white mb-4 border-b border-gray-800 pb-2">
          Documenting Your Situation
        </h2>
        <p className="text-gray-400 text-sm mb-4">
          If you believe your business was harmed, preserve the following documentation for potential consultation with an attorney:
        </p>
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="text-green-500 font-mono text-sm">1.</div>
            <div>
              <p className="text-white text-sm font-medium">Financial Records</p>
              <p className="text-gray-500 text-xs">Tax returns, P&L statements, enrollment/client records showing changes during 2020-2024</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-green-500 font-mono text-sm">2.</div>
            <div>
              <p className="text-white text-sm font-medium">Grant/Contract Applications</p>
              <p className="text-gray-500 text-xs">Applications you submitted that were denied, with documentation of who received awards instead</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-green-500 font-mono text-sm">3.</div>
            <div>
              <p className="text-white text-sm font-medium">Market Information</p>
              <p className="text-gray-500 text-xs">Names and locations of providers in your service area who have been charged or are under investigation</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-green-500 font-mono text-sm">4.</div>
            <div>
              <p className="text-white text-sm font-medium">Client Communications</p>
              <p className="text-gray-500 text-xs">Any evidence showing clients chose competitors or expressed concerns about industry trustworthiness</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-green-500 font-mono text-sm">5.</div>
            <div>
              <p className="text-white text-sm font-medium">Timeline</p>
              <p className="text-gray-500 text-xs">When your business began declining, correlated with when fraudulent providers entered your market</p>
            </div>
          </div>
        </div>
      </section>

      {/* Important Considerations */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-white mb-4 border-b border-gray-800 pb-2">
          Important Considerations
        </h2>
        <div className="space-y-4 text-sm text-gray-400">
          <div className="border-l-2 border-gray-700 pl-4">
            <p className="text-white font-medium mb-1">Statute of Limitations</p>
            <p className="text-xs text-gray-500">
              Most claims have filing deadlines (often 2-6 years depending on the cause of action and state).
              Consult an attorney promptly to avoid losing your right to sue.
            </p>
          </div>

          <div className="border-l-2 border-gray-700 pl-4">
            <p className="text-white font-medium mb-1">Collectability</p>
            <p className="text-xs text-gray-500">
              Many individual defendants may be judgment-proof (unable to pay). Assets may be frozen, seized, or
              spent. Winning a judgment does not guarantee collecting money.
            </p>
          </div>

          <div className="border-l-2 border-gray-700 pl-4">
            <p className="text-white font-medium mb-1">Costs and Time</p>
            <p className="text-xs text-gray-500">
              Litigation is expensive and time-consuming. Federal cases can take 2-5 years. Consider whether
              the potential recovery justifies the investment.
            </p>
          </div>

          <div className="border-l-2 border-gray-700 pl-4">
            <p className="text-white font-medium mb-1">Sovereign Immunity</p>
            <p className="text-xs text-gray-500">
              Claims against state agencies for negligent administration face significant sovereign immunity
              obstacles. Most successful claims target the fraudulent private parties, not the government.
            </p>
          </div>
        </div>
      </section>

      {/* Provider Accountability Grant */}
      <section className="mb-10">
        <div className="border-2 border-green-900/50 bg-green-950/20 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-green-400 mb-3">
            Provider Accountability Grant — $20,000
          </h2>
          <div className="text-gray-300 text-sm space-y-4">
            <p>
              A <strong className="text-white">$20,000 grant</strong> is available to help offset legal costs for
              legitimate Minnesota service providers pursuing competitive injury claims against fraudulent operators.
            </p>

            <div className="border-l-2 border-green-800 pl-4 text-xs text-gray-400 space-y-2">
              <p className="text-green-300 font-medium">Eligibility Requirements:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>You must be a licensed provider in childcare, HCBS, autism care, senior care, PCA, or related Medicaid-funded services</li>
                <li>You must have <strong>already retained an attorney</strong> or <strong>already filed a case</strong> — this is not pre-litigation funding</li>
                <li>Your claim must involve competitive harm from providers who have been charged, indicted, or convicted of fraud</li>
                <li>You must provide documentation: signed retainer agreement, court filing, or proof of case initiation</li>
              </ul>
            </div>

            <div className="border-l-2 border-yellow-800 pl-4 text-xs text-yellow-200/70 space-y-2">
              <p className="text-yellow-300 font-medium">Important Limitations:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>SomaliScan does <strong>not</strong> evaluate the legal merit of your case — that is your attorney&apos;s role</li>
                <li>Grant decisions are based solely on eligibility verification, not case strength</li>
                <li>This grant is a one-time reimbursement for costs already incurred (filing fees, retainer deposits, etc.)</li>
                <li>SomaliScan has no stake in your litigation outcome and receives nothing if you win</li>
                <li>Limited funds available — first eligible applicant(s) will be awarded</li>
              </ul>
            </div>

            <div className="bg-green-900/20 rounded p-3 text-xs">
              <p className="text-green-300 font-medium mb-1">How to Apply:</p>
              <p className="text-gray-400">
                Submit proof of case initiation (retainer agreement or court filing) along with your provider license
                information via our{' '}
                <Link href="/tip" className="text-green-500 hover:underline">tip submission form</Link>.
                Include &quot;ACCOUNTABILITY GRANT&quot; in your message. We will verify eligibility and contact you
                regarding disbursement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What We Do NOT Do */}
      <section className="mb-10">
        <div className="border border-gray-700 bg-gray-900/50 rounded p-6">
          <h2 className="text-lg font-semibold text-white mb-3">What SomaliScan Does NOT Do</h2>
          <ul className="space-y-2 text-sm text-gray-400">
            <li className="flex gap-2">
              <span className="text-red-500">x</span>
              <span>We do not provide legal advice or evaluate the merit of potential claims</span>
            </li>
            <li className="flex gap-2">
              <span className="text-red-500">x</span>
              <span>We do not refer cases to attorneys or receive referral fees</span>
            </li>
            <li className="flex gap-2">
              <span className="text-red-500">x</span>
              <span>We do not verify the accuracy of public records displayed on this site</span>
            </li>
            <li className="flex gap-2">
              <span className="text-red-500">x</span>
              <span>We do not make accusations—we display public government data</span>
            </li>
            <li className="flex gap-2">
              <span className="text-red-500">x</span>
              <span>We have no financial stake in any litigation outcomes</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Resources */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-white mb-4 border-b border-gray-800 pb-2">
          Resources for Finding Legal Help
        </h2>
        <div className="space-y-3 text-sm">
          <a
            href="https://www.mnbar.org/resources/lawyer-referral-program"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-green-500 hover:underline"
          >
            Minnesota State Bar Lawyer Referral Program
          </a>
          <a
            href="https://www.lawhelpmn.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-green-500 hover:underline"
          >
            LawHelpMN - Free Legal Resources
          </a>
          <a
            href="https://www.sba.gov/local-assistance"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-green-500 hover:underline"
          >
            SBA Local Assistance - Small Business Resources
          </a>
          <a
            href="https://www.americanbar.org/groups/legal_services/flh-home/"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-green-500 hover:underline"
          >
            ABA Free Legal Help Directory
          </a>
        </div>

        <h3 className="text-white font-medium mt-6 mb-3">Relevant Statutes</h3>
        <div className="space-y-2 text-sm">
          <a
            href="https://www.revisor.mn.gov/statutes/cite/325D"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-green-500 hover:underline"
          >
            Minnesota Deceptive Trade Practices Act (Minn. Stat. § 325D)
          </a>
          <a
            href="https://www.law.cornell.edu/uscode/text/18/1964"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-green-500 hover:underline"
          >
            Civil RICO Statute (18 U.S.C. § 1964)
          </a>
          <a
            href="https://www.revisor.mn.gov/statutes/cite/15C"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-green-500 hover:underline"
          >
            Minnesota False Claims Act (Minn. Stat. § 15C)
          </a>
        </div>
      </section>

      {/* Related Tools */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-white mb-4 border-b border-gray-800 pb-2">
          Related Tools
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/database"
            className="border border-gray-800 rounded p-4 hover:border-gray-700 transition-colors"
          >
            <h3 className="text-white font-medium mb-2">Childcare Database</h3>
            <p className="text-gray-500 text-xs">
              Search licensed childcare providers and view public records.
            </p>
          </Link>

          <Link
            href="/hcbs"
            className="border border-gray-800 rounded p-4 hover:border-gray-700 transition-colors"
          >
            <h3 className="text-white font-medium mb-2">HCBS Providers</h3>
            <p className="text-gray-500 text-xs">
              Home and Community Based Services provider database.
            </p>
          </Link>

          <Link
            href="/foia"
            className="border border-gray-800 rounded p-4 hover:border-gray-700 transition-colors"
          >
            <h3 className="text-white font-medium mb-2">FOIA Generator</h3>
            <p className="text-gray-500 text-xs">
              Request public records from government agencies.
            </p>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <div className="mt-12 pt-8 border-t border-gray-800 flex gap-6 text-sm">
        <Link href="/terms" className="text-gray-500 hover:text-white">Terms</Link>
        <Link href="/privacy" className="text-gray-500 hover:text-white">Privacy</Link>
        <Link href="/about" className="text-gray-500 hover:text-white">About</Link>
      </div>
    </div>
  );
}
