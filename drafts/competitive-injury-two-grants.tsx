// DRAFT: Two-grant version of competitive injury page
// - General Provider Grant: $10,000
// - EIDBI Provider Grant: $10,000 (autism care)
// Total: $20,000

// Replace the single grant section with this:

      {/* Provider Accountability Grants */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-white mb-4 border-b border-gray-800 pb-2">
          Provider Accountability Grants — $20,000 Total
        </h2>
        <p className="text-gray-400 text-sm mb-6">
          Two grants are available to help offset legal costs for legitimate Minnesota providers pursuing
          competitive injury claims against fraudulent operators.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* General Provider Grant */}
          <div className="border-2 border-green-900/50 bg-green-950/20 rounded-lg p-5">
            <h3 className="text-green-400 font-semibold mb-2">General Provider Grant</h3>
            <p className="text-2xl font-bold text-white mb-3">$10,000</p>
            <p className="text-gray-400 text-xs mb-3">
              For licensed childcare, HCBS, senior care, PCA, mental health, or nursing facility providers.
            </p>
            <div className="text-xs text-gray-500">
              <p className="font-medium text-gray-400 mb-1">Eligible providers:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Licensed childcare (CCAP)</li>
                <li>HCBS / 245D disability services</li>
                <li>Senior home care / Elderly Waiver</li>
                <li>PCA agencies</li>
                <li>Mental health / ARMHS</li>
                <li>Nursing facilities</li>
                <li>NEMT transportation</li>
              </ul>
            </div>
          </div>

          {/* EIDBI Grant */}
          <div className="border-2 border-blue-900/50 bg-blue-950/20 rounded-lg p-5">
            <h3 className="text-blue-400 font-semibold mb-2">EIDBI Provider Grant</h3>
            <p className="text-2xl font-bold text-white mb-3">$10,000</p>
            <p className="text-gray-400 text-xs mb-3">
              Specifically for autism care providers harmed by fraud in Minnesota&apos;s EIDBI program.
            </p>
            <div className="text-xs text-gray-500">
              <p className="font-medium text-gray-400 mb-1">Eligible providers:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>EIDBI-enrolled providers</li>
                <li>ABA therapy practices</li>
                <li>Autism treatment centers</li>
                <li>Developmental therapy providers</li>
                <li>Behavioral intervention specialists</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Shared Requirements */}
        <div className="border border-gray-800 rounded-lg p-5 space-y-4">
          <div className="border-l-2 border-green-800 pl-4 text-xs text-gray-400 space-y-2">
            <p className="text-green-300 font-medium">Eligibility Requirements (Both Grants):</p>
            <ul className="list-disc list-inside space-y-1">
              <li>You must be a licensed/enrolled provider in the relevant program</li>
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
              <li>One grant per category — first eligible applicant in each category will be awarded</li>
            </ul>
          </div>

          <div className="bg-green-900/20 rounded p-3 text-xs">
            <p className="text-green-300 font-medium mb-1">How to Apply:</p>
            <p className="text-gray-400">
              Submit proof of case initiation (retainer agreement or court filing) along with your provider license
              information via our{' '}
              <Link href="/tip" className="text-green-500 hover:underline">tip submission form</Link>.
              Include <strong>&quot;GENERAL GRANT&quot;</strong> or <strong>&quot;EIDBI GRANT&quot;</strong> in your message.
              We will verify eligibility and contact you regarding disbursement.
            </p>
          </div>
        </div>
      </section>
