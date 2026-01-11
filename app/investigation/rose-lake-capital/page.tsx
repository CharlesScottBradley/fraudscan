import Link from 'next/link';
import { Metadata } from 'next';
import ToshiAdBanner from '../../components/ToshiAdBanner';

export const metadata: Metadata = {
  title: 'Rose Lake Capital / E Street Group Investigation | SomaliScan',
  description: 'Investigation into Rose Lake Capital LLC and E Street Group LLC - political finance network connecting Rep. Ilhan Omar\'s campaign to investment firm through shared principals.',
};

function formatMoney(amount: number | null): string {
  if (!amount) return '-';
  if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(1)}B`;
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(2)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

// E Street Group Disbursements from FEC Data
const FEC_DISBURSEMENTS = [
  { committee_id: 'C00680934', committee_name: 'Ilhan for Congress', payments: 146, total: 2918470.74 },
  { committee_id: 'C00605592', committee_name: 'Pramila for Congress', payments: 24, total: 193782.00 },
  { committee_id: 'C00307314', committee_name: 'EB4C PAC', payments: 27, total: 137526.00 },
  { committee_id: 'C00712968', committee_name: 'Royce West for Senate', payments: 17, total: 76774.49 },
  { committee_id: 'C00719708', committee_name: 'MATH PAC (Andrew Yang)', payments: 7, total: 64264.38 },
  { committee_id: 'C00717876', committee_name: 'Amanda Adkins for Congress', payments: 15, total: 49500.00 },
  { committee_id: 'C00010603', committee_name: 'DNC Services Corp', payments: 4, total: 40000.00 },
];

// Key Individuals
const KEY_INDIVIDUALS = [
  {
    name: 'Timothy M. Mynett',
    role: 'E Street Group Partner, Registered Agent',
    connection: 'Husband of Rep. Ilhan Omar (married March 2020)',
    address: '4616 15th Street NW, Washington, DC 20011 (now ex-wife\'s)',
    notes: 'Divorced Beth Jordan December 2019; affair alleged August 2019'
  },
  {
    name: 'William R. Hailer',
    role: 'Partner at BOTH E Street Group AND Rose Lake Capital',
    connection: 'The bridge between political consulting and investment',
    address: '4508 34th St S, Arlington, VA (sold 2021)',
    notes: 'Key link between the two entities'
  },
  {
    name: 'William Derrough',
    role: 'Rose Lake Capital Principal',
    connection: 'DNC Treasurer 2017-2021, Moelis & Company MD',
    address: '399 Park Ave, New York, NY',
    notes: '$397,976 in FEC contributions'
  },
  {
    name: 'Adam Ereli',
    role: 'Rose Lake Capital Principal',
    connection: 'Former US Ambassador to Bahrain (Obama admin)',
    address: 'Washington, DC area',
    notes: '$13,200 in FEC contributions'
  },
];

// Delaware Entities
const DELAWARE_ENTITIES = [
  { name: 'Rose Lake Holdings LLC', file_num: '6890594', formed: '2022-06-30', agent: 'VCORP SERVICES, LLC', status: 'Good Standing' },
  { name: 'Rose Lake Capital LLC', file_num: '6954979', formed: '2022-08-05', agent: 'VCORP SERVICES, LLC', status: 'Good Standing' },
  { name: 'Rose Lake Inc.', file_num: '7246289', formed: '2023-01-19', agent: 'UNASSIGNED AGENT', status: 'Unknown' },
];

// Investment Fund Entities (Hailer/Mynett)
const INVESTMENT_ENTITIES = [
  { name: 'eStCru LLC', state: 'CA', file_num: '202018810577', formed: '2020-07-02', status: 'Active', type: 'Winery', bank_balance: '$650 (2023)' },
  { name: 'eSt Ventures LLC', state: 'NE', file_num: 'Unknown', formed: '2020', status: 'INACTIVE', type: 'Venture Capital', bank_balance: '$0.05 (Feb 2024)' },
  { name: 'Badlands Fund GP LLC', state: 'Unknown', file_num: 'Unknown', formed: '2020', status: 'Unknown', type: 'Investment Fund', bank_balance: 'Unknown' },
  { name: 'Badlands Ventures LLC', state: 'Unknown', file_num: 'Unknown', formed: '2020', status: 'Unknown', type: 'Investment Fund', bank_balance: 'Unknown' },
  { name: 'Born to Run GP LLC', state: 'Unknown', file_num: 'Unknown', formed: 'Unknown', status: 'Unknown', type: 'Investment Fund ($50M purported)', bank_balance: 'Unknown' },
];

// Lawsuits and Settlements
const LAWSUITS = [
  {
    name: 'Naeem Mohd v. eStCru',
    court: 'California',
    filed: 'Fall 2023',
    plaintiff: 'Naeem Mohd (DC restaurant owner - La Vie, Provision No. 14)',
    defendants: 'Will Hailer (Tim Mynett mentioned but not named)',
    allegation: 'Fraud - invested $300K with promise of 200% return in 18 months',
    amount_sought: 780000,
    outcome: 'Settled November 2024 (amount undisclosed)',
    status: 'Settled'
  },
  {
    name: 'Dakota Natural Growers v. Hailer',
    court: 'Hennepin County, MN',
    filed: 'December 2022',
    plaintiff: 'Dakota Natural Growers, 605 Cannabis + 24 investors',
    defendants: 'Will Hailer, eSt Ventures LLC, Badlands Fund GP LLC, Badlands Ventures LLC',
    allegation: 'Fraud - raised $3.54M, promised $7.5M additional investment',
    amount_sought: 1700000,
    outcome: 'Settled $1.2M (August 2024) - Hailer signed confession of judgment',
    status: 'Settled'
  },
];

// Scrubbed Names from Rose Lake Capital Website (Sept-Oct 2024)
const SCRUBBED_NAMES = [
  { name: 'Adam Ereli', role: 'Former US Ambassador to Bahrain (Obama admin)', status: 'REMOVED' },
  { name: 'Max Baucus', role: 'Former US Senator, Ambassador to China (Obama admin)', status: 'REMOVED' },
  { name: 'William Derrough', role: 'Former DNC Treasurer (2017-2021), Moelis & Co MD', status: 'REMOVED' },
  { name: 'Keith Mestrich', role: 'Former CEO, Amalgamated Bank', status: 'REMOVED' },
  { name: 'Alex Hoffman', role: 'DNC Finance Chair associate', status: 'REMOVED' },
  { name: 'Sheila Healy', role: 'Unknown role', status: 'REMOVED' },
  { name: 'Justin Pratt', role: 'Unknown role', status: 'REMOVED' },
];

// Financial Disclosure vs Reality (Court Documents)
const DISCLOSURE_DISCREPANCIES = [
  {
    entity: 'Rose Lake Capital LLC',
    disclosure_2023: '$1 - $1,000',
    court_docs_2024: '$42.44',
    disclosure_2024: '$5M - $25M',
    change: '5,000x to 25,000,000x'
  },
  {
    entity: 'eStCru LLC (Winery)',
    disclosure_2023: '$15,001 - $50,000',
    court_docs_2024: '$650',
    disclosure_2024: '$1M - $5M',
    change: '~100x'
  },
  {
    entity: 'eSt Ventures LLC',
    disclosure_2023: 'Not listed',
    court_docs_2024: '$0.05',
    disclosure_2024: 'Not listed',
    change: 'N/A'
  },
  {
    entity: 'Rose Lake Inc.',
    disclosure_2023: 'Not listed',
    court_docs_2024: '$10',
    disclosure_2024: 'Not listed',
    change: 'N/A'
  },
];

// Timeline
const TIMELINE = [
  { date: 'July 2018', event: 'E Street Group LLC formed in Washington, DC', type: 'formation' },
  { date: '2018-2019', event: 'E Street Group begins receiving payments from Omar campaign', type: 'financial' },
  { date: 'August 2019', event: 'Beth Mynett files for divorce, alleging Tim\'s affair with Ilhan Omar', type: 'personal' },
  { date: 'December 2019', event: 'Mynett divorce finalized', type: 'personal' },
  { date: 'March 2020', event: 'Tim Mynett marries Ilhan Omar', type: 'personal' },
  { date: 'July 2020', event: 'eStCru LLC (winery) and eSt Ventures LLC formed', type: 'formation' },
  { date: 'July 2020', event: 'Property at 4616 15th St NW transferred to Beth Jordan (ex-wife)', type: 'property' },
  { date: 'Fall 2021', event: 'Naeem Mohd invests $300K in eStCru with 200% return promise', type: 'financial' },
  { date: 'Early 2022', event: 'Mynett claims he "withdrew" from eSt Ventures', type: 'personal' },
  { date: 'June 2022', event: 'Rose Lake Holdings LLC formed in Delaware', type: 'formation' },
  { date: 'August 2022', event: 'Rose Lake Capital LLC formed in Delaware', type: 'formation' },
  { date: 'December 2022', event: 'South Dakota cannabis companies sue Hailer for $1.7M fraud', type: 'lawsuit' },
  { date: 'Early 2023', event: 'eStCru winemaker Erica Stancliff stops getting paid', type: 'financial' },
  { date: 'January 2023', event: 'Rose Lake Inc. formed in Delaware', type: 'formation' },
  { date: 'Fall 2023', event: 'Naeem Mohd sues eStCru in California for $780K', type: 'lawsuit' },
  { date: 'Feb 2024', event: 'Court docs show Rose Lake Capital has $42.44, eStCru has $650 in bank', type: 'financial' },
  { date: 'August 2024', event: 'Hailer settles SD cannabis lawsuit for $1.2M (confession of judgment)', type: 'lawsuit' },
  { date: 'Sept-Oct 2024', event: '9 names scrubbed from Rose Lake Capital website (incl. Derrough, Ereli, Baucus)', type: 'scrubbing' },
  { date: 'Oct 2024', event: '8 more individuals arrested in MN $9B welfare fraud case', type: 'fraud' },
  { date: 'November 2024', event: 'Mohd v. eStCru settled (amount undisclosed)', type: 'lawsuit' },
  { date: 'May 2025', event: 'Omar files disclosure showing $6-30M household net worth', type: 'disclosure' },
];

export const revalidate = 3600;

export default function RoseLakeCapitalPage() {
  const totalDisbursements = FEC_DISBURSEMENTS.reduce((sum, d) => sum + d.total, 0);
  const totalPayments = FEC_DISBURSEMENTS.reduce((sum, d) => sum + d.payments, 0);
  const omarPercentage = ((FEC_DISBURSEMENTS[0].total / totalDisbursements) * 100).toFixed(1);

  return (
    <div>
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-6">
        <Link href="/investigation" className="hover:text-gray-300">Investigations</Link>
        <span className="mx-2">/</span>
        <span className="text-white">Rose Lake Capital / E Street Group</span>
      </div>

      {/* Terminal-style stats */}
      <div className="font-mono text-sm mb-10">
        <p className="text-gray-500">POLITICAL_FINANCE_NETWORK_ANALYSIS</p>
        <div className="mt-2 text-gray-400">
          <p><span className="text-gray-600">├─</span> e_street_group_fec_payments <span className="text-green-500 ml-4">{formatMoney(totalDisbursements)}</span></p>
          <p><span className="text-gray-600">├─</span> omar_campaign_share <span className="text-yellow-400 ml-4">{omarPercentage}%</span></p>
          <p><span className="text-gray-600">├─</span> disclosed_net_worth_2024 <span className="text-green-500 ml-4">$6M - $30M</span></p>
          <p><span className="text-gray-600">├─</span> actual_bank_balance_feb_2024 <span className="text-red-400 ml-4">$706.49 (court docs)</span></p>
          <p><span className="text-gray-600">├─</span> names_scrubbed_from_website <span className="text-orange-400 ml-4">9 (Sept-Oct 2024)</span></p>
          <p><span className="text-gray-600">├─</span> sec_registration <span className="text-red-400 ml-4">NOT FOUND ($60B AUM claimed)</span></p>
          <p><span className="text-gray-600">├─</span> lawsuits_settled <span className="text-red-400 ml-4">2 ($1.98M+ in claims)</span></p>
          <p><span className="text-gray-600">└─</span> ppp_loan <span className="text-green-500 ml-4">$134,800 (forgiven)</span></p>
        </div>
      </div>

      {/* Toshi Sponsor Banner */}
      <ToshiAdBanner className="mb-8" />

      {/* Investigation Type Banner */}
      <div className="bg-blue-900/20 border border-blue-800 p-4 mb-8">
        <div className="flex items-start gap-3">
          <span className="text-blue-400 text-xl">i</span>
          <div>
            <h2 className="text-blue-400 font-medium mb-1">Political Finance Investigation</h2>
            <p className="text-sm text-gray-400 mb-2">
              This investigation documents publicly-available corporate registrations, FEC filings, and property records.
              No illegal activity is alleged - the structure raises <span className="text-blue-400">governance and ethics questions</span> about
              campaign payments to a spouse&apos;s company and interconnected business structures.
            </p>
            <p className="text-xs text-gray-500">
              See our <Link href="/terms" className="text-blue-400 hover:underline">Terms of Use</Link> and{' '}
              <Link href="/corrections" className="text-blue-400 hover:underline">Corrections Policy</Link>.
            </p>
          </div>
        </div>
      </div>

      {/* What is this */}
      <div className="border border-gray-800 p-4 mb-8">
        <h2 className="text-white font-medium mb-2">Executive Summary</h2>
        <p className="text-sm text-gray-400 leading-relaxed mb-3">
          <strong className="text-white">E Street Group LLC</strong> is a DC-based political consulting firm that received
          <strong className="text-green-500"> $2.92 million</strong> from Rep. Ilhan Omar&apos;s campaign (Ilhan for Congress).
          The firm is owned by <strong className="text-white">Tim Mynett</strong>, who married Omar in March 2020.
        </p>
        <p className="text-sm text-gray-400 leading-relaxed mb-3">
          <strong className="text-white">Rose Lake Capital LLC</strong> is a Delaware-registered investment firm sharing the
          same WeWork office address. One of E Street Group&apos;s partners (<strong className="text-white">William Hailer</strong>)
          is also a principal at Rose Lake Capital, creating a direct link between the political consulting operation and the investment firm.
        </p>
        <p className="text-sm text-gray-400 leading-relaxed">
          Rose Lake Capital&apos;s other principals include the <strong className="text-white">former DNC Treasurer</strong> (William Derrough)
          and a <strong className="text-white">former US Ambassador</strong> (Adam Ereli), suggesting the firm leverages Democratic
          political networks for investment opportunities.
        </p>
      </div>

      {/* The Connection Diagram */}
      <div className="border border-gray-800 p-4 mb-8 font-mono text-xs">
        <h3 className="text-white font-medium mb-4 font-sans text-sm">Entity Connection Map</h3>
        <pre className="text-gray-400 overflow-x-auto">
{`
                    ┌─────────────────────────────┐
                    │   ILHAN FOR CONGRESS        │
                    │   (Campaign Committee)      │
                    │   $2.92M payments ──────────┼──┐
                    └─────────────────────────────┘  │
                                                     │
                                                     ▼
┌─────────────────────────────┐         ┌─────────────────────────────┐
│   E STREET GROUP LLC        │◄────────│        TIM MYNETT           │
│   DC File #L00006033509     │         │   (Omar's husband)          │
│   80 M St SE FL 1, DC       │         │   Registered Agent          │
│   Political Consulting      │         └─────────────────────────────┘
└──────────────┬──────────────┘
               │
               │ WILLIAM HAILER
               │ (Partner at BOTH)
               │
               ▼
┌─────────────────────────────┐         ┌─────────────────────────────┐
│   ROSE LAKE CAPITAL LLC     │◄────────│   ROSE LAKE HOLDINGS LLC    │
│   DE File #6954979          │         │   DE File #6890594          │
│   80 M St SE FL 1, DC       │         │   (Parent Entity)           │
│   Investment Firm           │         └─────────────────────────────┘
└──────────────┬──────────────┘
               │
    ┌──────────┴──────────┐
    │                     │
    ▼                     ▼
┌───────────────┐   ┌───────────────┐
│ Wm. Derrough  │   │  Adam Ereli   │
│ DNC Treasurer │   │ Fmr Ambassador│
│ 2017-2021     │   │ to Bahrain    │
└───────────────┘   └───────────────┘
`}
        </pre>
      </div>

      {/* E Street Group DC Registration */}
      <div className="mb-8">
        <h3 className="text-sm font-medium text-gray-400 mb-4">E Street Group LLC - DC Registration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="border border-gray-800 p-4">
            <p className="text-gray-500 text-xs mb-2">REGISTRATION DETAILS</p>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-500">File Number:</span> <span className="text-white font-mono">L00006033509</span></p>
              <p><span className="text-gray-500">Trade Name:</span> <span className="text-white">ESTREET.CO</span></p>
              <p><span className="text-gray-500">Formed:</span> <span className="text-white">July 11, 2018</span></p>
              <p><span className="text-gray-500">Status:</span> <span className="text-green-500">Active</span></p>
              <p><span className="text-gray-500">Entity Type:</span> <span className="text-white">DC LLC</span></p>
            </div>
          </div>
          <div className="border border-gray-800 p-4">
            <p className="text-gray-500 text-xs mb-2">SAM.GOV REGISTRATION</p>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-500">UEI:</span> <span className="text-white font-mono">HNRCX365LG34</span></p>
              <p><span className="text-gray-500">DUNS:</span> <span className="text-white font-mono">927199831</span></p>
              <p><span className="text-gray-500">CAGE Code:</span> <span className="text-white font-mono">8JBD9</span></p>
              <p><span className="text-gray-500">NAICS:</span> <span className="text-white">541810 (Advertising)</span></p>
              <p><span className="text-gray-500">SAM Status:</span> <span className="text-yellow-400">Expired (March 2021)</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* FEC Disbursements Table */}
      <div className="mb-8">
        <h3 className="text-sm font-medium text-gray-400 mb-1">FEC Operating Expenditures to E Street Group (2019-2024)</h3>
        <p className="text-xs text-gray-600 mb-4">Data as of January 7, 2026. Marriage occurred March 2020; pre-2020 payments were to non-spouse.</p>
        <div className="border border-gray-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left p-3 font-medium text-gray-400">Committee</th>
                <th className="text-left p-3 font-medium text-gray-400">Committee Name</th>
                <th className="text-right p-3 font-medium text-gray-400">Payments</th>
                <th className="text-right p-3 font-medium text-gray-400">Total Amount</th>
                <th className="text-right p-3 font-medium text-gray-400">% of Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {FEC_DISBURSEMENTS.map((d, idx) => (
                <tr key={idx} className={`hover:bg-gray-900/50 ${idx === 0 ? 'bg-yellow-900/10' : ''}`}>
                  <td className="p-3 font-mono text-gray-400 text-xs">{d.committee_id}</td>
                  <td className="p-3 text-white">
                    {d.committee_name}
                    {idx === 0 && <span className="ml-2 text-xs bg-yellow-600 text-black px-1.5 py-0.5 rounded">SPOUSE</span>}
                  </td>
                  <td className="p-3 text-right font-mono text-white">{d.payments}</td>
                  <td className="p-3 text-right font-mono text-green-500">{formatMoney(d.total)}</td>
                  <td className="p-3 text-right font-mono text-gray-400">{((d.total / totalDisbursements) * 100).toFixed(1)}%</td>
                </tr>
              ))}
              <tr className="bg-gray-900/30">
                <td className="p-3 text-gray-400 font-medium" colSpan={2}>Total</td>
                <td className="p-3 text-right font-mono text-white">{totalPayments}</td>
                <td className="p-3 text-right font-mono text-green-500">{formatMoney(totalDisbursements)}</td>
                <td className="p-3 text-right font-mono text-gray-400">100%</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Source: FEC Bulk Data (oppexp 2020-2024 cycles). Data imported to SomaliScan database.
        </p>
      </div>

      {/* Spouse Payment Alert */}
      <div className="bg-yellow-900/20 border border-yellow-800 p-4 mb-8">
        <h3 className="text-yellow-400 font-medium mb-2">Campaign Finance Structure</h3>
        <p className="text-sm text-gray-400 mb-3">
          <strong className="text-white">79.5% of E Street Group&apos;s FEC-reported revenue</strong> came from a single client:
          Rep. Ilhan Omar&apos;s campaign committee. Tim Mynett, who owns/operates E Street Group, married Omar in March 2020.
        </p>
        <div className="grid grid-cols-2 gap-4 text-center mt-4">
          <div className="bg-gray-900/50 p-3 rounded">
            <p className="text-2xl font-mono text-yellow-400">$2.92M</p>
            <p className="text-xs text-gray-500">From Omar Campaign</p>
          </div>
          <div className="bg-gray-900/50 p-3 rounded">
            <p className="text-2xl font-mono text-green-400">$134,800</p>
            <p className="text-xs text-gray-500">PPP Loan (Forgiven)</p>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-4">
          <strong>Note:</strong> Campaign payments to a spouse&apos;s company are legal if disclosed and at market rate.
          This structure raises governance questions, not allegations of illegality.
        </p>
      </div>

      {/* CRITICAL: Financial Disclosure vs Court Documents */}
      <div className="bg-red-900/20 border border-red-800 p-4 mb-8">
        <h3 className="text-red-400 font-medium mb-2">Financial Disclosure vs. Court Documents</h3>
        <p className="text-sm text-gray-400 mb-4">
          Omar&apos;s congressional financial disclosures show dramatic asset value increases that contradict
          bank balances revealed in February 2024 court filings from the Hailer fraud lawsuits.
        </p>
        <div className="border border-red-900/50 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left p-3 font-medium text-gray-400">Entity</th>
                <th className="text-right p-3 font-medium text-gray-400">2023 Disclosure</th>
                <th className="text-right p-3 font-medium text-red-400">Court Docs (Feb 2024)</th>
                <th className="text-right p-3 font-medium text-gray-400">2024 Disclosure</th>
                <th className="text-right p-3 font-medium text-gray-400">Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {DISCLOSURE_DISCREPANCIES.map((d, idx) => (
                <tr key={idx} className="hover:bg-gray-900/50">
                  <td className="p-3 text-white">{d.entity}</td>
                  <td className="p-3 text-right font-mono text-gray-400">{d.disclosure_2023}</td>
                  <td className="p-3 text-right font-mono text-red-400 font-bold">{d.court_docs_2024}</td>
                  <td className="p-3 text-right font-mono text-green-400">{d.disclosure_2024}</td>
                  <td className="p-3 text-right font-mono text-yellow-400">{d.change}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 p-3 bg-gray-900/50 rounded">
          <p className="text-sm text-gray-400">
            <strong className="text-red-400">Key Question:</strong> How do companies with a combined <strong className="text-red-400">$706.49</strong> in
            their bank accounts become worth <strong className="text-green-400">$6-30 million</strong> within months?
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Additionally, Omar reported <strong>$0 income</strong> from Rose Lake Capital in 2024 despite its $5-25M valuation,
            down from $15K-$50K income in 2023 when it was valued at just $1-$1,000.
          </p>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Source: House Clerk Financial Disclosures (2023, 2024) and Dakota Natural Growers v. Hailer court filings.
        </p>
      </div>

      {/* SEC Registration Alert */}
      <div className="bg-orange-900/20 border border-orange-800 p-4 mb-8">
        <h3 className="text-orange-400 font-medium mb-2">SEC Registration Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-gray-500 text-xs mb-2">WEBSITE CLAIMS</p>
            <p className="text-2xl font-mono text-orange-400">$60B AUM</p>
            <p className="text-sm text-gray-400 mt-1">&quot;Assets Under Management&quot;</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-2">SEC IAPD DATABASE</p>
            <p className="text-2xl font-mono text-red-400">NOT FOUND</p>
            <p className="text-sm text-gray-400 mt-1">No Form ADV, No CRD Number</p>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-4">
          Investment advisers managing over $100M are generally required to register with the SEC.
          Rose Lake Capital does not appear in the SEC&apos;s Investment Adviser Public Disclosure (IAPD) database.
          The firm may operate under an exemption, but the $60B AUM claim combined with no SEC registration raises questions.
        </p>
      </div>

      {/* Website Scrubbing Alert */}
      <div className="bg-orange-900/20 border border-orange-800 p-4 mb-8">
        <h3 className="text-orange-400 font-medium mb-2">Names Scrubbed from Website (Sept-Oct 2024)</h3>
        <p className="text-sm text-gray-400 mb-4">
          Between September and October 2024, Rose Lake Capital removed all team member names and bios from its website.
          This occurred simultaneously with new arrests in Minnesota&apos;s $9 billion welfare fraud investigation.
        </p>
        <div className="border border-orange-900/50 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left p-3 font-medium text-gray-400">Name</th>
                <th className="text-left p-3 font-medium text-gray-400">Role</th>
                <th className="text-left p-3 font-medium text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {SCRUBBED_NAMES.map((person, idx) => (
                <tr key={idx} className="hover:bg-gray-900/50">
                  <td className="p-3 text-white">{person.name}</td>
                  <td className="p-3 text-gray-400">{person.role}</td>
                  <td className="p-3">
                    <span className="text-xs px-2 py-0.5 rounded bg-orange-900/30 text-orange-400">
                      {person.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          <strong>Note:</strong> None of these individuals have been charged with any crime. The timing of the removal
          coinciding with Minnesota fraud arrests may be coincidental. However, the scrubbing of a former DNC Treasurer,
          two Obama-era ambassadors, and a former bank CEO from a venture capital website is notable.
        </p>
      </div>

      {/* Key Individuals */}
      <div className="mb-8">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Key Individuals</h3>
        <div className="space-y-4">
          {KEY_INDIVIDUALS.map((person, idx) => (
            <div key={idx} className="border border-gray-800 p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-white font-medium">{person.name}</h4>
                <span className="text-xs text-gray-500">{person.role}</span>
              </div>
              <p className="text-sm text-gray-400 mb-2">{person.connection}</p>
              <div className="text-xs text-gray-500">
                <p><span className="text-gray-600">Address:</span> {person.address}</p>
                <p><span className="text-gray-600">Notes:</span> {person.notes}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Delaware Entities */}
      <div className="mb-8">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Delaware Corporate Structure</h3>
        <div className="border border-gray-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left p-3 font-medium text-gray-400">Entity</th>
                <th className="text-left p-3 font-medium text-gray-400">File #</th>
                <th className="text-left p-3 font-medium text-gray-400">Formed</th>
                <th className="text-left p-3 font-medium text-gray-400">Registered Agent</th>
                <th className="text-left p-3 font-medium text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {DELAWARE_ENTITIES.map((entity, idx) => (
                <tr key={idx} className="hover:bg-gray-900/50">
                  <td className="p-3 text-white">{entity.name}</td>
                  <td className="p-3 font-mono text-gray-400">{entity.file_num}</td>
                  <td className="p-3 text-gray-400">{entity.formed}</td>
                  <td className="p-3 text-gray-400 text-xs">{entity.agent}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      entity.status === 'Good Standing'
                        ? 'bg-green-900/30 text-green-400'
                        : 'bg-yellow-900/30 text-yellow-400'
                    }`}>
                      {entity.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Rose Lake Holdings (June 2022) was formed before Rose Lake Capital (August 2022), suggesting Holdings is the parent entity.
          Delaware LLCs do not require public disclosure of beneficial owners.
        </p>
      </div>

      {/* Hailer Investment Entities */}
      <div className="mb-8">
        <h3 className="text-sm font-medium text-gray-400 mb-1">Hailer/Mynett Investment Entities</h3>
        <p className="text-xs text-gray-600 mb-4">Related investment vehicles operated by William Hailer and/or Tim Mynett</p>
        <div className="border border-gray-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left p-3 font-medium text-gray-400">Entity</th>
                <th className="text-left p-3 font-medium text-gray-400">State</th>
                <th className="text-left p-3 font-medium text-gray-400">Type</th>
                <th className="text-left p-3 font-medium text-gray-400">Formed</th>
                <th className="text-left p-3 font-medium text-gray-400">Status</th>
                <th className="text-right p-3 font-medium text-gray-400">Bank Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {INVESTMENT_ENTITIES.map((entity, idx) => (
                <tr key={idx} className="hover:bg-gray-900/50">
                  <td className="p-3 text-white">{entity.name}</td>
                  <td className="p-3 font-mono text-gray-400">{entity.state}</td>
                  <td className="p-3 text-gray-400">{entity.type}</td>
                  <td className="p-3 text-gray-400">{entity.formed}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      entity.status === 'Active'
                        ? 'bg-green-900/30 text-green-400'
                        : entity.status === 'INACTIVE'
                        ? 'bg-red-900/30 text-red-400'
                        : 'bg-gray-900/30 text-gray-400'
                    }`}>
                      {entity.status}
                    </span>
                  </td>
                  <td className="p-3 text-right font-mono text-yellow-400">{entity.bank_balance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Bank balance data from lawsuit filings. eStCru reported $650 in 2023; eSt Ventures had $0.05 by Feb 2024.
        </p>
      </div>

      {/* Lawsuits and Settlements */}
      <div className="mb-8">
        <h3 className="text-sm font-medium text-gray-400 mb-1">Lawsuits & Settlements</h3>
        <p className="text-xs text-gray-600 mb-4">Fraud allegations and civil litigation involving Hailer investment entities</p>
        <div className="space-y-4">
          {LAWSUITS.map((lawsuit, idx) => (
            <div key={idx} className="border border-red-900/50 bg-red-900/10 p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="text-white font-medium">{lawsuit.name}</h4>
                  <p className="text-xs text-gray-500">{lawsuit.court} • Filed {lawsuit.filed}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  lawsuit.status === 'Settled'
                    ? 'bg-yellow-900/30 text-yellow-400'
                    : 'bg-red-900/30 text-red-400'
                }`}>
                  {lawsuit.status}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 text-xs mb-1">PLAINTIFF</p>
                  <p className="text-gray-400">{lawsuit.plaintiff}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">DEFENDANTS</p>
                  <p className="text-gray-400">{lawsuit.defendants}</p>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-gray-500 text-xs mb-1">ALLEGATION</p>
                <p className="text-gray-400 text-sm">{lawsuit.allegation}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <p className="text-gray-500 text-xs mb-1">AMOUNT SOUGHT</p>
                  <p className="text-red-400 font-mono">{formatMoney(lawsuit.amount_sought)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">OUTCOME</p>
                  <p className="text-yellow-400 text-sm">{lawsuit.outcome}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-4">
          <strong>Note:</strong> These are civil allegations, not criminal charges. Both cases settled before trial.
          Settlements do not constitute admission of wrongdoing. Tim Mynett was mentioned but not named as defendant in the eStCru case.
        </p>
      </div>

      {/* eStCru Detail Box */}
      <div className="bg-purple-900/20 border border-purple-800 p-4 mb-8">
        <h3 className="text-purple-400 font-medium mb-2">eStCru LLC - Winery Investment</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500 text-xs mb-2">CALIFORNIA REGISTRATION</p>
            <div className="space-y-1">
              <p><span className="text-gray-500">File Number:</span> <span className="text-white font-mono">202018810577</span></p>
              <p><span className="text-gray-500">Formed:</span> <span className="text-white">July 2, 2020</span></p>
              <p><span className="text-gray-500">Status:</span> <span className="text-green-400">Active</span></p>
              <p><span className="text-gray-500">Agent:</span> <span className="text-white">William R Hailer</span></p>
            </div>
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-2">BUSINESS DETAILS</p>
            <div className="space-y-1">
              <p><span className="text-gray-500">Type:</span> <span className="text-white">Boutique Wine Label</span></p>
              <p><span className="text-gray-500">Winemaker:</span> <span className="text-white">Erica Stancliff (stopped getting paid early 2023)</span></p>
              <p><span className="text-gray-500">Bank Balance:</span> <span className="text-yellow-400">$650 (per 2023 lawsuit filing)</span></p>
              <p><span className="text-gray-500">Investor:</span> <span className="text-white">Naeem Mohd ($300K)</span></p>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-4">
          Mohd was promised 200% return in 18 months per lawsuit filing. The investment was allegedly misrepresented.
        </p>
      </div>

      {/* Property Investigation */}
      <div className="bg-gray-900/30 border border-gray-800 p-4 mb-8">
        <h3 className="text-white font-medium mb-3">Property Investigation Finding</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-gray-500 text-xs mb-2">4616 15TH ST NW, WASHINGTON DC</p>
            <div className="space-y-1 text-sm">
              <p><span className="text-gray-500">Current Owner:</span> <span className="text-white">BETH A. JORDAN</span></p>
              <p><span className="text-gray-500">Deed Date:</span> <span className="text-white">July 21, 2020</span></p>
              <p><span className="text-gray-500">Property Value:</span> <span className="text-green-500">$941,350</span></p>
              <p><span className="text-gray-500">Homestead:</span> <span className="text-white">Yes (owner-occupied)</span></p>
            </div>
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-2">SIGNIFICANCE</p>
            <p className="text-sm text-gray-400">
              This was Tim Mynett&apos;s registered address on E Street Group filings.
              <strong className="text-yellow-400"> Beth A. Jordan is his ex-wife</strong> (maiden name Jordan).
              The property was transferred to her in July 2020 - four months after Mynett married Omar.
              This was likely part of the divorce settlement.
            </p>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="border border-gray-800 p-4 mb-8">
        <h3 className="text-white font-medium mb-3">Timeline</h3>
        <div className="space-y-3 text-sm">
          {TIMELINE.map((item, idx) => (
            <div key={idx} className="flex gap-4">
              <span className="text-gray-500 font-mono w-28 shrink-0">{item.date}</span>
              <span className={`${
                item.type === 'financial' ? 'text-green-400' :
                item.type === 'personal' ? 'text-yellow-400' :
                item.type === 'property' ? 'text-blue-400' :
                item.type === 'lawsuit' ? 'text-red-400' :
                item.type === 'formation' ? 'text-purple-400' :
                item.type === 'scrubbing' ? 'text-orange-400' :
                item.type === 'fraud' ? 'text-red-500' :
                item.type === 'disclosure' ? 'text-cyan-400' :
                'text-gray-400'
              }`}>{item.event}</span>
            </div>
          ))}
        </div>
      </div>

      {/* What This Shows */}
      <div className="border border-gray-800 p-4 mb-8">
        <h3 className="text-white font-medium mb-3">Inferences</h3>
        <div className="space-y-4 text-sm text-gray-400">
          <div>
            <p className="text-gray-500 mb-1">1. THE HAILER CONNECTION</p>
            <p>William Hailer is a partner at both E Street Group (political consulting) and Rose Lake Capital (investment).
            This creates a direct bridge between the political network and investment opportunities.</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">2. DEMOCRATIC ESTABLISHMENT VEHICLE</p>
            <p>Rose Lake Capital&apos;s principals include a former DNC Treasurer and former Ambassador.
            Combined with E Street Group&apos;s progressive campaign work, this appears to be a Democratic donor/operative investment vehicle.</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">3. STRUCTURAL OPACITY</p>
            <p>Delaware LLCs, WeWork addresses, and holding company structures provide limited public visibility.
            Neither Omar nor Mynett appear to own property in their names in DC or MN.</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">4. PATTERN OF FAILED INVESTMENTS</p>
            <p>Two separate investor lawsuits (totaling $2.48M in claims) against Hailer-operated entities, both settling
            rather than going to trial. eStCru winery had $650 in the bank; eSt Ventures had $0.05. Promised returns
            of 200%+ allegedly not delivered. Tim Mynett was mentioned in the eStCru lawsuit but not named as defendant.</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">5. CAPITAL FLOW QUESTIONS</p>
            <p>Between 2018-2024, E Street Group received $3.67M from Democratic campaigns (79% from Omar&apos;s).
            During this same period, Hailer was raising investor funds for eSt Ventures and eStCru.
            Both investment vehicles ended up nearly empty. The relationship between political consulting revenue
            and investment fund operations remains unclear.</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">6. THE $706 → $30M MYSTERY</p>
            <p>Court documents from February 2024 show combined bank balances of $706.49 across all Mynett/Hailer entities.
            Yet Omar&apos;s May 2025 disclosure values these same entities at $6-30 million. No explanation is provided for
            how near-empty companies gained tens of millions in value. Additionally, she reports $0 income from Rose Lake
            Capital despite its $5-25M valuation.</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">7. COORDINATED WEBSITE SCRUBBING</p>
            <p>Between September and October 2024, Rose Lake Capital removed 9 names from its website, including a former
            DNC Treasurer, two Obama ambassadors, and a former bank CEO. This occurred simultaneously with new arrests in
            Minnesota&apos;s $9 billion welfare fraud investigation. While no direct connection is established, the timing
            raises questions about why prominent Democratic operatives distanced themselves from the firm.</p>
          </div>
        </div>
      </div>

      {/* What Was NOT Found */}
      <div className="border border-green-800 bg-green-900/10 p-4 mb-8">
        <h3 className="text-green-400 font-medium mb-3">What Was NOT Found</h3>
        <ul className="text-sm text-gray-400 space-y-2">
          <li>- No connection to Feeding Our Future fraud case</li>
          <li>- No Minnesota business registrations for E Street Group or Mynett</li>
          <li>- No Minnesota property under Omar or Mynett names (Hennepin County searched)</li>
          <li>- No evidence of illegal activity (spousal payments are legal if disclosed)</li>
        </ul>
      </div>

      {/* Data Sources */}
      <div className="border border-gray-800 p-4 mb-8">
        <h3 className="text-white font-medium mb-3">Data Sources</h3>
        <ul className="text-sm text-gray-400 space-y-2">
          <li>
            <span className="text-gray-500">House Clerk Financial Disclosures:</span> Omar 2023 &amp; 2024 annual reports
          </li>
          <li>
            <span className="text-gray-500">SEC IAPD Database:</span> Investment adviser search (Rose Lake Capital not found)
          </li>
          <li>
            <span className="text-gray-500">DC CorpOnline:</span> E Street Group LLC registration (File #L00006033509)
          </li>
          <li>
            <span className="text-gray-500">Delaware Division of Corporations:</span> Rose Lake entities
          </li>
          <li>
            <span className="text-gray-500">California Secretary of State:</span> eStCru LLC registration (File #202018810577)
          </li>
          <li>
            <span className="text-gray-500">FEC Bulk Data (2020-2024):</span> 310 operating expenditure records
          </li>
          <li>
            <span className="text-gray-500">SAM.gov:</span> E Street Group federal registration (UEI: HNRCX365LG34)
          </li>
          <li>
            <span className="text-gray-500">DC OTR Property Database:</span> 4616 15th St NW ownership records
          </li>
          <li>
            <span className="text-gray-500">SBA PPP Data:</span> E Street Group $134,800 loan (forgiven)
          </li>
          <li>
            <span className="text-gray-500">Minnesota SOS:</span> No related entities found
          </li>
          <li>
            <span className="text-gray-500">Hennepin County GIS:</span> No property under target names
          </li>
          <li>
            <span className="text-gray-500">Hennepin County Court Records:</span> Dakota Natural Growers v. Hailer court filings (bank balances)
          </li>
          <li>
            <span className="text-gray-500">Rose Lake Capital Website:</span> Current vs archived versions (names removed Sept-Oct 2024)
          </li>
          <li>
            <span className="text-gray-500">News Sources:</span> Fox News, Mediaite, Washingtonian, South Dakota Standard, Investigative Economics
          </li>
        </ul>
        <p className="text-xs text-gray-500 mt-4">
          Found an error? <Link href="/corrections" className="text-blue-400 hover:underline">Submit a correction</Link>.
        </p>
      </div>

      {/* Related Links */}
      <div className="border-t border-gray-800 pt-6">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Related</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <Link href="/investigation" className="text-gray-400 hover:text-green-400">
            All Investigations
          </Link>
          <span className="text-gray-700">|</span>
          <Link href="/ppp" className="text-gray-400 hover:text-green-400">
            PPP Database
          </Link>
          <span className="text-gray-700">|</span>
          <Link href="/donations/federal" className="text-gray-400 hover:text-green-400">
            Federal Donations
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
