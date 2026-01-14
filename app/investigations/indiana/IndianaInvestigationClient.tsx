'use client';

import { useState } from 'react';
import Link from 'next/link';

// Indiana spending data by agency (FY2022-2025)
const spendingByAgency = [
  { agency: 'Family & Social Services Admin', amount: 9234000000, pctOfTotal: 28.0, trend: '+34%' },
  { agency: 'Health', amount: 4891000000, pctOfTotal: 14.8, trend: '+28%' },
  { agency: 'Child Services', amount: 3900000000, pctOfTotal: 13.0, trend: '+88%' },
  { agency: 'Education', amount: 3456000000, pctOfTotal: 10.5, trend: '+18%' },
  { agency: 'Transportation', amount: 2987000000, pctOfTotal: 9.0, trend: '+22%' },
  { agency: 'Corrections', amount: 1876000000, pctOfTotal: 5.7, trend: '+15%' },
  { agency: 'Workforce Development', amount: 1234000000, pctOfTotal: 3.7, trend: '+45%' },
  { agency: 'State Police', amount: 876000000, pctOfTotal: 2.7, trend: '+12%' },
  { agency: 'Environmental Management', amount: 654000000, pctOfTotal: 2.0, trend: '+8%' },
  { agency: 'Revenue', amount: 543000000, pctOfTotal: 1.6, trend: '+5%' },
  { agency: 'Natural Resources', amount: 432000000, pctOfTotal: 1.3, trend: '+10%' },
  { agency: 'Veterans Affairs', amount: 321000000, pctOfTotal: 1.0, trend: '+25%' },
  { agency: 'Homeland Security', amount: 287000000, pctOfTotal: 0.9, trend: '+18%' },
  { agency: 'Agriculture', amount: 234000000, pctOfTotal: 0.7, trend: '+7%' },
  { agency: 'Gaming Commission', amount: 198000000, pctOfTotal: 0.6, trend: '+3%' },
  { agency: 'Insurance', amount: 176000000, pctOfTotal: 0.5, trend: '+4%' },
  { agency: 'Utility Regulatory', amount: 156000000, pctOfTotal: 0.5, trend: '+6%' },
  { agency: 'Professional Licensing', amount: 143000000, pctOfTotal: 0.4, trend: '+9%' },
  { agency: 'Civil Rights Commission', amount: 98000000, pctOfTotal: 0.3, trend: '+11%' },
  { agency: 'Ethics Commission', amount: 45000000, pctOfTotal: 0.1, trend: '+2%' },
];

// Consulting firm payments
const consultingPayments = [
  { vendor: 'Deloitte Consulting LLP', amount: 187600000, agency: 'Multiple', contracts: 156, note: 'Now getting Medicaid contract' },
  { vendor: 'Accenture LLP', amount: 89400000, agency: 'FSSA/IOT', contracts: 67, note: 'Named in FBI investigation' },
  { vendor: 'Deloitte (DCS only)', amount: 70600000, agency: 'Child Services', contracts: 66 },
  { vendor: 'Gainwell Technologies', amount: 45200000, agency: 'FSSA', contracts: 34, note: 'Medicaid claims since 1991' },
  { vendor: 'Carahsoft Technology', amount: 31500000, agency: 'Multiple', contracts: 28, note: 'FBI raid Sept 2024' },
  { vendor: 'Casebook PBC', amount: 27300000, agency: 'Child Services', contracts: 12 },
  { vendor: 'KPMG LLP', amount: 17200000, agency: 'FSSA', contracts: 23 },
  { vendor: 'IBM Corporation', amount: 15800000, agency: 'IOT', contracts: 19 },
];

// The FSSA disaster timeline - the bigger picture
const fssaTimeline = [
  { year: 2005, event: 'Mitch Roob (ex-ACS executive) becomes FSSA Secretary under Daniels', amount: null },
  { year: 2006, event: 'Roob awards $1.3B contract to IBM (with ACS as subcontractor)', amount: 1300000000 },
  { year: '2007-09', event: 'System fails: lost records, denied benefits, at least one death', amount: null },
  { year: 2009, event: 'Daniels cancels IBM contract, admits "I was wrong"', amount: null },
  { year: 2009, event: 'ACS gets NEW $638M contract despite being blamed for failure', amount: 638000000 },
  { year: 2020, event: 'IBM ordered to pay $78M back to Indiana (court ruling)', amount: -78000000 },
  { year: 2023, event: 'FSSA discovers $1B Medicaid shortfall - "can\'t fully explain it"', amount: 1000000000 },
  { year: 2024, event: 'State fires Milliman (actuary blamed for $1B error)', amount: null },
  { year: 2025, event: 'Braun appoints Roob back as FSSA Secretary', amount: null },
  { year: 2025, event: 'Deloitte gets Medicaid forecasting contract (replacing Milliman)', amount: null },
];

// Budget timeline - STATE APPROPRIATIONS (verified from State Budget Agency)
// Note: Federal Title IV-E matching adds ~35% more, so total spending is higher
const budgetTimeline = [
  { year: 2013, amount: 520000000, event: 'Pence becomes Governor, appoints Bonaventura', note: 'est.' },
  { year: 2014, amount: 550000000, event: 'Gargano (KPMG) appointed to FSSA', note: 'est.' },
  { year: 2015, amount: 580000000, event: 'Deloitte hired for "independent" analysis', note: 'est.' },
  { year: 2016, amount: 612000000, event: 'CCWIS federal mandate enacted', note: 'est.' },
  { year: 2017, amount: 629000000, event: 'Pence becomes VP; Bonaventura resigns', note: 'verified' },
  { year: 2018, amount: 629000000, event: 'Verma now runs CMS (controls federal match)', note: 'verified' },
  { year: 2019, amount: 679000000, event: '+8% increase', note: 'verified' },
  { year: 2020, amount: 780000000, event: 'COVID increases caseloads', note: 'est.' },
  { year: 2021, amount: 850000000, event: 'COVID federal relief', note: 'est.' },
  { year: 2022, amount: 920000000, event: 'Heather Neal joins Deloitte', note: 'est.' },
  { year: 2023, amount: 950000000, event: 'Randy Head resigns GOP Chair to lobby', note: 'est.' },
  { year: 2024, amount: 977000000, event: 'Eric Miller becomes DCS Director', note: 'verified' },
];

// The money contrast - who gets what
// State appropriation: $977M / 11,547 kids = $84,600/child (state only)
// With federal match (~35% more): ~$1.3B / 11,547 = ~$113,000/child (total)
const moneyContrast = [
  { recipient: 'Foster family (per child/year)', amount: 8700, amountHigh: 18200, note: 'Actual caregivers - $24-50/day' },
  { recipient: 'Deloitte (average payment)', amount: 1070000, note: '66 payments from DCS' },
  { recipient: 'System cost per child/year', amount: 85000, amountTotal: 113000, note: '$977M state / 11,547 kids' },
];

// Politicians who approved budgets
const politicians = [
  {
    name: 'Tim Brown (R)',
    role: 'Ways & Means Chair',
    years: '2012-2022',
    action: 'Authored all DCS budgets',
    status: 'Retired'
  },
  {
    name: 'Todd Huston (R)',
    role: 'House Speaker',
    years: '2020-present',
    action: 'Called DCS funding "locked in"',
    status: 'Current Speaker'
  },
  {
    name: 'Eric Holcomb (R)',
    role: 'Governor',
    years: '2017-2025',
    action: 'Signed all budget increases',
    status: 'Term-limited'
  },
  {
    name: 'Brian Bosma (R)',
    role: 'House Speaker',
    years: '2010-2020',
    action: 'Appointed Tim Brown as chair',
    status: 'Retired'
  },
  {
    name: 'Rodric Bray (R)',
    role: 'Senate President',
    years: '2018-present',
    action: 'Approved all budgets in Senate',
    status: 'Current'
  },
];

// Revolving door connections
const revolvingDoor = [
  {
    name: 'Mitch Roob',
    govRole: 'FSSA Secretary (twice)',
    govYears: '2005-2009, 2025-present',
    privateRole: 'ACS executive (prior)',
    privateYears: 'Pre-2005',
    note: 'Architect of $1.3B IBM failure, now back running FSSA'
  },
  {
    name: 'Heather Neal',
    govRole: 'Pence Legislative Director',
    govYears: '2013',
    privateRole: 'Deloitte Client Executive',
    privateYears: '2022-present',
    note: 'Involved in grade-fixing scandal'
  },
  {
    name: 'Michael Gargano',
    govRole: 'FSSA Deputy Secretary',
    govYears: '2013-2017',
    privateRole: 'KPMG (prior)',
    privateYears: 'Pre-2013',
    note: 'Came FROM KPMG to government'
  },
  {
    name: 'Seema Verma',
    govRole: 'CMS Administrator',
    govYears: '2017-2021',
    privateRole: 'Oracle Health EVP',
    privateYears: '2021-present',
    note: 'Got $6.6M from Indiana while advising'
  },
  {
    name: 'Michael McDaniel',
    govRole: 'IN GOP Chair (3 terms)',
    govYears: '1995-2002',
    privateRole: 'Krieg DeVault (Deloitte lobbyist)',
    privateYears: '2002-present',
    note: '50 years in Indiana GOP'
  },
  {
    name: 'Randy Head',
    govRole: 'State Senator, GOP Chair',
    govYears: '2008-2024',
    privateRole: 'Krieg DeVault (Deloitte lobbyist)',
    privateYears: '2024-present',
    note: 'Resigned as GOP Chair to lobby'
  },
  {
    name: 'Aaron Atwell',
    govRole: 'DCS Chief of Staff/CFO',
    govYears: '2020-2024',
    privateRole: 'The Villages CFO',
    privateYears: '2024-present',
    note: 'The Villages has $231M in contracts'
  },
];

// Key findings for the "opioid excuse"
const opioidFindings = [
  { stat: '14%', label: 'of child removals for housing issues alone' },
  { stat: '10x', label: 'more spent on intervention than prevention' },
  { stat: '5x', label: 'more spent on drug testing than treatment' },
  { stat: '7th', label: 'highest removal rate nationally' },
];

function formatMoney(amount: number): string {
  if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(1)}B`;
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  return `$${amount.toLocaleString()}`;
}

export default function IndianaInvestigationClient() {
  const [activeSection, setActiveSection] = useState<'overview' | 'fssa' | 'spending' | 'consultants' | 'politicians' | 'revolving' | 'opioid'>('overview');

  return (
    <div>
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-6">
        <Link href="/investigation" className="hover:text-gray-300">Investigations</Link>
        <span className="mx-2">/</span>
        <span className="text-white">Indiana Child Welfare Machine</span>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold text-white mb-2">The Indiana Consulting Machine</h1>
      <p className="text-gray-400 mb-8">20 years. $2+ billion to consultants. Systems keep failing. Contracts keep flowing.</p>

      {/* The contrast - lead with this */}
      <div className="border-2 border-red-800 bg-red-900/10 p-4 mb-8">
        <p className="text-sm text-gray-500 font-mono mb-3">WHERE_THE_MONEY_GOES</p>
        <div className="grid md:grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-3xl font-mono text-green-500">$24-50</p>
            <p className="text-sm text-gray-400">per day to foster families</p>
            <p className="text-xs text-gray-600">($8,700-$18,200/year)</p>
          </div>
          <div>
            <p className="text-3xl font-mono text-white">$85,000</p>
            <p className="text-sm text-gray-400">state cost per child/year</p>
            <p className="text-xs text-gray-600">($977M ÷ 11,547 kids)</p>
          </div>
          <div>
            <p className="text-3xl font-mono text-red-500">$1.07M</p>
            <p className="text-sm text-gray-400">average Deloitte payment</p>
            <p className="text-xs text-gray-600">(66 payments from DCS)</p>
          </div>
        </div>
        <p className="text-center text-gray-500 text-sm mt-4">
          Foster families receive <span className="text-white">10-21%</span> of what the system spends per child.
          With federal matching, total cost is ~$113K/child. The rest goes to bureaucracy and contractors.
        </p>
      </div>

      {/* Terminal-style stats */}
      <div className="font-mono text-sm mb-10">
        <p className="text-gray-500">INDIANA_DCS_INVESTIGATION</p>
        <div className="mt-2 text-gray-400">
          <p><span className="text-gray-600">├─</span> dcs_state_budget_fy24 <span className="text-green-500 ml-4">$977M</span> <span className="text-gray-600">(verified appropriation)</span></p>
          <p><span className="text-gray-600">├─</span> dcs_total_w_federal <span className="text-green-500 ml-4">~$1.3B</span> <span className="text-gray-600">(with Title IV-E match)</span></p>
          <p><span className="text-gray-600">├─</span> consulting_statewide <span className="text-green-500 ml-4">$491.5M</span></p>
          <p><span className="text-gray-600">├─</span> foster_family_pay <span className="text-yellow-500 ml-4">$24-50/day</span> <span className="text-gray-600">(poverty wages)</span></p>
          <p><span className="text-gray-600">├─</span> budget_increase <span className="text-red-500 ml-4">+88% since 2013</span> <span className="text-gray-600">($520M → $977M)</span></p>
          <p><span className="text-gray-600">├─</span> children_in_foster <span className="text-white ml-4">11,547</span> <span className="text-gray-600">(6th highest removal rate)</span></p>
          <p><span className="text-gray-600">└─</span> source <span className="text-gray-500 ml-4">IN State Budget Agency, DCS Rate Letters</span></p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-gray-800 pb-4 mb-8">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'fssa', label: 'The $1.3B Failure' },
          { id: 'spending', label: 'Where Money Goes' },
          { id: 'consultants', label: 'Consulting Contracts' },
          { id: 'politicians', label: 'Who Approved It' },
          { id: 'revolving', label: 'Revolving Door' },
          { id: 'opioid', label: 'The Opioid Excuse' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id as typeof activeSection)}
            className={`px-3 py-1.5 text-sm ${
              activeSection === tab.id
                ? 'text-white border-b border-white'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Section */}
      {activeSection === 'overview' && (
        <div className="space-y-8">
          {/* The Big Picture */}
          <div className="border border-gray-800 p-4">
            <h3 className="text-white font-medium mb-4">Same Playbook, 20 Years Running</h3>
            <p className="text-gray-300 leading-relaxed mb-4">
              <span className="text-white">2006</span>: Indiana gave IBM <span className="text-green-500">$1.3 billion</span> to
              privatize welfare. People died waiting for wrongly denied benefits. The guy who awarded that contract?
              <span className="text-red-400"> Back running FSSA as of January 2025.</span>
            </p>
            <p className="text-gray-400 leading-relaxed mb-4">
              <span className="text-white">2013</span>: Pence brought in KPMG and Deloitte.
              <span className="text-white"> 2023</span>: <span className="text-red-400">$1 billion Medicaid shortfall</span> that
              officials &quot;can&apos;t fully explain.&quot;
              <span className="text-white"> 2025</span>: Deloitte gets that contract too.
            </p>
            <p className="text-gray-400 leading-relaxed">
              Deloitte currently faces an FTC complaint for faulty Medicaid software in 20+ states.
              Their Indiana lobbyist? The former GOP Chairman who resigned in December 2024 to take the job.
            </p>
          </div>

          {/* How Lobbyists Maintain Pressure */}
          <div className="border border-gray-800 p-4">
            <p className="text-gray-500 text-sm mb-4 font-mono">HOW_LOBBYISTS_KEEP_CONTRACTS_FLOWING</p>
            <div className="space-y-3 text-sm text-gray-400">
              <p><span className="text-white">1.</span> Former <span className="text-red-400">3-term GOP Chairman</span> lobbies for Deloitte (Krieg DeVault)</p>
              <p><span className="text-white">2.</span> Former <span className="text-red-400">State Senator/GOP Chair</span> resigns to lobby for Deloitte (2024)</p>
              <p><span className="text-white">3.</span> Pence legislative director <span className="text-red-400">joins Deloitte</span> as Client Executive (2022)</p>
              <p><span className="text-white">4.</span> KPMG executive <span className="text-red-400">appointed to run FSSA</span> under Pence (2014)</p>
              <p><span className="text-white">5.</span> Ex-ACS executive <span className="text-red-400">returns to run FSSA</span> under Braun (2025)</p>
              <p><span className="text-white">6.</span> When systems fail, <span className="text-red-400">same firms get new contracts</span> to fix them</p>
            </div>
          </div>

          {/* The DCS Story */}
          <div className="border border-gray-800 p-4">
            <h3 className="text-white font-medium mb-4">DCS (2013-2024)</h3>
            <p className="text-gray-300 leading-relaxed mb-4">
              <span className="text-white">2013</span>: Pence becomes Governor. Appoints Mary Beth Bonaventura (36-year veteran)
              as DCS Director. Brings in <span className="text-white">Michael Gargano</span> from
              <span className="text-red-400"> KPMG</span> to run FSSA.
            </p>
            <p className="text-gray-400 leading-relaxed mb-4">
              <span className="text-white">2015</span>: Pence hires <span className="text-red-400">Deloitte</span> for
              &quot;independent&quot; caseload analysis. Deloitte recommends more staff and better IT.
              Then Deloitte builds the IT. Then maintains it. <span className="text-white">$70.6 million later</span>, still there.
            </p>
            <p className="text-gray-400 leading-relaxed">
              <span className="text-white">2017</span>: Bonaventura warns the system is failing children. Forced out.
              <span className="text-white">2024</span>: Budget up <span className="text-red-400">88%</span>. The man she called
              &quot;the greatest threat to DCS reform&quot; is now DCS Director.
            </p>
          </div>

          {/* The Money Trail */}
          <div className="border border-gray-800 p-4">
            <h3 className="text-white font-medium mb-4">Where the Money Goes</h3>
            <p className="text-gray-400 leading-relaxed mb-4">
              DCS budget (FY2024): <span className="text-green-500 font-mono">$977M</span> for 11,547 children.
              <span className="text-white">$85,000 per child</span> from state funds. With federal matching: <span className="text-white">~$113,000</span>.
            </p>
            <p className="text-gray-400 leading-relaxed mb-4">
              Foster families get <span className="text-yellow-500">$24-50/day</span> ($8,700-$18,200/year).
            </p>
            <div className="font-mono text-sm text-gray-400 space-y-1 mb-4">
              <p><span className="text-gray-600">├─</span> 4,000+ DCS employees <span className="text-gray-500 ml-4">(37% turnover)</span></p>
              <p><span className="text-gray-600">├─</span> Private residential facilities <span className="text-green-500 ml-4">$480/day</span></p>
              <p><span className="text-gray-600">├─</span> IT &amp; consulting <span className="text-green-500 ml-4">$250M over 4 years</span></p>
              <p><span className="text-gray-600">├─</span> 214K investigations/year <span className="text-gray-500 ml-4">(2x national rate)</span></p>
              <p><span className="text-gray-600">└─</span> Admin overhead</p>
            </div>
            <p className="text-gray-500 text-sm">
              Indiana removes children at the <span className="text-white">6th highest rate</span> nationally.
            </p>
          </div>

          {/* Budget Timeline - table style */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-4">The Budget Explosion (2013-2024)</h3>
            <div className="border border-gray-800 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="text-left p-3 font-medium text-gray-400">Year</th>
                    <th className="text-right p-3 font-medium text-gray-400">Budget</th>
                    <th className="text-left p-3 font-medium text-gray-400">Event</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {budgetTimeline.map((item) => (
                    <tr key={item.year} className={`hover:bg-gray-900/50 ${item.year === 2017 ? 'bg-gray-900/30' : ''}`}>
                      <td className="p-3 font-mono text-white">{item.year}</td>
                      <td className="p-3 text-right font-mono text-green-500">{formatMoney(item.amount)}</td>
                      <td className="p-3 text-gray-400">
                        {item.event}
                        {item.year === 2017 && <span className="text-gray-500 ml-2">(whistleblower exit)</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Key Quote */}
          <div className="border-l-2 border-gray-700 pl-4 py-2">
            <p className="text-gray-300 italic">
              &quot;I choose to resign, rather than be complicit in decreasing the safety, permanency
              and well-being of children who have nowhere else to turn.&quot;
            </p>
            <p className="text-gray-500 text-sm mt-2">Mary Beth Bonaventura, DCS Director, resignation letter (Dec 2017)</p>
          </div>
        </div>
      )}

      {/* FSSA Section - The Bigger Picture */}
      {activeSection === 'fssa' && (
        <div className="space-y-8">
          <div className="border border-gray-800 p-4">
            <h2 className="text-white font-medium mb-2">The $1.3 Billion Privatization Failure</h2>
            <p className="text-gray-500 text-sm">DCS is the sequel. This is how it started.</p>
          </div>

          {/* Roob Story */}
          <div className="border border-gray-800 p-4">
            <h3 className="text-white font-medium mb-4">Mitch Roob</h3>
            <p className="text-gray-400 leading-relaxed mb-4">
              <span className="text-white">2005</span>: Daniels appoints Mitch Roob as FSSA Secretary.
              Roob was an executive at <span className="text-red-400">Affiliated Computer Services (ACS)</span>.
            </p>
            <p className="text-gray-400 leading-relaxed mb-4">
              <span className="text-white">2006</span>: Roob awards a <span className="text-green-500 font-mono">$1.3 billion</span> contract to IBM
              to privatize welfare. ACS - his former employer - is IBM&apos;s primary subcontractor.
            </p>
            <p className="text-gray-400 leading-relaxed">
              <span className="text-white">2007-2009</span>: Lost records. Denied benefits. Long wait times.
              <span className="text-red-400"> At least one person died</span> waiting for benefits that were wrongly denied.
            </p>
          </div>

          {/* Timeline */}
          <div className="border border-gray-800 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-900">
                <tr>
                  <th className="text-left p-3 font-medium text-gray-400">Year</th>
                  <th className="text-left p-3 font-medium text-gray-400">Event</th>
                  <th className="text-right p-3 font-medium text-gray-400">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {fssaTimeline.map((item, idx) => (
                  <tr key={idx} className={`hover:bg-gray-900/50 ${
                    String(item.year).includes('2023') || String(item.year).includes('2025') ? 'bg-red-900/20' : ''
                  }`}>
                    <td className="p-3 font-mono text-white">{item.year}</td>
                    <td className="p-3 text-gray-400">{item.event}</td>
                    <td className="p-3 text-right font-mono">
                      {item.amount ? (
                        <span className={item.amount < 0 ? 'text-green-500' : 'text-red-400'}>
                          {item.amount < 0 ? '-' : ''}{formatMoney(Math.abs(item.amount))}
                        </span>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* The Aftermath */}
          <div className="border border-gray-800 p-4">
            <h3 className="text-white font-medium mb-4">The Aftermath</h3>
            <div className="space-y-3 text-sm text-gray-400">
              <p><span className="text-white">1.</span> Daniels cancels IBM contract, admits <span className="text-white">&quot;I was wrong&quot;</span> (2009)</p>
              <p><span className="text-white">2.</span> But <span className="text-red-400">ACS gets a NEW $638M contract</span> despite being blamed (2009)</p>
              <p><span className="text-white">3.</span> Roob gets promoted to Economic Development Secretary (2009)</p>
              <p><span className="text-white">4.</span> IBM ordered to pay $78M back to Indiana (2020)</p>
              <p><span className="text-white">5.</span> FSSA discovers <span className="text-red-400">$1B Medicaid shortfall</span> - &quot;can&apos;t fully explain it&quot; (2023)</p>
              <p><span className="text-white">6.</span> State fires Milliman, hires <span className="text-red-400">Deloitte</span> (2025)</p>
              <p><span className="text-white">7.</span> Braun appoints <span className="text-red-400">Roob back as FSSA Secretary</span> (2025)</p>
            </div>
          </div>

          {/* The $1B Shortfall */}
          <div className="border border-gray-800 p-4">
            <h3 className="text-white font-medium mb-4">The $1 Billion Shortfall (2023)</h3>
            <p className="text-gray-400 leading-relaxed mb-4">
              April 2023: Milliman forecasts <span className="text-green-500">$570M surplus</span>.
              December 2023: Actually <span className="text-red-400">$1B short</span>. A $1.57 billion swing.
            </p>
            <p className="text-gray-400 leading-relaxed mb-4">
              Lawmakers asked FSSA to explain. Their answer:
              <span className="text-white"> &quot;There was no single issue... your questions do not apply.&quot;</span>
            </p>
            <p className="text-gray-400 leading-relaxed">
              State fires Milliman. Hires <span className="text-red-400">Deloitte</span>.
              Deloitte faces an <span className="text-white">FTC complaint</span> for faulty Medicaid software
              that wrongfully kicked 90,000 Texans off coverage.
            </p>
          </div>

          {/* The Pattern */}
          <div className="border border-gray-800 p-4">
            <p className="text-gray-500 text-sm mb-4 font-mono">HOW_IT_WORKS</p>
            <div className="font-mono text-sm text-gray-400 space-y-1">
              <p><span className="text-gray-600">├─</span> Consultant builds system</p>
              <p><span className="text-gray-600">├─</span> System fails</p>
              <p><span className="text-gray-600">├─</span> New consultant hired to fix it</p>
              <p><span className="text-gray-600">├─</span> Lobbyists keep relationships warm</p>
              <p><span className="text-gray-600">└─</span> Officials rotate in and out</p>
            </div>
          </div>

          <div className="border-l-2 border-gray-700 pl-4 py-2">
            <p className="text-gray-300 italic">
              &quot;It was very flawed in concept... The system wasn&apos;t working and it wasn&apos;t getting better despite best efforts.&quot;
            </p>
            <p className="text-gray-500 text-sm mt-2">Governor Mitch Daniels, canceling the IBM contract (2009)</p>
          </div>
        </div>
      )}

      {/* Spending Section */}
      {activeSection === 'spending' && (
        <div className="space-y-8">
          <div className="border border-gray-800 p-4">
            <h2 className="text-white font-medium mb-2">Top 20 Indiana Spending Categories</h2>
            <p className="text-gray-500 text-sm">FY2022-2025 combined spending by agency</p>
          </div>

          <div className="border border-gray-800 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-900">
                <tr>
                  <th className="text-left p-3 text-gray-400 font-medium">#</th>
                  <th className="text-left p-3 text-gray-400 font-medium">Agency</th>
                  <th className="text-right p-3 text-gray-400 font-medium">Amount</th>
                  <th className="text-right p-3 text-gray-400 font-medium">% of Total</th>
                  <th className="text-right p-3 text-gray-400 font-medium">Since 2015</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {spendingByAgency.map((item, idx) => (
                  <tr
                    key={item.agency}
                    className={`hover:bg-gray-900/50 ${item.agency === 'Child Services' ? 'bg-red-900/20 border-l-2 border-red-600' : ''}`}
                  >
                    <td className="p-3 text-gray-600">{idx + 1}</td>
                    <td className="p-3 text-white">
                      {item.agency}
                      {item.agency === 'Child Services' && (
                        <span className="ml-2 text-xs text-red-400">(investigation focus)</span>
                      )}
                    </td>
                    <td className="p-3 text-right font-mono text-green-500">{formatMoney(item.amount)}</td>
                    <td className="p-3 text-right text-gray-500">{item.pctOfTotal}%</td>
                    <td className={`p-3 text-right ${item.agency === 'Child Services' ? 'text-red-500 font-bold' : parseFloat(item.trend) > 50 ? 'text-white' : 'text-gray-500'}`}>
                      {item.trend}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border border-gray-800 p-4">
            <p className="text-gray-400 text-sm">
              Child Services state appropriation grew <span className="text-red-500 font-bold">+88%</span> since 2013 ($520M → $977M).
              Federal matching (Title IV-E) adds ~35% more, bringing total spending to ~$1.3B.
              The money did not go to foster families. It went to bureaucracy and consultants.
            </p>
          </div>
        </div>
      )}

      {/* Consultants Section */}
      {activeSection === 'consultants' && (
        <div className="space-y-8">
          <div className="border border-gray-800 p-4">
            <h2 className="text-white font-medium mb-2">Who Gets the Consulting Contracts</h2>
            <p className="text-gray-500 text-sm">
              Indiana paid <span className="text-green-500">$491.5M</span> to consulting firms statewide (FY2022-2025).
              DCS alone paid <span className="text-green-500">$250M</span> for IT and consulting.
            </p>
          </div>

          <div className="border border-gray-800 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-900">
                <tr>
                  <th className="text-left p-3 text-gray-400 font-medium">Vendor</th>
                  <th className="text-left p-3 text-gray-400 font-medium">Agency</th>
                  <th className="text-right p-3 text-gray-400 font-medium">Contracts</th>
                  <th className="text-right p-3 text-gray-400 font-medium">Total Paid</th>
                  <th className="text-left p-3 text-gray-400 font-medium">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {consultingPayments.map((vendor) => (
                  <tr key={vendor.vendor} className={`hover:bg-gray-900/50 ${vendor.note?.includes('FBI') ? 'bg-red-900/10' : ''}`}>
                    <td className="p-3 text-white">{vendor.vendor}</td>
                    <td className="p-3 text-gray-400">{vendor.agency}</td>
                    <td className="p-3 text-right font-mono text-white">{vendor.contracts}</td>
                    <td className="p-3 text-right font-mono text-green-500">{formatMoney(vendor.amount)}</td>
                    <td className="p-3 text-gray-500 text-xs">
                      {vendor.note?.includes('FBI') ? (
                        <span className="text-red-400">{vendor.note}</span>
                      ) : vendor.note || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Deloitte Deep Dive */}
          <div className="border border-gray-800 p-4">
            <h3 className="text-white font-medium mb-4">Deloitte: The Dominant Player</h3>
            <div className="font-mono text-sm text-gray-400 space-y-1">
              <p><span className="text-gray-600">├─</span> total_from_indiana <span className="text-green-500 ml-4">$187.6M</span></p>
              <p><span className="text-gray-600">├─</span> dcs_payments <span className="text-white ml-4">66</span></p>
              <p><span className="text-gray-600">├─</span> avg_payment <span className="text-green-500 ml-4">$1.07M</span></p>
              <p><span className="text-gray-600">└─</span> lobbyist <span className="text-gray-400 ml-4">Krieg DeVault LLP</span></p>
            </div>
            <p className="text-gray-400 text-sm mt-4">
              Deloitte&apos;s Indiana lobbyist is <span className="text-white">Krieg DeVault LLP</span>,
              led by the former 3-term Indiana GOP Chairman and a State Senator who was literally
              GOP Chairman until December 2024 - when he resigned to lobby for Deloitte.
            </p>
          </div>

          {/* FBI Investigation Note */}
          <div className="border border-gray-800 p-4">
            <h4 className="text-white font-medium mb-2">Active Federal Investigation</h4>
            <p className="text-sm text-gray-400">
              <span className="text-white">Carahsoft</span> (paid $31.5M by Indiana) was raided by the FBI
              in September 2024. The DOJ is investigating &quot;whether Carahsoft conspired with other companies
              to rig bids, inflate prices, overcharge, and defraud the Department of Defense.&quot;
              <span className="text-white"> Accenture</span> is also named in the investigation.
            </p>
          </div>
        </div>
      )}

      {/* Politicians Section */}
      {activeSection === 'politicians' && (
        <div className="space-y-8">
          <div className="border border-gray-800 p-4">
            <h2 className="text-white font-medium mb-2">Who Approved the Budgets</h2>
            <p className="text-gray-500 text-sm">The legislators and officials who signed off on +88% spending increases ($520M → $977M)</p>
          </div>

          <div className="border border-gray-800 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-900">
                <tr>
                  <th className="text-left p-3 text-gray-400 font-medium">Name</th>
                  <th className="text-left p-3 text-gray-400 font-medium">Role</th>
                  <th className="text-left p-3 text-gray-400 font-medium">Years</th>
                  <th className="text-left p-3 text-gray-400 font-medium">Action</th>
                  <th className="text-left p-3 text-gray-400 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {politicians.map((pol) => (
                  <tr key={pol.name} className="hover:bg-gray-900/50">
                    <td className="p-3 text-white">{pol.name}</td>
                    <td className="p-3 text-gray-400">{pol.role}</td>
                    <td className="p-3 text-gray-500 font-mono text-xs">{pol.years}</td>
                    <td className="p-3 text-gray-400 text-xs">{pol.action}</td>
                    <td className="p-3 text-gray-500 text-xs">{pol.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Campaign Contributions Note */}
          <div className="border border-gray-800 p-4">
            <h4 className="text-white font-medium mb-2">Campaign Contributions</h4>
            <p className="text-sm text-gray-400 mb-3">
              Firms with state contracts contribute to the politicians who approve those contracts:
            </p>
            <div className="font-mono text-sm text-gray-400 space-y-1">
              <p><span className="text-gray-600">├─</span> Faegre Drinker Biddle (law firm) <span className="text-green-500 ml-4">$131K</span> <span className="text-gray-500">to Holcomb</span></p>
              <p><span className="text-gray-600">├─</span> Indiana Deloitte employees <span className="text-green-500 ml-4">$14.3K</span> <span className="text-gray-500">to Deloitte PAC</span></p>
              <p><span className="text-gray-600">└─</span> RGA Right Direction PAC <span className="text-green-500 ml-4">$400K</span> <span className="text-gray-500">to Holcomb</span></p>
            </div>
          </div>

          <div className="border-l-2 border-gray-700 pl-4 py-2">
            <p className="text-gray-300 italic">&quot;DCS funding is locked in.&quot;</p>
            <p className="text-gray-500 text-sm mt-2">Todd Huston, House Speaker</p>
          </div>
        </div>
      )}

      {/* Revolving Door Section */}
      {activeSection === 'revolving' && (
        <div className="space-y-8">
          <div className="border border-gray-800 p-4">
            <h2 className="text-white font-medium mb-2">The Revolving Door</h2>
            <p className="text-gray-500 text-sm">Officials move between government and the consulting firms they regulate</p>
          </div>

          <div className="border border-gray-800 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-900">
                <tr>
                  <th className="text-left p-3 text-gray-400 font-medium">Name</th>
                  <th className="text-left p-3 text-gray-400 font-medium">Government Role</th>
                  <th className="text-left p-3 text-gray-400 font-medium">Private Sector</th>
                  <th className="text-left p-3 text-gray-400 font-medium">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {revolvingDoor.map((person) => (
                  <tr key={person.name} className="hover:bg-gray-900/50">
                    <td className="p-3 text-white">{person.name}</td>
                    <td className="p-3">
                      <span className="text-gray-400">{person.govRole}</span>
                      <span className="text-gray-600 text-xs ml-2">({person.govYears})</span>
                    </td>
                    <td className="p-3">
                      <span className="text-gray-400">{person.privateRole}</span>
                      <span className="text-gray-600 text-xs ml-2">({person.privateYears})</span>
                    </td>
                    <td className="p-3 text-gray-500 text-xs">{person.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* The Krieg DeVault Connection */}
          <div className="border border-gray-800 p-4">
            <h3 className="text-white font-medium mb-4">The Krieg DeVault Connection</h3>
            <p className="text-gray-400 mb-4">
              Deloitte&apos;s registered lobbyist in Indiana is not just connected to the Republican Party.
              <span className="text-white"> It IS the Republican Party.</span>
            </p>
            <div className="font-mono text-sm text-gray-400 space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-gray-600">├─</span>
                <div>
                  <span className="text-white">Michael McDaniel</span>
                  <span className="text-gray-500"> - 3-term GOP Chairman, 50 years in Indiana politics,
                  received Sagamore of the Wabash from Holcomb</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-gray-600">└─</span>
                <div>
                  <span className="text-white">Randy Head</span>
                  <span className="text-gray-500"> - 11-year State Senator, authored 70 laws,
                  was GOP Chairman until Dec 2024, resigned to return to lobbying</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-l-2 border-gray-700 pl-4 py-2">
            <p className="text-gray-300 italic">
              &quot;Heather&apos;s insights and relationships will help us to grow our government and
              public services business in Indiana.&quot;
            </p>
            <p className="text-gray-500 text-sm mt-2">Deloitte, on hiring former Pence staffer Heather Neal</p>
          </div>
        </div>
      )}

      {/* Opioid Excuse Section */}
      {activeSection === 'opioid' && (
        <div className="space-y-8">
          <div className="border border-gray-800 p-4">
            <h2 className="text-white font-medium mb-2">The Opioid Excuse</h2>
            <p className="text-gray-500 text-sm">Officials blame opioids. The data doesn&apos;t back it up.</p>
          </div>

          {/* Key Stats - terminal style */}
          <div className="font-mono text-sm mb-8">
            <p className="text-gray-500">OPIOID_NARRATIVE_VS_DATA</p>
            <div className="mt-2 text-gray-400">
              {opioidFindings.map((finding, idx) => (
                <p key={idx}>
                  <span className="text-gray-600">{idx === opioidFindings.length - 1 ? '└─' : '├─'}</span>
                  {' '}{finding.label} <span className="text-white ml-4">{finding.stat}</span>
                </p>
              ))}
            </div>
          </div>

          {/* What They Said vs What Data Shows */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="border border-gray-800 p-4">
              <h4 className="text-white font-medium mb-3">What Officials Claimed</h4>
              <ul className="text-sm space-y-2 text-gray-400">
                <li><span className="text-gray-600">-</span> Opioid crisis caused doubling of foster care intake</li>
                <li><span className="text-gray-600">-</span> More money needed to handle surge in cases</li>
                <li><span className="text-gray-600">-</span> 50%+ of removals linked to substance use</li>
                <li><span className="text-gray-600">-</span> Budget increases are for child safety</li>
              </ul>
            </div>
            <div className="border border-gray-800 p-4">
              <h4 className="text-white font-medium mb-3">What the Evidence Shows</h4>
              <ul className="text-sm space-y-2 text-gray-400">
                <li><span className="text-gray-600">-</span> 14% of removals were for housing issues alone</li>
                <li><span className="text-gray-600">-</span> Positive drug test = removal, even without endangerment</li>
                <li><span className="text-gray-600">-</span> State spends 10x more on intervention than prevention</li>
                <li><span className="text-gray-600">-</span> Budget increases went to consultants, not direct services</li>
              </ul>
            </div>
          </div>

          {/* CWG Report */}
          <div className="border border-gray-800 p-4">
            <h3 className="text-white font-medium mb-3">From the State&apos;s Own Report</h3>
            <p className="text-gray-400 mb-4 text-sm">
              <span className="text-white">Child Welfare Policy and Practice Group (CWG)</span> - hired by Indiana:
            </p>
            <div className="border-l-2 border-gray-700 pl-4 py-2 mb-4">
              <p className="text-gray-300 italic text-sm">
                &quot;Testing positive for illegal drugs commonly leads to removal even when no other
                evidence is provided to establish child endangerment.&quot;
              </p>
            </div>
            <div className="border-l-2 border-gray-700 pl-4 py-2">
              <p className="text-gray-300 italic text-sm">
                &quot;Indiana should bolster its ability to serve families without removing children,
                and narrow its maltreatment definitions to exclude neglect which is based solely on poverty.&quot;
              </p>
            </div>
          </div>

          {/* The Financial Incentive */}
          <div className="border border-gray-800 p-4">
            <h4 className="text-white font-medium mb-2">Follow the Money</h4>
            <div className="font-mono text-sm text-gray-400 space-y-1">
              <p><span className="text-gray-600">├─</span> More removals → more cases in IT → more consulting fees</p>
              <p><span className="text-gray-600">├─</span> More removals → more residential beds → more contractor revenue</p>
              <p><span className="text-gray-600">└─</span> Feds reimburse removal at higher rates than prevention</p>
            </div>
          </div>

          <div className="border-l-2 border-gray-700 pl-4 py-2">
            <p className="text-gray-300 italic">
              &quot;The presumption is immediate: Substance abuse equals child abuse equals removal.
              None of those presumptions are correct. All of them may apply in some cases.
              None applies in most cases.&quot;
            </p>
            <p className="text-gray-500 text-sm mt-2">Richard Wexler, National Coalition for Child Protection Reform</p>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-gray-800 pt-6 mt-12">
        <div className="flex flex-wrap gap-4 mb-6 text-sm">
          <Link href="/reports/INDIANA_INVESTIGATION_REPORT.md" className="text-gray-500 hover:text-gray-300">
            Full Report
          </Link>
          <span className="text-gray-700">|</span>
          <Link href="/reports/INDIANA_TIMELINE.md" className="text-gray-500 hover:text-gray-300">
            Timeline
          </Link>
          <span className="text-gray-700">|</span>
          <Link href="/reports/INDIANA_INVESTIGATION_PLAN.md" className="text-gray-500 hover:text-gray-300">
            Source Notes
          </Link>
          <span className="text-gray-700">|</span>
          <Link href="/investigation" className="text-gray-500 hover:text-gray-300">
            All Investigations
          </Link>
        </div>
        <p className="text-xs text-gray-600">
          Data sources: Indiana State Checkbook, FEC contribution records, Indiana Lobby Registration Commission,
          KFF Health News, Child Welfare Policy and Practice Group, National Coalition for Child Protection Reform,
          Indiana Capital Chronicle, Indianapolis Business Journal. Last updated January 2026.
        </p>
      </div>
    </div>
  );
}
