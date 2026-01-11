import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import ToshiAdBanner from '../../components/ToshiAdBanner';

const STATE_NAMES: Record<string, string> = {
  MN: 'Minnesota',
  OH: 'Ohio', 
  WA: 'Washington'
};

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

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

interface StateStats {
  state: string;
  ppp_count: number;
  ppp_amount: number;
  ppp_flagged_count: number;
  eidl_count: number;
  eidl_amount: number;
  eidl_flagged_count: number;
  sba_count: number;
  sba_amount: number;
  federal_grants_count: number;
  federal_grants_amount: number;
  state_grants_count: number;
  state_grants_amount: number;
  doj_articles: number;
  double_dippers: number;
}

interface OrgStats {
  state: string;
  total_orgs: number;
  childcare_orgs: number;
  shell_companies: number;
  ppp_recipients: number;
}

interface DemographicRow {
  borrower_state: string;
  demographic_value: string;
  loan_count: number;
  pct_of_loans: number;
}

interface DojArticle {
  title: string;
  url: string;
  state: string;
  fraud_types: string[];
  source: string;
}

interface FraudCase {
  id: string;
  case_name: string;
  state: string;
  fraud_type: string;
  total_fraud_amount: number;
  status: string;
  date_sentenced: string | null;
  date_convicted: string | null;
  date_indicted: string | null;
  date_charged: string | null;
}

interface DoubleDipper {
  borrower_name: string;
  borrower_state: string;
  eidl_amount: number;
  ppp_amount: number;
}

async function getStateStats(): Promise<StateStats[]> {
  // Use the RPC function to get aggregated stats without row limits
  const { data, error } = await supabase.rpc('get_investigation_stats', {
    target_states: ['MN', 'OH', 'WA']
  });

  if (error) {
    console.error('Error fetching stats:', error);
    return [];
  }

  return (data || []).map((row: Record<string, unknown>) => ({
    state: String(row.state),
    ppp_count: Number(row.ppp_count) || 0,
    ppp_amount: Number(row.ppp_amount) || 0,
    ppp_flagged_count: Number(row.ppp_flagged_count) || 0,
    eidl_count: Number(row.eidl_count) || 0,
    eidl_amount: Number(row.eidl_amount) || 0,
    eidl_flagged_count: Number(row.eidl_flagged_count) || 0,
    sba_count: Number(row.sba_count) || 0,
    sba_amount: Number(row.sba_amount) || 0,
    federal_grants_count: Number(row.federal_grants_count) || 0,
    federal_grants_amount: Number(row.federal_grants_amount) || 0,
    state_grants_count: Number(row.state_grants_count) || 0,
    state_grants_amount: Number(row.state_grants_amount) || 0,
    doj_articles: Number(row.doj_articles) || 0,
    double_dippers: Number(row.double_dippers) || 0
  }));
}

async function getDemographics() {
  const { data } = await supabase
    .from('ppp_demographic_summary')
    .select('borrower_state, demographic_value, loan_count, pct_of_loans')
    .in('borrower_state', ['MN', 'OH', 'WA'])
    .eq('demographic_type', 'race')
    .not('demographic_value', 'eq', 'Unanswered')
    .not('demographic_value', 'is', null)
    .order('loan_count', { ascending: false });

  return data || [];
}

async function getDojArticles() {
  const { data } = await supabase
    .from('news_articles')
    .select('title, url, state, fraud_types, source')
    .eq('source_type', 'usa_attorney')
    .in('state', ['MN', 'OH', 'WA'])
    .not('fraud_types', 'eq', '{}')
    .order('state')
    .limit(20);

  return data || [];
}

async function getFraudCases() {
  const { data } = await supabase
    .from('cases')
    .select('id, case_name, state, fraud_type, total_fraud_amount, status, date_sentenced, date_convicted, date_indicted, date_charged')
    .in('state', ['MN', 'OH', 'WA'])
    .order('total_fraud_amount', { ascending: false });

  return data || [];
}

async function getOrgStats(): Promise<OrgStats[]> {
  const stats: OrgStats[] = [];

  for (const state of ['MN', 'OH', 'WA']) {
    const [totalRes, childcareRes, shellRes, pppRes] = await Promise.all([
      supabase.from('organizations').select('*', { count: 'exact', head: true }).eq('state', state),
      supabase.from('organizations').select('*', { count: 'exact', head: true }).eq('state', state).eq('is_childcare', true),
      supabase.from('organizations').select('*', { count: 'exact', head: true }).eq('state', state).eq('is_shell_company', true),
      supabase.from('organizations').select('*', { count: 'exact', head: true }).eq('state', state).eq('is_ppp_recipient', true),
    ]);

    stats.push({
      state,
      total_orgs: totalRes.count || 0,
      childcare_orgs: childcareRes.count || 0,
      shell_companies: shellRes.count || 0,
      ppp_recipients: pppRes.count || 0,
    });
  }

  return stats;
}

async function getDoubleDippers(): Promise<DoubleDipper[]> {
  // Get double dippers with varied amounts (not just top by amount)
  // Mix of different states and loan sizes
  const { data: eidlData } = await supabase
    .from('eidl_loans')
    .select('borrower_name, borrower_state, loan_amount, ppp_loan_id')
    .in('borrower_state', ['MN', 'OH', 'WA'])
    .not('ppp_loan_id', 'is', null)
    .order('borrower_state')
    .limit(100);

  if (!eidlData || eidlData.length === 0) return [];

  // Get corresponding PPP amounts
  const pppIds = eidlData.map(e => e.ppp_loan_id).filter(Boolean);
  const { data: pppData } = await supabase
    .from('ppp_loans')
    .select('id, initial_approval_amount')
    .in('id', pppIds);

  const pppMap = new Map((pppData || []).map(p => [p.id, p.initial_approval_amount]));

  // Create combined records with both amounts
  const combined = eidlData.map(e => ({
    borrower_name: e.borrower_name,
    borrower_state: e.borrower_state,
    eidl_amount: e.loan_amount,
    ppp_amount: pppMap.get(e.ppp_loan_id) || 0
  }));

  // Sort by combined total and take varied sample
  combined.sort((a, b) => (b.eidl_amount + b.ppp_amount) - (a.eidl_amount + a.ppp_amount));
  
  // Take first 5 from each state for variety
  const byState: Record<string, DoubleDipper[]> = { MN: [], OH: [], WA: [] };
  for (const item of combined) {
    if (byState[item.borrower_state].length < 5) {
      byState[item.borrower_state].push(item);
    }
  }

  return [...byState.MN, ...byState.OH, ...byState.WA];
}

function getCaseDate(c: FraudCase): string | null {
  return c.date_sentenced || c.date_convicted || c.date_indicted || c.date_charged;
}

export const revalidate = 300;

export default async function InvestigationDashboard() {
  const [stateStats, demographics, dojArticles, fraudCases, doubleDippers, orgStats] = await Promise.all([
    getStateStats(),
    getDemographics(),
    getDojArticles(),
    getFraudCases(),
    getDoubleDippers(),
    getOrgStats()
  ]);

  const totals = stateStats.reduce((acc, s) => ({
    ppp_count: acc.ppp_count + s.ppp_count,
    ppp_amount: acc.ppp_amount + s.ppp_amount,
    ppp_flagged: acc.ppp_flagged + s.ppp_flagged_count,
    eidl_count: acc.eidl_count + s.eidl_count,
    eidl_amount: acc.eidl_amount + s.eidl_amount,
    eidl_flagged: acc.eidl_flagged + s.eidl_flagged_count,
    sba_count: acc.sba_count + s.sba_count,
    sba_amount: acc.sba_amount + s.sba_amount,
    federal_grants_count: acc.federal_grants_count + s.federal_grants_count,
    federal_grants: acc.federal_grants + s.federal_grants_amount,
    state_grants: acc.state_grants + s.state_grants_amount,
    doj_articles: acc.doj_articles + s.doj_articles,
    double_dippers: acc.double_dippers + s.double_dippers
  }), {
    ppp_count: 0, ppp_amount: 0, ppp_flagged: 0,
    eidl_count: 0, eidl_amount: 0, eidl_flagged: 0,
    sba_count: 0, sba_amount: 0,
    federal_grants_count: 0, federal_grants: 0, state_grants: 0,
    doj_articles: 0, double_dippers: 0
  });

  const orgTotals = orgStats.reduce((acc, o) => ({
    total_orgs: acc.total_orgs + o.total_orgs,
    childcare_orgs: acc.childcare_orgs + o.childcare_orgs,
    shell_companies: acc.shell_companies + o.shell_companies,
    ppp_recipients: acc.ppp_recipients + o.ppp_recipients,
  }), { total_orgs: 0, childcare_orgs: 0, shell_companies: 0, ppp_recipients: 0 });

  const totalFunding = totals.ppp_amount + totals.eidl_amount + totals.sba_amount + totals.federal_grants;
  const totalFlagged = totals.ppp_flagged + totals.eidl_flagged;

  return (
    <div>
      {/* Terminal-style stats */}
      <div className="font-mono text-sm mb-10">
        <p className="text-gray-500">MN_OH_WA_INVESTIGATION</p>
        <div className="mt-2 text-gray-400">
          <p><span className="text-gray-600">├─</span> total_funding_tracked <span className="text-green-500 ml-4">{formatMoney(totalFunding)}</span></p>
          <p><span className="text-gray-600">├─</span> organizations_tracked <span className="text-white ml-4">{formatNumber(orgTotals.total_orgs)}</span></p>
          <p><span className="text-gray-600">├─</span> covid_loans <span className="text-white ml-4">{formatNumber(totals.ppp_count + totals.eidl_count)}</span></p>
          <p><span className="text-gray-600">├─</span> federal_grants <span className="text-white ml-4">{formatNumber(totals.federal_grants_count)}</span></p>
          <p><span className="text-gray-600">├─</span> flagged_for_review <span className="text-red-400 ml-4">{formatNumber(totalFlagged)}</span></p>
          <p><span className="text-gray-600">├─</span> shell_companies <span className="text-red-400 ml-4">{formatNumber(orgTotals.shell_companies)}</span></p>
          <p><span className="text-gray-600">├─</span> childcare_providers <span className="text-white ml-4">{formatNumber(orgTotals.childcare_orgs)}</span></p>
          <p><span className="text-gray-600">├─</span> doj_press_releases <span className="text-white ml-4">{totals.doj_articles}</span></p>
          <p><span className="text-gray-600">└─</span> double_dippers <span className="text-white ml-4">{totals.double_dippers}</span></p>
        </div>
      </div>

      {/* Toshi Sponsor Banner */}
      <ToshiAdBanner className="mb-8" />

      {/* State breakdown table */}
      <div className="mb-10">
        <h2 className="text-sm font-medium text-gray-400 mb-3">Funding by State</h2>
        <div className="border border-gray-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left p-3 font-medium text-gray-400">State</th>
                <th className="text-right p-3 font-medium text-gray-400">PPP</th>
                <th className="text-right p-3 font-medium text-gray-400">EIDL</th>
                <th className="text-right p-3 font-medium text-gray-400">SBA 7a/504</th>
                <th className="text-right p-3 font-medium text-gray-400">Federal Grants</th>
                <th className="text-right p-3 font-medium text-gray-400">Orgs</th>
                <th className="text-right p-3 font-medium text-gray-400">Flagged</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {stateStats.map(s => {
                const org = orgStats.find(o => o.state === s.state);
                return (
                  <tr key={s.state} className="hover:bg-gray-900/50">
                    <td className="p-3 text-white">{STATE_NAMES[s.state]}</td>
                    <td className="p-3 text-right font-mono text-green-500">{formatMoney(s.ppp_amount)}</td>
                    <td className="p-3 text-right font-mono text-green-500">{formatMoney(s.eidl_amount)}</td>
                    <td className="p-3 text-right font-mono text-green-500">{formatMoney(s.sba_amount)}</td>
                    <td className="p-3 text-right font-mono text-green-500">{formatMoney(s.federal_grants_amount)}</td>
                    <td className="p-3 text-right font-mono">{formatNumber(org?.total_orgs || 0)}</td>
                    <td className="p-3 text-right font-mono text-red-400">{formatNumber(s.ppp_flagged_count + s.eidl_flagged_count)}</td>
                  </tr>
                );
              })}
              <tr className="bg-gray-900/30">
                <td className="p-3 text-gray-400 font-medium">Total</td>
                <td className="p-3 text-right font-mono text-green-500">{formatMoney(totals.ppp_amount)}</td>
                <td className="p-3 text-right font-mono text-green-500">{formatMoney(totals.eidl_amount)}</td>
                <td className="p-3 text-right font-mono text-green-500">{formatMoney(totals.sba_amount)}</td>
                <td className="p-3 text-right font-mono text-green-500">{formatMoney(totals.federal_grants)}</td>
                <td className="p-3 text-right font-mono text-white">{formatNumber(orgTotals.total_orgs)}</td>
                <td className="p-3 text-right font-mono text-red-400">{formatNumber(totalFlagged)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Loan counts table */}
      <div className="mb-10">
        <h2 className="text-sm font-medium text-gray-400 mb-3">Loan & Grant Counts</h2>
        <div className="border border-gray-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left p-3 font-medium text-gray-400">State</th>
                <th className="text-right p-3 font-medium text-gray-400">PPP Loans</th>
                <th className="text-right p-3 font-medium text-gray-400">EIDL Loans</th>
                <th className="text-right p-3 font-medium text-gray-400">SBA 7a/504</th>
                <th className="text-right p-3 font-medium text-gray-400">Federal Grants</th>
                <th className="text-right p-3 font-medium text-gray-400">DOJ Articles</th>
                <th className="text-right p-3 font-medium text-gray-400">Double Dip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {stateStats.map(s => (
                <tr key={s.state} className="hover:bg-gray-900/50">
                  <td className="p-3 text-white">{STATE_NAMES[s.state]}</td>
                  <td className="p-3 text-right font-mono">{formatNumber(s.ppp_count)}</td>
                  <td className="p-3 text-right font-mono">{formatNumber(s.eidl_count)}</td>
                  <td className="p-3 text-right font-mono">{formatNumber(s.sba_count)}</td>
                  <td className="p-3 text-right font-mono">{formatNumber(s.federal_grants_count)}</td>
                  <td className="p-3 text-right font-mono">{s.doj_articles}</td>
                  <td className="p-3 text-right font-mono">{s.double_dippers}</td>
                </tr>
              ))}
              <tr className="bg-gray-900/30">
                <td className="p-3 text-gray-400 font-medium">Total</td>
                <td className="p-3 text-right font-mono text-white">{formatNumber(totals.ppp_count)}</td>
                <td className="p-3 text-right font-mono text-white">{formatNumber(totals.eidl_count)}</td>
                <td className="p-3 text-right font-mono text-white">{formatNumber(totals.sba_count)}</td>
                <td className="p-3 text-right font-mono text-white">{formatNumber(totals.federal_grants_count)}</td>
                <td className="p-3 text-right font-mono text-white">{totals.doj_articles}</td>
                <td className="p-3 text-right font-mono text-white">{totals.double_dippers}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Organizations tracked */}
      <div className="mb-10">
        <h2 className="text-sm font-medium text-gray-400 mb-3">Organizations Tracked</h2>
        <div className="border border-gray-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left p-3 font-medium text-gray-400">State</th>
                <th className="text-right p-3 font-medium text-gray-400">Total Orgs</th>
                <th className="text-right p-3 font-medium text-gray-400">Childcare</th>
                <th className="text-right p-3 font-medium text-gray-400">PPP Recipients</th>
                <th className="text-right p-3 font-medium text-gray-400">Shell Companies</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {orgStats.map(o => (
                <tr key={o.state} className="hover:bg-gray-900/50">
                  <td className="p-3 text-white">{STATE_NAMES[o.state]}</td>
                  <td className="p-3 text-right font-mono">{formatNumber(o.total_orgs)}</td>
                  <td className="p-3 text-right font-mono">{formatNumber(o.childcare_orgs)}</td>
                  <td className="p-3 text-right font-mono">{formatNumber(o.ppp_recipients)}</td>
                  <td className="p-3 text-right font-mono text-red-400">{o.shell_companies > 0 ? formatNumber(o.shell_companies) : '-'}</td>
                </tr>
              ))}
              <tr className="bg-gray-900/30">
                <td className="p-3 text-gray-400 font-medium">Total</td>
                <td className="p-3 text-right font-mono text-white">{formatNumber(orgTotals.total_orgs)}</td>
                <td className="p-3 text-right font-mono text-white">{formatNumber(orgTotals.childcare_orgs)}</td>
                <td className="p-3 text-right font-mono text-white">{formatNumber(orgTotals.ppp_recipients)}</td>
                <td className="p-3 text-right font-mono text-red-400">{orgTotals.shell_companies > 0 ? formatNumber(orgTotals.shell_companies) : '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-gray-600 text-xs mt-2">
          Organizations unified from PPP, EIDL, SBA, federal grants, and state licensing data.
        </p>
      </div>

      {/* Funding coverage */}
      <div className="mb-10">
        <h2 className="text-sm font-medium text-gray-400 mb-3">Data Coverage</h2>
        <div className="border border-gray-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left p-3 font-medium text-gray-400">Program</th>
                <th className="text-right p-3 font-medium text-gray-400">Tracked</th>
                <th className="text-right p-3 font-medium text-gray-400">Coverage</th>
                <th className="text-left p-3 font-medium text-gray-400">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              <tr className="hover:bg-gray-900/50">
                <td className="p-3 text-white">PPP Loans</td>
                <td className="p-3 text-right font-mono text-green-500">{formatMoney(totals.ppp_amount)}</td>
                <td className="p-3 text-right text-gray-400">Complete</td>
                <td className="p-3 text-gray-500 text-xs">SBA FOIA data 2020-21</td>
              </tr>
              <tr className="hover:bg-gray-900/50">
                <td className="p-3 text-white">EIDL Loans</td>
                <td className="p-3 text-right font-mono text-green-500">{formatMoney(totals.eidl_amount)}</td>
                <td className="p-3 text-right text-gray-400">Apr-Nov 2020</td>
                <td className="p-3 text-gray-500 text-xs">data.sba.gov</td>
              </tr>
              <tr className="hover:bg-gray-900/50">
                <td className="p-3 text-white">SBA 7a/504</td>
                <td className="p-3 text-right font-mono text-green-500">{formatMoney(totals.sba_amount)}</td>
                <td className="p-3 text-right text-gray-400">Active loans</td>
                <td className="p-3 text-gray-500 text-xs">SBA.gov</td>
              </tr>
              <tr className="hover:bg-gray-900/50">
                <td className="p-3 text-white">Federal Grants</td>
                <td className="p-3 text-right font-mono text-green-500">{formatMoney(totals.federal_grants)}</td>
                <td className="p-3 text-right text-gray-400">FY2020-24</td>
                <td className="p-3 text-gray-500 text-xs">USASpending.gov</td>
              </tr>
              <tr className="hover:bg-gray-900/50">
                <td className="p-3 text-white">Childcare Providers</td>
                <td className="p-3 text-right font-mono text-white">{formatNumber(orgTotals.childcare_orgs)}</td>
                <td className="p-3 text-right text-gray-400">Licensed</td>
                <td className="p-3 text-gray-500 text-xs">State licensing boards</td>
              </tr>
              <tr className="hover:bg-gray-900/50">
                <td className="p-3 text-white">State COVID Relief</td>
                <td className="p-3 text-right font-mono text-gray-500">-</td>
                <td className="p-3 text-right text-gray-500">Pending</td>
                <td className="p-3 text-gray-500 text-xs">FOIA in progress</td>
              </tr>
              <tr className="hover:bg-gray-900/50">
                <td className="p-3 text-white">CCAP Subsidies</td>
                <td className="p-3 text-right font-mono text-gray-500">-</td>
                <td className="p-3 text-right text-gray-500">Pending</td>
                <td className="p-3 text-gray-500 text-xs">State DHS data</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Double dippers */}
      {doubleDippers.length > 0 && (
        <div className="mb-10">
          <h2 className="text-sm font-medium text-gray-400 mb-3">
            Double Dippers - {totals.double_dippers} businesses received both PPP and EIDL
          </h2>
          <div className="border border-gray-800 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-900">
                <tr>
                  <th className="text-left p-3 font-medium text-gray-400">Business Name</th>
                  <th className="text-left p-3 font-medium text-gray-400">State</th>
                  <th className="text-right p-3 font-medium text-gray-400">EIDL</th>
                  <th className="text-right p-3 font-medium text-gray-400">PPP</th>
                  <th className="text-right p-3 font-medium text-gray-400">Combined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {doubleDippers.map((row: DoubleDipper, i: number) => (
                  <tr key={i} className="hover:bg-gray-900/50">
                    <td className="p-3 text-white">{row.borrower_name}</td>
                    <td className="p-3 text-gray-400">{STATE_NAMES[row.borrower_state]}</td>
                    <td className="p-3 text-right font-mono text-green-500">{formatMoney(row.eidl_amount)}</td>
                    <td className="p-3 text-right font-mono text-green-500">{formatMoney(row.ppp_amount)}</td>
                    <td className="p-3 text-right font-mono text-green-500">{formatMoney(row.eidl_amount + row.ppp_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-gray-600 text-xs mt-2">
            Sample of {doubleDippers.length} businesses matched by normalized name. Total: {totals.double_dippers}
          </p>
        </div>
      )}

      {/* Fraud cases */}
      {fraudCases.length > 0 && (
        <div className="mb-10">
          <h2 className="text-sm font-medium text-gray-400 mb-3">Prosecuted Fraud Cases</h2>
          <div className="border border-gray-800 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-900">
                <tr>
                  <th className="text-left p-3 font-medium text-gray-400">Case</th>
                  <th className="text-left p-3 font-medium text-gray-400">State</th>
                  <th className="text-left p-3 font-medium text-gray-400">Type</th>
                  <th className="text-right p-3 font-medium text-gray-400">Amount</th>
                  <th className="text-left p-3 font-medium text-gray-400">Status</th>
                  <th className="text-right p-3 font-medium text-gray-400">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {fraudCases.slice(0, 10).map((c: FraudCase) => (
                  <tr key={c.id} className="hover:bg-gray-900/50">
                    <td className="p-3">
                      <Link href={`/case/${c.id}`} className="text-white hover:text-green-400">
                        {c.case_name.length > 50 ? c.case_name.slice(0, 50) + '...' : c.case_name}
                      </Link>
                    </td>
                    <td className="p-3 text-gray-400">{STATE_NAMES[c.state]}</td>
                    <td className="p-3 text-gray-400">{c.fraud_type || '-'}</td>
                    <td className="p-3 text-right font-mono text-green-500">{formatMoney(c.total_fraud_amount)}</td>
                    <td className="p-3 text-gray-400">{c.status}</td>
                    <td className="p-3 text-right text-gray-500">{formatDate(getCaseDate(c))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {fraudCases.length > 10 && (
            <p className="text-gray-600 text-xs mt-2">
              Showing 10 of {fraudCases.length} cases. <Link href="/cases" className="text-green-500 hover:underline">View all</Link>
            </p>
          )}
        </div>
      )}

      {/* Demographics */}
      <div className="mb-10">
        <h2 className="text-sm font-medium text-gray-400 mb-3">
          PPP Demographics - Self-reported race, 70-78% unanswered
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {['MN', 'OH', 'WA'].map(state => {
            const stateDemos = demographics.filter((d: DemographicRow) => d.borrower_state === state);
            return (
              <div key={state} className="border border-gray-800 p-4">
                <h3 className="text-white font-medium mb-3">{STATE_NAMES[state]}</h3>
                <div className="space-y-1 text-sm font-mono">
                  {stateDemos.slice(0, 5).map((d: DemographicRow, i: number) => (
                    <div key={i} className="flex justify-between">
                      <span className="text-gray-400 truncate pr-2">{d.demographic_value}</span>
                      <span className="text-white">{formatNumber(d.loan_count)} <span className="text-gray-600">({d.pct_of_loans?.toFixed(1)}%)</span></span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DOJ articles */}
      <div className="mb-10">
        <h2 className="text-sm font-medium text-gray-400 mb-3">DOJ Press Releases - Fraud-related</h2>
        <div className="border border-gray-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left p-3 font-medium text-gray-400">Title</th>
                <th className="text-left p-3 font-medium text-gray-400">State</th>
                <th className="text-left p-3 font-medium text-gray-400">Type</th>
                <th className="text-left p-3 font-medium text-gray-400">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {dojArticles.slice(0, 15).map((article: DojArticle, i: number) => (
                <tr key={i} className="hover:bg-gray-900/50">
                  <td className="p-3">
                    <a 
                      href={article.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-white hover:text-green-400"
                    >
                      {article.title.length > 60 ? article.title.slice(0, 60) + '...' : article.title}
                    </a>
                  </td>
                  <td className="p-3 text-gray-400">{STATE_NAMES[article.state]}</td>
                  <td className="p-3 text-gray-500">{article.fraud_types?.join(', ') || '-'}</td>
                  <td className="p-3 text-gray-600 text-xs">{article.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export data */}
      <div className="mb-10">
        <h2 className="text-sm font-medium text-gray-400 mb-3">Export Data</h2>
        <div className="border border-gray-800 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {['MN', 'OH', 'WA'].map(state => (
              <div key={state}>
                <h3 className="text-white font-medium mb-3">{STATE_NAMES[state]}</h3>
                <div className="space-y-2 text-sm">
                  <a 
                    href={`/api/export/${state}?type=summary`}
                    className="block text-gray-400 hover:text-green-400"
                  >
                    Summary CSV
                  </a>
                  <a 
                    href={`/api/export/${state}?type=ppp`}
                    className="block text-gray-400 hover:text-green-400"
                  >
                    PPP Loans CSV
                  </a>
                  <a 
                    href={`/api/export/${state}?type=eidl`}
                    className="block text-gray-400 hover:text-green-400"
                  >
                    EIDL Loans CSV
                  </a>
                  <a 
                    href={`/api/export/${state}?type=flagged`}
                    className="block text-gray-400 hover:text-green-400"
                  >
                    Flagged Loans CSV
                  </a>
                  <a 
                    href={`/api/export/${state}?type=double-dippers`}
                    className="block text-gray-400 hover:text-green-400"
                  >
                    Double Dippers CSV
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Methodology */}
      <div className="border-t border-gray-800 pt-6">
        <h3 className="text-sm font-medium text-gray-400 mb-3">Methodology</h3>
        <p className="text-gray-500 text-sm leading-relaxed">
          Loans flagged based on: exact maximum amounts, round dollar figures, sole proprietorships 
          with high loans, early COVID timing (April 2020), suspicious addresses, fraud-prone industry 
          NAICS codes. Double-dippers identified by matching normalized business names between PPP and 
          EIDL datasets. Demographic data is self-reported with 70-78% non-response rate.
        </p>
      </div>
    </div>
  );
}
