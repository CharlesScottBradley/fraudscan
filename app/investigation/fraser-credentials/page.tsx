import Link from 'next/link';

function formatMoney(amount: number | null): string {
  if (!amount) return '-';
  if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(2)}B`;
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

// Fraser employees with unverifiable CMDE credentials
// Source: MN DHS MHCP Provider Directory vs MN Board of Behavioral Health & Therapy
// Verification Date: January 3, 2026
const FRASER_MISMATCHES = [
  {
    name: 'David Hoch',
    claimed_credentials: ['CMDE Professional', 'Supervising Professional', 'Supervisor'],
    board_result: 'NO MATCHES FOUND',
    role_level: 'Supervisor',
    evidence: ['MN DHS Provider Directory listing', 'MN BBHT license search screenshot']
  },
  {
    name: 'Okonu Tandra Mari',
    claimed_credentials: ['CMDE Professional', 'Supervising Professional', 'Supervisor'],
    board_result: 'NO MATCHES FOUND',
    role_level: 'Supervisor',
    evidence: ['MN DHS Provider Directory listing', 'MN BBHT license search screenshot']
  },
  {
    name: 'Valerie Anne Lardinois',
    claimed_credentials: ['CMDE Professional', 'Supervising Professional', 'Supervisor'],
    board_result: 'NO MATCHES FOUND',
    role_level: 'Supervisor',
    evidence: ['MN DHS Provider Directory listing', 'MN BBHT license search screenshot']
  },
  {
    name: 'Jessica Hase',
    claimed_credentials: ['CMDE Professional'],
    board_result: 'NO MATCHES FOUND',
    role_level: 'Staff',
    evidence: ['MN DHS Provider Directory listing', 'MN BBHT license search screenshot']
  },
  {
    name: 'Michelle Lee Mangerplant',
    claimed_credentials: ['CMDE Professional'],
    board_result: 'NO MATCHES FOUND',
    role_level: 'Staff',
    evidence: ['MN DHS Provider Directory listing', 'MN BBHT license search screenshot']
  },
  {
    name: 'Elizabeth Ashley Mann',
    claimed_credentials: ['CMDE Professional'],
    board_result: 'NO MATCHES FOUND',
    role_level: 'Staff',
    evidence: ['MN DHS Provider Directory listing', 'MN BBHT license search screenshot']
  }
];

// Related MN autism fraud context
const MN_EIDBI_CONTEXT = {
  program_name: 'Early Intensive Developmental and Behavioral Intervention (EIDBI)',
  total_medicaid_disbursed: 700000000, // ~$700M
  recent_indictments: [
    { entity: 'Star Autism Center LLC', date: 'Dec 2025', status: 'Charged' },
    { entity: 'Pristine Health LLC', date: 'Dec 2025', status: 'Charged' },
    { entity: 'SafeLodgings Inc.', date: 'Dec 2025', status: 'Owner Fugitive' }
  ],
  cross_scheme_defendant: {
    name: 'Asha Farhan Hassan',
    schemes: ['Feeding Our Future ($250M)', 'Star Autism Center LLC'],
    plea_date: 'December 18, 2025'
  }
};

export const revalidate = 3600; // Revalidate hourly

export default function FraserCredentialsPage() {
  const supervisorCount = FRASER_MISMATCHES.filter(m => m.role_level === 'Supervisor').length;
  const staffCount = FRASER_MISMATCHES.filter(m => m.role_level === 'Staff').length;

  return (
    <div>
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-6">
        <Link href="/investigation" className="hover:text-gray-300">Investigations</Link>
        <span className="mx-2">/</span>
        <span className="text-white">Fraser Credential Verification</span>
      </div>

      {/* Terminal-style stats */}
      <div className="font-mono text-sm mb-10">
        <p className="text-gray-500">FRASER_CREDENTIAL_INVESTIGATION</p>
        <div className="mt-2 text-gray-400">
          <p><span className="text-gray-600">├─</span> provider <span className="text-white ml-4">Fraser (MN&apos;s largest autism provider)</span></p>
          <p><span className="text-gray-600">├─</span> credentials_unverified <span className="text-red-500 ml-4">{FRASER_MISMATCHES.length}</span></p>
          <p><span className="text-gray-600">├─</span> supervisors_affected <span className="text-white ml-4">{supervisorCount}</span></p>
          <p><span className="text-gray-600">├─</span> staff_affected <span className="text-white ml-4">{staffCount}</span></p>
          <p><span className="text-gray-600">├─</span> program_at_risk <span className="text-white ml-4">EIDBI (Medicaid)</span></p>
          <p><span className="text-gray-600">└─</span> program_disbursements <span className="text-green-500 ml-4">{formatMoney(MN_EIDBI_CONTEXT.total_medicaid_disbursed)}</span></p>
        </div>
      </div>

      {/* Alert Banner */}
      <div className="bg-red-900/20 border border-red-800 p-4 mb-8">
        <div className="flex items-start gap-3">
          <span className="text-red-500 text-xl">!</span>
          <div>
            <h2 className="text-red-400 font-medium mb-1">Credential Verification Failure</h2>
            <p className="text-sm text-gray-400">
              Six Fraser employees are listed in the MN DHS Medicaid Provider Directory with &quot;Qualified CMDE Professional&quot;
              credentials, but searches of the Minnesota Board of Behavioral Health and Therapy return
              <span className="text-red-400 font-mono"> &quot;NO MATCHES FOUND&quot;</span> for all six individuals.
            </p>
          </div>
        </div>
      </div>

      {/* What is this */}
      <div className="border border-gray-800 p-4 mb-8">
        <h2 className="text-white font-medium mb-2">What is this investigation</h2>
        <p className="text-sm text-gray-400 leading-relaxed mb-3">
          CMDE (Certified Mental Health and Developmental Disabilities Examiner) credentials are required for
          billing Medicaid under Minnesota&apos;s EIDBI autism services program. Providers claiming these credentials
          should appear in the Minnesota Board of Behavioral Health and Therapy&apos;s public license lookup.
        </p>
        <p className="text-sm text-gray-400 leading-relaxed">
          This investigation cross-referenced Fraser employees listed in the state&apos;s Medicaid provider directory
          against the licensing board&apos;s database. The discrepancy suggests either credential fraud, data entry
          errors, or a systemic verification failure.
        </p>
      </div>

      {/* Evidence Table */}
      <div className="mb-8">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Individuals with Unverifiable Credentials</h3>
        <div className="border border-gray-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left p-3 font-medium text-gray-400">Name</th>
                <th className="text-left p-3 font-medium text-gray-400">Claimed Credentials</th>
                <th className="text-left p-3 font-medium text-gray-400">Role Level</th>
                <th className="text-left p-3 font-medium text-gray-400">MN BBHT Search Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {FRASER_MISMATCHES.map((person, idx) => (
                <tr key={idx} className="hover:bg-gray-900/50">
                  <td className="p-3 text-white font-medium">{person.name}</td>
                  <td className="p-3 text-gray-400">
                    <div className="flex flex-wrap gap-1">
                      {person.claimed_credentials.map((cred, i) => (
                        <span key={i} className="bg-gray-800 px-2 py-0.5 text-xs rounded">
                          {cred}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-3 text-gray-400">{person.role_level}</td>
                  <td className="p-3">
                    <span className="text-red-500 font-mono text-xs bg-red-900/20 px-2 py-1 rounded">
                      {person.board_result}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* About Fraser */}
      <div className="border border-gray-800 p-4 mb-8">
        <h3 className="text-white font-medium mb-3">About Fraser</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-400">
          <div>
            <p className="text-gray-500 mb-1">Founded</p>
            <p>1935 (90+ years of operation)</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Status</p>
            <p>Minnesota&apos;s largest autism services provider</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Individuals Served</p>
            <p>35,000+ annually</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Primary Funding</p>
            <p>Medicaid EIDBI Program</p>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-4 leading-relaxed">
          Fraser is not a fly-by-night operation. As a trusted institution with decades of history,
          the appearance of credential discrepancies at Fraser is particularly concerning and suggests
          the issue may be systemic rather than isolated.
        </p>
      </div>

      {/* Why it matters */}
      <div className="border border-gray-800 p-4 mb-8">
        <h3 className="text-white font-medium mb-3">Why this matters</h3>
        <div className="space-y-3 text-sm text-gray-400">
          <div className="flex items-start gap-2">
            <span className="text-red-500">1.</span>
            <p><strong className="text-white">Fraudulent Billing Risk:</strong> If staff lack required credentials,
            every Medicaid claim submitted under their name may constitute fraud.</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-red-500">2.</span>
            <p><strong className="text-white">Patient Safety:</strong> CMDE credentials exist to ensure
            qualified individuals are assessing and treating vulnerable children with autism.</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-red-500">3.</span>
            <p><strong className="text-white">Systemic Failure:</strong> If Minnesota&apos;s largest provider
            has unverified credentials, how many smaller providers have the same issue?</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-red-500">4.</span>
            <p><strong className="text-white">Program Integrity:</strong> The EIDBI program has disbursed
            ~$700M. Credential verification is a basic safeguard that appears to be failing.</p>
          </div>
        </div>
      </div>

      {/* MN Autism Fraud Context */}
      <div className="border border-gray-800 p-4 mb-8">
        <h3 className="text-white font-medium mb-3">Related: MN Autism Fraud Wave (Dec 2025)</h3>
        <p className="text-sm text-gray-400 mb-4">
          This investigation comes amid federal prosecutions of other MN autism providers:
        </p>
        <div className="border border-gray-700 overflow-x-auto mb-4">
          <table className="w-full text-sm">
            <thead className="bg-gray-800">
              <tr>
                <th className="text-left p-2 font-medium text-gray-400">Entity</th>
                <th className="text-left p-2 font-medium text-gray-400">Date</th>
                <th className="text-left p-2 font-medium text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {MN_EIDBI_CONTEXT.recent_indictments.map((ind, idx) => (
                <tr key={idx}>
                  <td className="p-2 text-white">{ind.entity}</td>
                  <td className="p-2 text-gray-400">{ind.date}</td>
                  <td className="p-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      ind.status === 'Owner Fugitive'
                        ? 'bg-red-900/30 text-red-400'
                        : 'bg-yellow-900/30 text-yellow-400'
                    }`}>
                      {ind.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-gray-900/50 p-3 rounded">
          <p className="text-sm text-gray-400">
            <span className="text-yellow-500 font-medium">Cross-Scheme Alert:</span>{' '}
            {MN_EIDBI_CONTEXT.cross_scheme_defendant.name} pled guilty on{' '}
            {MN_EIDBI_CONTEXT.cross_scheme_defendant.plea_date} to participating in BOTH{' '}
            {MN_EIDBI_CONTEXT.cross_scheme_defendant.schemes.join(' AND ')} — the first documented
            case of an individual in multiple major MN fraud schemes.
          </p>
        </div>
      </div>

      {/* Methodology */}
      <div className="border border-gray-800 p-4 mb-8">
        <h3 className="text-white font-medium mb-3">Methodology</h3>
        <div className="space-y-2 text-sm text-gray-400">
          <p><strong className="text-gray-300">Data Sources:</strong></p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li>Minnesota DHS MHCP Provider Directory (public database)</li>
            <li>Minnesota Board of Behavioral Health and Therapy License Lookup (public database)</li>
          </ul>
          <p className="mt-3"><strong className="text-gray-300">Process:</strong></p>
          <ol className="list-decimal list-inside ml-2 space-y-1">
            <li>Retrieved Fraser employees listed as &quot;Qualified CMDE Professional&quot; from MN DHS directory</li>
            <li>Searched each name in MN BBHT public license lookup</li>
            <li>Documented search results with screenshots (January 3, 2026)</li>
            <li>Cross-referenced against known credential types and aliases</li>
          </ol>
          <p className="mt-3"><strong className="text-gray-300">Limitations:</strong></p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li>Individuals may be licensed under different names (maiden names, legal name changes)</li>
            <li>Board database may have lag time for new credentials</li>
            <li>Some credential pathways may not appear in standard BBHT search</li>
          </ul>
        </div>
      </div>

      {/* Questions for Officials */}
      <div className="border border-gray-800 p-4 mb-8">
        <h3 className="text-white font-medium mb-3">Outstanding Questions</h3>
        <div className="space-y-3 text-sm text-gray-400">
          <div>
            <p className="text-gray-300 font-medium">For Minnesota DHS:</p>
            <p>How does DHS verify CMDE credentials before listing providers in the MHCP directory?</p>
          </div>
          <div>
            <p className="text-gray-300 font-medium">For MN Board of Behavioral Health and Therapy:</p>
            <p>Are these individuals licensed under different names or credential types not appearing in public searches?</p>
          </div>
          <div>
            <p className="text-gray-300 font-medium">For Fraser:</p>
            <p>What documentation does Fraser have for these employees&apos; CMDE credentials?</p>
          </div>
          <div>
            <p className="text-gray-300 font-medium">For HHS-OIG:</p>
            <p>Should credential verification failures trigger a broader audit of EIDBI claims?</p>
          </div>
        </div>
      </div>

      {/* Evidence Archive */}
      <div className="border border-gray-800 p-4 mb-8">
        <h3 className="text-white font-medium mb-3">Evidence Archive</h3>
        <p className="text-sm text-gray-400 mb-3">
          All evidence has been preserved and is available for verification:
        </p>
        <ul className="text-sm text-gray-500 space-y-1">
          <li>- MN DHS Provider Directory screenshots (6 individuals)</li>
          <li>- MN BBHT license search screenshots (6 searches)</li>
          <li>- Structured spreadsheet with methodology</li>
          <li>- All searches dated January 3, 2026</li>
        </ul>
        <p className="text-sm text-gray-500 mt-3">
          Evidence submitted to HHS-OIG fraud tip line. Contact{' '}
          <Link href="/tip" className="text-green-500 hover:underline">tips@somaliscan.org</Link>{' '}
          for media inquiries.
        </p>
      </div>

      {/* Status */}
      <div className="bg-yellow-900/20 border border-yellow-800 p-4 mb-8">
        <h3 className="text-yellow-400 font-medium mb-2">Investigation Status: Active</h3>
        <ul className="text-sm text-gray-400 space-y-1">
          <li>- Evidence submitted to HHS-OIG</li>
          <li>- Public records request filed for billing data</li>
          <li>- Awaiting response from Fraser</li>
          <li>- Awaiting response from MN BBHT</li>
        </ul>
        <p className="text-sm text-gray-500 mt-3">Last updated: January 4, 2026</p>
      </div>

      {/* Related Links */}
      <div className="border-t border-gray-800 pt-6">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Related</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <Link href="/investigation" className="text-gray-400 hover:text-green-400">
            All Investigations
          </Link>
          <span className="text-gray-700">|</span>
          <Link href="/cases" className="text-gray-400 hover:text-green-400">
            Fraud Cases
          </Link>
          <span className="text-gray-700">|</span>
          <a
            href="https://www.justice.gov/usao-mn/pr/six-additional-defendants-charged-one-defendant-pleads-guilty-ongoing-fraud-schemes"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-green-400"
          >
            DOJ: MN Autism Fraud Charges (Dec 2025)
          </a>
          <span className="text-gray-700">|</span>
          <Link href="/tip" className="text-gray-400 hover:text-green-400">
            Submit a Tip
          </Link>
        </div>
      </div>
    </div>
  );
}
