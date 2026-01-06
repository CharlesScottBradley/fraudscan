import Link from 'next/link';

function formatMoney(amount: number | null): string {
  if (!amount) return '-';
  if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(1)}B`;
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

// Fraud schemes data
const FRAUD_SCHEMES = [
  {
    name: 'Feeding Our Future',
    program: 'USDA Child Nutrition',
    estimated_fraud: 300000000,
    defendants_charged: 78,
    convictions: 56,
    status: 'Ongoing prosecutions',
    timeline: 'Sept 2022 - Present',
    key_figure: 'Aimee Bock (convicted)'
  },
  {
    name: 'Housing Stabilization Services (HSS)',
    program: 'Medicaid',
    estimated_fraud: 302000000,
    defendants_charged: 13,
    convictions: 0,
    status: 'Program terminated Oct 2024',
    timeline: 'Sept 2025 - Present',
    key_figure: 'Multiple family operations'
  },
  {
    name: 'Autism/EIDBI Services',
    program: 'Medicaid',
    estimated_fraud: 220000000,
    defendants_charged: 7,
    convictions: 1,
    status: 'Active investigation',
    timeline: 'Sept 2025 - Present',
    key_figure: 'Asha Farhan Hassan (pled guilty)'
  }
];

// HSS Fraud Defendants - September 2025
const HSS_DEFENDANTS_SEPT = [
  { name: 'Moktar Hassan Aden', age: 30, company: 'Brilliant Minds Services LLC', role: 'Principal' },
  { name: 'Mustafa Dayib Ali', age: 29, company: 'Leo Human Services LLC', role: 'Principal' },
  { name: 'Khalid Ahmed Dayib', age: 26, company: 'Leo Human Services LLC', role: 'Principal' },
  { name: 'Abdifitah Mohamud Mohamed', age: 27, company: 'Liberty Plus LLC', role: 'Principal' },
  { name: 'Christopher Adesoji Falade', age: 62, company: 'Faladcare LLC', role: 'Principal' },
  { name: 'Emmanuel Oluwademilade Falade', age: 32, company: 'Faladcare LLC', role: 'Principal' },
  { name: 'Asad Ahmed Adow', age: 26, company: 'Unknown', role: 'Defendant' },
  { name: 'Anwar Ahmed Adow', age: 25, company: 'Unknown', role: 'Defendant' },
];

// HSS Fraud Defendants - December 2025
const HSS_DEFENDANTS_DEC = [
  { name: 'Anthony Waddell Jefferson', age: 37, company: 'Chozen Runner LLC', role: 'Principal', note: 'Philadelphia - "fraud tourism"' },
  { name: 'Lester Brown', age: 53, company: 'Retsel Real Estate LLC', role: 'Principal', note: 'Philadelphia - "fraud tourism"' },
  { name: 'Hassan Ahmed Hussein', age: null, company: 'Unknown', role: 'Defendant' },
  { name: 'Ahmed Abdirashim Mohamed', age: null, company: 'Unknown', role: 'Defendant' },
  { name: 'Abdinajib Hassan Yussuf', age: null, company: 'Unknown', role: 'Defendant' },
];

// Autism/EIDBI Defendants
const EIDBI_DEFENDANTS = [
  { name: 'Asha Farhan Hassan', age: 28, company: 'Smart Therapy LLC / Star Autism Center LLC', role: 'Owner', status: 'Pled Guilty', note: 'Cross-scheme: Also received $465K from FOF', fraud_amount: 14000000 },
  { name: 'Kaamil Omar Sallah', age: null, company: 'SafeLodgings Inc.', role: 'Owner', status: 'FUGITIVE', note: '4 counts wire fraud', fraud_amount: null },
  { name: 'Unknown', age: null, company: 'Pristine Health LLC', role: 'Principal', status: 'Charged', note: null, fraud_amount: null },
];

// Charged companies
const CHARGED_COMPANIES = [
  { name: 'Smart Therapy LLC', scheme: 'EIDBI', fraud_amount: 14000000, status: 'Owner pled guilty' },
  { name: 'Star Autism Center LLC', scheme: 'EIDBI', fraud_amount: null, status: 'Under investigation' },
  { name: 'SafeLodgings Inc.', scheme: 'EIDBI', fraud_amount: null, status: 'Owner fugitive' },
  { name: 'Pristine Health LLC', scheme: 'EIDBI', fraud_amount: null, status: 'Charged' },
  { name: 'Brilliant Minds Services LLC', scheme: 'HSS', fraud_amount: null, status: 'Principals charged' },
  { name: 'Leo Human Services LLC', scheme: 'HSS', fraud_amount: null, status: 'Principals charged' },
  { name: 'Liberty Plus LLC', scheme: 'HSS', fraud_amount: null, status: 'Principals charged' },
  { name: 'Faladcare LLC', scheme: 'HSS', fraud_amount: null, status: 'Principals charged' },
  { name: 'Chozen Runner LLC', scheme: 'HSS', fraud_amount: 3500000, status: 'Fraud tourism case' },
  { name: 'Retsel Real Estate LLC', scheme: 'HSS', fraud_amount: 3500000, status: 'Fraud tourism case' },
];

// Uninvestigated Leads - 2104 Park Ave Cluster
const PARK_AVE_CLUSTER = {
  address: '2104 Park Ave S, Minneapolis, MN 55404',
  parcelId: '27053-3502924220076',
  totalPPP: 2157419,
  businesses: [
    {
      name: 'Alpha Home Care Provider',
      suite: '102',
      owner: 'Mohamed Ibrahim Adur',
      ppp: 698329,
      ppp_jobs: 141,
      dhs_payments: 42034699,
      dhs_years: '2021-2025',
      license: '1080326',
      license_status: 'Active',
      violations: 0,
      notes: '$9M/year from small suite; 141 jobs claimed'
    },
    {
      name: 'Minnesota Staffing LLC',
      suite: '104',
      owner: 'Unknown (Female-owned)',
      ppp: 1217400,
      ppp_jobs: 479,
      dhs_payments: null,
      dhs_years: null,
      license: null,
      license_status: null,
      violations: null,
      notes: 'Two PPP loans ($608K each); 479 jobs from Suite 104'
    },
    {
      name: 'First Choice Home Care Inc',
      suite: 'Main',
      owner: 'Najah Ahmed Barkhadle',
      ppp: 165250,
      ppp_jobs: 53,
      dhs_payments: null,
      dhs_years: null,
      license: '1104851',
      license_status: 'Active',
      violations: 2,
      notes: '2 DHS correction orders (2022, 2023)'
    },
    {
      name: 'Agan Home Care Inc',
      suite: '110',
      owner: 'Unknown',
      ppp: 76440,
      ppp_jobs: 12,
      dhs_payments: null,
      dhs_years: null,
      license: '1099750',
      license_status: 'Active',
      violations: 0,
      notes: 'Serves East African immigrant community'
    },
    {
      name: 'Aspen Housing Services LLC',
      suite: '8B',
      owner: 'Unknown',
      ppp: null,
      ppp_jobs: null,
      dhs_payments: null,
      dhs_years: null,
      license: null,
      license_status: null,
      violations: null,
      notes: 'HSS provider - program flagged for fraud'
    }
  ]
};

export const revalidate = 3600;

export default function MNMedicaidFraudPage() {
  const totalEstimatedFraud = FRAUD_SCHEMES.reduce((sum, s) => sum + s.estimated_fraud, 0);
  const totalDefendants = FRAUD_SCHEMES.reduce((sum, s) => sum + s.defendants_charged, 0);
  const totalConvictions = FRAUD_SCHEMES.reduce((sum, s) => sum + s.convictions, 0);

  return (
    <div>
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-6">
        <Link href="/investigation" className="hover:text-gray-300">Investigations</Link>
        <span className="mx-2">/</span>
        <span className="text-white">Minnesota Medicaid Fraud Wave</span>
      </div>

      {/* Terminal-style stats */}
      <div className="font-mono text-sm mb-10">
        <p className="text-gray-500">MN_MEDICAID_FRAUD_INVESTIGATION</p>
        <div className="mt-2 text-gray-400">
          <p><span className="text-gray-600">├─</span> potential_total_fraud <span className="text-red-500 ml-4">$9B+ (U.S. Attorney estimate)</span></p>
          <p><span className="text-gray-600">├─</span> confirmed_schemes <span className="text-white ml-4">3 (FOF, HSS, EIDBI)</span></p>
          <p><span className="text-gray-600">├─</span> estimated_fraud_to_date <span className="text-green-500 ml-4">{formatMoney(totalEstimatedFraud)}</span></p>
          <p><span className="text-gray-600">├─</span> defendants_charged <span className="text-white ml-4">{totalDefendants}</span></p>
          <p><span className="text-gray-600">├─</span> convictions <span className="text-white ml-4">{totalConvictions}</span></p>
          <p><span className="text-gray-600">├─</span> fugitives <span className="text-red-400 ml-4">1 (Kaamil Omar Sallah)</span></p>
          <p><span className="text-gray-600">└─</span> cross_scheme_participants <span className="text-yellow-400 ml-4">1 (Asha Farhan Hassan)</span></p>
        </div>
      </div>

      {/* Alert Banner */}
      <div className="bg-red-900/20 border border-red-800 p-4 mb-8">
        <div className="flex items-start gap-3">
          <span className="text-red-500 text-xl">!</span>
          <div>
            <h2 className="text-red-400 font-medium mb-1">$9 Billion Fraud Estimate</h2>
            <p className="text-sm text-gray-400">
              U.S. Attorney Joseph Thompson stated in December 2025 that total fraud across 14 Minnesota
              Medicaid programs could exceed <span className="text-red-400 font-bold">$9 billion</span>.
              Three major schemes have been identified so far, with investigations ongoing.
            </p>
          </div>
        </div>
      </div>

      {/* What is this */}
      <div className="border border-gray-800 p-4 mb-8">
        <h2 className="text-white font-medium mb-2">What is this investigation</h2>
        <p className="text-sm text-gray-400 leading-relaxed mb-3">
          Minnesota is experiencing an unprecedented wave of government program fraud. Starting with the
          $250M+ Feeding Our Future scheme (charged 2022), investigators have uncovered connected fraud
          in Housing Stabilization Services (HSS) and autism treatment (EIDBI) programs.
        </p>
        <p className="text-sm text-gray-400 leading-relaxed">
          The schemes share personnel, methods, and in at least one case, the same defendant participated
          in multiple schemes. U.S. Attorney Thompson called it a &quot;web&quot; of fraud that has stolen
          billions in taxpayer money.
        </p>
      </div>

      {/* Scheme Comparison Table */}
      <div className="mb-8">
        <h3 className="text-sm font-medium text-gray-400 mb-4">The Three Major Schemes</h3>
        <div className="border border-gray-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left p-3 font-medium text-gray-400">Scheme</th>
                <th className="text-left p-3 font-medium text-gray-400">Program</th>
                <th className="text-right p-3 font-medium text-gray-400">Est. Fraud</th>
                <th className="text-right p-3 font-medium text-gray-400">Charged</th>
                <th className="text-right p-3 font-medium text-gray-400">Convicted</th>
                <th className="text-left p-3 font-medium text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {FRAUD_SCHEMES.map((scheme, idx) => (
                <tr key={idx} className="hover:bg-gray-900/50">
                  <td className="p-3 text-white font-medium">{scheme.name}</td>
                  <td className="p-3 text-gray-400">{scheme.program}</td>
                  <td className="p-3 text-right font-mono text-green-500">{formatMoney(scheme.estimated_fraud)}</td>
                  <td className="p-3 text-right font-mono text-white">{scheme.defendants_charged}</td>
                  <td className="p-3 text-right font-mono text-white">{scheme.convictions}</td>
                  <td className="p-3 text-gray-400 text-xs">{scheme.status}</td>
                </tr>
              ))}
              <tr className="bg-gray-900/30">
                <td className="p-3 text-gray-400 font-medium" colSpan={2}>Total (Known)</td>
                <td className="p-3 text-right font-mono text-green-500">{formatMoney(totalEstimatedFraud)}</td>
                <td className="p-3 text-right font-mono text-white">{totalDefendants}</td>
                <td className="p-3 text-right font-mono text-white">{totalConvictions}</td>
                <td className="p-3"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Cross-Scheme Alert */}
      <div className="bg-yellow-900/20 border border-yellow-800 p-4 mb-8">
        <h3 className="text-yellow-400 font-medium mb-2">Cross-Scheme Participant Identified</h3>
        <p className="text-sm text-gray-400 mb-3">
          <strong className="text-white">Asha Farhan Hassan</strong> (28) is the first documented case of
          an individual participating in multiple major Minnesota fraud schemes:
        </p>
        <ul className="text-sm text-gray-400 space-y-1 ml-4">
          <li>- <strong>Smart Therapy LLC / Star Autism Center</strong>: $14M EIDBI fraud (pled guilty)</li>
          <li>- <strong>Feeding Our Future</strong>: Received $465,000 claiming ~200,000 fake meals</li>
        </ul>
        <p className="text-sm text-gray-500 mt-3">
          Her attorney stated she &quot;wanted to start the business for the right reasons&quot; but
          &quot;knew at some point that the fraud began, and she let it continue.&quot;
        </p>
      </div>

      {/* HSS Defendants - September 2025 */}
      <div className="mb-8">
        <h3 className="text-sm font-medium text-gray-400 mb-2">HSS Fraud Defendants (September 2025)</h3>
        <p className="text-xs text-gray-500 mb-4">First wave of charges - 8 defendants, ~$8M in fraudulent billing</p>
        <div className="border border-gray-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left p-3 font-medium text-gray-400">Name</th>
                <th className="text-left p-3 font-medium text-gray-400">Age</th>
                <th className="text-left p-3 font-medium text-gray-400">Company</th>
                <th className="text-left p-3 font-medium text-gray-400">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {HSS_DEFENDANTS_SEPT.map((d, idx) => (
                <tr key={idx} className="hover:bg-gray-900/50">
                  <td className="p-3 text-white">{d.name}</td>
                  <td className="p-3 text-gray-400">{d.age}</td>
                  <td className="p-3 text-gray-400">{d.company}</td>
                  <td className="p-3 text-gray-400">{d.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* HSS Defendants - December 2025 */}
      <div className="mb-8">
        <h3 className="text-sm font-medium text-gray-400 mb-2">HSS Fraud Defendants (December 2025)</h3>
        <p className="text-xs text-gray-500 mb-4">Second wave - includes &quot;fraud tourism&quot; case from Philadelphia</p>
        <div className="border border-gray-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left p-3 font-medium text-gray-400">Name</th>
                <th className="text-left p-3 font-medium text-gray-400">Age</th>
                <th className="text-left p-3 font-medium text-gray-400">Company</th>
                <th className="text-left p-3 font-medium text-gray-400">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {HSS_DEFENDANTS_DEC.map((d, idx) => (
                <tr key={idx} className="hover:bg-gray-900/50">
                  <td className="p-3 text-white">{d.name}</td>
                  <td className="p-3 text-gray-400">{d.age || '-'}</td>
                  <td className="p-3 text-gray-400">{d.company}</td>
                  <td className="p-3 text-xs text-gray-500">{d.note || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 p-3 bg-gray-900/50 border border-gray-800 rounded">
          <p className="text-sm text-gray-400">
            <strong className="text-white">&quot;Fraud Tourism&quot;:</strong> Two Philadelphia men heard
            Minnesota&apos;s HSS program was &quot;easy money,&quot; traveled to Minnesota to enroll their
            companies, returned to Philadelphia, and submitted $3.5M in fraudulent claims remotely.
          </p>
        </div>
      </div>

      {/* EIDBI Defendants */}
      <div className="mb-8">
        <h3 className="text-sm font-medium text-gray-400 mb-2">Autism/EIDBI Fraud Defendants</h3>
        <p className="text-xs text-gray-500 mb-4">Estimated $220M in fraud - investigation ongoing</p>
        <div className="border border-gray-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left p-3 font-medium text-gray-400">Name</th>
                <th className="text-left p-3 font-medium text-gray-400">Company</th>
                <th className="text-left p-3 font-medium text-gray-400">Status</th>
                <th className="text-left p-3 font-medium text-gray-400">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {EIDBI_DEFENDANTS.map((d, idx) => (
                <tr key={idx} className="hover:bg-gray-900/50">
                  <td className="p-3 text-white">{d.name}</td>
                  <td className="p-3 text-gray-400">{d.company}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      d.status === 'FUGITIVE'
                        ? 'bg-red-900/30 text-red-400'
                        : d.status === 'Pled Guilty'
                        ? 'bg-green-900/30 text-green-400'
                        : 'bg-yellow-900/30 text-yellow-400'
                    }`}>
                      {d.status}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-gray-500">{d.note || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fugitive Alert */}
      <div className="bg-red-900/30 border border-red-700 p-4 mb-8">
        <h3 className="text-red-400 font-medium mb-2">FUGITIVE: Kaamil Omar Sallah</h3>
        <p className="text-sm text-gray-400">
          Owner of SafeLodgings Inc. Charged with 4 counts of wire fraud for EIDBI autism services fraud.
          Currently wanted by federal authorities. His flight suggests substantial evidence against him.
        </p>
      </div>

      {/* Charged Companies */}
      <div className="mb-8">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Charged Companies</h3>
        <div className="border border-gray-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left p-3 font-medium text-gray-400">Company</th>
                <th className="text-left p-3 font-medium text-gray-400">Scheme</th>
                <th className="text-right p-3 font-medium text-gray-400">Known Fraud</th>
                <th className="text-left p-3 font-medium text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {CHARGED_COMPANIES.map((c, idx) => (
                <tr key={idx} className="hover:bg-gray-900/50">
                  <td className="p-3 text-white">{c.name}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      c.scheme === 'EIDBI'
                        ? 'bg-purple-900/30 text-purple-400'
                        : 'bg-blue-900/30 text-blue-400'
                    }`}>
                      {c.scheme}
                    </span>
                  </td>
                  <td className="p-3 text-right font-mono text-green-500">
                    {c.fraud_amount ? formatMoney(c.fraud_amount) : '-'}
                  </td>
                  <td className="p-3 text-gray-400 text-xs">{c.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Uninvestigated Lead: 2104 Park Ave Cluster */}
      <div className="bg-orange-900/20 border border-orange-800 p-4 mb-8">
        <h3 className="text-orange-400 font-medium mb-2">Uninvestigated Lead: 2104 Park Ave S Cluster</h3>
        <p className="text-sm text-gray-400 mb-4">
          Five healthcare/staffing businesses operating from a single small commercial building.
          One business alone received <span className="text-orange-400 font-bold">$42M in DHS payments</span> from 2021-2025.
        </p>

        <div className="border border-gray-800 overflow-x-auto mb-4">
          <table className="w-full text-sm">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left p-2 font-medium text-gray-400">Business</th>
                <th className="text-left p-2 font-medium text-gray-400">Suite</th>
                <th className="text-left p-2 font-medium text-gray-400">Owner</th>
                <th className="text-right p-2 font-medium text-gray-400">PPP</th>
                <th className="text-right p-2 font-medium text-gray-400">Jobs</th>
                <th className="text-right p-2 font-medium text-gray-400">DHS Payments</th>
                <th className="text-left p-2 font-medium text-gray-400">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {PARK_AVE_CLUSTER.businesses.map((b, idx) => (
                <tr key={idx} className="hover:bg-gray-900/50">
                  <td className="p-2 text-white text-xs">{b.name}</td>
                  <td className="p-2 text-gray-400 text-xs">{b.suite}</td>
                  <td className="p-2 text-gray-400 text-xs">{b.owner}</td>
                  <td className="p-2 text-right font-mono text-green-500 text-xs">
                    {b.ppp ? formatMoney(b.ppp) : '-'}
                  </td>
                  <td className="p-2 text-right font-mono text-white text-xs">
                    {b.ppp_jobs || '-'}
                  </td>
                  <td className="p-2 text-right font-mono text-xs">
                    {b.dhs_payments ? (
                      <span className="text-orange-400">{formatMoney(b.dhs_payments)}</span>
                    ) : '-'}
                  </td>
                  <td className="p-2 text-gray-500 text-xs">{b.notes}</td>
                </tr>
              ))}
              <tr className="bg-gray-900/30">
                <td className="p-2 text-gray-400 font-medium text-xs" colSpan={3}>Total at Address</td>
                <td className="p-2 text-right font-mono text-green-500 text-xs">{formatMoney(PARK_AVE_CLUSTER.totalPPP)}</td>
                <td className="p-2 text-right font-mono text-white text-xs">685+</td>
                <td className="p-2 text-right font-mono text-orange-400 text-xs">{formatMoney(42034699)}</td>
                <td className="p-2"></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-gray-900/50 p-3 rounded">
            <p className="text-gray-500 mb-2">Why This Is Suspicious</p>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
              <li>141 employees claimed from a single small suite</li>
              <li>$9M/year in billing from Suite 102 alone</li>
              <li>5 businesses in one building serving vulnerable populations</li>
              <li>One tenant (First Choice) has 2 DHS correction orders</li>
              <li>HSS provider at same address (program terminated for fraud)</li>
            </ul>
          </div>
          <div className="bg-gray-900/50 p-3 rounded">
            <p className="text-gray-500 mb-2">Verified Data Sources</p>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
              <li>PPP: SBA PPP Loan Data (Loan #2246227403)</li>
              <li>DHS Payments: OpenTheBooks.com MN Checkbook</li>
              <li>Licenses: MN DHS License Lookup</li>
              <li>Address: Hennepin County Parcel {PARK_AVE_CLUSTER.parcelId}</li>
            </ul>
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-4">
          <strong>Status:</strong> No charges filed as of January 2026. This cluster has not been publicly linked to any fraud investigation.
        </p>
      </div>

      {/* How the Fraud Works */}
      <div className="border border-gray-800 p-4 mb-8">
        <h3 className="text-white font-medium mb-3">How the Fraud Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-400">
          <div>
            <p className="text-gray-500 mb-2">EIDBI (Autism) Fraud Pattern</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Recruit children from community (often Somali)</li>
              <li>Get children diagnosed for autism services</li>
              <li>Pay parents $300-$1,500/month kickbacks</li>
              <li>Hire unqualified staff (18-19 year olds, no training)</li>
              <li>Bill Medicaid for services not rendered</li>
            </ul>
          </div>
          <div>
            <p className="text-gray-500 mb-2">HSS (Housing) Fraud Pattern</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Register company as HSS provider</li>
              <li>Submit claims for housing services</li>
              <li>Services never actually provided</li>
              <li>Some operated entirely out-of-state</li>
              <li>Program had minimal verification</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Program Growth Stats */}
      <div className="border border-gray-800 p-4 mb-8">
        <h3 className="text-white font-medium mb-3">EIDBI Program Growth (Red Flag)</h3>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-gray-500 text-xs mb-1">Provider Growth</p>
            <p className="text-2xl font-mono text-red-400">700%</p>
            <p className="text-xs text-gray-500">41 to 328 providers (2018-2024)</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-1">Payment Growth</p>
            <p className="text-2xl font-mono text-red-400">3,000%</p>
            <p className="text-xs text-gray-500">$6M to $192M (2018-2024)</p>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="border border-gray-800 p-4 mb-8">
        <h3 className="text-white font-medium mb-3">Timeline</h3>
        <div className="space-y-3 text-sm">
          <div className="flex gap-4">
            <span className="text-gray-500 font-mono w-24 shrink-0">Jul 2020</span>
            <span className="text-gray-400">Minnesota launches HSS program (first state in nation)</span>
          </div>
          <div className="flex gap-4">
            <span className="text-gray-500 font-mono w-24 shrink-0">Sept 2022</span>
            <span className="text-gray-400">First 47 Feeding Our Future defendants charged</span>
          </div>
          <div className="flex gap-4">
            <span className="text-gray-500 font-mono w-24 shrink-0">Sept 2025</span>
            <span className="text-gray-400">First HSS fraud charges (8 defendants)</span>
          </div>
          <div className="flex gap-4">
            <span className="text-gray-500 font-mono w-24 shrink-0">Sept 2025</span>
            <span className="text-gray-400">Asha Farhan Hassan charged (first EIDBI case)</span>
          </div>
          <div className="flex gap-4">
            <span className="text-gray-500 font-mono w-24 shrink-0">Oct 2024</span>
            <span className="text-gray-400">Governor Walz terminates HSS program</span>
          </div>
          <div className="flex gap-4">
            <span className="text-gray-500 font-mono w-24 shrink-0">Dec 2025</span>
            <span className="text-gray-400">Additional charges; U.S. Attorney estimates $9B+ total fraud</span>
          </div>
        </div>
      </div>

      {/* Sources */}
      <div className="border border-gray-800 p-4 mb-8">
        <h3 className="text-white font-medium mb-3">Sources</h3>
        <ul className="text-sm text-gray-400 space-y-2">
          <li>
            <a
              href="https://www.justice.gov/usao-mn/pr/first-defendant-charged-autism-fraud-scheme-0"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-500 hover:underline"
            >
              DOJ: First Defendant Charged in Autism Fraud Scheme
            </a>
          </li>
          <li>
            <a
              href="https://www.ag.state.mn.us/Office/Communications/2025/12/18_HSS.asp"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-500 hover:underline"
            >
              MN AG: HSS and EIDBI Provider Indictments (Dec 2025)
            </a>
          </li>
          <li>
            <a
              href="https://www.fox9.com/news/fraud-minnesota-detailing-nearly-1-billion-schemes"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-500 hover:underline"
            >
              FOX 9: Fraud in Minnesota - Nearly $1 Billion in Schemes
            </a>
          </li>
          <li>
            <a
              href="https://www.irs.gov/compliance/criminal-investigation/defendants-charged-in-first-wave-of-housing-stabilization-fraud-cases"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-500 hover:underline"
            >
              IRS-CI: HSS Fraud First Wave Charges
            </a>
          </li>
        </ul>
      </div>

      {/* Related Links */}
      <div className="border-t border-gray-800 pt-6">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Related</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <Link href="/investigation/mn-oh-wa" className="text-gray-400 hover:text-green-400">
            Three-State Analysis
          </Link>
          <span className="text-gray-700">|</span>
          <Link href="/investigation" className="text-gray-400 hover:text-green-400">
            All Investigations
          </Link>
          <span className="text-gray-700">|</span>
          <Link href="/cases" className="text-gray-400 hover:text-green-400">
            Fraud Cases
          </Link>
          <span className="text-gray-700">|</span>
          <Link href="/tip" className="text-gray-400 hover:text-green-400">
            Submit a Tip
          </Link>
        </div>
      </div>
    </div>
  );
}
