import Link from 'next/link';

function formatMoney(amount: number | null): string {
  if (!amount) return '-';
  if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(1)}B`;
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

// Fraud hub buildings data
const FRAUD_HUBS = [
  {
    address: '1433 E Franklin Ave',
    name: 'Franklin Ave Fraud Hub',
    businesses: 2,
    total_ppp: 2705339,
    key_tenant: 'Midwest Quality Home Care ($2.6M, 500 jobs)',
    damage_status: 'Not damaged',
    notes: 'Multiple home health + daycare in single building'
  },
  {
    address: '312 W Lake St',
    name: 'West Lake Mall',
    businesses: 5,
    total_ppp: 355626,
    key_tenant: '5 daycares: Gedi, MN Childcare, Tayo, Intisar, Nuna',
    damage_status: 'On riot corridor',
    notes: 'Five separate daycare operations in one building'
  },
  {
    address: '1516 E Lake St',
    name: 'Karmel Square (Somali Mall)',
    businesses: 2,
    total_ppp: 122893,
    key_tenant: 'Alpha Home Health + Lakes Adult Day Care',
    damage_status: 'On riot corridor',
    notes: 'Major Somali commercial center'
  },
  {
    address: '1229 E Lake St',
    name: 'Kadiye Network Hub',
    businesses: 4,
    total_ppp: 1289960,
    key_tenant: 'Comfort Services LLC ($1.1M, Gandi Kediye)',
    damage_status: 'On riot corridor',
    notes: 'Connected to FOF defendant family'
  },
  {
    address: '125 W Broadway',
    name: 'Broadway Hub',
    businesses: 1,
    total_ppp: 507500,
    key_tenant: 'HealthMax Home Health Care Services',
    damage_status: 'On riot corridor',
    notes: 'Claims 200 employees'
  },
  {
    address: '2100 W Broadway',
    name: 'Broadway Commercial',
    businesses: 1,
    total_ppp: 248488,
    key_tenant: 'Caring Heart Home Healthcare',
    damage_status: 'On riot corridor',
    notes: 'Home health operation'
  },
  {
    address: '2910 Pillsbury Ave S',
    name: '53-Entity Building',
    businesses: 53,
    total_ppp: 955077,
    key_tenant: 'Isra Home Care + 52 others',
    damage_status: 'Near corridor',
    notes: 'Extreme clustering - 53 PPP recipients at one address'
  }
];

// Industry breakdown
const INDUSTRY_BREAKDOWN = [
  { industry: 'Home Health Care', naics: '621610', count: 42, ppp: 16845677, percent: 60.8 },
  { industry: 'Other Social Services', naics: '624190', count: 14, ppp: 5864086, percent: 21.2 },
  { industry: 'Adult Day Care', naics: '624120', count: 7, ppp: 3229976, percent: 11.7 },
  { industry: 'Child Day Care', naics: '624410', count: 23, ppp: 1690458, percent: 6.1 },
  { industry: 'Nursing Care', naics: '623110', count: 1, ppp: 33860, percent: 0.1 },
  { industry: 'Mental Health', naics: '621112', count: 2, ppp: 28551, percent: 0.1 }
];

// Post-riot construction
const POST_RIOT_BUILDS = [
  { address: '3536 Nicollet Ave', owner: '3536 NICOLLET LLC', year: 2022, value: 34000000, type: 'Luxury Apartments' },
  { address: '500 W Lake St', owner: '500 WEST LAKE STREET APTS LP', year: 2021, value: 23200000, type: 'Apartments' },
  { address: '1516 E Lake St', owner: 'KARMEL SQUARE LLC', year: 2021, value: 23625000, type: 'Somali Mall' },
  { address: '3121 Lake St E', owner: 'RICE FAMILY LTD PTNRSHP', year: 2022, value: 3600000, type: 'Walgreens' },
  { address: '2610 Lake St E', owner: 'MINNEHAHA HOLDING ASSOC', year: 2021, value: 2400000, type: 'Commercial' },
  { address: '2906 Chicago Ave', owner: 'AFC ENTERPRISES (Popeyes)', year: 2022, value: 1600000, type: 'Fast Food' },
  { address: '2726 Lake St E', owner: 'GRAY DOG HOLDINGS', year: 2020, value: 1092500, type: 'Commercial' }
];

// Kadiye network
const KADIYE_NETWORK = [
  { entity: 'Comfort Services LLC', address: '1229 E Lake St', ppp: 1099188, jobs: 150, connection: 'Gandi Kediye (registered agent)' },
  { entity: 'Kadiye Logistics Inc', address: 'Burnsville', ppp: 30800, jobs: 16, connection: 'Family business' },
  { entity: 'Miski Kadiye', address: 'Minneapolis', ppp: 28142, jobs: 2, connection: 'Double-dipped (2 loans)' }
];

// Timeline
const TIMELINE = [
  { date: 'May 25, 2020', event: 'George Floyd killed; riots begin', type: 'trigger' },
  { date: 'May 27-29, 2020', event: '1,500+ buildings damaged or destroyed across Minneapolis', type: 'damage' },
  { date: 'Apr 2020 - Aug 2020', event: 'PPP Round 1: $27.7M flows to fraud-pattern businesses on corridors', type: 'ppp' },
  { date: 'Jan 2021 - Mar 2021', event: 'PPP Round 2: Additional funding to same businesses', type: 'ppp' },
  { date: '2021-2022', event: '$92M in new construction on riot corridors', type: 'rebuild' },
  { date: 'Sept 2022', event: 'Feeding Our Future defendants charged ($250M fraud)', type: 'prosecution' },
  { date: '2023-2024', event: 'Home health and daycare businesses continue operating at hub addresses', type: 'ongoing' },
  { date: 'Sept 2025', event: 'HSS and EIDBI fraud charges reveal connected schemes', type: 'prosecution' }
];

export const revalidate = 3600;

export default function GeorgeFloydSwitcharooPage() {
  const totalFraudPPP = INDUSTRY_BREAKDOWN.reduce((sum, i) => sum + i.ppp, 0);
  const totalFraudBusinesses = INDUSTRY_BREAKDOWN.reduce((sum, i) => sum + i.count, 0);
  const totalHubPPP = FRAUD_HUBS.reduce((sum, h) => sum + h.total_ppp, 0);
  const totalPostRiotValue = POST_RIOT_BUILDS.reduce((sum, b) => sum + b.value, 0);

  return (
    <div>
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-6">
        <Link href="/investigation" className="hover:text-gray-300">Investigations</Link>
        <span className="mx-2">/</span>
        <span className="text-white">The George Floyd Switcharoo</span>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold text-white mb-2">The George Floyd Switcharoo</h1>
      <p className="text-gray-400 mb-8">How government relief for riot-damaged corridors became a fraud incubator</p>

      {/* Terminal-style stats */}
      <div className="font-mono text-sm mb-10">
        <p className="text-gray-500">GF_SWITCHAROO_INVESTIGATION</p>
        <div className="mt-2 text-gray-400">
          <p><span className="text-gray-600">├─</span> corridors_analyzed <span className="text-white ml-4">5 (Lake, Broadway, Chicago, Nicollet, Franklin)</span></p>
          <p><span className="text-gray-600">├─</span> fraud_pattern_businesses <span className="text-red-400 ml-4">{totalFraudBusinesses}</span></p>
          <p><span className="text-gray-600">├─</span> fraud_pattern_ppp <span className="text-green-500 ml-4">{formatMoney(totalFraudPPP)}</span></p>
          <p><span className="text-gray-600">├─</span> fraud_hub_buildings <span className="text-yellow-400 ml-4">7 identified</span></p>
          <p><span className="text-gray-600">├─</span> hub_ppp_concentration <span className="text-green-500 ml-4">{formatMoney(totalHubPPP)}</span></p>
          <p><span className="text-gray-600">├─</span> post_riot_construction <span className="text-green-500 ml-4">{formatMoney(totalPostRiotValue)}</span></p>
          <p><span className="text-gray-600">└─</span> fof_connection <span className="text-red-400 ml-4">Kadiye network ($1.16M PPP)</span></p>
        </div>
      </div>

      {/* Alert Banner */}
      <div className="bg-red-900/20 border border-red-800 p-4 mb-8">
        <div className="flex items-start gap-3">
          <span className="text-red-500 text-xl">!</span>
          <div>
            <h2 className="text-red-400 font-medium mb-1">$27.7 Million to Fraud-Prone Industries</h2>
            <p className="text-sm text-gray-400">
              89 businesses in fraud-susceptible industries (home health, daycare, adult day care) received
              <span className="text-red-400 font-bold"> $27.7 million</span> in PPP loans on riot-damaged corridors.
              Many are concentrated at &quot;fraud hub&quot; addresses where multiple entities share a single building.
            </p>
          </div>
        </div>
      </div>

      {/* What is this */}
      <div className="border border-gray-800 p-4 mb-8">
        <h2 className="text-white font-medium mb-2">What is this investigation</h2>
        <p className="text-sm text-gray-400 leading-relaxed mb-3">
          The destruction following George Floyd&apos;s murder in May 2020 created a vacuum—and opportunists
          rushed to fill it. This investigation analyzes PPP loans, property records, and grant data to reveal
          how fraud-prone industries flooded the riot corridors with government money while legitimate businesses
          struggled to rebuild.
        </p>
        <p className="text-sm text-gray-400 leading-relaxed">
          The pattern mirrors the Feeding Our Future scheme: shell companies clustered at shared addresses,
          claiming implausible employee counts, billing government programs for services that may never have
          been rendered. The same family networks appear in both schemes.
        </p>
      </div>

      {/* Key Finding: 312 W Lake St */}
      <div className="bg-yellow-900/20 border border-yellow-800 p-4 mb-8">
        <h3 className="text-yellow-400 font-medium mb-2">Five Daycares, One Building: 312 W Lake St</h3>
        <p className="text-sm text-gray-400 mb-3">
          A single address on Lake Street houses <span className="text-yellow-400 font-bold">five separate daycare operations</span> that
          collectively received $356,000 in PPP:
        </p>
        <ul className="text-sm text-gray-400 space-y-1 ml-4">
          <li>• <strong>Gedi Adult Daycare Corporation</strong>: $105,200</li>
          <li>• <strong>Minnesota Childcare Center Inc</strong>: $100,597</li>
          <li>• <strong>Tayo Daycare Inc</strong>: $75,900</li>
          <li>• <strong>Nuna Childcare Center Inc</strong>: $42,232</li>
          <li>• <strong>Intisar Childcare Center Inc</strong>: $31,697</li>
        </ul>
        <p className="text-sm text-gray-500 mt-3">
          This clustering pattern is a hallmark of billing fraud—multiple &quot;separate&quot; businesses
          operating from the same location to maximize government payments.
        </p>
      </div>

      {/* Fraud Hub Buildings Table */}
      <div className="mb-8">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Fraud Hub Buildings on Riot Corridors</h3>
        <div className="border border-gray-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left p-3 font-medium text-gray-400">Address</th>
                <th className="text-left p-3 font-medium text-gray-400">Name</th>
                <th className="text-right p-3 font-medium text-gray-400">Businesses</th>
                <th className="text-right p-3 font-medium text-gray-400">Total PPP</th>
                <th className="text-left p-3 font-medium text-gray-400">Key Tenant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {FRAUD_HUBS.map((hub, idx) => (
                <tr key={idx} className="hover:bg-gray-900/50">
                  <td className="p-3 text-white font-mono text-xs">{hub.address}</td>
                  <td className="p-3 text-gray-400">{hub.name}</td>
                  <td className="p-3 text-right font-mono text-white">{hub.businesses}</td>
                  <td className="p-3 text-right font-mono text-green-500">{formatMoney(hub.total_ppp)}</td>
                  <td className="p-3 text-gray-400 text-xs">{hub.key_tenant}</td>
                </tr>
              ))}
              <tr className="bg-gray-900/30">
                <td className="p-3 text-gray-400 font-medium" colSpan={2}>Total at Hub Addresses</td>
                <td className="p-3 text-right font-mono text-white">{FRAUD_HUBS.reduce((s, h) => s + h.businesses, 0)}</td>
                <td className="p-3 text-right font-mono text-green-500">{formatMoney(totalHubPPP)}</td>
                <td className="p-3"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Kadiye Network Connection */}
      <div className="bg-purple-900/20 border border-purple-800 p-4 mb-8">
        <h3 className="text-purple-400 font-medium mb-2">FOF Connection: The Kadiye Network</h3>
        <p className="text-sm text-gray-400 mb-3">
          The Kadiye family name appears in both the Feeding Our Future prosecution and PPP loan recipients
          on the riot corridors. Abdikadir Kadiye was charged in the FOF case; the family also operates
          home health and logistics businesses that received PPP:
        </p>
        <div className="border border-gray-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-900/50">
              <tr>
                <th className="text-left p-2 font-medium text-gray-400">Entity</th>
                <th className="text-left p-2 font-medium text-gray-400">Address</th>
                <th className="text-right p-2 font-medium text-gray-400">PPP</th>
                <th className="text-right p-2 font-medium text-gray-400">Jobs</th>
                <th className="text-left p-2 font-medium text-gray-400">Connection</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {KADIYE_NETWORK.map((k, idx) => (
                <tr key={idx}>
                  <td className="p-2 text-white text-xs">{k.entity}</td>
                  <td className="p-2 text-gray-400 text-xs">{k.address}</td>
                  <td className="p-2 text-right font-mono text-green-500 text-xs">{formatMoney(k.ppp)}</td>
                  <td className="p-2 text-right font-mono text-white text-xs">{k.jobs}</td>
                  <td className="p-2 text-gray-500 text-xs">{k.connection}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Comfort Services LLC at 1229 E Lake St claimed 150 home health employees while operating from a
          small commercial suite. The registered agent &quot;Gandi Kediye&quot; shares the distinctive family surname
          with FOF defendant Abdikadir Kadiye.
        </p>
      </div>

      {/* Industry Breakdown */}
      <div className="mb-8">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Fraud-Pattern Industries on Riot Corridors</h3>
        <div className="border border-gray-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left p-3 font-medium text-gray-400">Industry</th>
                <th className="text-left p-3 font-medium text-gray-400">NAICS</th>
                <th className="text-right p-3 font-medium text-gray-400">Businesses</th>
                <th className="text-right p-3 font-medium text-gray-400">Total PPP</th>
                <th className="text-right p-3 font-medium text-gray-400">% of Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {INDUSTRY_BREAKDOWN.map((ind, idx) => (
                <tr key={idx} className="hover:bg-gray-900/50">
                  <td className="p-3 text-white">{ind.industry}</td>
                  <td className="p-3 text-gray-500 font-mono text-xs">{ind.naics}</td>
                  <td className="p-3 text-right font-mono text-white">{ind.count}</td>
                  <td className="p-3 text-right font-mono text-green-500">{formatMoney(ind.ppp)}</td>
                  <td className="p-3 text-right text-gray-400">{ind.percent}%</td>
                </tr>
              ))}
              <tr className="bg-gray-900/30">
                <td className="p-3 text-gray-400 font-medium" colSpan={2}>Total</td>
                <td className="p-3 text-right font-mono text-white">{totalFraudBusinesses}</td>
                <td className="p-3 text-right font-mono text-green-500">{formatMoney(totalFraudPPP)}</td>
                <td className="p-3 text-right text-gray-400">100%</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Home health care alone accounts for 60% of fraud-pattern PPP on the corridors.
        </p>
      </div>

      {/* Post-Riot Construction */}
      <div className="mb-8">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Post-Riot Construction ($92M)</h3>
        <p className="text-xs text-gray-500 mb-4">
          Properties built or rebuilt 2020-2024 on riot corridors. These represent the &quot;rebuild&quot; that
          government funds were supposed to support.
        </p>
        <div className="border border-gray-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left p-3 font-medium text-gray-400">Address</th>
                <th className="text-left p-3 font-medium text-gray-400">Owner</th>
                <th className="text-right p-3 font-medium text-gray-400">Year</th>
                <th className="text-right p-3 font-medium text-gray-400">Value</th>
                <th className="text-left p-3 font-medium text-gray-400">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {POST_RIOT_BUILDS.map((b, idx) => (
                <tr key={idx} className="hover:bg-gray-900/50">
                  <td className="p-3 text-white font-mono text-xs">{b.address}</td>
                  <td className="p-3 text-gray-400 text-xs">{b.owner}</td>
                  <td className="p-3 text-right font-mono text-white">{b.year}</td>
                  <td className="p-3 text-right font-mono text-green-500">{formatMoney(b.value)}</td>
                  <td className="p-3 text-gray-400 text-xs">{b.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* The Switcharoo Explained */}
      <div className="border border-gray-800 p-4 mb-8">
        <h3 className="text-white font-medium mb-3">The Switcharoo: What Happened</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-gray-900/50 p-3 rounded">
            <p className="text-red-400 font-medium mb-2">Before: May 2020</p>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• Retail shops</li>
              <li>• Restaurants</li>
              <li>• Service businesses</li>
              <li>• Community organizations</li>
            </ul>
          </div>
          <div className="bg-gray-900/50 p-3 rounded">
            <p className="text-yellow-400 font-medium mb-2">During: 2020-2021</p>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• PPP funds distributed</li>
              <li>• Insurance payouts</li>
              <li>• Grant programs launched</li>
              <li>• Properties change hands</li>
            </ul>
          </div>
          <div className="bg-gray-900/50 p-3 rounded">
            <p className="text-green-400 font-medium mb-2">After: 2022-Present</p>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• 42 home health agencies</li>
              <li>• 23 daycare centers</li>
              <li>• 7 adult day care facilities</li>
              <li>• Medicaid billing machines</li>
            </ul>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-4">
          The riots didn&apos;t just destroy buildings; they created an opportunity for organized fraud to embed
          itself in the reconstruction, funded by the very government programs meant to help the community recover.
        </p>
      </div>

      {/* Timeline */}
      <div className="border border-gray-800 p-4 mb-8">
        <h3 className="text-white font-medium mb-3">Timeline</h3>
        <div className="space-y-3 text-sm">
          {TIMELINE.map((t, idx) => (
            <div key={idx} className="flex gap-4">
              <span className={`font-mono w-28 shrink-0 ${
                t.type === 'trigger' ? 'text-red-400' :
                t.type === 'damage' ? 'text-orange-400' :
                t.type === 'ppp' ? 'text-green-400' :
                t.type === 'rebuild' ? 'text-blue-400' :
                t.type === 'prosecution' ? 'text-purple-400' :
                'text-gray-500'
              }`}>{t.date}</span>
              <span className="text-gray-400">{t.event}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Questions Raised */}
      <div className="bg-blue-900/20 border border-blue-800 p-4 mb-8">
        <h3 className="text-blue-400 font-medium mb-2">Questions This Investigation Raises</h3>
        <ul className="text-sm text-gray-400 space-y-2">
          <li>• Why did 89 fraud-pattern businesses receive PPP on riot corridors with minimal scrutiny?</li>
          <li>• How did multiple daycare/home health operations end up clustered at single addresses?</li>
          <li>• Why does the Kadiye family appear in both FOF prosecutions AND corridor PPP recipients?</li>
          <li>• Are the 42 home health agencies on corridors billing Medicaid for legitimate services?</li>
          <li>• Who owns the properties housing these fraud hub buildings?</li>
        </ul>
      </div>

      {/* Data Sources */}
      <div className="border border-gray-800 p-4 mb-8">
        <h3 className="text-white font-medium mb-3">Data Sources</h3>
        <ul className="text-sm text-gray-400 space-y-2">
          <li>• <strong>PPP Loans:</strong> SBA PPP Loan Forgiveness Data (public)</li>
          <li>• <strong>Property Records:</strong> Hennepin County ArcGIS REST API</li>
          <li>• <strong>Damage Assessment:</strong> City of Minneapolis official damage list</li>
          <li>• <strong>FOF Defendants:</strong> DOJ press releases and indictments</li>
          <li>• <strong>Business Registrations:</strong> Minnesota Secretary of State</li>
        </ul>
      </div>

      {/* Related Links */}
      <div className="border-t border-gray-800 pt-6">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Related Investigations</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <Link href="/investigation/mn-medicaid-fraud" className="text-gray-400 hover:text-green-400">
            Minnesota Medicaid Fraud Wave
          </Link>
          <span className="text-gray-700">|</span>
          <Link href="/investigation/address-clusters" className="text-gray-400 hover:text-green-400">
            Address Clusters
          </Link>
          <span className="text-gray-700">|</span>
          <Link href="/investigation/2104-park-ave" className="text-gray-400 hover:text-green-400">
            2104 Park Ave Cluster
          </Link>
          <span className="text-gray-700">|</span>
          <Link href="/investigation" className="text-gray-400 hover:text-green-400">
            All Investigations
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-gray-800">
        <p className="text-xs text-gray-600">
          Investigation ID: SS-2026-GF-SWITCHAROO | Last updated: January 2026 |
          All data from public sources. This investigation identifies patterns; it does not allege
          that any specific business committed fraud. Some businesses may be operating legitimately.
        </p>
      </div>
    </div>
  );
}
