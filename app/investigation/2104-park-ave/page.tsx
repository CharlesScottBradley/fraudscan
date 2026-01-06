import Link from 'next/link';

function formatMoney(amount: number | null): string {
  if (!amount) return '-';
  if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(1)}B`;
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

// Property Details
const PROPERTY = {
  address: '2104 Park Ave S, Minneapolis, MN 55404',
  parcelId: '27053-3502924220076',
  county: 'Hennepin',
  neighborhood: 'Ventura Village / Phillips',
  propertyType: 'Commercial',
  notes: 'Small commercial building with multiple suites'
};

// All businesses at this address
const BUSINESSES = [
  {
    name: 'Alpha Home Care Provider',
    dba: 'MOHAMED ADUR DBA ALPHA HOMECARE PROVIDER',
    suite: '102',
    owner: 'Mohamed Ibrahim Adur',
    business_type: 'Sole Proprietorship',
    started: 'May 31, 2016',
    ppp_loan: 698329,
    ppp_loan_id: '2246227403',
    ppp_jobs: 141,
    ppp_bank: 'Wells Fargo Bank',
    ppp_date: 'May 5, 2020',
    ppp_status: 'Paid in Full',
    dhs_license: '1080326',
    dhs_license_status: 'Active',
    dhs_license_renewed: 'January 1, 2026',
    dhs_violations: 0,
    dhs_payments: [
      { year: 2021, amount: 7305280.15 },
      { year: 2022, amount: 8076685.00 },
      { year: 2023, amount: 8872367.00 },
      { year: 2024, amount: 8681521.48 },
      { year: 2025, amount: 9098846.03 }
    ],
    dhs_total: 42034699.66,
    services: ['Home and Community Based Services', 'PCA', 'Respite', 'Companion'],
    flags: [
      '141 employees reported for PPP (field-based workforce)',
      '$9M/year in DHS payments (large client base)',
      'Sole proprietorship structure',
      'Clean compliance record with DHS'
    ],
    sources: [
      { name: 'PPP Loan Data', url: 'https://www.sba.gov/funding-programs/loans/covid-19-relief-options/paycheck-protection-program' },
      { name: 'DHS License Lookup', url: 'https://licensinglookup.dhs.state.mn.us/Details.aspx?l=1080326' },
      { name: 'OpenTheBooks MN Checkbook', url: 'https://www.openthebooks.com/minnesota-state-checkbook/?emp=Human%20Services' },
      { name: 'BBB Profile', url: 'https://www.bbb.org/us/mn/minneapolis/profile/home-health-care/alpha-home-care-provider-0704-1000046238' }
    ]
  },
  {
    name: 'Minnesota Staffing LLC',
    dba: null,
    suite: '104',
    owner: 'Unknown (Female-owned per SBA)',
    business_type: 'LLC',
    started: 'Unknown',
    ppp_loan: 1217400,
    ppp_loan_id: '8442397010 / 6883808408',
    ppp_jobs: 479,
    ppp_bank: 'Alerus Financial',
    ppp_date: 'April 8, 2020 / Feb 11, 2021',
    ppp_status: 'Paid in Full (both)',
    dhs_license: null,
    dhs_license_status: null,
    dhs_license_renewed: null,
    dhs_violations: null,
    dhs_payments: [],
    dhs_total: null,
    services: ['Temporary Staffing (NAICS 561320)'],
    flags: [
      'Two PPP loans across both rounds ($608K each)',
      '479 jobs reported in first round, 130 in second',
      'Temporary staffing agency (NAICS 561320)'
    ],
    sources: [
      { name: 'PPP Loan Data', url: 'https://www.sba.gov/funding-programs/loans/covid-19-relief-options/paycheck-protection-program' }
    ]
  },
  {
    name: 'First Choice Home Care Inc',
    dba: null,
    suite: 'Main',
    owner: 'Najah Ahmed Barkhadle',
    business_type: 'S Corporation',
    started: 'June 8, 2020',
    ppp_loan: 165250,
    ppp_loan_id: '1916207207',
    ppp_jobs: 53,
    ppp_bank: 'Vibrant Credit Union',
    ppp_date: 'April 15, 2020',
    ppp_status: 'Paid in Full',
    dhs_license: '1104851',
    dhs_license_status: 'Active',
    dhs_license_renewed: 'January 1, 2026',
    dhs_violations: 2,
    dhs_payments: [],
    dhs_total: null,
    services: ['Home and Community Based Services', 'PCA', 'Respite', 'Crisis Respite'],
    flags: [
      '2 DHS correction orders on file (March 2022, August 2023)',
      'NPI registered May 2006, DHS license issued June 2020',
      'Owner has other business interests (Najah Store Inc)'
    ],
    sources: [
      { name: 'PPP Loan Data', url: 'https://www.sba.gov/funding-programs/loans/covid-19-relief-options/paycheck-protection-program' },
      { name: 'DHS License Lookup', url: 'https://licensinglookup.dhs.state.mn.us/Details.aspx?l=1104851' },
      { name: 'NPI Registry', url: 'https://npiprofile.com/npi/1225082233' }
    ]
  },
  {
    name: 'Agan Home Care Inc',
    dba: null,
    suite: '110',
    owner: 'Unknown',
    business_type: 'S Corporation',
    started: 'May 17, 2019',
    ppp_loan: 76440,
    ppp_loan_id: '5750918604',
    ppp_jobs: 12,
    ppp_bank: 'Wells Fargo Bank',
    ppp_date: 'March 20, 2021',
    ppp_status: 'Paid in Full',
    dhs_license: '1099750',
    dhs_license_status: 'Active',
    dhs_license_renewed: 'January 1, 2026',
    dhs_violations: 0,
    dhs_payments: [],
    dhs_total: null,
    services: ['Home and Community Based Services', 'PCA', 'Employment Support', 'Crisis Respite'],
    flags: [
      'Smallest PPP loan at address but maintains active DHS license'
    ],
    sources: [
      { name: 'PPP Loan Data', url: 'https://www.sba.gov/funding-programs/loans/covid-19-relief-options/paycheck-protection-program' },
      { name: 'DHS License Lookup', url: 'https://licensinglookup.dhs.state.mn.us/Details.aspx?l=1099750' },
      { name: 'Company Website', url: 'https://www.aganhomecare.com/' }
    ]
  },
  {
    name: 'Aspen Housing Services LLC',
    dba: null,
    suite: '8B',
    owner: 'Unknown',
    business_type: 'LLC',
    started: 'Unknown',
    ppp_loan: null,
    ppp_loan_id: null,
    ppp_jobs: null,
    ppp_bank: null,
    ppp_date: null,
    ppp_status: null,
    dhs_license: null,
    dhs_license_status: 'Unknown',
    dhs_license_renewed: null,
    dhs_violations: null,
    dhs_payments: [],
    dhs_total: null,
    services: ['Housing Stabilization Services (HSS)', 'Housing Transition', 'Housing Sustaining'],
    flags: [
      'HSS program statewide was suspended Oct 2024',
      'Limited public information available for this provider'
    ],
    sources: [
      { name: 'MN Help Info', url: 'https://www.minnesotahelp.info/Providers/Aspen_Housing_Services_LLC/Housing_Stabilization_Services_HSS/1' }
    ]
  }
];

// Calculate totals
const totalPPP = BUSINESSES.reduce((sum, b) => sum + (b.ppp_loan || 0), 0);
const totalJobs = BUSINESSES.reduce((sum, b) => sum + (b.ppp_jobs || 0), 0);
const totalDHS = BUSINESSES.reduce((sum, b) => sum + (b.dhs_total || 0), 0);
const totalViolations = BUSINESSES.reduce((sum, b) => sum + (b.dhs_violations || 0), 0);

// Minnesota Medicaid spending explosion data
const MN_MEDICAID_SPENDING = [
  { year: 2012, amount: 8.9, label: '$8.9B' },
  { year: 2016, amount: 11.2, label: '$11.2B' },
  { year: 2018, amount: 12, label: '$12B' },
  { year: 2020, amount: 14, label: '$14B' },
  { year: 2022, amount: 17, label: '$17B' },
  { year: 2023, amount: 19.1, label: '$19.1B' },
  { year: 2024, amount: 20.9, label: '$20.9B' },
];

const HSS_SPENDING = [
  { year: 2021, amount: 21, projected: 2.6 },
  { year: 2022, amount: 42, projected: 2.6 },
  { year: 2023, amount: 74, projected: 2.6 },
  { year: 2024, amount: 104, projected: 2.6 },
];

const EIDBI_SPENDING = [
  { year: 2018, amount: 3 },
  { year: 2019, amount: 54 },
  { year: 2020, amount: 77 },
  { year: 2021, amount: 183 },
  { year: 2022, amount: 279 },
  { year: 2023, amount: 399 },
  { year: 2024, amount: 400 },
];

export const revalidate = 3600;

export default function ParkAveInvestigationPage() {
  return (
    <div>
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-6">
        <Link href="/investigation" className="hover:text-gray-300">Investigations</Link>
        <span className="mx-2">/</span>
        <span className="text-white">2104 Park Ave Cluster</span>
      </div>

      {/* Uninvestigated Lead Banner */}
      <div className="bg-orange-900/20 border border-orange-600 p-4 mb-6">
        <div className="flex items-start gap-3">
          <span className="text-orange-400 text-xl">⚠</span>
          <div>
            <h2 className="text-orange-400 font-medium mb-1">Uninvestigated Lead</h2>
            <p className="text-sm text-gray-300">
              This address cluster has not been charged or investigated by authorities despite receiving{' '}
              <span className="text-white font-bold">$44M+ in tracked government funding</span>.
              The data below is compiled from public sources for transparency.
            </p>
          </div>
        </div>
      </div>

      {/* Terminal-style stats */}
      <div className="font-mono text-sm mb-10">
        <p className="text-gray-500">ADDRESS_CLUSTER_INVESTIGATION</p>
        <div className="mt-2 text-gray-400">
          <p><span className="text-gray-600">├─</span> address <span className="text-white ml-4">{PROPERTY.address}</span></p>
          <p><span className="text-gray-600">├─</span> businesses_at_address <span className="text-white ml-4">{BUSINESSES.length}</span></p>
          <p><span className="text-gray-600">├─</span> total_ppp_loans <span className="text-green-500 ml-4">{formatMoney(totalPPP)}</span></p>
          <p><span className="text-gray-600">├─</span> total_jobs_claimed <span className="text-orange-400 ml-4">{totalJobs}</span></p>
          <p><span className="text-gray-600">├─</span> total_dhs_payments <span className="text-red-400 ml-4">{formatMoney(totalDHS)}</span></p>
          <p><span className="text-gray-600">├─</span> dhs_violations <span className="text-yellow-400 ml-4">{totalViolations}</span></p>
          <p><span className="text-gray-600">└─</span> fraud_charges <span className="text-gray-500 ml-4">0 (none filed)</span></p>
        </div>
      </div>

      {/* The Impossible Math */}
      <div className="bg-red-900/20 border border-red-600 p-4 mb-8">
        <h3 className="text-red-400 font-medium mb-3">The Impossible Math</h3>
        <div className="text-sm text-gray-300 space-y-2">
          <p>
            <span className="text-white font-bold">5 businesses</span> at one small commercial building claim{' '}
            <span className="text-white font-bold">685+ employees</span> and received{' '}
            <span className="text-white font-bold">$44M+</span> in tracked government funding.
          </p>
          <p>
            Alpha Home Care Provider alone claims <span className="text-white">141 employees</span> and received{' '}
            <span className="text-white">$9M/year</span> in DHS payments—yet operates from a{' '}
            <span className="text-red-400">single suite in a shabby commercial building</span>.
          </p>
          <p className="text-gray-400">
            For context: 141 employees at $64K revenue/employee = $9M, which matches. But where do 141 people
            work? The office is administrative only. <span className="text-white">Do 141 caregivers actually exist?</span>{' '}
            Do the clients they bill for actually receive services?
          </p>
        </div>
      </div>

      {/* Minnesota Spending Explosion Context */}
      <div className="border border-red-800 bg-red-900/10 p-4 mb-8">
        <h3 className="text-red-400 font-medium mb-3">Context: Minnesota&apos;s Medicaid Spending Explosion</h3>
        <p className="text-sm text-gray-400 mb-4">
          This address cluster exists within a broader pattern of explosive spending growth in Minnesota&apos;s
          Medicaid programs—spending that U.S. Attorney Joe Thompson says is <span className="text-white">&quot;half or more&quot; fraudulent</span>.
        </p>

        {/* Spending Charts - Side by Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Chart 1: Total Medicaid Spending */}
          <div className="bg-gray-900/50 rounded border border-gray-800 p-4">
            <div className="flex justify-between items-baseline mb-3">
              <p className="text-sm text-gray-400">Total MN Medicaid Spending</p>
              <p className="text-xs text-red-400 font-mono">+135%</p>
            </div>
            <svg viewBox="0 0 400 200" className="w-full h-48">
              {/* Grid lines */}
              <line x1="50" y1="30" x2="380" y2="30" stroke="#374151" strokeWidth="0.5" />
              <line x1="50" y1="80" x2="380" y2="80" stroke="#374151" strokeWidth="0.5" />
              <line x1="50" y1="130" x2="380" y2="130" stroke="#374151" strokeWidth="0.5" />
              <line x1="50" y1="170" x2="380" y2="170" stroke="#374151" strokeWidth="0.5" />
              {/* Y-axis labels */}
              <text x="45" y="34" fill="#6b7280" fontSize="10" textAnchor="end">$21B</text>
              <text x="45" y="84" fill="#6b7280" fontSize="10" textAnchor="end">$17B</text>
              <text x="45" y="134" fill="#6b7280" fontSize="10" textAnchor="end">$13B</text>
              <text x="45" y="174" fill="#6b7280" fontSize="10" textAnchor="end">$8B</text>
              {/* Area fill under line */}
              <polygon
                fill="url(#redGradient)"
                points="50,170 50,163 105,142 160,135 215,117 270,77 325,56 380,30 380,170"
                opacity="0.3"
              />
              {/* Line path: x = 50 + (i * 55), y = 170 - ((amount-8)/13)*140 */}
              <polyline
                fill="none"
                stroke="#ef4444"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points="50,163 105,142 160,135 215,117 270,77 325,56 380,30"
              />
              {/* Data points with values */}
              <circle cx="50" cy="163" r="4" fill="#ef4444" />
              <text x="50" y="155" fill="#ef4444" fontSize="9" textAnchor="middle">$8.9B</text>
              <circle cx="380" cy="30" r="4" fill="#ef4444" />
              <text x="380" y="22" fill="#ef4444" fontSize="9" textAnchor="middle">$20.9B</text>
              {/* X-axis labels */}
              <text x="50" y="188" fill="#6b7280" fontSize="9" textAnchor="middle">2012</text>
              <text x="105" y="188" fill="#6b7280" fontSize="9" textAnchor="middle">2016</text>
              <text x="160" y="188" fill="#6b7280" fontSize="9" textAnchor="middle">2018</text>
              <text x="215" y="188" fill="#6b7280" fontSize="9" textAnchor="middle">2020</text>
              <text x="270" y="188" fill="#6b7280" fontSize="9" textAnchor="middle">2022</text>
              <text x="325" y="188" fill="#6b7280" fontSize="9" textAnchor="middle">2023</text>
              <text x="380" y="188" fill="#6b7280" fontSize="9" textAnchor="middle">2024</text>
              {/* Gradient definition */}
              <defs>
                <linearGradient id="redGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Chart 2: Fraud-Prone Programs */}
          <div className="bg-gray-900/50 rounded border border-gray-800 p-4">
            <div className="flex justify-between items-baseline mb-3">
              <p className="text-sm text-gray-400">Fraud-Prone Programs</p>
              <p className="text-xs text-red-400">Under investigation</p>
            </div>
            <svg viewBox="0 0 400 200" className="w-full h-48">
              {/* Grid lines */}
              <line x1="50" y1="30" x2="380" y2="30" stroke="#374151" strokeWidth="0.5" />
              <line x1="50" y1="77" x2="380" y2="77" stroke="#374151" strokeWidth="0.5" />
              <line x1="50" y1="123" x2="380" y2="123" stroke="#374151" strokeWidth="0.5" />
              <line x1="50" y1="170" x2="380" y2="170" stroke="#374151" strokeWidth="0.5" />
              {/* Y-axis labels */}
              <text x="45" y="34" fill="#6b7280" fontSize="10" textAnchor="end">$400M</text>
              <text x="45" y="81" fill="#6b7280" fontSize="10" textAnchor="end">$270M</text>
              <text x="45" y="127" fill="#6b7280" fontSize="10" textAnchor="end">$130M</text>
              <text x="45" y="174" fill="#6b7280" fontSize="10" textAnchor="end">$0</text>
              {/* EIDBI area fill */}
              <polygon
                fill="#ef4444"
                points="50,170 50,169 105,151 160,143 215,106 270,72 325,30 380,30 380,170"
                opacity="0.2"
              />
              {/* EIDBI line: x = 50 + (i * 55), y = 170 - (amount/400)*140 */}
              <polyline
                fill="none"
                stroke="#ef4444"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points="50,169 105,151 160,143 215,106 270,72 325,30 380,30"
              />
              {/* HSS line (starts 2021): dashed */}
              <polyline
                fill="none"
                stroke="#f97316"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="6,3"
                points="215,163 270,155 325,144 380,134"
              />
              {/* Data points */}
              <circle cx="50" cy="169" r="3" fill="#ef4444" />
              <circle cx="380" cy="30" r="4" fill="#ef4444" />
              <text x="380" y="22" fill="#ef4444" fontSize="9" textAnchor="middle">$400M</text>
              <text x="50" y="161" fill="#ef4444" fontSize="9" textAnchor="middle">$3M</text>
              {/* X-axis labels */}
              <text x="50" y="188" fill="#6b7280" fontSize="9" textAnchor="middle">2018</text>
              <text x="105" y="188" fill="#6b7280" fontSize="9" textAnchor="middle">2019</text>
              <text x="160" y="188" fill="#6b7280" fontSize="9" textAnchor="middle">2020</text>
              <text x="215" y="188" fill="#6b7280" fontSize="9" textAnchor="middle">2021</text>
              <text x="270" y="188" fill="#6b7280" fontSize="9" textAnchor="middle">2022</text>
              <text x="325" y="188" fill="#6b7280" fontSize="9" textAnchor="middle">2023</text>
              <text x="380" y="188" fill="#6b7280" fontSize="9" textAnchor="middle">2024</text>
              {/* Legend */}
              <rect x="270" y="8" width="105" height="28" fill="#1f2937" rx="2" />
              <line x1="278" y1="18" x2="298" y2="18" stroke="#ef4444" strokeWidth="2" />
              <text x="303" y="21" fill="#9ca3af" fontSize="8">EIDBI (133x)</text>
              <line x1="278" y1="30" x2="298" y2="30" stroke="#f97316" strokeWidth="2" strokeDasharray="4,2" />
              <text x="303" y="33" fill="#9ca3af" fontSize="8">HSS (40x)</text>
            </svg>
            <p className="text-xs text-gray-600 mt-2">EIDBI: 85 open investigations. HSS: Program terminated Oct 2025.</p>
          </div>

        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-800">
          <div className="text-center">
            <p className="text-2xl font-mono text-red-400">$18B</p>
            <p className="text-xs text-gray-500">&quot;High-risk&quot; program billing since 2018</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-mono text-red-400">$9B+</p>
            <p className="text-xs text-gray-500">Estimated fraud (50%+)</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-mono text-white">$1B</p>
            <p className="text-xs text-gray-500">Prosecuted so far</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-mono text-orange-400">$8B</p>
            <p className="text-xs text-gray-500">Gap (uninvestigated)</p>
          </div>
        </div>
      </div>

      {/* Property Info */}
      <div className="border border-gray-800 p-4 mb-8">
        <h3 className="text-white font-medium mb-3">Property Information</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Address</p>
            <p className="text-white">{PROPERTY.address}</p>
          </div>
          <div>
            <p className="text-gray-500">Parcel ID</p>
            <p className="text-white font-mono text-xs">{PROPERTY.parcelId}</p>
          </div>
          <div>
            <p className="text-gray-500">County</p>
            <p className="text-white">{PROPERTY.county}</p>
          </div>
          <div>
            <p className="text-gray-500">Neighborhood</p>
            <p className="text-white">{PROPERTY.neighborhood}</p>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Property owner information available via{' '}
          <a
            href="https://www.hennepin.us/residents/property/property-information-search"
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-500 hover:underline"
          >
            Hennepin County Property Search
          </a>
        </p>
      </div>

      {/* Businesses Overview Table */}
      <div className="mb-8">
        <h3 className="text-sm font-medium text-gray-400 mb-4">All Businesses at This Address</h3>
        <div className="border border-gray-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left p-3 font-medium text-gray-400">Business</th>
                <th className="text-left p-3 font-medium text-gray-400">Suite</th>
                <th className="text-left p-3 font-medium text-gray-400">Owner</th>
                <th className="text-right p-3 font-medium text-gray-400">PPP Loan</th>
                <th className="text-right p-3 font-medium text-gray-400">Jobs</th>
                <th className="text-right p-3 font-medium text-gray-400">DHS Payments</th>
                <th className="text-center p-3 font-medium text-gray-400">DHS License</th>
                <th className="text-center p-3 font-medium text-gray-400">Violations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {BUSINESSES.map((b, idx) => (
                <tr key={idx} className="hover:bg-gray-900/50">
                  <td className="p-3 text-white">{b.name}</td>
                  <td className="p-3 text-gray-400">{b.suite}</td>
                  <td className="p-3 text-gray-400 text-xs">{b.owner}</td>
                  <td className="p-3 text-right font-mono text-green-500">
                    {b.ppp_loan ? formatMoney(b.ppp_loan) : '-'}
                  </td>
                  <td className="p-3 text-right font-mono text-white">
                    {b.ppp_jobs || '-'}
                  </td>
                  <td className="p-3 text-right font-mono">
                    {b.dhs_total ? (
                      <span className="text-orange-400">{formatMoney(b.dhs_total)}</span>
                    ) : '-'}
                  </td>
                  <td className="p-3 text-center">
                    {b.dhs_license ? (
                      <span className="text-xs px-2 py-0.5 rounded bg-green-900/30 text-green-400">
                        Active
                      </span>
                    ) : b.dhs_license_status === null ? (
                      <span className="text-gray-600">N/A</span>
                    ) : (
                      <span className="text-gray-600">Unknown</span>
                    )}
                  </td>
                  <td className="p-3 text-center font-mono">
                    {b.dhs_violations !== null ? (
                      b.dhs_violations > 0 ? (
                        <span className="text-red-400">{b.dhs_violations}</span>
                      ) : (
                        <span className="text-gray-500">0</span>
                      )
                    ) : '-'}
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-900/30">
                <td className="p-3 text-gray-400 font-medium" colSpan={3}>Totals</td>
                <td className="p-3 text-right font-mono text-green-500">{formatMoney(totalPPP)}</td>
                <td className="p-3 text-right font-mono text-white">{totalJobs}</td>
                <td className="p-3 text-right font-mono text-orange-400">{formatMoney(totalDHS)}</td>
                <td className="p-3"></td>
                <td className="p-3 text-center font-mono text-yellow-400">{totalViolations}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Business Profiles */}
      <div className="mb-8">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Detailed Business Profiles</h3>
        <div className="space-y-6">
          {BUSINESSES.map((b, idx) => (
            <div key={idx} className="border border-gray-800 p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="text-white font-medium">{b.name}</h4>
                  {b.dba && <p className="text-xs text-gray-500">{b.dba}</p>}
                </div>
                <span className="text-xs text-gray-500">Suite {b.suite}</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs mb-4">
                <div>
                  <p className="text-gray-500">Owner</p>
                  <p className="text-white">{b.owner}</p>
                </div>
                <div>
                  <p className="text-gray-500">Business Type</p>
                  <p className="text-white">{b.business_type}</p>
                </div>
                <div>
                  <p className="text-gray-500">Started</p>
                  <p className="text-white">{b.started}</p>
                </div>
                <div>
                  <p className="text-gray-500">Services</p>
                  <p className="text-white">{b.services[0]}</p>
                </div>
              </div>

              {/* PPP Info */}
              {b.ppp_loan && (
                <div className="bg-gray-900/30 p-3 rounded mb-3">
                  <p className="text-xs text-gray-500 mb-2">PPP Loan Details</p>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500">Amount: </span>
                      <span className="text-green-500 font-mono">{formatMoney(b.ppp_loan)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Jobs: </span>
                      <span className="text-white font-mono">{b.ppp_jobs}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Bank: </span>
                      <span className="text-white">{b.ppp_bank}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Date: </span>
                      <span className="text-white">{b.ppp_date}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Status: </span>
                      <span className="text-green-400">{b.ppp_status}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* DHS Payments */}
              {b.dhs_payments.length > 0 && (
                <div className="bg-orange-900/10 border border-orange-900/30 p-3 rounded mb-3">
                  <p className="text-xs text-orange-400 mb-2">DHS Payments (OpenTheBooks Data)</p>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-xs">
                    {b.dhs_payments.map((p, i) => (
                      <div key={i}>
                        <span className="text-gray-500">{p.year}: </span>
                        <span className="text-orange-400 font-mono">{formatMoney(p.amount)}</span>
                      </div>
                    ))}
                    <div className="font-medium">
                      <span className="text-gray-400">Total: </span>
                      <span className="text-orange-400 font-mono">{formatMoney(b.dhs_total)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* DHS License */}
              {b.dhs_license && (
                <div className="bg-gray-900/30 p-3 rounded mb-3">
                  <p className="text-xs text-gray-500 mb-2">DHS License</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500">License #: </span>
                      <span className="text-white font-mono">{b.dhs_license}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Status: </span>
                      <span className="text-green-400">{b.dhs_license_status}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Renewed: </span>
                      <span className="text-white">{b.dhs_license_renewed}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Violations: </span>
                      <span className={b.dhs_violations && b.dhs_violations > 0 ? 'text-red-400' : 'text-gray-400'}>
                        {b.dhs_violations}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Notable Data Points */}
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-1">Notable Data Points</p>
                <ul className="text-xs text-gray-400 space-y-1">
                  {b.flags.map((f, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-gray-600">•</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Sources */}
              <div className="flex flex-wrap gap-2">
                {b.sources.map((s, i) => (
                  <a
                    key={i}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-green-500 hover:underline"
                  >
                    {s.name}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison to Charged Fraud Cases */}
      <div className="border border-red-800 p-4 mb-8">
        <h3 className="text-red-400 font-medium mb-3">Comparison: Charged Fraud Cases vs. This Address</h3>
        <p className="text-xs text-gray-500 mb-4">
          How does 2104 Park Ave compare to providers who have been charged with fraud?
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left p-3 font-medium text-gray-400">Entity</th>
                <th className="text-right p-3 font-medium text-gray-400">Payments</th>
                <th className="text-right p-3 font-medium text-gray-400">Employees</th>
                <th className="text-center p-3 font-medium text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              <tr className="hover:bg-gray-900/50">
                <td className="p-3 text-white">Feeding Our Future (FOF)</td>
                <td className="p-3 text-right font-mono text-red-400">$250M</td>
                <td className="p-3 text-right font-mono text-gray-400">-</td>
                <td className="p-3 text-center">
                  <span className="text-xs px-2 py-0.5 rounded bg-red-900/30 text-red-400">70 charged</span>
                </td>
              </tr>
              <tr className="hover:bg-gray-900/50">
                <td className="p-3 text-white">HSS Fraud Wave (total)</td>
                <td className="p-3 text-right font-mono text-red-400">$302M</td>
                <td className="p-3 text-right font-mono text-gray-400">-</td>
                <td className="p-3 text-center">
                  <span className="text-xs px-2 py-0.5 rounded bg-red-900/30 text-red-400">Program terminated</span>
                </td>
              </tr>
              <tr className="hover:bg-gray-900/50">
                <td className="p-3 text-white">EIDBI Fraud (identified)</td>
                <td className="p-3 text-right font-mono text-red-400">$220M</td>
                <td className="p-3 text-right font-mono text-gray-400">-</td>
                <td className="p-3 text-center">
                  <span className="text-xs px-2 py-0.5 rounded bg-orange-900/30 text-orange-400">85 investigations</span>
                </td>
              </tr>
              <tr className="hover:bg-gray-900/50">
                <td className="p-3 text-white">Abdifatah Yusuf (individual)</td>
                <td className="p-3 text-right font-mono text-red-400">$7.2M</td>
                <td className="p-3 text-right font-mono text-gray-400">-</td>
                <td className="p-3 text-center">
                  <span className="text-xs px-2 py-0.5 rounded bg-red-900/30 text-red-400">Guilty</span>
                </td>
              </tr>
              <tr className="bg-orange-900/20">
                <td className="p-3 text-orange-400 font-medium">2104 Park Ave (5 businesses)</td>
                <td className="p-3 text-right font-mono text-orange-400">$44M+</td>
                <td className="p-3 text-right font-mono text-orange-400">685</td>
                <td className="p-3 text-center">
                  <span className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-400">Not investigated</span>
                </td>
              </tr>
              <tr className="bg-orange-900/10">
                <td className="p-3 text-orange-300">↳ Alpha Home Care alone</td>
                <td className="p-3 text-right font-mono text-orange-300">$42M</td>
                <td className="p-3 text-right font-mono text-orange-300">141</td>
                <td className="p-3 text-center">
                  <span className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-400">Not investigated</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Note: Abdifatah Yusuf was convicted for $7.2M fraud. Alpha Home Care Provider received <span className="text-white">5.8x more</span> in DHS payments with no investigation.
        </p>
      </div>

      {/* Open Questions */}
      <div className="border border-orange-800 p-4 mb-8">
        <h3 className="text-orange-400 font-medium mb-3">Open Questions for Investigation</h3>
        <p className="text-xs text-gray-500 mb-3">The following questions cannot be answered with public data alone:</p>
        <ul className="text-sm text-gray-400 space-y-2">
          <li className="flex gap-2">
            <span className="text-orange-600">?</span>
            <span><strong className="text-white">Do 141 employees actually exist?</strong> Payroll records, W-2 filings, and unemployment insurance records would verify.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-orange-600">?</span>
            <span><strong className="text-white">Do the billed clients receive actual services?</strong> Timesheets, care plans, and client interviews would verify.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-orange-600">?</span>
            <span><strong className="text-white">Are these 5 businesses actually independent?</strong> Common ownership, shared employees, or related-party transactions?</span>
          </li>
          <li className="flex gap-2">
            <span className="text-orange-600">?</span>
            <span><strong className="text-white">What triggered First Choice Home Care&apos;s 2 DHS violations?</strong> Correction order details are not public.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-orange-600">?</span>
            <span><strong className="text-white">Why has Aspen Housing Services (HSS provider) not been investigated?</strong> HSS program was terminated statewide for fraud.</span>
          </li>
        </ul>
      </div>

      {/* Data Sources */}
      <div className="border border-gray-800 p-4 mb-8">
        <h3 className="text-white font-medium mb-3">Data Sources</h3>
        <ul className="text-sm text-gray-400 space-y-2">
          <li>
            <strong className="text-white">PPP Loans:</strong>{' '}
            <a href="https://www.sba.gov/funding-programs/loans/covid-19-relief-options/paycheck-protection-program" target="_blank" rel="noopener noreferrer" className="text-green-500 hover:underline">
              SBA PPP Loan Data (public_150k_plus_240930.csv)
            </a>
          </li>
          <li>
            <strong className="text-white">DHS Payments:</strong>{' '}
            <a href="https://www.openthebooks.com/minnesota-state-checkbook/?emp=Human%20Services" target="_blank" rel="noopener noreferrer" className="text-green-500 hover:underline">
              OpenTheBooks.com MN State Checkbook
            </a>
            {' '}- scraped January 5, 2026
          </li>
          <li>
            <strong className="text-white">DHS Licenses:</strong>{' '}
            <a href="https://licensinglookup.dhs.state.mn.us/" target="_blank" rel="noopener noreferrer" className="text-green-500 hover:underline">
              MN DHS License Lookup
            </a>
          </li>
          <li>
            <strong className="text-white">BBB Profiles:</strong>{' '}
            <a href="https://www.bbb.org/us/mn/minneapolis" target="_blank" rel="noopener noreferrer" className="text-green-500 hover:underline">
              Better Business Bureau
            </a>
          </li>
          <li>
            <strong className="text-white">Property Records:</strong>{' '}
            <a href="https://www.hennepin.us/residents/property/property-information-search" target="_blank" rel="noopener noreferrer" className="text-green-500 hover:underline">
              Hennepin County Property Search
            </a>
            {' '}- Parcel {PROPERTY.parcelId}
          </li>
        </ul>
      </div>

      {/* Related Links */}
      <div className="border-t border-gray-800 pt-6">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Related</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <Link href="/investigation/mn-medicaid-fraud" className="text-gray-400 hover:text-green-400">
            MN Medicaid Fraud Wave
          </Link>
          <span className="text-gray-700">|</span>
          <Link href="/investigation/address-clusters" className="text-gray-400 hover:text-green-400">
            Address Cluster Detection
          </Link>
          <span className="text-gray-700">|</span>
          <Link href="/investigation" className="text-gray-400 hover:text-green-400">
            All Investigations
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
