import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import ToshiAdBanner from '../../components/ToshiAdBanner';

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
  unemployed_donation_count: number;
  total_unemployed_donations: number;
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
  total_donations: 16311395,
  total_amount: 1748347868,
  unique_donors: 804077,
  avg_donation: 107.18,
  actblue_amount: 691134441,
  actblue_pct: 37.6,
  max_single_day: 930,
  max_per_day_avg: 38.18,
  volume_spike: 252, // x increase Jan 2023
};

// Top extreme donors (from public FEC data)
const EXTREME_DONORS: ExtremeDonor[] = [
  { name: 'Edson Griswold', city: 'Denver', state: 'CO', donation_count: 9049, total_amount: 130242, donations_per_day: 38.18 },
  { name: 'Agnes Matenos', city: 'Peabody', state: 'MA', donation_count: 6791, total_amount: 43321, donations_per_day: 31.88 },
  { name: 'Gerald Farr', city: 'San Marcos', state: 'TX', donation_count: 14997, total_amount: 207031, donations_per_day: 20.57 },
  { name: 'Wendy Urbanowicz', city: 'Vancouver', state: 'WA', donation_count: 14111, total_amount: 71137, donations_per_day: 19.33 },
  { name: 'Michelle Schweitzer', city: 'Seattle', state: 'WA', donation_count: 10035, total_amount: 56295, donations_per_day: 13.80 },
  { name: 'Melinda Dearman', city: 'San Antonio', state: 'TX', donation_count: 9888, total_amount: 42467, donations_per_day: 13.55 },
  { name: 'Sun Hae Kim', city: 'Flushing', state: 'NY', donation_count: 6681, total_amount: 15223, donations_per_day: 12.92 },
  { name: 'Carol Ann Roan Dennis', city: 'Oak Harbor', state: 'WA', donation_count: 5761, total_amount: 22765, donations_per_day: 11.76 },
];

// Single-day extremes
const SINGLE_DAY_EXTREMES = [
  { name: 'Robert Otto', city: 'Greensboro', state: 'NC', date: 'Nov 3, 2024', donations: 930 },
  { name: 'Christie Kaufmann', city: 'Manheim', state: 'PA', date: 'Nov 30, 2024', donations: 381 },
  { name: 'Amy Welden', city: 'Ashland', state: 'OR', date: 'Jan 21, 2024', donations: 338 },
  { name: 'Anne Davenport', city: 'Philadelphia', state: 'PA', date: 'Jun 8, 2023', donations: 330 },
];

async function getCommittees(): Promise<Committee[]> {
  const { data, error } = await supabase
    .from('fec_committees')
    .select('*')
    .order('unemployed_donation_count', { ascending: false })
    .limit(15);

  if (error) {
    console.error('Error fetching committees:', error);
    return [];
  }

  return data || [];
}

export const revalidate = 3600;

export default async function UnemployedArmyPage() {
  const committees = await getCommittees();

  return (
    <div>
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-6">
        <Link href="/investigation" className="hover:text-gray-300">Investigations</Link>
        <span className="mx-2">/</span>
        <span className="text-white">The Unemployed Army</span>
      </div>

      {/* Terminal-style stats */}
      <div className="font-mono text-sm mb-10">
        <p className="text-gray-500">UNEMPLOYED_ARMY_INVESTIGATION</p>
        <div className="mt-2 text-gray-400">
          <p><span className="text-gray-600">├─</span> total_anomalous_donations <span className="text-red-500 ml-4">{formatMoney(INVESTIGATION_STATS.total_amount)}</span></p>
          <p><span className="text-gray-600">├─</span> donation_count <span className="text-white ml-4">{formatNumber(INVESTIGATION_STATS.total_donations)}</span></p>
          <p><span className="text-gray-600">├─</span> unique_unemployed_donors <span className="text-white ml-4">{formatNumber(INVESTIGATION_STATS.unique_donors)}</span></p>
          <p><span className="text-gray-600">├─</span> max_single_day <span className="text-red-400 ml-4">{INVESTIGATION_STATS.max_single_day} donations</span></p>
          <p><span className="text-gray-600">├─</span> max_sustained_rate <span className="text-red-400 ml-4">{INVESTIGATION_STATS.max_per_day_avg}/day for months</span></p>
          <p><span className="text-gray-600">├─</span> jan_2023_volume_spike <span className="text-yellow-400 ml-4">{INVESTIGATION_STATS.volume_spike}x increase</span></p>
          <p><span className="text-gray-600">└─</span> source <span className="text-gray-500 ml-4">FEC Individual Contributions (58M records)</span></p>
        </div>
      </div>

      {/* Toshi Sponsor Banner */}
      <ToshiAdBanner className="mb-8" />

      {/* Warning Banner */}
      <div className="bg-yellow-900/20 border border-yellow-800 p-4 mb-8">
        <div className="flex items-start gap-3">
          <span className="text-yellow-500 text-xl">⚠</span>
          <div>
            <h2 className="text-yellow-400 font-medium mb-1">Important Disclaimer</h2>
            <p className="text-sm text-gray-400">
              This report presents statistical analysis of publicly available FEC data. Unusual patterns do not prove wrongdoing.
              There may be legitimate explanations including data entry errors, batch processing artifacts, platform technical issues,
              or legitimate sources of income not reflected in employment status (retirement, investments, savings, spousal income).
              The individuals and organizations referenced have not been charged with any crimes.
            </p>
          </div>
        </div>
      </div>

      {/* What is this */}
      <div className="border border-gray-800 p-4 mb-8">
        <h2 className="text-white font-medium mb-2">What is this investigation</h2>
        <p className="text-sm text-gray-400 leading-relaxed mb-3">
          Analysis of 58 million FEC contribution records reveals <strong className="text-white">$1.75 billion in political donations</strong> from
          individuals reporting &quot;NOT EMPLOYED&quot; status. The data contains donation patterns that appear highly anomalous,
          including one record showing 930 donations in a single day and sustained rates averaging 38 donations per day for months.
        </p>
        <p className="text-sm text-gray-400 leading-relaxed">
          These patterns warrant investigation to determine whether they reflect data issues, platform artifacts, or activities requiring regulatory review.
          The donations flow across the entire Democratic Party fundraising ecosystem - not just ActBlue.
        </p>
      </div>

      {/* Key Finding Callout */}
      <div className="bg-red-900/20 border border-red-800 p-4 mb-8">
        <h3 className="text-red-400 font-medium mb-2">930 Donations in ONE Day</h3>
        <p className="text-sm text-gray-400 mb-2">
          On November 3, 2024, FEC records show <strong className="text-white">Robert Otto</strong> from Greensboro, NC
          with 930 separate political donations recorded in 24 hours.
        </p>
        <p className="text-sm text-gray-500">
          This would require making one donation every <strong className="text-red-400">93 seconds</strong> for the entire day without sleep,
          food, or breaks. This pattern warrants investigation to determine whether it reflects data errors, platform issues, or other explanations.
        </p>
      </div>

      {/* Committee Distribution */}
      <div className="mb-8">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Where The Money Went</h3>
        <p className="text-xs text-gray-500 mb-4">
          Click committee name to view details. Only 37.6% went to ActBlue - the rest flowed across the Democratic ecosystem.
        </p>
        <div className="border border-gray-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left p-3 font-medium text-gray-400">Committee</th>
                <th className="text-left p-3 font-medium text-gray-400">Type</th>
                <th className="text-right p-3 font-medium text-gray-400">Donations</th>
                <th className="text-right p-3 font-medium text-gray-400">Amount</th>
                <th className="text-right p-3 font-medium text-gray-400">% of Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {committees.map((committee) => {
                const pctOfTotal = ((committee.unemployed_donation_count / INVESTIGATION_STATS.total_donations) * 100).toFixed(2);
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
                    <td className="p-3 text-gray-500">{committee.committee_type || '-'}</td>
                    <td className="p-3 text-right font-mono text-white">
                      {formatNumber(committee.unemployed_donation_count)}
                    </td>
                    <td className="p-3 text-right font-mono text-green-500">
                      {formatMoney(committee.total_unemployed_donations)}
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
        <h3 className="text-sm font-medium text-gray-400 mb-4">Top "Speed Demon" Donors (10+ donations/day average)</h3>
        <p className="text-xs text-gray-500 mb-4">
          Data from public FEC Individual Contributions filings. Employment status is self-reported.
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
                  <td className={`p-3 text-right font-mono ${donor.donations_per_day > 20 ? 'text-red-400' : 'text-yellow-400'}`}>
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

      {/* Single Day Extremes */}
      <div className="mb-8">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Single-Day Anomalies</h3>
        <div className="border border-gray-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left p-3 font-medium text-gray-400">Donor</th>
                <th className="text-left p-3 font-medium text-gray-400">Location</th>
                <th className="text-left p-3 font-medium text-gray-400">Date</th>
                <th className="text-right p-3 font-medium text-gray-400">Donations That Day</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {SINGLE_DAY_EXTREMES.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-900/50">
                  <td className="p-3 text-white">{item.name}</td>
                  <td className="p-3 text-gray-400">{item.city}, {item.state}</td>
                  <td className="p-3 text-gray-400">{item.date}</td>
                  <td className="p-3 text-right font-mono text-red-400">{item.donations}</td>
                </tr>
              ))}
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
                <div className="h-4 bg-gray-600 rounded" style={{ width: '0.2%' }}></div>
              </div>
              <span className="text-gray-500 font-mono w-24 text-right">696</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-white font-mono w-24">Jan 2023</span>
              <div className="flex-1 h-4 bg-gray-800 rounded">
                <div className="h-4 bg-red-600 rounded" style={{ width: '6%' }}></div>
              </div>
              <span className="text-red-400 font-mono w-24 text-right">175,959</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-500 font-mono w-24">Oct 2024</span>
              <div className="flex-1 h-4 bg-gray-800 rounded">
                <div className="h-4 bg-red-600 rounded" style={{ width: '100%' }}></div>
              </div>
              <span className="text-red-400 font-mono w-24 text-right">2,906,422</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            A 252x increase from December 2022 to January 2023 is a highly unusual growth trajectory.
          </p>
        </div>
      </div>

      {/* Questions Section */}
      <div className="border border-gray-800 p-4 mb-8">
        <h3 className="text-white font-medium mb-3">Questions Raised by the Data</h3>
        <ul className="text-sm text-gray-400 space-y-2">
          <li className="flex gap-2">
            <span className="text-gray-600">1.</span>
            <span><strong className="text-gray-300">Donation frequency anomalies</strong> - What explains single-day volumes and sustained rates that appear to exceed typical human behavior patterns?</span>
          </li>
          <li className="flex gap-2">
            <span className="text-gray-600">2.</span>
            <span><strong className="text-gray-300">Identity verification gaps</strong> - How do platforms verify donor eligibility when "NOT EMPLOYED" is reported?</span>
          </li>
          <li className="flex gap-2">
            <span className="text-gray-600">3.</span>
            <span><strong className="text-gray-300">Volume timing questions</strong> - What caused the 252x increase in January 2023?</span>
          </li>
          <li className="flex gap-2">
            <span className="text-gray-600">4.</span>
            <span><strong className="text-gray-300">Source of funds</strong> - How do individuals reporting no employment fund six-figure donation totals?</span>
          </li>
        </ul>
        <p className="text-xs text-gray-600 mt-4">
          These questions do not establish that wrongdoing occurred, but suggest the need for enhanced verification and investigation.
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
                58,207,350 individual contribution records from the 2023-2024 election cycle, filtered for <code className="bg-gray-800 px-1 rounded text-xs">OCCUPATION = &apos;NOT EMPLOYED&apos;</code>.
              </p>
            </div>
            <div>
              <p className="text-gray-300 font-medium mb-1">Verification Links</p>
              <div className="flex flex-wrap gap-2 mt-1">
                <a href="https://www.fec.gov/data/committee/C00401224/" target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-1 bg-gray-800 text-cyan-400 hover:bg-gray-700 rounded">ActBlue (FEC)</a>
                <a href="https://www.fec.gov/data/committee/C00010603/" target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-1 bg-gray-800 text-cyan-400 hover:bg-gray-700 rounded">DNC (FEC)</a>
                <a href="https://www.fec.gov/data/committee/C00042366/" target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-1 bg-gray-800 text-cyan-400 hover:bg-gray-700 rounded">DSCC (FEC)</a>
                <a href="https://www.fec.gov/data/committee/C00000935/" target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-1 bg-gray-800 text-cyan-400 hover:bg-gray-700 rounded">DCCC (FEC)</a>
                <a href="https://www.fec.gov/data/committee/C00744946/" target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-1 bg-gray-800 text-cyan-400 hover:bg-gray-700 rounded">Harris Victory Fund (FEC)</a>
                <a href="https://api.open.fec.gov/developers/" target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-1 bg-gray-800 text-cyan-400 hover:bg-gray-700 rounded">FEC API</a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* View Full Report Link */}
      <div className="flex gap-4 mb-8">
        <a
          href="/reports/unemployed-army-investigation.html"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-900/30 hover:bg-red-900/50 border border-red-800 text-red-400 text-sm rounded transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          View Full Visual Report
        </a>
        <Link
          href="/investigation"
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-700 hover:border-gray-600 text-gray-300 text-sm rounded transition-colors"
        >
          ← Back to Investigations
        </Link>
      </div>

      {/* Footer */}
      <div className="mt-12 pt-6 border-t border-gray-800">
        <p className="text-xs text-gray-600">
          Data source: FEC Individual Contributions (58.2M records analyzed). Investigation ID: ua-2024-001.
          This analysis is provided for informational purposes and raises questions for regulatory review - it is not an accusation of illegal conduct.
        </p>
      </div>
    </div>
  );
}
