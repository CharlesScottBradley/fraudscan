import { supabase } from '@/lib/supabase';
import Link from 'next/link';

function formatMoney(amount: number | null): string {
  if (!amount) return '-';
  if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(2)}B`;
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

function formatNumber(num: number): string {
  return num.toLocaleString();
}

interface Committee {
  cmte_id: string;
  name: string;
  committee_type: string | null;
  party: string | null;
  retired_donation_count: number;
  total_retired_donations: number;
}

interface ExtremeDonor {
  name: string;
  city: string;
  state: string;
  donation_count: number;
  total_amount: number;
  donations_per_day: number;
}

// Static data from the investigation
const INVESTIGATION_STATS = {
  total_donations: 18260909,
  total_amount: 1887221621,
  unique_donors: 1306005,
  avg_donation: 103.35,
  winred_amount: 210469622,
  winred_pct: 11.2,
  max_single_day: 68.58, // Bruce Makowski's sustained rate
  max_per_day_avg: 68.58,
  volume_spike: 51, // Dec 2022 to Jan 2023 (~2,863 to 145,146)
  republican_pct: 88.8, // % going to Republican committees
};

// Top extreme donors (from public FEC data)
const EXTREME_DONORS: ExtremeDonor[] = [
  { name: 'Bruce Makowski', city: 'Clawson', state: 'MI', donation_count: 50065, total_amount: 106953, donations_per_day: 68.58 },
  { name: 'Brenda Lemmond', city: 'Durham', state: 'NC', donation_count: 14169, total_amount: 52108, donations_per_day: 51.71 },
  { name: 'Beverly Ford', city: 'Marietta', state: 'GA', donation_count: 36649, total_amount: 329943, donations_per_day: 48.48 },
  { name: 'Margaret McLendon', city: 'Richland', state: 'GA', donation_count: 12953, total_amount: 301759, donations_per_day: 48.33 },
  { name: 'Ruth Waymire', city: 'Odenville', state: 'AL', donation_count: 15257, total_amount: 71900, donations_per_day: 45.68 },
  { name: 'Virginia Hruza', city: 'Prescott', state: 'AZ', donation_count: 20618, total_amount: 214899, donations_per_day: 45.02 },
  { name: 'Donald Glenz', city: 'Spring', state: 'TX', donation_count: 10662, total_amount: 280702, donations_per_day: 36.77 },
  { name: 'Jo Ann Yancey', city: 'Conroe', state: 'TX', donation_count: 18061, total_amount: 468668, donations_per_day: 36.12 },
];

// Comparison with NOT EMPLOYED (partisan split)
const PARTISAN_COMPARISON = [
  { occupation: 'NOT EMPLOYED', dem_donations: 8226499, dem_amount: 950672857, rep_donations: 35265, rep_amount: 3200502 },
  { occupation: 'RETIRED', dem_donations: 1229822, dem_amount: 258912348, rep_donations: 9758567, rep_amount: 651177671 },
];

async function getCommittees(): Promise<Committee[]> {
  const { data, error } = await supabase
    .from('fec_committees')
    .select('*')
    .order('retired_donation_count', { ascending: false })
    .limit(15);

  if (error) {
    console.error('Error fetching committees:', error);
    return [];
  }

  return data || [];
}

export const revalidate = 3600;

export default async function RetiredArmyPage() {
  const committees = await getCommittees();

  return (
    <div>
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-6">
        <Link href="/investigation" className="hover:text-gray-300">Investigations</Link>
        <span className="mx-2">/</span>
        <span className="text-white">The Retired Army</span>
      </div>

      {/* Terminal-style stats */}
      <div className="font-mono text-sm mb-10">
        <p className="text-gray-500">RETIRED_ARMY_INVESTIGATION</p>
        <div className="mt-2 text-gray-400">
          <p><span className="text-gray-600">├─</span> total_anomalous_donations <span className="text-red-500 ml-4">{formatMoney(INVESTIGATION_STATS.total_amount)}</span></p>
          <p><span className="text-gray-600">├─</span> donation_count <span className="text-white ml-4">{formatNumber(INVESTIGATION_STATS.total_donations)}</span></p>
          <p><span className="text-gray-600">├─</span> unique_retired_donors <span className="text-white ml-4">{formatNumber(INVESTIGATION_STATS.unique_donors)}</span></p>
          <p><span className="text-gray-600">├─</span> max_sustained_rate <span className="text-red-400 ml-4">{INVESTIGATION_STATS.max_per_day_avg}/day for 2 years</span></p>
          <p><span className="text-gray-600">├─</span> jan_2023_volume_spike <span className="text-yellow-400 ml-4">{INVESTIGATION_STATS.volume_spike}x increase</span></p>
          <p><span className="text-gray-600">├─</span> republican_recipients <span className="text-red-400 ml-4">{INVESTIGATION_STATS.republican_pct}%</span></p>
          <p><span className="text-gray-600">└─</span> source <span className="text-gray-500 ml-4">FEC Individual Contributions (58M records)</span></p>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="bg-yellow-900/20 border border-yellow-800 p-4 mb-8">
        <div className="flex items-start gap-3">
          <span className="text-yellow-500 text-xl">&#x26A0;</span>
          <div>
            <h2 className="text-yellow-400 font-medium mb-1">Important Disclaimer</h2>
            <p className="text-sm text-gray-400">
              This report presents statistical analysis of publicly available FEC data. Unusual patterns do not prove wrongdoing.
              There may be legitimate explanations including batch processing artifacts, platform technical issues,
              or legitimately wealthy retirees with significant investment income or savings.
              The individuals and organizations referenced have not been charged with any crimes.
            </p>
          </div>
        </div>
      </div>

      {/* What is this */}
      <div className="border border-gray-800 p-4 mb-8">
        <h2 className="text-white font-medium mb-2">What is this investigation</h2>
        <p className="text-sm text-gray-400 leading-relaxed mb-3">
          Analysis of 58 million FEC contribution records reveals <strong className="text-white">$1.89 billion in political donations</strong> from
          individuals reporting &quot;RETIRED&quot; status - even more than the &quot;NOT EMPLOYED&quot; army. The data contains donation patterns that appear highly anomalous,
          including sustained rates averaging <strong className="text-white">68 donations per day</strong> for two years straight.
        </p>
        <p className="text-sm text-gray-400 leading-relaxed">
          Unlike the NOT EMPLOYED donations which flow to Democratic committees, <strong className="text-white">88.8% of RETIRED donations go to Republican committees</strong> -
          primarily through WinRed, the Trump JFCs, and the RNC.
        </p>
      </div>

      {/* Partisan Mirror Callout */}
      <div className="bg-purple-900/20 border border-purple-800 p-4 mb-8">
        <h3 className="text-purple-400 font-medium mb-2">The Partisan Mirror</h3>
        <p className="text-sm text-gray-400 mb-3">
          The &quot;NOT EMPLOYED&quot; and &quot;RETIRED&quot; armies are near-perfect partisan mirrors:
        </p>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="border border-blue-800 bg-blue-900/20 p-3 rounded">
            <p className="text-blue-400 font-medium">NOT EMPLOYED</p>
            <p className="text-gray-400">99.6% Democratic</p>
            <p className="text-gray-500 font-mono text-xs">$950M to Dem / $3M to Rep</p>
          </div>
          <div className="border border-red-800 bg-red-900/20 p-3 rounded">
            <p className="text-red-400 font-medium">RETIRED</p>
            <p className="text-gray-400">88.8% Republican</p>
            <p className="text-gray-500 font-mono text-xs">$651M to Rep / $259M to Dem</p>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Combined, these two &quot;non-working&quot; groups account for $3.64 billion - 59% of all itemized donations in our dataset.
        </p>
      </div>

      {/* Key Finding Callout */}
      <div className="bg-red-900/20 border border-red-800 p-4 mb-8">
        <h3 className="text-red-400 font-medium mb-2">68 Donations Per Day - For Two Years</h3>
        <p className="text-sm text-gray-400 mb-2">
          FEC records show <strong className="text-white">Bruce Makowski</strong> from Clawson, MI
          averaging 68.58 political donations <em>per day</em> from January 2023 through December 2024.
        </p>
        <p className="text-sm text-gray-500">
          That&apos;s one donation every <strong className="text-red-400">21 minutes</strong> around the clock,
          resulting in 50,065 total donations over 2 years. This is significantly higher than the top &quot;NOT EMPLOYED&quot; donor rate of 38/day.
        </p>
      </div>

      {/* Committee Distribution */}
      <div className="mb-8">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Where The Money Went</h3>
        <p className="text-xs text-gray-500 mb-4">
          Click committee name to view details. Unlike NOT EMPLOYED donations, RETIRED money flows primarily to Republican committees.
        </p>
        <div className="border border-gray-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left p-3 font-medium text-gray-400">Committee</th>
                <th className="text-left p-3 font-medium text-gray-400">Party</th>
                <th className="text-right p-3 font-medium text-gray-400">Donations</th>
                <th className="text-right p-3 font-medium text-gray-400">Amount</th>
                <th className="text-right p-3 font-medium text-gray-400">% of Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {committees.map((committee) => {
                const pctOfTotal = ((committee.retired_donation_count / INVESTIGATION_STATS.total_donations) * 100).toFixed(2);
                return (
                  <tr key={committee.cmte_id} className="hover:bg-gray-900/50">
                    <td className="p-3">
                      <Link
                        href={`/committees/${committee.cmte_id}`}
                        className="text-cyan-400 hover:text-cyan-300 hover:underline"
                      >
                        {committee.name}
                      </Link>
                      <span className="text-gray-600 text-xs ml-2">{committee.cmte_id}</span>
                    </td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        committee.party === 'Republican'
                          ? 'bg-red-900/40 text-red-400'
                          : committee.party === 'Democratic'
                          ? 'bg-blue-900/40 text-blue-400'
                          : 'bg-gray-800 text-gray-400'
                      }`}>
                        {committee.party || '-'}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono text-white">
                      {formatNumber(committee.retired_donation_count)}
                    </td>
                    <td className="p-3 text-right font-mono text-green-500">
                      {formatMoney(committee.total_retired_donations)}
                    </td>
                    <td className="p-3 text-right font-mono text-gray-400">
                      {pctOfTotal}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Extreme Donors Table */}
      <div className="mb-8">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Top &quot;Speed Demon&quot; Donors (35+ donations/day average)</h3>
        <p className="text-xs text-gray-500 mb-4">
          Data from public FEC Individual Contributions filings. Employment status is self-reported.
          RETIRED donors show MORE extreme patterns than NOT EMPLOYED donors.
        </p>
        <div className="border border-gray-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left p-3 font-medium text-gray-400">Donor</th>
                <th className="text-left p-3 font-medium text-gray-400">Location</th>
                <th className="text-right p-3 font-medium text-gray-400">Donations/Day</th>
                <th className="text-right p-3 font-medium text-gray-400">Total Donations</th>
                <th className="text-right p-3 font-medium text-gray-400">Total Given</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {EXTREME_DONORS.map((donor, idx) => (
                <tr key={idx} className="hover:bg-gray-900/50">
                  <td className="p-3 text-white">{donor.name}</td>
                  <td className="p-3 text-gray-400">{donor.city}, {donor.state}</td>
                  <td className={`p-3 text-right font-mono ${donor.donations_per_day > 50 ? 'text-red-400' : 'text-yellow-400'}`}>
                    {donor.donations_per_day.toFixed(2)}
                  </td>
                  <td className="p-3 text-right font-mono text-white">
                    {formatNumber(donor.donation_count)}
                  </td>
                  <td className="p-3 text-right font-mono text-green-500">
                    {formatMoney(donor.total_amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comparison with NOT EMPLOYED */}
      <div className="mb-8">
        <h3 className="text-sm font-medium text-gray-400 mb-4">NOT EMPLOYED vs RETIRED: Side by Side</h3>
        <div className="border border-gray-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left p-3 font-medium text-gray-400">Metric</th>
                <th className="text-right p-3 font-medium text-gray-400">NOT EMPLOYED</th>
                <th className="text-right p-3 font-medium text-gray-400">RETIRED</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              <tr className="hover:bg-gray-900/50">
                <td className="p-3 text-gray-400">Total Amount</td>
                <td className="p-3 text-right font-mono text-green-500">$1.75B</td>
                <td className="p-3 text-right font-mono text-green-500">$1.89B</td>
              </tr>
              <tr className="hover:bg-gray-900/50">
                <td className="p-3 text-gray-400">Donation Count</td>
                <td className="p-3 text-right font-mono text-white">16.3M</td>
                <td className="p-3 text-right font-mono text-white">18.3M</td>
              </tr>
              <tr className="hover:bg-gray-900/50">
                <td className="p-3 text-gray-400">Unique Donors</td>
                <td className="p-3 text-right font-mono text-white">804K</td>
                <td className="p-3 text-right font-mono text-white">1.3M</td>
              </tr>
              <tr className="hover:bg-gray-900/50">
                <td className="p-3 text-gray-400">Max Sustained Rate</td>
                <td className="p-3 text-right font-mono text-yellow-400">38/day</td>
                <td className="p-3 text-right font-mono text-red-400">68/day</td>
              </tr>
              <tr className="hover:bg-gray-900/50">
                <td className="p-3 text-gray-400">Primary Recipient Party</td>
                <td className="p-3 text-right"><span className="bg-blue-900/40 text-blue-400 text-xs px-2 py-0.5 rounded">Democratic (99.6%)</span></td>
                <td className="p-3 text-right"><span className="bg-red-900/40 text-red-400 text-xs px-2 py-0.5 rounded">Republican (88.8%)</span></td>
              </tr>
              <tr className="hover:bg-gray-900/50">
                <td className="p-3 text-gray-400">Top Platform</td>
                <td className="p-3 text-right text-gray-300">ActBlue</td>
                <td className="p-3 text-right text-gray-300">WinRed</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Timeline */}
      <div className="mb-8">
        <h3 className="text-sm font-medium text-gray-400 mb-4">The January 2023 Explosion</h3>
        <div className="border border-gray-800 p-4">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <span className="text-gray-500 font-mono w-24">Dec 2022</span>
              <div className="flex-1 h-4 bg-gray-800 rounded">
                <div className="h-4 bg-gray-600 rounded" style={{ width: '0.1%' }}></div>
              </div>
              <span className="text-gray-500 font-mono w-24 text-right">2,863</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-white font-mono w-24">Jan 2023</span>
              <div className="flex-1 h-4 bg-gray-800 rounded">
                <div className="h-4 bg-red-600 rounded" style={{ width: '6%' }}></div>
              </div>
              <span className="text-red-400 font-mono w-24 text-right">145,146</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-500 font-mono w-24">Oct 2024</span>
              <div className="flex-1 h-4 bg-gray-800 rounded">
                <div className="h-4 bg-red-600 rounded" style={{ width: '100%' }}></div>
              </div>
              <span className="text-red-400 font-mono w-24 text-right">2,617,858</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            Same pattern as NOT EMPLOYED: 51x increase from December 2022 to January 2023. This coincides with when bulk FEC data coverage begins in our dataset.
          </p>
        </div>
      </div>

      {/* Questions Section */}
      <div className="border border-gray-800 p-4 mb-8">
        <h3 className="text-white font-medium mb-3">Questions Raised by the Data</h3>
        <ul className="text-sm text-gray-400 space-y-2">
          <li className="flex gap-2">
            <span className="text-gray-600">1.</span>
            <span><strong className="text-gray-300">Partisan mirror patterns</strong> - Why do NOT EMPLOYED and RETIRED show near-opposite partisan splits? Is this organic behavior or coordinated?</span>
          </li>
          <li className="flex gap-2">
            <span className="text-gray-600">2.</span>
            <span><strong className="text-gray-300">More extreme than NOT EMPLOYED</strong> - Why do RETIRED donors show higher donation frequencies (68/day vs 38/day)?</span>
          </li>
          <li className="flex gap-2">
            <span className="text-gray-600">3.</span>
            <span><strong className="text-gray-300">Platform symmetry</strong> - ActBlue dominates NOT EMPLOYED; WinRed dominates RETIRED. Are both platforms seeing the same patterns?</span>
          </li>
          <li className="flex gap-2">
            <span className="text-gray-600">4.</span>
            <span><strong className="text-gray-300">Volume timing</strong> - Both groups exploded in January 2023. What caused this across both parties simultaneously?</span>
          </li>
        </ul>
        <p className="text-xs text-gray-600 mt-4">
          These questions do not establish that wrongdoing occurred, but suggest the need for enhanced verification and investigation on both sides.
        </p>
      </div>

      {/* Data Sources */}
      <div className="mb-8">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Data Sources</h3>
        <div className="border border-gray-800 p-4">
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-gray-300 font-medium mb-1">Primary Source</p>
              <p className="text-gray-500">
                <a href="https://www.fec.gov/data/browse-data/?tab=bulk-data" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 hover:underline">
                  FEC Individual Contributions Database
                </a>
                {' '}- Bulk data files containing all itemized individual contributions to federal committees.
              </p>
            </div>
            <div>
              <p className="text-gray-300 font-medium mb-1">Data Specification</p>
              <p className="text-gray-500">
                <a href="https://www.fec.gov/campaign-finance-data/contributions-individuals-file-description/" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 hover:underline">
                  FEC Individual Contributions File Description
                </a>
                {' '}- The <code className="bg-gray-800 px-1 rounded text-xs">OCCUPATION</code> field is self-reported by donors on contribution forms.
              </p>
            </div>
            <div>
              <p className="text-gray-300 font-medium mb-1">Records Analyzed</p>
              <p className="text-gray-500">
                58,207,350 individual contribution records from the 2023-2024 election cycle, filtered for <code className="bg-gray-800 px-1 rounded text-xs">OCCUPATION = &apos;RETIRED&apos;</code>.
              </p>
            </div>
            <div>
              <p className="text-gray-300 font-medium mb-1">Verification Links</p>
              <div className="flex flex-wrap gap-2 mt-1">
                <a href="https://www.fec.gov/data/committee/C00694323/" target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-1 bg-gray-800 text-cyan-400 hover:bg-gray-700 rounded">WinRed (FEC)</a>
                <a href="https://www.fec.gov/data/committee/C00873893/" target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-1 bg-gray-800 text-cyan-400 hover:bg-gray-700 rounded">Trump National JFC (FEC)</a>
                <a href="https://www.fec.gov/data/committee/C00003418/" target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-1 bg-gray-800 text-cyan-400 hover:bg-gray-700 rounded">RNC (FEC)</a>
                <a href="https://www.fec.gov/data/committee/C00027466/" target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-1 bg-gray-800 text-cyan-400 hover:bg-gray-700 rounded">NRSC (FEC)</a>
                <a href="https://www.fec.gov/data/committee/C00744946/" target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-1 bg-gray-800 text-cyan-400 hover:bg-gray-700 rounded">Harris Victory Fund (FEC)</a>
                <a href="https://api.open.fec.gov/developers/" target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-1 bg-gray-800 text-cyan-400 hover:bg-gray-700 rounded">FEC API</a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Investigation */}
      <div className="flex gap-4 mb-8">
        <Link
          href="/investigation/unemployed-army"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-900/30 hover:bg-blue-900/50 border border-blue-800 text-blue-400 text-sm rounded transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
          View &quot;Unemployed Army&quot; Investigation
        </Link>
        <Link
          href="/investigation"
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-700 hover:border-gray-600 text-gray-300 text-sm rounded transition-colors"
        >
          &#x2190; Back to Investigations
        </Link>
      </div>

      {/* Footer */}
      <div className="mt-12 pt-6 border-t border-gray-800">
        <p className="text-xs text-gray-600">
          Data source: FEC Individual Contributions (58.2M records analyzed). Investigation ID: ra-2024-001.
          This analysis is provided for informational purposes and raises questions for regulatory review - it is not an accusation of illegal conduct.
        </p>
      </div>
    </div>
  );
}
