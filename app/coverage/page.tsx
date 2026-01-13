import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export const metadata = {
  title: 'Data Coverage | SomaliScan',
  description: 'See which states and programs have data in our government spending database',
};

interface DataSource {
  name: string;
  table: string;
  rowCount: number;
  description: string;
  level: 'federal' | 'state' | 'local';
  category: string;
}

interface StateCheckbookCoverage {
  state: string;
  hasData: boolean;
}

const ALL_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
];

const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
  MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
  OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  DC: 'District of Columbia',
};

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
  return num.toLocaleString();
}

async function getDataSources(): Promise<DataSource[]> {
  // Get row counts from pg_stat_user_tables for performance
  const { data: stats } = await supabase.rpc('get_table_row_counts');

  const rowCounts: Record<string, number> = {};
  if (stats) {
    stats.forEach((row: { table_name: string; row_count: number }) => {
      rowCounts[row.table_name] = row.row_count;
    });
  }

  // Fallback to estimated counts if RPC not available
  const fallbackCounts: Record<string, number> = {
    state_checkbook: 138000000,
    state_contributions: 96000000,
    fec_contributions: 58000000,
    political_donations: 41000000,
    open_payments_general: 28000000,
    organizations: 8000000,
    ppp_loans: 7500000,
    state_employee_salaries: 5700000,
    federal_grants: 5200000,
    nonprofits: 1925000,
    sba_loans: 1800000,
    snap_retailers: 660000,
    h1b_lca_applications: 560000,
    eidl_loans: 205000,
    providers: 161000,
    nursing_homes: 15000,
    cases: 500,
  };

  return [
    {
      name: 'State Checkbook',
      table: 'state_checkbook',
      rowCount: rowCounts['state_checkbook'] || fallbackCounts['state_checkbook'],
      description: 'State government payment transactions',
      level: 'state',
      category: 'Spending',
    },
    {
      name: 'State Contributions',
      table: 'state_contributions',
      rowCount: rowCounts['state_contributions'] || fallbackCounts['state_contributions'],
      description: 'State-level campaign contributions',
      level: 'state',
      category: 'Political',
    },
    {
      name: 'FEC Contributions',
      table: 'fec_contributions',
      rowCount: rowCounts['fec_contributions'] || fallbackCounts['fec_contributions'],
      description: 'Federal campaign contributions',
      level: 'federal',
      category: 'Political',
    },
    {
      name: 'Open Payments',
      table: 'open_payments_general',
      rowCount: rowCounts['open_payments_general'] || fallbackCounts['open_payments_general'],
      description: 'Pharma payments to physicians',
      level: 'federal',
      category: 'Healthcare',
    },
    {
      name: 'Organizations',
      table: 'organizations',
      rowCount: rowCounts['organizations'] || fallbackCounts['organizations'],
      description: 'Unified entity registry',
      level: 'federal',
      category: 'Entities',
    },
    {
      name: 'Nonprofits',
      table: 'nonprofits',
      rowCount: rowCounts['nonprofits'] || fallbackCounts['nonprofits'],
      description: 'IRS tax-exempt organizations',
      level: 'federal',
      category: 'Entities',
    },
    {
      name: 'PPP Loans',
      table: 'ppp_loans',
      rowCount: rowCounts['ppp_loans'] || fallbackCounts['ppp_loans'],
      description: 'COVID-era Paycheck Protection Program loans',
      level: 'federal',
      category: 'Loans',
    },
    {
      name: 'Federal Grants',
      table: 'federal_grants',
      rowCount: rowCounts['federal_grants'] || fallbackCounts['federal_grants'],
      description: 'Federal grant awards',
      level: 'federal',
      category: 'Spending',
    },
    {
      name: 'State Salaries',
      table: 'state_employee_salaries',
      rowCount: rowCounts['state_employee_salaries'] || fallbackCounts['state_employee_salaries'],
      description: 'State employee compensation',
      level: 'state',
      category: 'Spending',
    },
    {
      name: 'SBA Loans',
      table: 'sba_loans',
      rowCount: rowCounts['sba_loans'] || fallbackCounts['sba_loans'],
      description: 'Small Business Administration loans',
      level: 'federal',
      category: 'Loans',
    },
    {
      name: 'SNAP Retailers',
      table: 'snap_retailers',
      rowCount: rowCounts['snap_retailers'] || fallbackCounts['snap_retailers'],
      description: 'SNAP/EBT authorized stores',
      level: 'federal',
      category: 'Welfare',
    },
    {
      name: 'H-1B Applications',
      table: 'h1b_lca_applications',
      rowCount: rowCounts['h1b_lca_applications'] || fallbackCounts['h1b_lca_applications'],
      description: 'H-1B visa labor condition applications',
      level: 'federal',
      category: 'Immigration',
    },
    {
      name: 'Childcare Providers',
      table: 'providers',
      rowCount: rowCounts['providers'] || fallbackCounts['providers'],
      description: 'Licensed childcare facilities',
      level: 'state',
      category: 'Entities',
    },
    {
      name: 'Fraud Cases',
      table: 'cases',
      rowCount: rowCounts['cases'] || fallbackCounts['cases'],
      description: 'Documented fraud prosecutions',
      level: 'federal',
      category: 'Cases',
    },
  ];
}

async function getStateCheckbookCoverage(): Promise<StateCheckbookCoverage[]> {
  // Get distinct states from checkbook
  const { data } = await supabase
    .from('state_checkbook')
    .select('state')
    .limit(1000);

  const statesWithData = new Set<string>();
  if (data) {
    data.forEach(row => {
      if (row.state) statesWithData.add(row.state);
    });
  }

  // Fallback known states
  const knownStates = ['CA', 'FL', 'ID', 'IN', 'LA', 'MA', 'MN', 'NC', 'NM', 'NY', 'OK', 'TN', 'TX', 'VT', 'WA'];
  knownStates.forEach(s => statesWithData.add(s));

  return ALL_STATES.map(state => ({
    state,
    hasData: statesWithData.has(state),
  }));
}

export const revalidate = 3600; // 1 hour

export default async function CoveragePage() {
  const [dataSources, checkbookCoverage] = await Promise.all([
    getDataSources(),
    getStateCheckbookCoverage(),
  ]);

  const totalRows = dataSources.reduce((sum, ds) => sum + ds.rowCount, 0);
  const statesWithCheckbook = checkbookCoverage.filter(s => s.hasData).length;
  const statesWithoutCheckbook = checkbookCoverage.filter(s => !s.hasData);

  const byCategory = dataSources.reduce((acc, ds) => {
    if (!acc[ds.category]) acc[ds.category] = { count: 0, rows: 0 };
    acc[ds.category].count++;
    acc[ds.category].rows += ds.rowCount;
    return acc;
  }, {} as Record<string, { count: number; rows: number }>);

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold mb-2">Data Coverage</h1>
      <p className="text-gray-400 mb-8">
        See what government spending data we have and where we need more.
      </p>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="border border-gray-800 p-4">
          <p className="text-2xl font-bold text-green-500 font-mono">{formatNumber(totalRows)}</p>
          <p className="text-sm text-gray-500">Total Records</p>
        </div>
        <div className="border border-gray-800 p-4">
          <p className="text-2xl font-bold text-white font-mono">{dataSources.length}</p>
          <p className="text-sm text-gray-500">Data Sources</p>
        </div>
        <div className="border border-gray-800 p-4">
          <p className="text-2xl font-bold text-white font-mono">{statesWithCheckbook}/51</p>
          <p className="text-sm text-gray-500">States w/ Checkbook</p>
        </div>
        <div className="border border-gray-800 p-4">
          <p className="text-2xl font-bold text-yellow-500 font-mono">{51 - statesWithCheckbook}</p>
          <p className="text-sm text-gray-500">States Missing</p>
        </div>
      </div>

      {/* Data Sources by Category */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-white mb-4">Data Sources</h2>
        <div className="border border-gray-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left p-3 font-medium text-gray-400">Source</th>
                <th className="text-left p-3 font-medium text-gray-400">Category</th>
                <th className="text-left p-3 font-medium text-gray-400">Level</th>
                <th className="text-right p-3 font-medium text-gray-400">Records</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {dataSources
                .sort((a, b) => b.rowCount - a.rowCount)
                .map(ds => (
                  <tr key={ds.table} className="hover:bg-gray-900/50">
                    <td className="p-3">
                      <p className="text-white">{ds.name}</p>
                      <p className="text-xs text-gray-500">{ds.description}</p>
                    </td>
                    <td className="p-3 text-gray-400">{ds.category}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 text-xs rounded ${
                        ds.level === 'federal' ? 'bg-blue-900/50 text-blue-400' :
                        ds.level === 'state' ? 'bg-purple-900/50 text-purple-400' :
                        'bg-green-900/50 text-green-400'
                      }`}>
                        {ds.level}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono text-white">
                      {formatNumber(ds.rowCount)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* State Checkbook Coverage */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-white mb-4">State Checkbook Coverage</h2>
        <p className="text-sm text-gray-400 mb-4">
          Green = we have data. Red = gap we need to fill.
        </p>
        <div className="grid grid-cols-6 sm:grid-cols-9 md:grid-cols-12 gap-2">
          {checkbookCoverage.map(({ state, hasData }) => (
            <div
              key={state}
              className={`p-2 text-center text-xs font-mono rounded border ${
                hasData
                  ? 'bg-green-900/30 border-green-800 text-green-400'
                  : 'bg-red-900/30 border-red-800 text-red-400'
              }`}
              title={STATE_NAMES[state]}
            >
              {state}
            </div>
          ))}
        </div>
      </div>

      {/* Missing States List */}
      {statesWithoutCheckbook.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-medium text-white mb-4">Help Us Fill the Gaps</h2>
          <p className="text-sm text-gray-400 mb-4">
            We&apos;re missing state checkbook data for {statesWithoutCheckbook.length} states.
            If you know where to find this data, <Link href="/crowdsource/submit" className="text-green-500 hover:underline">submit it here</Link>.
          </p>
          <div className="flex flex-wrap gap-2">
            {statesWithoutCheckbook.map(({ state }) => (
              <span
                key={state}
                className="px-3 py-1 text-sm bg-gray-800 text-gray-400 rounded"
              >
                {STATE_NAMES[state]}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Data Gaps Roadmap */}
      <div className="border border-gray-800 p-6">
        <h2 className="text-lg font-medium text-white mb-4">Data Roadmap</h2>
        <p className="text-sm text-gray-400 mb-4">What we&apos;re working on adding:</p>
        <ul className="space-y-3 text-sm">
          <li className="flex items-start gap-3">
            <span className="text-yellow-500">○</span>
            <div>
              <p className="text-white">USASpending.gov Contracts</p>
              <p className="text-gray-500">Federal contracts data from api.usaspending.gov</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-yellow-500">○</span>
            <div>
              <p className="text-white">More State Checkbooks</p>
              <p className="text-gray-500">Priority: OH, PA, GA, AZ, MI, NJ, VA, IL, CO, MD</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-yellow-500">○</span>
            <div>
              <p className="text-white">CMS Provider Payments</p>
              <p className="text-gray-500">Medicare/Medicaid provider payment data</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-yellow-500">○</span>
            <div>
              <p className="text-white">Childcare Subsidy Payments</p>
              <p className="text-gray-500">CCAP payment data via FOIA</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-yellow-500">○</span>
            <div>
              <p className="text-white">Local Government Data</p>
              <p className="text-gray-500">City and county spending</p>
            </div>
          </li>
        </ul>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-gray-800 text-sm text-gray-500">
        <p>
          Have data we&apos;re missing?{' '}
          <Link href="/crowdsource/submit" className="text-green-500 hover:underline">Submit it</Link>
          {' '}or{' '}
          <Link href="/tip" className="text-green-500 hover:underline">send us a tip</Link>.
        </p>
      </div>
    </div>
  );
}
