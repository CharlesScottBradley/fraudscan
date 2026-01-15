import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Rep. Robert Garcia Pay-to-Play Investigation | SomaliScan',
  description: 'Investigation into campaign donations and earmarks for Rep. Robert Garcia (D-CA-42), including connections to Shangri-La Industries federal fraud case.',
};

function formatMoney(amount: number | null): string {
  if (!amount) return '-';
  if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(1)}B`;
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(2)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

// Politician Data
const POLITICIAN = {
  name: 'Robert Garcia',
  party: 'Democrat',
  district: 'CA-42',
  area: 'Long Beach area',
  id: 'ef22daa8-9379-4efb-aca8-e0dbf7f175f1',
  bioguide: 'G000598',
  totalDonations: 1916,
  totalDonationAmount: 622737,
  totalEarmarks: 71,
  totalEarmarkAmount: 211700000,
};

// Comparison to average congressman
const EARMARK_COMPARISON = {
  avgEarmarkCount: 34.9,
  avgEarmarkAmount: 143493097,
  medianEarmarkAmount: 107135291,
  totalPoliticians: 394,
  garciaAmountRank: 61,
  garciaCountRank: 1, // #1 most earmarks of any congressman
};

// Pay-to-Play Connections
const CONNECTIONS = [
  {
    name: 'Shangri-La Industries',
    type: 'Developer (Under Federal Investigation)',
    flagged: true,
    donations: 14200,
    donors: [
      { name: 'Andrew Abdul-Wahab', role: 'CEO', amount: 6600 },
      { name: 'Dalia Wahab', role: 'Attorney', amount: 3300 },
      { name: 'Skyler Modrzejewski', role: 'Development Manager', amount: 3300 },
      { name: 'Matthew Modrzejewski', role: 'Director', amount: 1000 },
    ],
    relatedEarmarks: 41700000,
    earmarkDescription: 'Long Beach area construction (Shangri-La HQ: 442 W Ocean Blvd, Long Beach)',
    earmarkDetails: [
      { name: 'City of Long Beach projects', amount: 17100000 },
      { name: 'CSULB projects', amount: 9600000 },
      { name: 'Long Beach CC projects', amount: 5000000 },
      { name: 'City of Cudahy projects', amount: 6600000 },
      { name: 'City of Signal Hill projects', amount: 3400000 },
    ],
  },
  {
    name: 'Townsend Public Affairs',
    type: 'Lobbyist',
    flagged: false,
    donations: 6600,
    donors: [
      { name: 'Christopher Townsend', role: 'President', amount: 6600 },
    ],
    relatedEarmarks: 24000000,
    earmarkDescription: 'Client earmarks (City of Long Beach, Long Beach CC)',
    earmarkDetails: [],
  },
  {
    name: 'CSULB Executives',
    type: 'University Administration',
    flagged: false,
    donations: 3250,
    donors: [
      { name: 'Jane Conoley', role: 'President', amount: 2250 },
      { name: 'Scott Apel', role: 'VP', amount: 1000 },
    ],
    relatedEarmarks: 9600000,
    earmarkDescription: 'CSULB projects',
    earmarkDetails: [],
  },
  {
    name: 'Long Beach CC Executives',
    type: 'Community College Administration',
    flagged: false,
    donations: 750,
    donors: [
      { name: 'Mike Munoz', role: 'President', amount: 500 },
      { name: 'Uduak-Joe Ntuk', role: 'Trustee', amount: 250 },
    ],
    relatedEarmarks: 5000000,
    earmarkDescription: 'LBCC projects',
    earmarkDetails: [],
  },
  {
    name: 'Prima Waste Management',
    type: 'Municipal Contractor',
    flagged: false,
    donations: 5500,
    donors: [
      { name: 'Fernando Vasquez', role: 'President', amount: 5500 },
    ],
    relatedEarmarks: 17600000,
    earmarkDescription: 'Sewer infrastructure (potential subcontracting)',
    earmarkDetails: [],
  },
  {
    name: 'Real Estate Developers',
    type: 'Property Development',
    flagged: false,
    donations: 21500,
    donors: [
      { name: 'Waterford Property (Rawson, Drachman)', role: 'Developer', amount: 13200 },
      { name: 'Beach Front Property (Kyle Kazan)', role: 'Developer', amount: 8300 },
    ],
    relatedEarmarks: 3500000,
    earmarkDescription: 'Housing earmarks',
    earmarkDetails: [],
  },
];

// Shangri-La Fraud Details
const SHANGRI_LA_FRAUD = {
  fraudAmount: 160000000,
  grantAmount: 117000000,
  totalStateGrants: 114000000,
  arrestDate: 'October 2025',
  headquarters: '442 W Ocean Blvd, Long Beach, CA 90802',
  cfoPurchases: [
    { item: 'Beverly Hills mansion rent', amount: 46000, period: 'per month' },
    { item: 'Luxury goods and personal expenses', amount: null, period: '' },
  ],
  program: 'California Homekey homeless housing grants',
  allegation: 'Submitting fake bank records to obtain grants',
  longBeachProjects: ['Sonata Modern Flats (207 Seaside Way)'],
};

// Shangri-La Political Network - Who approved the grants
const POLITICAL_NETWORK = {
  stateLevel: [
    { name: 'CA Dept of Housing & Community Development (HCD)', role: 'Administered Homekey grants', director: 'Gustavo Velasquez', donations: null },
    { name: 'Governor Gavin Newsom', role: 'Created Homekey program', director: null, donations: null, note: '$3.78B program total' },
    { name: 'Attorney General Rob Bonta', role: 'Now suing Shangri-La for $114M', director: null, donations: null },
  ],
  countyLevel: [
    { name: 'Janice Hahn', role: 'LA County Supervisor', donations: 6500, years: '2014-2020', voted: true },
    { name: 'Hilda Solis', role: 'LA County Supervisor', donations: 1500, years: '2022', voted: true },
    { name: 'Kathryn Barger', role: 'LA County Supervisor', donations: null, years: '2024', voted: true },
    { name: 'Sheila Kuehl', role: 'LA County Supervisor', donations: 1500, years: '2018', voted: true },
    { name: 'Mark Ridley-Thomas', role: 'LA County Supervisor (convicted of corruption)', donations: 1500, years: '2016', voted: true },
  ],
  otherOfficials: [
    { name: 'Sheriff Robert Luna', role: 'LA County Sheriff', donations: 4500, note: 'Disbanded Public Corruption Unit after election' },
    { name: 'Traci Park', role: 'LA City Council', donations: 1800, note: 'Council approval' },
  ],
  federal: [
    { name: 'Rep. Robert Garcia', role: 'U.S. Congress (D-CA-42)', donations: 14200, note: '$41.7M in Long Beach area earmarks' },
  ],
};

// News Sources
const SOURCES = [
  {
    name: 'DOJ Press Release',
    url: 'https://www.justice.gov/usao-cdca/pr/beverly-hills-man-arrested-brentwood-man-charged-separate-criminal-cases-linked-fraud',
    description: 'Criminal charges announcement',
  },
  {
    name: 'LA Downtown News',
    url: 'https://www.ladowntownnews.com/news/former-downtown-cfo-arrested-man-accused-of-fraud-in-public-homelessness-funds-to-pay-credit/article_29a16e81-885c-449a-8770-423d3161292b.html',
    description: 'Detailed reporting on CFO arrest',
  },
  {
    name: 'The Current Report',
    url: 'https://thecurrentreport.com/shangri-la-political-pay-off-scandal/',
    description: 'Political donation analysis',
  },
  {
    name: 'ABC7',
    url: 'https://abc7.com/post/2-la-county-real-estate-developers-charged-separate-multimillion-dollar-housing-fraud-cases/18027429/',
    description: 'Developer fraud charges coverage',
  },
  {
    name: 'Daily News',
    url: 'https://www.dailynews.com/2024/03/26/embattled-la-developer-accuses-its-financial-chief-of-looting-40-million-intended-for-homeless-housing/',
    description: 'CFO accused of looting $40M',
  },
  {
    name: 'The Current Report (Political Network)',
    url: 'https://thecurrentreport.com/feds-indict-shangri-la-industries-executive-exposes-development-firms-role-in-buying-political-influence-donating-to-sheriff-luna-and-board-of-supervisors/',
    description: 'Sheriff Luna and Board of Supervisors donations',
  },
  {
    name: 'RealClearInvestigations',
    url: 'https://www.realclearinvestigations.com/articles/2025/12/11/newsomes_national_model_for_homeless_wracked_by_fraud_1152688.html',
    description: 'Newsom Homekey program fraud analysis',
  },
];

// Calculate totals
const totalLinkedDonations = CONNECTIONS.reduce((sum, c) => sum + c.donations, 0);
const totalLinkedEarmarks = CONNECTIONS.reduce((sum, c) => sum + c.relatedEarmarks, 0);

export const revalidate = 3600;

export default function CongressmanGarciaPage() {
  return (
    <div>
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-6">
        <Link href="/investigation" className="hover:text-gray-300">Investigations</Link>
        <span className="mx-2">/</span>
        <span className="text-white">Rep. Robert Garcia</span>
      </div>

      {/* Terminal-style stats */}
      <div className="font-mono text-sm mb-10">
        <p className="text-gray-500">PAY_TO_PLAY_ANALYSIS</p>
        <div className="mt-2 text-gray-400">
          <p><span className="text-gray-600">├─</span> politician <span className="text-white ml-4">{POLITICIAN.name} ({POLITICIAN.party[0]}-{POLITICIAN.district})</span></p>
          <p><span className="text-gray-600">├─</span> total_fec_donations <span className="text-white ml-4">{POLITICIAN.totalDonations.toLocaleString()}</span></p>
          <p><span className="text-gray-600">├─</span> total_donation_amount <span className="text-green-500 ml-4">{formatMoney(POLITICIAN.totalDonationAmount)}</span></p>
          <p><span className="text-gray-600">├─</span> total_earmarks <span className="text-white ml-4">{POLITICIAN.totalEarmarks}</span></p>
          <p><span className="text-gray-600">├─</span> total_earmark_amount <span className="text-green-500 ml-4">{formatMoney(POLITICIAN.totalEarmarkAmount)}</span></p>
          <p><span className="text-gray-600">├─</span> linked_donations <span className="text-yellow-400 ml-4">{formatMoney(totalLinkedDonations)}</span></p>
          <p><span className="text-gray-600">├─</span> linked_earmarks <span className="text-yellow-400 ml-4">{formatMoney(totalLinkedEarmarks)}</span></p>
          <p><span className="text-gray-600">└─</span> fraud_investigation <span className="text-red-400 ml-4">ACTIVE (Shangri-La Industries)</span></p>
        </div>
      </div>

      {/* Comparison to Average */}
      <div className="border border-yellow-800 bg-yellow-900/10 p-4 mb-8">
        <h3 className="text-yellow-400 font-medium mb-3">Earmark Volume: #1 in Congress</h3>
        <p className="text-sm text-gray-400 mb-4">
          Garcia has requested <strong className="text-white">more individual earmarks than any other member of Congress</strong> in our database.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="bg-gray-900/50 p-3 rounded">
            <p className="text-2xl font-mono text-white">{POLITICIAN.totalEarmarks}</p>
            <p className="text-xs text-gray-500">Garcia earmarks</p>
          </div>
          <div className="bg-gray-900/50 p-3 rounded">
            <p className="text-2xl font-mono text-gray-400">{EARMARK_COMPARISON.avgEarmarkCount}</p>
            <p className="text-xs text-gray-500">Avg congressman</p>
          </div>
          <div className="bg-gray-900/50 p-3 rounded">
            <p className="text-2xl font-mono text-yellow-400">2x</p>
            <p className="text-xs text-gray-500">Above average count</p>
          </div>
          <div className="bg-gray-900/50 p-3 rounded">
            <p className="text-2xl font-mono text-red-400">#1</p>
            <p className="text-xs text-gray-500">Rank by count</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-yellow-900/50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Total Amount:</span>
              <span className="text-green-500 font-mono ml-2">{formatMoney(POLITICIAN.totalEarmarkAmount)}</span>
              <span className="text-gray-600 ml-1">(avg: {formatMoney(EARMARK_COMPARISON.avgEarmarkAmount)})</span>
            </div>
            <div>
              <span className="text-gray-500">Amount Rank:</span>
              <span className="text-white ml-2">#{EARMARK_COMPARISON.garciaAmountRank} of {EARMARK_COMPARISON.totalPoliticians}</span>
              <span className="text-gray-600 ml-1">(top 15%)</span>
            </div>
            <div>
              <span className="text-gray-500">Above Median:</span>
              <span className="text-yellow-400 ml-2">+98%</span>
              <span className="text-gray-600 ml-1">({formatMoney(EARMARK_COMPARISON.medianEarmarkAmount)} median)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Alert - Shangri-La */}
      <div className="bg-red-900/20 border border-red-800 p-4 mb-8">
        <div className="flex items-start gap-3">
          <span className="text-red-500 text-xl font-bold">X</span>
          <div className="flex-1">
            <h2 className="text-red-400 font-medium mb-2">Active Federal Fraud Investigation</h2>
            <p className="text-sm text-gray-400 mb-3">
              <strong className="text-white">Shangri-La Industries</strong>, which donated{' '}
              <strong className="text-green-500">{formatMoney(CONNECTIONS[0].donations)}</strong> to Rep. Garcia,
              is currently under federal investigation for a{' '}
              <strong className="text-red-400">{formatMoney(SHANGRI_LA_FRAUD.fraudAmount)}</strong> fraud scheme.
            </p>
            <div className="bg-gray-900/50 p-3 rounded mb-3">
              <p className="text-sm text-gray-400">
                CFO <strong className="text-white">Cody Holmes</strong> was arrested in {SHANGRI_LA_FRAUD.arrestDate} for
                submitting fake bank records to obtain <strong className="text-green-500">{formatMoney(SHANGRI_LA_FRAUD.grantAmount)}</strong> in
                California Homekey homeless housing grants. Holmes allegedly used grant money for a{' '}
                <strong className="text-white">${SHANGRI_LA_FRAUD.cfoPurchases[0].amount?.toLocaleString()}/month</strong> Beverly Hills mansion
                and luxury purchases.
              </p>
            </div>
            <p className="text-xs text-gray-500">
              Garcia received {formatMoney(CONNECTIONS[0].donations)} from Shangri-La executives. Shangri-La is headquartered
              in Long Beach (Garcia&apos;s district) at 442 W Ocean Blvd. Garcia directed {formatMoney(CONNECTIONS[0].relatedEarmarks)} in
              Long Beach area construction earmarks - potential contract opportunities for the developer.
            </p>
          </div>
        </div>
      </div>

      {/* Politician Profile Link */}
      <div className="border border-gray-800 p-4 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white font-medium">{POLITICIAN.name}</h2>
            <p className="text-sm text-gray-400">
              {POLITICIAN.party}, {POLITICIAN.district} ({POLITICIAN.area})
            </p>
          </div>
          <Link
            href={`/politician/${POLITICIAN.id}`}
            className="px-4 py-2 border border-gray-700 hover:border-gray-600 text-gray-300 text-sm rounded transition-colors"
          >
            View Full Profile
          </Link>
        </div>
      </div>

      {/* Summary Table */}
      <div className="mb-8">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Donor-to-Earmark Connections Summary</h3>
        <div className="border border-gray-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left p-3 font-medium text-gray-400">Connection</th>
                <th className="text-left p-3 font-medium text-gray-400">Type</th>
                <th className="text-right p-3 font-medium text-gray-400">Donations</th>
                <th className="text-right p-3 font-medium text-gray-400">Related Earmarks</th>
                <th className="text-right p-3 font-medium text-gray-400">Ratio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {CONNECTIONS.map((c, idx) => (
                <tr key={idx} className={`hover:bg-gray-900/50 ${c.flagged ? 'bg-red-900/10' : ''}`}>
                  <td className="p-3">
                    <span className={c.flagged ? 'text-red-400 font-medium' : 'text-white'}>
                      {c.name}
                    </span>
                    {c.flagged && (
                      <span className="ml-2 text-xs text-red-500">FRAUD INVESTIGATION</span>
                    )}
                  </td>
                  <td className="p-3 text-gray-400 text-xs">{c.type}</td>
                  <td className="p-3 text-right font-mono text-green-500">{formatMoney(c.donations)}</td>
                  <td className="p-3 text-right font-mono text-green-500">{formatMoney(c.relatedEarmarks)}</td>
                  <td className="p-3 text-right font-mono text-yellow-400">
                    {c.donations > 0 ? `${Math.round(c.relatedEarmarks / c.donations)}:1` : '-'}
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-900/30 font-medium">
                <td className="p-3 text-gray-300" colSpan={2}>Total Linked</td>
                <td className="p-3 text-right font-mono text-green-500">{formatMoney(totalLinkedDonations)}</td>
                <td className="p-3 text-right font-mono text-green-500">{formatMoney(totalLinkedEarmarks)}</td>
                <td className="p-3 text-right font-mono text-yellow-400">
                  {Math.round(totalLinkedEarmarks / totalLinkedDonations)}:1
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Ratio shows earmark dollars per donation dollar. High ratios may indicate effective lobbying or concerning influence patterns.
        </p>
      </div>

      {/* Detailed Connections */}
      <div className="mb-8">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Detailed Donor Breakdown</h3>
        <div className="space-y-4">
          {CONNECTIONS.map((connection, idx) => (
            <div
              key={idx}
              className={`border p-4 ${
                connection.flagged
                  ? 'border-red-800 bg-red-900/10'
                  : 'border-gray-800'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className={connection.flagged ? 'text-red-400 font-medium' : 'text-white font-medium'}>
                    {connection.name}
                  </h4>
                  <p className="text-xs text-gray-500">{connection.type}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-green-500">{formatMoney(connection.donations)}</p>
                  <p className="text-xs text-gray-500">in donations</p>
                </div>
              </div>

              {/* Individual Donors */}
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-2">DONORS</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {connection.donors.map((donor, dIdx) => (
                    <div key={dIdx} className="flex justify-between text-sm bg-gray-900/30 px-3 py-1.5 rounded">
                      <span className="text-gray-300">
                        {donor.name}
                        <span className="text-gray-600 text-xs ml-2">({donor.role})</span>
                      </span>
                      <span className="font-mono text-green-500">{formatMoney(donor.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Related Earmarks */}
              <div className="border-t border-gray-800 pt-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">RELATED EARMARKS</p>
                    <p className="text-sm text-gray-400">{connection.earmarkDescription}</p>
                  </div>
                  <p className="font-mono text-green-500 text-lg">{formatMoney(connection.relatedEarmarks)}</p>
                </div>
                {connection.earmarkDetails.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {connection.earmarkDetails.map((e, eIdx) => (
                      <div key={eIdx} className="flex justify-between text-sm">
                        <span className="text-gray-400">{e.name}</span>
                        <span className="font-mono text-gray-500">{formatMoney(e.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Shangri-La Deep Dive */}
      <div className="border border-red-900/50 bg-red-900/10 p-4 mb-8">
        <h3 className="text-red-400 font-medium mb-3">Shangri-La Industries Fraud Case</h3>

        {/* Long Beach Connection */}
        <div className="bg-gray-900/50 p-3 rounded mb-4">
          <p className="text-xs text-gray-500 mb-2">LONG BEACH CONNECTION</p>
          <p className="text-sm text-gray-400">
            <strong className="text-white">Headquarters:</strong> {SHANGRI_LA_FRAUD.headquarters} (Garcia&apos;s district)
          </p>
          <p className="text-sm text-gray-400 mt-1">
            <strong className="text-white">Known LB Projects:</strong> Sonata Modern Flats (207 Seaside Way)
          </p>
          <p className="text-sm text-gray-400 mt-1">
            <strong className="text-white">State Housing Grants:</strong> <span className="text-green-400 font-mono">{formatMoney(SHANGRI_LA_FRAUD.totalStateGrants)}</span> (before fraud collapse)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-500 mb-2">FRAUD SCHEME</p>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-500">Total Fraud:</span> <span className="text-red-400 font-mono">{formatMoney(SHANGRI_LA_FRAUD.fraudAmount)}</span></p>
              <p><span className="text-gray-500">Grants Obtained:</span> <span className="text-green-400 font-mono">{formatMoney(SHANGRI_LA_FRAUD.grantAmount)}</span></p>
              <p><span className="text-gray-500">Program:</span> <span className="text-white">{SHANGRI_LA_FRAUD.program}</span></p>
              <p><span className="text-gray-500">Arrest Date:</span> <span className="text-white">{SHANGRI_LA_FRAUD.arrestDate}</span></p>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-2">ALLEGATION</p>
            <p className="text-sm text-gray-400">{SHANGRI_LA_FRAUD.allegation}</p>
            <p className="text-xs text-gray-500 mt-3 mb-2">CFO EXPENDITURES</p>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>Beverly Hills mansion: ${SHANGRI_LA_FRAUD.cfoPurchases[0].amount?.toLocaleString()}/month</li>
              <li>Luxury goods and personal expenses</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-red-900/50 pt-3 mt-3">
          <p className="text-xs text-gray-500 mb-2">DONATIONS TO GARCIA FROM SHANGRI-LA</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {CONNECTIONS[0].donors.map((donor, idx) => (
              <div key={idx} className="bg-gray-900/50 p-2 rounded text-center">
                <p className="text-white text-sm">{donor.name.split(' ').slice(-1)[0]}</p>
                <p className="text-xs text-gray-500">{donor.role}</p>
                <p className="font-mono text-green-500">{formatMoney(donor.amount)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Shangri-La Political Network */}
      <div className="border border-gray-800 p-4 mb-8">
        <h3 className="text-white font-medium mb-4">Shangri-La Political Donation Network</h3>
        <p className="text-sm text-gray-400 mb-4">
          Garcia is one of many politicians who received donations from Shangri-La executives.
          The company donated to officials at every level who approved or could influence their $114M in state grants.
        </p>

        {/* Federal */}
        <div className="mb-4">
          <p className="text-xs text-red-400 mb-2">FEDERAL (GARCIA)</p>
          <div className="bg-red-900/20 border border-red-900/50 p-3 rounded">
            {POLITICAL_NETWORK.federal.map((official, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <div>
                  <span className="text-red-400 font-medium">{official.name}</span>
                  <span className="text-gray-500 text-xs ml-2">({official.role})</span>
                </div>
                <div className="text-right">
                  <span className="font-mono text-green-500">{formatMoney(official.donations)}</span>
                  <p className="text-xs text-gray-500">{official.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* County Level */}
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2">LA COUNTY SUPERVISORS (Voted to approve TEFRA funding)</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {POLITICAL_NETWORK.countyLevel.map((official, idx) => (
              <div key={idx} className="bg-gray-900/30 p-2 rounded flex justify-between items-center">
                <div>
                  <span className="text-white text-sm">{official.name}</span>
                  {official.role.includes('convicted') && (
                    <span className="text-red-500 text-xs ml-1">(convicted)</span>
                  )}
                  <p className="text-xs text-gray-600">{official.years}</p>
                </div>
                <span className="font-mono text-green-500 text-sm">
                  {official.donations ? formatMoney(official.donations) : 'contributions'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Other Officials */}
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2">OTHER OFFICIALS</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {POLITICAL_NETWORK.otherOfficials.map((official, idx) => (
              <div key={idx} className="bg-gray-900/30 p-2 rounded">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-white text-sm">{official.name}</span>
                    <p className="text-xs text-gray-600">{official.role}</p>
                  </div>
                  <span className="font-mono text-green-500 text-sm">{formatMoney(official.donations)}</span>
                </div>
                {official.note && (
                  <p className="text-xs text-yellow-500 mt-1">{official.note}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* State Level */}
        <div>
          <p className="text-xs text-gray-500 mb-2">STATE LEVEL (Grant administration)</p>
          <div className="space-y-1 text-sm">
            {POLITICAL_NETWORK.stateLevel.map((entity, idx) => (
              <div key={idx} className="flex justify-between text-gray-400">
                <span>{entity.name}</span>
                <span className="text-gray-500">{entity.role}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="border-t border-gray-800 mt-4 pt-4">
          <p className="text-xs text-gray-500">
            Total known Shangri-La political donations: ~$31,000+ to local/county officials, plus $14,200 to Garcia (federal).
            All five LA County Supervisors who voted to approve funding received donations. Sheriff Luna disbanded the
            Public Corruption Unit after receiving $4,500.
          </p>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-yellow-900/20 border border-yellow-800 p-4 mb-8">
        <div className="flex items-start gap-3">
          <span className="text-yellow-500 text-xl">i</span>
          <div>
            <h2 className="text-yellow-400 font-medium mb-1">Important Context</h2>
            <p className="text-sm text-gray-400">
              Campaign donations do not prove quid pro quo or corruption. Earmarks go through official congressional processes.
              Many donors support politicians who share their policy priorities. This analysis documents publicly available
              connections between donors and earmarks. Rep. Garcia has not been charged with any wrongdoing.
            </p>
          </div>
        </div>
      </div>

      {/* Sources */}
      <div className="border border-gray-800 p-4 mb-8">
        <h3 className="text-white font-medium mb-3">Sources</h3>
        <ul className="space-y-2 text-sm">
          {SOURCES.map((source, idx) => (
            <li key={idx}>
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                {source.name}
              </a>
              <span className="text-gray-600 ml-2">- {source.description}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 pt-3 border-t border-gray-800">
          <p className="text-xs text-gray-500">
            Donation data from FEC filings. Earmark data from congressional appropriations records.
            Found an error? <Link href="/corrections" className="text-blue-400 hover:underline">Submit a correction</Link>.
          </p>
        </div>
      </div>

      {/* Related Links */}
      <div className="border-t border-gray-800 pt-6">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Related</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <Link
            href={`/politician/${POLITICIAN.id}`}
            className="text-green-500 hover:text-green-400"
          >
            Garcia Full Profile
          </Link>
          <span className="text-gray-700">|</span>
          <Link href="/investigation" className="text-gray-400 hover:text-green-400">
            All Investigations
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
