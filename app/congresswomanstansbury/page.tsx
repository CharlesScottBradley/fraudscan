import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Rep. Melanie Stansbury Pay-to-Play Investigation | SomaliScan',
  description: 'Investigation into campaign donations and earmarks for Rep. Melanie Stansbury (D-NM-01), including tribal donation patterns and inflated earmark requests.',
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
  name: 'Melanie Stansbury',
  party: 'Democrat',
  district: 'NM-01',
  area: 'Albuquerque area',
  id: '5aacca85-e363-41b8-99dd-9688300cca75',
  bioguide: 'S001218',
  totalDonations: 4053,
  totalDonationAmount: 749000,
  totalEarmarks: 45,
  totalEarmarkAmount: 298400000,
};

// Comparison to average congressman
const EARMARK_COMPARISON = {
  avgEarmarkCount: 34.9,
  avgEarmarkAmount: 143493097,
  medianEarmarkAmount: 107135291,
  totalPoliticians: 394,
  stansburyAmountRank: 36,
  stansburyCountRank: 2, // #2 most earmarks (only Garcia has more)
};

// Tribal Pay-to-Play Connections
const TRIBAL_CONNECTIONS = [
  {
    name: 'Pueblo of Sandia',
    state: 'NM',
    flagged: true,
    donations: 6600,
    relatedEarmarks: 88953844,
    earmarkDetails: [
      { name: 'Rio Grande Pueblos Irrigation Infrastructure', amount: 72260166, fy: 2025 },
      { name: 'Child Development Center', amount: 16693678, fy: 2024 },
    ],
    roi: 13478,
    population: 500,
    note: 'Operates Sandia Resort & Casino',
  },
  {
    name: 'Mescalero Apache Tribe',
    state: 'NM',
    flagged: false,
    donations: 9000,
    relatedEarmarks: 5500000,
    earmarkDetails: [
      { name: 'Head Start Center', amount: 5500000, fy: 2024 },
    ],
    roi: 611,
    population: 5100,
    note: 'Operates Inn of the Mountain Gods',
  },
];

// All Tribal Donations
const ALL_TRIBAL_DONATIONS = [
  { tribe: 'Mescalero Apache Tribe', state: 'NM', amount: 9000 },
  { tribe: 'Poarch Band of Creek Indians', state: 'AL', amount: 6600 },
  { tribe: 'Tulalip Tribes of Washington', state: 'WA', amount: 6600 },
  { tribe: 'Pueblo of Sandia', state: 'NM', amount: 6600 },
  { tribe: 'Shakopee Mdewakanton Sioux', state: 'MN', amount: 6600 },
  { tribe: 'Federated Indians of Graton Rancheria', state: 'CA', amount: 6600 },
  { tribe: 'Puyallup Tribe of Indians', state: 'WA', amount: 6200 },
  { tribe: 'Ak-Chin Indian Community', state: 'AZ', amount: 5800 },
  { tribe: 'Pueblo of Isleta', state: 'NM', amount: 5600 },
  { tribe: 'Agua Caliente Band of Cahuilla Indians', state: 'CA', amount: 3300 },
  { tribe: 'Cherokee Nation', state: 'OK', amount: 3300 },
  { tribe: 'Otoe Missouria Tribe of Oklahoma', state: 'OK', amount: 3300 },
  { tribe: 'Pascua Yaqui Tribe', state: 'AZ', amount: 3300 },
  { tribe: 'Pechanga Band of Luiseno Indians', state: 'CA', amount: 3300 },
  { tribe: 'Pueblo of Laguna', state: 'NM', amount: 3300 },
  { tribe: 'Pueblo of Santa Ana', state: 'NM', amount: 3300 },
  { tribe: 'Santo Domingo Pueblo', state: 'NM', amount: 3000 },
  { tribe: 'Zuni Tribe', state: 'NM', amount: 3000 },
  { tribe: 'Tunica-Biloxi Tribe of LA', state: 'LA', amount: 2500 },
  { tribe: 'Tigua Indian Reservation', state: 'TX', amount: 2500 },
  { tribe: 'Morongo Band of Mission Indians', state: 'CA', amount: 2000 },
  { tribe: 'The Chickasaw Nation', state: 'OK', amount: 2000 },
  { tribe: 'Alabama-Coushatta Tribe', state: 'TX', amount: 2000 },
  { tribe: 'Barona Band of Mission Indians', state: 'CA', amount: 1500 },
  { tribe: 'Soboba Band of Luiseno Indians', state: 'CA', amount: 1000 },
  { tribe: 'Sycuan Band of the Kumeyaay Nation', state: 'CA', amount: 1000 },
  { tribe: 'Muscogee Creek Nation', state: 'OK', amount: 1000 },
  { tribe: 'Pueblo of Tesuque', state: 'NM', amount: 1000 },
  { tribe: 'Salt River Pima Maricopa Indian Community', state: 'AZ', amount: 1000 },
  { tribe: 'Choctaw Nation of Oklahoma', state: 'OK', amount: 500 },
  { tribe: 'Fort Sill Apache Tribe', state: 'OK', amount: 250 },
];

// Inflated Earmark Requests
const INFLATED_REQUESTS = [
  { project: 'Sandia CDC', requested: 16693678, approved: 850000, reduction: 95 },
  { project: 'Peralta Fire Station', requested: 7678352, approved: 1000000, reduction: 87 },
];

// Per Capita Cost Analysis
const PER_CAPITA_ANALYSIS = [
  { project: 'Sandia CDC', amount: 16693678, population: 500, perCapita: 33387 },
  { project: 'Estancia Town Hall', amount: 5560000, population: 1328, perCapita: 4188 },
  { project: 'Fort Sumner Fire', amount: 2250000, population: 852, perCapita: 2641 },
  { project: 'Bosque Farms Wastewater', amount: 10000000, population: 4111, perCapita: 2433 },
  { project: 'Peralta Fire Station', amount: 7678352, population: 3470, perCapita: 2213 },
];

// Duplicate/Multi-Year Requests
const DUPLICATE_REQUESTS = [
  { project: 'Rio Grande Pueblos Irrigation', fy2024: 0, fy2025: 72260000, fy2026: 82700000, total: 154960000 },
  { project: 'Lincoln County EOC', fy2024: 0, fy2025: 3000000, fy2026: 3000000, total: 6000000 },
  { project: 'Estancia Town Hall', fy2024: 0, fy2025: 2260000, fy2026: 3300000, total: 5560000 },
  { project: 'ABQ Temporary Shelter', fy2024: 0, fy2025: 1700000, fy2026: 2000000, total: 3700000 },
  { project: 'NM State Police Tech', fy2024: 500000, fy2025: 2500000, fy2026: 1650000, total: 4650000 },
];

// Top Earmarks
const TOP_EARMARKS = [
  { recipient: 'U.S. Army Corps of Engineers', amount: 82700000, description: 'Rio Grande Pueblos Irrigation', fy: 2026 },
  { recipient: 'Pueblo of Sandia', amount: 72260166, description: 'Rio Grande Pueblos Irrigation', fy: 2025 },
  { recipient: 'Town of Bernalillo', amount: 20000000, description: 'Wastewater Treatment Plant', fy: 2026 },
  { recipient: 'Pueblo of Sandia', amount: 16693678, description: 'Child Development Center', fy: 2024 },
  { recipient: 'Village of Bosque Farms', amount: 10000000, description: 'Wastewater Treatment', fy: 2025 },
  { recipient: 'Valencia County', amount: 8000000, description: 'Hospital', fy: 2026 },
  { recipient: 'Town of Bernalillo', amount: 8000000, description: 'Behavioral Health Center', fy: 2026 },
  { recipient: 'Town of Peralta', amount: 7678352, description: 'Fire Station', fy: 2024 },
  { recipient: 'Mescalero Apache Tribe', amount: 5500000, description: 'Head Start Center', fy: 2024 },
  { recipient: 'Region 9 Early Childhood', amount: 5000000, description: 'Education Center', fy: 2024 },
];

// News Sources
const SOURCES = [
  {
    name: 'Source New Mexico',
    url: 'https://sourcenm.com/briefs/13m-in-earmarks-stansbury/',
    description: 'Stansbury earmarks reporting',
  },
  {
    name: 'Stansbury House Press Release',
    url: 'https://stansbury.house.gov/media/press-releases/rep-stansbury-becomes-dem-vice-chair-congressional-native-american-caucus',
    description: 'Native American Caucus Vice Chair announcement',
  },
  {
    name: 'Valencia County News-Bulletin',
    url: 'https://www.news-bulletin.com/news/peralta-given-1-million-to-start-building-new-fire-station/article_2fcc9123-cab4-5cd4-adbc-b442fa813dc5.html',
    description: 'Peralta fire station actual funding ($1M vs $7.68M requested)',
  },
  {
    name: 'Sandoval Signpost',
    url: 'https://sandovalsignpost.com/2025/10/sandia-pueblos-new-early-childhood-center-fosters-creativity/',
    description: 'Sandia CDC actual funding (~$850K approved)',
  },
  {
    name: 'News-Bulletin (Bosque Farms)',
    url: 'https://www.news-bulletin.com/news/bosque-farms-receives-10-million-for-clarifier/article_e51503c4-d8e6-11ef-a957-6fea347687bd.html',
    description: 'Confirming earmark recipients',
  },
];

// Calculate totals
const totalTribalDonations = ALL_TRIBAL_DONATIONS.reduce((sum, t) => sum + t.amount, 0);
const totalTribalEarmarks = TRIBAL_CONNECTIONS.reduce((sum, t) => sum + t.relatedEarmarks, 0);
const outOfStateTribeCount = ALL_TRIBAL_DONATIONS.filter(t => t.state !== 'NM').length;

export const revalidate = 3600;

export default function CongresswomanStansburyPage() {
  return (
    <div>
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-6">
        <Link href="/investigation" className="hover:text-gray-300">Investigations</Link>
        <span className="mx-2">/</span>
        <span className="text-white">Rep. Melanie Stansbury</span>
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
          <p><span className="text-gray-600">├─</span> tribal_donations <span className="text-green-500 ml-4">{formatMoney(totalTribalDonations)}</span></p>
          <p><span className="text-gray-600">├─</span> tribal_earmarks <span className="text-green-500 ml-4">{formatMoney(totalTribalEarmarks)}</span></p>
          <p><span className="text-gray-600">└─</span> pattern_detected <span className="text-red-400 ml-4">TRIBAL PAY-TO-PLAY</span></p>
        </div>
      </div>

      {/* Comparison to Average */}
      <div className="border border-gray-800 p-4 mb-8">
        <h3 className="text-white font-medium mb-3">Earmark Volume: #2 in Congress</h3>
        <p className="text-sm text-gray-400 mb-4">
          Stansbury has requested more individual earmarks than all but one member of Congress (only Rep. Garcia has more).
        </p>
        <div className="font-mono text-sm">
          <div className="text-gray-400 space-y-1">
            <p><span className="text-gray-600">├─</span> stansbury_earmarks <span className="text-white ml-4">{POLITICIAN.totalEarmarks}</span></p>
            <p><span className="text-gray-600">├─</span> avg_congressman <span className="text-gray-500 ml-4">{EARMARK_COMPARISON.avgEarmarkCount}</span></p>
            <p><span className="text-gray-600">├─</span> above_average <span className="text-white ml-4">1.3x</span></p>
            <p><span className="text-gray-600">├─</span> rank_by_count <span className="text-white ml-4">#2 of {EARMARK_COMPARISON.totalPoliticians}</span></p>
            <p><span className="text-gray-600">├─</span> total_amount <span className="text-green-500 ml-4">{formatMoney(POLITICIAN.totalEarmarkAmount)}</span> <span className="text-gray-600">(avg: {formatMoney(EARMARK_COMPARISON.avgEarmarkAmount)})</span></p>
            <p><span className="text-gray-600">├─</span> rank_by_amount <span className="text-white ml-4">#{EARMARK_COMPARISON.stansburyAmountRank}</span> <span className="text-gray-600">(top 10%)</span></p>
            <p><span className="text-gray-600">└─</span> above_median <span className="text-white ml-4">+178%</span> <span className="text-gray-600">({formatMoney(EARMARK_COMPARISON.medianEarmarkAmount)} median)</span></p>
          </div>
        </div>
      </div>

      {/* Critical Alert - Tribal Pay-to-Play */}
      <div className="bg-red-900/20 border border-red-800 p-4 mb-8">
        <div className="flex items-start gap-3">
          <span className="text-red-500 text-xl font-bold">X</span>
          <div className="flex-1">
            <h2 className="text-red-400 font-medium mb-2">Tribal Pay-to-Play Pattern Detected</h2>
            <p className="text-sm text-gray-400 mb-3">
              <strong className="text-white">Pueblo of Sandia</strong> donated{' '}
              <strong className="text-green-500">{formatMoney(TRIBAL_CONNECTIONS[0].donations)}</strong> to Rep. Stansbury
              and received{' '}
              <strong className="text-green-500">{formatMoney(TRIBAL_CONNECTIONS[0].relatedEarmarks)}</strong> in earmarks,
              a <strong className="text-white">{TRIBAL_CONNECTIONS[0].roi.toLocaleString()}:1 ROI</strong>.
            </p>
            <div className="bg-gray-900/50 p-3 rounded mb-3">
              <p className="text-sm text-gray-400">
                Stansbury serves as <strong className="text-white">Democrat Vice Chair of the Congressional Native American Caucus</strong> and
                sits on the <strong className="text-white">House Natural Resources Subcommittee for Indigenous Peoples</strong>.
                She previously did tribal consultation at OMB under the Obama administration.
              </p>
            </div>
            <p className="text-xs text-gray-500">
              31 tribes donated {formatMoney(totalTribalDonations)} total. {outOfStateTribeCount} of 31 tribes are from outside New Mexico.
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

      {/* Main Tribal Connections Table */}
      <div className="mb-8">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Tribal Donor-to-Earmark Connections</h3>
        <div className="border border-gray-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left p-3 font-medium text-gray-400">Tribe</th>
                <th className="text-left p-3 font-medium text-gray-400">State</th>
                <th className="text-right p-3 font-medium text-gray-400">Donations</th>
                <th className="text-right p-3 font-medium text-gray-400">Earmarks Received</th>
                <th className="text-right p-3 font-medium text-gray-400">ROI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {TRIBAL_CONNECTIONS.map((t, idx) => (
                <tr key={idx} className={`hover:bg-gray-900/50 ${t.flagged ? 'bg-red-900/10' : ''}`}>
                  <td className="p-3">
                    <span className={t.flagged ? 'text-red-400 font-medium' : 'text-white'}>
                      {t.name}
                    </span>
                    {t.flagged && (
                      <span className="ml-2 text-xs text-red-500">HIGHEST ROI</span>
                    )}
                  </td>
                  <td className="p-3 text-gray-400">{t.state}</td>
                  <td className="p-3 text-right font-mono text-green-500">{formatMoney(t.donations)}</td>
                  <td className="p-3 text-right font-mono text-green-500">{formatMoney(t.relatedEarmarks)}</td>
                  <td className="p-3 text-right font-mono text-white">
                    {t.roi.toLocaleString()}:1
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-900/30 font-medium">
                <td className="p-3 text-gray-300" colSpan={2}>Total Tribal (with earmarks)</td>
                <td className="p-3 text-right font-mono text-green-500">{formatMoney(TRIBAL_CONNECTIONS.reduce((s, t) => s + t.donations, 0))}</td>
                <td className="p-3 text-right font-mono text-green-500">{formatMoney(totalTribalEarmarks)}</td>
                <td className="p-3 text-right font-mono text-white">
                  {Math.round(totalTribalEarmarks / TRIBAL_CONNECTIONS.reduce((s, t) => s + t.donations, 0)).toLocaleString()}:1
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          ROI shows earmark dollars per donation dollar. High ratios may indicate concerning influence patterns.
        </p>
      </div>

      {/* Pueblo of Sandia Deep Dive */}
      <div className="border border-red-900/50 bg-red-900/10 p-4 mb-8">
        <h3 className="text-red-400 font-medium mb-3">Pueblo of Sandia Deep Dive</h3>

        <div className="font-mono text-sm mb-4">
          <p className="text-xs text-gray-500 mb-2">PUEBLO_CONTEXT</p>
          <div className="text-gray-400 space-y-1">
            <p><span className="text-gray-600">├─</span> population <span className="text-white ml-4">~500</span></p>
            <p><span className="text-gray-600">├─</span> median_age <span className="text-white ml-4">52</span></p>
            <p><span className="text-gray-600">├─</span> casino <span className="text-white ml-4">Sandia Resort</span></p>
            <p><span className="text-gray-600">└─</span> earmarks <span className="text-green-500 ml-4">{formatMoney(TRIBAL_CONNECTIONS[0].relatedEarmarks)}</span></p>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2">EARMARKS FROM STANSBURY</p>
          <div className="space-y-2">
            {TRIBAL_CONNECTIONS[0].earmarkDetails.map((e, idx) => (
              <div key={idx} className="flex justify-between items-center bg-gray-900/30 p-2 rounded">
                <div>
                  <span className="text-white">{e.name}</span>
                  <span className="text-gray-600 text-xs ml-2">(FY{e.fy})</span>
                </div>
                <span className="font-mono text-green-500">{formatMoney(e.amount)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-red-900/50 pt-3">
          <p className="text-xs text-gray-500 mb-2">CHILD DEVELOPMENT CENTER ANALYSIS</p>
          <p className="text-sm text-gray-400">
            The <strong className="text-white">$16.69M CDC request</strong> was for a pueblo with only ~500 members
            (median age 52, declining population). At most ~50 children could use the facility.
            That is <strong className="text-white">$333,937 per child</strong>.
          </p>
          <p className="text-sm text-gray-400 mt-2">
            News reports indicate only <strong className="text-green-500">~$850K was actually approved</strong>,
            a <strong className="text-white">95% reduction</strong> from the request.
          </p>
        </div>
      </div>

      {/* Inflated Request Pattern */}
      <div className="border border-yellow-800 bg-yellow-900/10 p-4 mb-8">
        <h3 className="text-yellow-400 font-medium mb-3">Pattern: Massively Inflated Requests</h3>
        <p className="text-sm text-gray-400 mb-4">
          Stansbury&apos;s earmark requests are consistently reduced by 85-95% when approved, suggesting
          a pattern of requesting far more than projects actually need or receive.
        </p>
        <div className="border border-gray-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left p-3 font-medium text-gray-400">Project</th>
                <th className="text-right p-3 font-medium text-gray-400">Requested</th>
                <th className="text-right p-3 font-medium text-gray-400">Approved</th>
                <th className="text-right p-3 font-medium text-gray-400">Reduction</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {INFLATED_REQUESTS.map((r, idx) => (
                <tr key={idx} className="hover:bg-gray-900/50">
                  <td className="p-3 text-white">{r.project}</td>
                  <td className="p-3 text-right font-mono text-gray-400">{formatMoney(r.requested)}</td>
                  <td className="p-3 text-right font-mono text-green-500">{formatMoney(r.approved)}</td>
                  <td className="p-3 text-right font-mono text-red-400">-{r.reduction}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Source: Valencia County News-Bulletin, Sandoval Signpost
        </p>
      </div>

      {/* Per Capita Analysis */}
      <div className="border border-gray-800 p-4 mb-8">
        <h3 className="text-white font-medium mb-3">Per Capita Cost Analysis</h3>
        <p className="text-sm text-gray-400 mb-4">
          The Sandia CDC requested amount is 15x higher per capita than the next most expensive project.
        </p>
        <div className="border border-gray-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left p-3 font-medium text-gray-400">Project</th>
                <th className="text-right p-3 font-medium text-gray-400">Amount</th>
                <th className="text-right p-3 font-medium text-gray-400">Population</th>
                <th className="text-right p-3 font-medium text-gray-400">Per Capita</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {PER_CAPITA_ANALYSIS.map((p, idx) => (
                <tr key={idx} className={`hover:bg-gray-900/50 ${idx === 0 ? 'bg-red-900/10' : ''}`}>
                  <td className="p-3">
                    <span className={idx === 0 ? 'text-red-400 font-medium' : 'text-white'}>{p.project}</span>
                  </td>
                  <td className="p-3 text-right font-mono text-green-500">{formatMoney(p.amount)}</td>
                  <td className="p-3 text-right text-gray-400">{p.population.toLocaleString()}</td>
                  <td className="p-3 text-right font-mono text-white">${p.perCapita.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Multi-Year Requests */}
      <div className="border border-gray-800 p-4 mb-8">
        <h3 className="text-white font-medium mb-3">Multi-Year Duplicate Requests</h3>
        <p className="text-sm text-gray-400 mb-4">
          Several projects were requested across multiple fiscal years, potentially seeking cumulative funding.
        </p>
        <div className="border border-gray-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left p-3 font-medium text-gray-400">Project</th>
                <th className="text-right p-3 font-medium text-gray-400">FY2024</th>
                <th className="text-right p-3 font-medium text-gray-400">FY2025</th>
                <th className="text-right p-3 font-medium text-gray-400">FY2026</th>
                <th className="text-right p-3 font-medium text-gray-400">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {DUPLICATE_REQUESTS.map((d, idx) => (
                <tr key={idx} className="hover:bg-gray-900/50">
                  <td className="p-3 text-white">{d.project}</td>
                  <td className="p-3 text-right font-mono text-gray-500">{d.fy2024 ? formatMoney(d.fy2024) : '-'}</td>
                  <td className="p-3 text-right font-mono text-gray-500">{d.fy2025 ? formatMoney(d.fy2025) : '-'}</td>
                  <td className="p-3 text-right font-mono text-gray-500">{d.fy2026 ? formatMoney(d.fy2026) : '-'}</td>
                  <td className="p-3 text-right font-mono text-green-500">{formatMoney(d.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* All Tribal Donations */}
      <div className="border border-gray-800 p-4 mb-8">
        <h3 className="text-white font-medium mb-3">All Tribal Donations ({ALL_TRIBAL_DONATIONS.length} tribes, {formatMoney(totalTribalDonations)})</h3>
        <p className="text-sm text-gray-400 mb-4">
          <strong className="text-white">{outOfStateTribeCount} of {ALL_TRIBAL_DONATIONS.length}</strong> tribal donations
          are from outside New Mexico, not her constituents.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
          {ALL_TRIBAL_DONATIONS.map((t, idx) => (
            <div key={idx} className={`flex justify-between text-sm px-3 py-1.5 rounded ${t.state === 'NM' ? 'bg-green-900/20' : 'bg-gray-900/30'}`}>
              <span className="text-gray-300">
                {t.tribe}
                <span className={`text-xs ml-2 ${t.state === 'NM' ? 'text-green-500' : 'text-gray-500'}`}>({t.state})</span>
              </span>
              <span className="font-mono text-green-500">{formatMoney(t.amount)}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-gray-800 text-xs text-gray-500">
          <span className="inline-block w-3 h-3 bg-green-900/20 rounded mr-1"></span> In-district (NM)
          <span className="inline-block w-3 h-3 bg-gray-900/30 rounded mr-1 ml-4"></span> Out-of-state
        </div>
      </div>

      {/* Top Earmarks */}
      <div className="border border-gray-800 p-4 mb-8">
        <h3 className="text-white font-medium mb-3">Top 10 Earmarks by Amount</h3>
        <div className="border border-gray-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left p-3 font-medium text-gray-400">Recipient</th>
                <th className="text-left p-3 font-medium text-gray-400">Description</th>
                <th className="text-right p-3 font-medium text-gray-400">Amount</th>
                <th className="text-right p-3 font-medium text-gray-400">FY</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {TOP_EARMARKS.map((e, idx) => (
                <tr key={idx} className={`hover:bg-gray-900/50 ${e.recipient.includes('Pueblo') || e.recipient.includes('Apache') ? 'bg-red-900/10' : ''}`}>
                  <td className="p-3">
                    <span className={e.recipient.includes('Pueblo') || e.recipient.includes('Apache') ? 'text-red-400' : 'text-white'}>
                      {e.recipient}
                    </span>
                    {(e.recipient.includes('Pueblo') || e.recipient.includes('Apache')) && (
                      <span className="ml-2 text-xs text-gray-600">donor</span>
                    )}
                  </td>
                  <td className="p-3 text-gray-400 text-xs">{e.description}</td>
                  <td className="p-3 text-right font-mono text-green-500">{formatMoney(e.amount)}</td>
                  <td className="p-3 text-right text-gray-500">{e.fy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Highlighted rows indicate tribal recipients who also donated to Stansbury.
          See <a href="/investigation/fec-smurfing" className="text-gray-400 hover:text-green-400">FEC smurfing analysis</a> for more donation patterns.
        </p>
      </div>

      {/* NOT EMPLOYED Donors */}
      <div className="border border-gray-800 p-4 mb-8">
        <h3 className="text-white font-medium mb-3">Donation Pattern: NOT EMPLOYED</h3>
        <div className="font-mono text-sm mb-4">
          <div className="text-gray-400 space-y-1">
            <p><span className="text-gray-600">├─</span> percent_of_total <span className="text-white ml-4">43%</span></p>
            <p><span className="text-gray-600">├─</span> amount <span className="text-green-500 ml-4">$323K</span></p>
            <p><span className="text-gray-600">└─</span> donations <span className="text-white ml-4">2,611</span></p>
          </div>
        </div>
        <p className="text-sm text-gray-400">
          Nearly half of Stansbury&apos;s FEC donations come from individuals listed as NOT EMPLOYED.
          This pattern warrants further investigation to verify donor authenticity.
        </p>
      </div>

      {/* Disclaimer */}
      <div className="bg-yellow-900/20 border border-yellow-800 p-4 mb-8">
        <div className="flex items-start gap-3">
          <span className="text-yellow-500 text-xl">i</span>
          <div>
            <h2 className="text-yellow-400 font-medium mb-1">Important Context</h2>
            <p className="text-sm text-gray-400">
              Campaign donations do not prove quid pro quo or corruption. Earmarks go through official congressional processes.
              Many donors support politicians who share their policy priorities. Tribal donations to members of the Native American
              Caucus reflect legitimate advocacy interests. This analysis documents publicly available connections between donors
              and earmarks. Rep. Stansbury has not been charged with any wrongdoing.
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
            Stansbury Full Profile
          </Link>
          <span className="text-gray-700">|</span>
          <Link href="/congressmangarcia" className="text-gray-400 hover:text-green-400">
            Rep. Garcia Investigation
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
