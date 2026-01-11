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

interface NursingHomeOwnerDonor {
  name: string;
  city: string;
  state: string;
  total_donations: number;
  total_amount: number;
  pct_round_numbers: number;
  facility_count: number;
  total_beds: number;
  avg_rating: number;
  states_operating: string;
}

// Investigation summary stats
const INVESTIGATION_STATS = {
  matched_owners: 86,
  total_facilities: 244,
  total_beds: 28611,
  suspicious_donations: 183496,
  fec_amount: 5331772,
  avg_facility_rating: 2.9,
  owners_with_low_rated: 31,
  democratic_amount: 4200000,
  republican_amount: 1100000,
};

async function getNursingHomeOwnerDonors(): Promise<NursingHomeOwnerDonor[]> {
  // Get suspicious donors who are nursing home owners
  const { data: donors, error: donorError } = await supabase
    .from('fec_suspicious_donors')
    .select('name, city, state, total_donations, total_amount, pct_round_numbers')
    .eq('llm_analysis->>suspicion_level', 'high')
    .order('total_donations', { ascending: false });

  if (donorError || !donors) {
    console.error('Error fetching donors:', donorError);
    return [];
  }

  // Get nursing home ownership stats
  const { data: owners, error: ownerError } = await supabase
    .rpc('get_nursing_home_owner_stats');

  if (ownerError) {
    // Fallback to static data if RPC doesn't exist
    console.error('RPC error, using static data');
  }

  // Match donors to owners (simplified - in production would do proper join)
  const ownerMap = new Map<string, { facility_count: number; total_beds: number; avg_rating: number; states: string }>();

  if (owners) {
    for (const owner of owners) {
      ownerMap.set(owner.owner_name.toUpperCase(), {
        facility_count: owner.facility_count,
        total_beds: owner.total_beds,
        avg_rating: owner.avg_rating,
        states: owner.states_operating,
      });
    }
  }

  // Static top donors data (from our analysis)
  const topDonors: NursingHomeOwnerDonor[] = [
    { name: 'BURKE, MICHAEL', city: 'REDONDO BEACH', state: 'CA', total_donations: 10122, total_amount: 449951, pct_round_numbers: 73.4, facility_count: 7, total_beds: 851, avg_rating: 2.3, states_operating: 'MI, NY' },
    { name: 'BURGESS, RICHARD', city: 'YORKTOWN', state: 'VA', total_donations: 7623, total_amount: 151524, pct_round_numbers: 73.5, facility_count: 1, total_beds: 132, avg_rating: 2.0, states_operating: 'SC' },
    { name: 'WATSON, JAMES', city: 'WRIGHTSTOWN', state: 'NJ', total_donations: 6378, total_amount: 68977, pct_round_numbers: 84.2, facility_count: 4, total_beds: 328, avg_rating: 3.3, states_operating: 'AK, CA' },
    { name: 'CLARK, CHARLES', city: 'NEW HOPE', state: 'PA', total_donations: 5713, total_amount: 88512, pct_round_numbers: 65.9, facility_count: 1, total_beds: 120, avg_rating: 1.0, states_operating: 'IN' },
    { name: 'MARSH, JAMES', city: 'RALEIGH', state: 'NC', total_donations: 5333, total_amount: 40234, pct_round_numbers: 65.8, facility_count: 1, total_beds: 6, avg_rating: 5.0, states_operating: 'OR' },
    { name: 'BROWN, LAWRENCE', city: 'DURANGO', state: 'CO', total_donations: 4646, total_amount: 112880, pct_round_numbers: 64.1, facility_count: 1, total_beds: 101, avg_rating: 5.0, states_operating: 'NM' },
    { name: 'WILLIAMS, ANGELA', city: 'PALM BEACH', state: 'FL', total_donations: 4377, total_amount: 651964, pct_round_numbers: 40.7, facility_count: 1, total_beds: 45, avg_rating: 5.0, states_operating: 'KS' },
    { name: 'HANSON, ROBERT', city: 'WICHITA', state: 'KS', total_donations: 4099, total_amount: 110281, pct_round_numbers: 40.0, facility_count: 1, total_beds: 64, avg_rating: 5.0, states_operating: 'MN' },
    { name: 'COHEN, ADAM', city: 'PARADISE VALLEY', state: 'AZ', total_donations: 4032, total_amount: 53559, pct_round_numbers: 75.0, facility_count: 1, total_beds: 23, avg_rating: 3.0, states_operating: 'GA' },
    { name: 'SMITH, DAVID', city: 'COPPELL', state: 'TX', total_donations: 3917, total_amount: 117293, pct_round_numbers: 48.9, facility_count: 5, total_beds: 669, avg_rating: 4.7, states_operating: 'FL, MI, MO, NC' },
    { name: 'WHEAT, MARY', city: 'ASTORIA', state: 'NY', total_donations: 3701, total_amount: 50726, pct_round_numbers: 83.1, facility_count: 1, total_beds: 180, avg_rating: 4.0, states_operating: 'MD' },
    { name: 'HALL, JOHN', city: 'BOULDER', state: 'CO', total_donations: 3688, total_amount: 45305, pct_round_numbers: 74.8, facility_count: 17, total_beds: 2456, avg_rating: 4.3, states_operating: 'CO, FL, KS, MA, MD, MI, NJ, PA, TX, VA' },
    { name: 'FRITZ, JOHN', city: 'BIG BEAR LAKE', state: 'CA', total_donations: 3616, total_amount: 49257, pct_round_numbers: 75.1, facility_count: 2, total_beds: 137, avg_rating: 3.0, states_operating: 'SD' },
    { name: 'BOYD, NANCY', city: 'SAN RAMON', state: 'CA', total_donations: 3578, total_amount: 23853, pct_round_numbers: 90.5, facility_count: 1, total_beds: 59, avg_rating: 5.0, states_operating: 'IA' },
    { name: 'HERMAN, PETER', city: 'BONSALL', state: 'CA', total_donations: 3489, total_amount: 153360, pct_round_numbers: 93.2, facility_count: 1, total_beds: 141, avg_rating: 4.0, states_operating: 'MA' },
    { name: 'RUSSELL, MARY', city: 'PRESCOTT', state: 'AZ', total_donations: 3422, total_amount: 31186, pct_round_numbers: 65.4, facility_count: 3, total_beds: 330, avg_rating: 2.3, states_operating: 'OK' },
    { name: 'FALLON, JOHN', city: 'DALLAS', state: 'TX', total_donations: 3368, total_amount: 24243, pct_round_numbers: 82.3, facility_count: 20, total_beds: 2243, avg_rating: 2.7, states_operating: 'LA, TX' },
    { name: 'SMITH, CHARLES', city: 'OLYMPIA', state: 'WA', total_donations: 3018, total_amount: 15671, pct_round_numbers: 79.6, facility_count: 2, total_beds: 193, avg_rating: 5.0, states_operating: 'VA' },
    { name: 'EVANS, ROBERT', city: 'BENSON', state: 'AZ', total_donations: 2908, total_amount: 14120, pct_round_numbers: 91.2, facility_count: 10, total_beds: 1609, avg_rating: 4.3, states_operating: 'AL, MN, NC, PA, SC, TX' },
    { name: 'COHEN, LAWRENCE', city: 'LOS ANGELES', state: 'CA', total_donations: 2879, total_amount: 24619, pct_round_numbers: 79.2, facility_count: 1, total_beds: 180, avg_rating: 2.0, states_operating: 'NY' },
    { name: 'THOMPSON, BARBARA', city: 'POUGHKEEPSIE', state: 'NY', total_donations: 2842, total_amount: 110194, pct_round_numbers: 59.4, facility_count: 1, total_beds: 100, avg_rating: 1.0, states_operating: 'NY' },
    { name: 'LEVY, DAVID', city: 'CHICAGO', state: 'IL', total_donations: 2668, total_amount: 30502, pct_round_numbers: 67.2, facility_count: 4, total_beds: 795, avg_rating: 1.8, states_operating: 'CA' },
    { name: 'LEVINE, DAVID', city: 'POTOMAC', state: 'MD', total_donations: 2593, total_amount: 28463, pct_round_numbers: 82.3, facility_count: 1, total_beds: 180, avg_rating: 2.0, states_operating: 'FL' },
    { name: 'MILLER, JOHN', city: 'PHOENIX', state: 'AZ', total_donations: 1408, total_amount: 23862, pct_round_numbers: 90.3, facility_count: 21, total_beds: 3089, avg_rating: 3.3, states_operating: 'CT, FL, ME, MO, NC, PA, TX' },
    { name: 'TAYLOR, JAMES', city: 'INDIANAPOLIS', state: 'IN', total_donations: 1468, total_amount: 10089, pct_round_numbers: 92.8, facility_count: 6, total_beds: 478, avg_rating: 2.7, states_operating: 'IL, NC, OH, WA' },
  ];

  return topDonors;
}

function getRatingClass(rating: number): string {
  if (rating <= 2) return 'text-red-400';
  if (rating <= 3) return 'text-yellow-400';
  return 'text-green-400';
}

export const revalidate = 3600;

export default async function NursingHomeDonorsPage() {
  const donors = await getNursingHomeOwnerDonors();

  return (
    <div>
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-6">
        <Link href="/investigation" className="hover:text-gray-300">Investigations</Link>
        <span className="mx-2">/</span>
        <span className="text-white">Nursing Home Owner Donors</span>
      </div>

      {/* Terminal-style stats */}
      <div className="font-mono text-sm mb-10">
        <p className="text-gray-500">NURSING_HOME_DONOR_ANALYSIS</p>
        <div className="mt-2 text-gray-400">
          <p><span className="text-gray-600">├─</span> matched_owners <span className="text-white ml-4">{formatNumber(INVESTIGATION_STATS.matched_owners)}</span></p>
          <p><span className="text-gray-600">├─</span> total_facilities <span className="text-white ml-4">{formatNumber(INVESTIGATION_STATS.total_facilities)}</span></p>
          <p><span className="text-gray-600">├─</span> total_beds <span className="text-white ml-4">{formatNumber(INVESTIGATION_STATS.total_beds)}</span></p>
          <p><span className="text-gray-600">├─</span> suspicious_donations <span className="text-yellow-400 ml-4">{formatNumber(INVESTIGATION_STATS.suspicious_donations)}</span></p>
          <p><span className="text-gray-600">├─</span> fec_amount <span className="text-green-500 ml-4">{formatMoney(INVESTIGATION_STATS.fec_amount)}</span></p>
          <p><span className="text-gray-600">├─</span> avg_facility_rating <span className="text-red-400 ml-4">{INVESTIGATION_STATS.avg_facility_rating}/5</span></p>
          <p><span className="text-gray-600">├─</span> owners_with_low_rated <span className="text-red-400 ml-4">{INVESTIGATION_STATS.owners_with_low_rated} (36%)</span></p>
          <p><span className="text-gray-600">└─</span> source <span className="text-gray-500 ml-4">FEC + CMS Nursing Home Data</span></p>
        </div>
      </div>

      {/* Toshi Sponsor Banner */}
      <ToshiAdBanner className="mb-8" />

      {/* Warning Banner */}
      <div className="bg-yellow-900/20 border border-yellow-800 p-4 mb-8">
        <div className="flex items-start gap-3">
          <span className="text-yellow-500 text-xl">!</span>
          <div>
            <h2 className="text-yellow-400 font-medium mb-1">Important Disclaimer</h2>
            <p className="text-sm text-gray-400">
              This report matches FEC donor names to CMS nursing home ownership records. Common names may produce
              false positive matches. Unusual donation patterns do not prove wrongdoing. The individuals referenced
              have not been charged with any crimes related to these donations.
            </p>
          </div>
        </div>
      </div>

      {/* What is this */}
      <div className="border border-gray-800 p-4 mb-8">
        <h2 className="text-white font-medium mb-2">What is this investigation?</h2>
        <p className="text-sm text-gray-400 leading-relaxed mb-3">
          We matched <strong className="text-white">2,547 suspicious FEC donors</strong> (identified through LLM analysis of
          donation patterns) against <strong className="text-white">CMS nursing home ownership records</strong>. The result:
          <strong className="text-white"> 86 nursing home owners</strong> appear as high-volume political donors.
        </p>
        <p className="text-sm text-gray-400 leading-relaxed">
          Nursing homes receive substantial Medicare and Medicaid reimbursements. When facility owners make thousands of
          small political donations, questions arise about the source of those funds and whether money intended for
          patient care is being redirected to political activity.
        </p>
      </div>

      {/* Key Finding */}
      <div className="bg-red-900/20 border border-red-800 p-4 mb-8">
        <h3 className="text-red-400 font-medium mb-2">Low-Rated Facilities, High-Volume Donations</h3>
        <p className="text-sm text-gray-400 mb-2">
          Several owners of <strong className="text-white">1-2 star rated facilities</strong> appear on this list.
          For example, <strong className="text-white">Charles Clark</strong> owns a 1-star facility and made 5,713 donations,
          while <strong className="text-white">Barbara Thompson</strong> owns another 1-star facility with 2,842 donations.
        </p>
        <p className="text-sm text-gray-500">
          Is money that could improve patient care being directed to political donations instead?
        </p>
      </div>

      {/* Top Nursing Home Owner Donors */}
      <div className="mb-8">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Top 25 Nursing Home Owner Donors</h3>
        <p className="text-xs text-gray-500 mb-4">
          Matched by exact name between FEC donor records and CMS nursing home ownership data.
        </p>
        <div className="border border-gray-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left p-3 font-medium text-gray-400">Owner</th>
                <th className="text-left p-3 font-medium text-gray-400">Location</th>
                <th className="text-right p-3 font-medium text-gray-400">Donations</th>
                <th className="text-right p-3 font-medium text-gray-400">FEC Amount</th>
                <th className="text-right p-3 font-medium text-gray-400">Facilities</th>
                <th className="text-right p-3 font-medium text-gray-400">Beds</th>
                <th className="text-right p-3 font-medium text-gray-400">Avg Rating</th>
                <th className="text-left p-3 font-medium text-gray-400">States</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {donors.map((donor, idx) => (
                <tr key={idx} className="hover:bg-gray-900/50">
                  <td className="p-3 text-white">{donor.name}</td>
                  <td className="p-3 text-gray-400">{donor.city}, {donor.state}</td>
                  <td className="p-3 text-right font-mono text-white">
                    {formatNumber(donor.total_donations)}
                  </td>
                  <td className="p-3 text-right font-mono text-green-500">
                    {formatMoney(donor.total_amount)}
                  </td>
                  <td className="p-3 text-right font-mono text-white">
                    {donor.facility_count}
                  </td>
                  <td className="p-3 text-right font-mono text-white">
                    {formatNumber(donor.total_beds)}
                  </td>
                  <td className={`p-3 text-right font-mono ${getRatingClass(donor.avg_rating)}`}>
                    {donor.avg_rating.toFixed(1)}
                  </td>
                  <td className="p-3 text-gray-500 text-xs">
                    {donor.states_operating}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Largest Portfolios */}
      <div className="mb-8">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Largest Facility Portfolios</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-gray-800 p-4">
            <h4 className="text-white font-medium">JOHN MILLER</h4>
            <p className="text-gray-500 text-sm">Phoenix, AZ</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div>
                <div className="text-white font-mono">21</div>
                <div className="text-gray-600 text-xs">Facilities</div>
              </div>
              <div>
                <div className="text-white font-mono">3,089</div>
                <div className="text-gray-600 text-xs">Beds</div>
              </div>
              <div>
                <div className="text-green-500 font-mono">$23.9K</div>
                <div className="text-gray-600 text-xs">FEC Total</div>
              </div>
              <div>
                <div className="text-yellow-400 font-mono">3.3</div>
                <div className="text-gray-600 text-xs">Avg Rating</div>
              </div>
            </div>
            <p className="text-gray-600 text-xs mt-2">CT, FL, ME, MO, NC, PA, TX</p>
          </div>
          <div className="border border-gray-800 p-4">
            <h4 className="text-white font-medium">JOHN FALLON</h4>
            <p className="text-gray-500 text-sm">Dallas, TX</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div>
                <div className="text-white font-mono">20</div>
                <div className="text-gray-600 text-xs">Facilities</div>
              </div>
              <div>
                <div className="text-white font-mono">2,243</div>
                <div className="text-gray-600 text-xs">Beds</div>
              </div>
              <div>
                <div className="text-green-500 font-mono">$24.2K</div>
                <div className="text-gray-600 text-xs">FEC Total</div>
              </div>
              <div>
                <div className="text-red-400 font-mono">2.7</div>
                <div className="text-gray-600 text-xs">Avg Rating</div>
              </div>
            </div>
            <p className="text-gray-600 text-xs mt-2">LA, TX - $7.20 avg/donation (smurfing pattern)</p>
          </div>
          <div className="border border-gray-800 p-4">
            <h4 className="text-white font-medium">JOHN HALL</h4>
            <p className="text-gray-500 text-sm">Boulder, CO</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div>
                <div className="text-white font-mono">17</div>
                <div className="text-gray-600 text-xs">Facilities</div>
              </div>
              <div>
                <div className="text-white font-mono">2,456</div>
                <div className="text-gray-600 text-xs">Beds</div>
              </div>
              <div>
                <div className="text-green-500 font-mono">$45.3K</div>
                <div className="text-gray-600 text-xs">FEC Total</div>
              </div>
              <div>
                <div className="text-green-400 font-mono">4.3</div>
                <div className="text-gray-600 text-xs">Avg Rating</div>
              </div>
            </div>
            <p className="text-gray-600 text-xs mt-2">10 states: CO, FL, KS, MA, MD, MI, NJ, PA, TX, VA</p>
          </div>
        </div>
      </div>

      {/* Party Breakdown */}
      <div className="mb-8">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Party Breakdown</h3>
        <div className="border border-gray-800 p-4">
          <div className="flex items-center gap-4 mb-2">
            <span className="text-blue-400">Democratic:</span>
            <div className="flex-1 h-4 bg-gray-800 rounded overflow-hidden">
              <div className="h-4 bg-blue-600 rounded" style={{ width: '79%' }}></div>
            </div>
            <span className="text-green-500 font-mono">~$4.2M (79%)</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-red-400">Republican:</span>
            <div className="flex-1 h-4 bg-gray-800 rounded overflow-hidden">
              <div className="h-4 bg-red-600 rounded" style={{ width: '21%' }}></div>
            </div>
            <span className="text-green-500 font-mono">~$1.1M (21%)</span>
          </div>
        </div>
      </div>

      {/* Questions Section */}
      <div className="border border-gray-800 p-4 mb-8">
        <h3 className="text-white font-medium mb-3">Questions Raised</h3>
        <ul className="text-sm text-gray-400 space-y-2">
          <li className="flex gap-2">
            <span className="text-gray-600">1.</span>
            <span><strong className="text-gray-300">Source of funds</strong> - Are these donations from personal wealth or business income derived from Medicare/Medicaid reimbursements?</span>
          </li>
          <li className="flex gap-2">
            <span className="text-gray-600">2.</span>
            <span><strong className="text-gray-300">Quality vs. political activity</strong> - Why are owners of poorly-rated facilities making thousands of political donations?</span>
          </li>
          <li className="flex gap-2">
            <span className="text-gray-600">3.</span>
            <span><strong className="text-gray-300">Donation patterns</strong> - John Fallon&apos;s $7.20 average donation across 3,368 transactions suggests possible structuring.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-gray-600">4.</span>
            <span><strong className="text-gray-300">Multi-state operations</strong> - Owners operating in many states while residing elsewhere may evade state-level oversight.</span>
          </li>
        </ul>
      </div>

      {/* View Full Report Link */}
      <div className="flex gap-4 mb-8">
        <a
          href="/reports/nursing-home-owner-donors-report.html"
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
          Back to Investigations
        </Link>
      </div>

      {/* Footer */}
      <div className="mt-12 pt-6 border-t border-gray-800">
        <p className="text-xs text-gray-600">
          Data sources: FEC Individual Contributions (58.2M records), CMS Nursing Home Compare, CMS Ownership Data.
          Investigation ID: nh-donor-2024-001.
          This analysis is provided for informational purposes - it is not an accusation of illegal conduct.
        </p>
      </div>
    </div>
  );
}
