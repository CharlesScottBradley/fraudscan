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

interface IndustryStats {
  naics_code: string;
  industry_name: string;
  loan_count: number;
  total_amount: number;
  flagged_count: number;
  flagged_amount: number;
  flag_rate: number;
  risk_level: 'critical' | 'high' | 'medium' | 'low';
  avg_loan_size: number;
}

interface StateBreakdown {
  state: string;
  childcare: number;
  restaurants: number;
  taxi: number;
  hotels: number;
  salons: number;
}

// Known fraud-prone NAICS codes with risk levels
const FRAUD_PRONE_INDUSTRIES: { code: string; name: string; risk: 'high' | 'medium'; category: string }[] = [
  { code: '624410', name: 'Child Day Care Services', risk: 'high', category: 'childcare' },
  { code: '722511', name: 'Full-Service Restaurants', risk: 'high', category: 'restaurant' },
  { code: '722513', name: 'Limited-Service Restaurants', risk: 'high', category: 'restaurant' },
  { code: '485310', name: 'Taxi and Rideshare Services', risk: 'high', category: 'transportation' },
  { code: '721110', name: 'Hotels and Motels', risk: 'high', category: 'hotel' },
  { code: '812112', name: 'Beauty Salons', risk: 'medium', category: 'personal_care' },
  { code: '812111', name: 'Barber Shops', risk: 'medium', category: 'personal_care' },
  { code: '811111', name: 'General Auto Repair', risk: 'medium', category: 'automotive' },
  { code: '447110', name: 'Gas Stations with Convenience Stores', risk: 'high', category: 'gas_station' },
  { code: '722410', name: 'Drinking Places (Alcoholic Beverages)', risk: 'medium', category: 'restaurant' },
  { code: '812320', name: 'Dry Cleaning and Laundry Services', risk: 'medium', category: 'dry_cleaner' },
  { code: '445120', name: 'Convenience Stores', risk: 'high', category: 'convenience_store' },
  { code: '485320', name: 'Limousine Service', risk: 'medium', category: 'transportation' },
  { code: '453310', name: 'Used Merchandise Stores', risk: 'medium', category: 'retail' },
  { code: '453991', name: 'Tobacco Stores', risk: 'high', category: 'retail' },
  { code: '812310', name: 'Coin-Operated Laundries', risk: 'medium', category: 'laundry' },
  { code: '812191', name: 'Diet and Weight Reducing Centers', risk: 'medium', category: 'personal_care' },
  { code: '561422', name: 'Telemarketing Bureaus and Call Centers', risk: 'high', category: 'telemarketing' },
];

// Focus states for state breakdown
const FOCUS_STATES = ['MN', 'OH', 'WA', 'TX', 'FL', 'CA', 'NY'];

async function getIndustryStats(): Promise<IndustryStats[]> {
  const results: IndustryStats[] = [];

  // Query each NAICS code for comprehensive stats
  for (const industry of FRAUD_PRONE_INDUSTRIES) {
    const [totalRes, flaggedRes, amountRes, flaggedAmountRes] = await Promise.all([
      supabase.from('ppp_loans').select('*', { count: 'exact', head: true }).eq('naics_code', industry.code),
      supabase.from('ppp_loans').select('*', { count: 'exact', head: true }).eq('naics_code', industry.code).eq('is_flagged', true),
      supabase.from('ppp_loans').select('initial_approval_amount').eq('naics_code', industry.code).limit(10000),
      supabase.from('ppp_loans').select('initial_approval_amount').eq('naics_code', industry.code).eq('is_flagged', true).limit(5000),
    ]);

    const loanCount = totalRes.count || 0;
    const flaggedCount = flaggedRes.count || 0;
    const totalAmount = amountRes.data?.reduce((sum, l) => sum + (l.initial_approval_amount || 0), 0) || 0;
    const flaggedAmount = flaggedAmountRes.data?.reduce((sum, l) => sum + (l.initial_approval_amount || 0), 0) || 0;

    // Estimate full amounts based on sample
    const estTotalAmount = loanCount > 10000 ? totalAmount * (loanCount / 10000) : totalAmount;
    const estFlaggedAmount = flaggedCount > 5000 ? flaggedAmount * (flaggedCount / 5000) : flaggedAmount;

    if (loanCount > 0) {
      const flagRate = (flaggedCount / loanCount) * 100;

      // Determine risk level
      let riskLevel: 'critical' | 'high' | 'medium' | 'low';
      if (flagRate > 0.5 || flaggedCount > 100) {
        riskLevel = 'critical';
      } else if (flagRate > 0.2 || industry.risk === 'high') {
        riskLevel = 'high';
      } else if (flagRate > 0.05 || industry.risk === 'medium') {
        riskLevel = 'medium';
      } else {
        riskLevel = 'low';
      }

      results.push({
        naics_code: industry.code,
        industry_name: industry.name,
        loan_count: loanCount,
        total_amount: estTotalAmount,
        flagged_count: flaggedCount,
        flagged_amount: estFlaggedAmount,
        flag_rate: flagRate,
        risk_level: riskLevel,
        avg_loan_size: estTotalAmount / loanCount,
      });
    }
  }

  // Sort by flagged count, then by total count
  results.sort((a, b) => {
    if (b.flagged_count !== a.flagged_count) return b.flagged_count - a.flagged_count;
    return b.loan_count - a.loan_count;
  });

  return results;
}

async function getStateBreakdown(): Promise<StateBreakdown[]> {
  const results: StateBreakdown[] = [];

  for (const state of FOCUS_STATES) {
    const [childcare, restaurants, taxi, hotels, salons] = await Promise.all([
      supabase.from('ppp_loans').select('*', { count: 'exact', head: true }).eq('naics_code', '624410').eq('borrower_state', state),
      supabase.from('ppp_loans').select('*', { count: 'exact', head: true }).in('naics_code', ['722511', '722513']).eq('borrower_state', state),
      supabase.from('ppp_loans').select('*', { count: 'exact', head: true }).eq('naics_code', '485310').eq('borrower_state', state),
      supabase.from('ppp_loans').select('*', { count: 'exact', head: true }).eq('naics_code', '721110').eq('borrower_state', state),
      supabase.from('ppp_loans').select('*', { count: 'exact', head: true }).in('naics_code', ['812111', '812112']).eq('borrower_state', state),
    ]);

    results.push({
      state,
      childcare: childcare.count || 0,
      restaurants: restaurants.count || 0,
      taxi: taxi.count || 0,
      hotels: hotels.count || 0,
      salons: salons.count || 0,
    });
  }

  // Sort by total
  results.sort((a, b) => (b.childcare + b.restaurants + b.taxi) - (a.childcare + a.restaurants + a.taxi));

  return results;
}

async function getTotalPPPStats() {
  const [{ count: totalLoans }, { count: totalFlagged }] = await Promise.all([
    supabase.from('ppp_loans').select('*', { count: 'exact', head: true }),
    supabase.from('ppp_loans').select('*', { count: 'exact', head: true }).eq('is_flagged', true),
  ]);

  return {
    totalLoans: totalLoans || 0,
    totalFlagged: totalFlagged || 0,
  };
}

export const revalidate = 600;

export default async function IndustryAnalysisPage() {
  const [industries, stateBreakdown, pppStats] = await Promise.all([
    getIndustryStats(),
    getStateBreakdown(),
    getTotalPPPStats(),
  ]);

  const totalIndustryLoans = industries.reduce((sum, i) => sum + i.loan_count, 0);
  const totalIndustryAmount = industries.reduce((sum, i) => sum + i.total_amount, 0);
  const totalFlagged = industries.reduce((sum, i) => sum + i.flagged_count, 0);
  const totalFlaggedAmount = industries.reduce((sum, i) => sum + i.flagged_amount, 0);
  const criticalIndustries = industries.filter(i => i.risk_level === 'critical');
  const highRiskIndustries = industries.filter(i => i.risk_level === 'high' || i.risk_level === 'critical');

  return (
    <div>
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-6">
        <Link href="/investigation" className="hover:text-gray-300">Investigations</Link>
        <span className="mx-2">/</span>
        <span className="text-white">Industry Analysis</span>
      </div>

      {/* Terminal-style stats */}
      <div className="font-mono text-sm mb-10">
        <p className="text-gray-500">FRAUD_PRONE_INDUSTRY_ANALYSIS</p>
        <div className="mt-2 text-gray-400">
          <p><span className="text-gray-600">├─</span> ppp_database <span className="text-white ml-4">{formatNumber(pppStats.totalLoans)} loans</span></p>
          <p><span className="text-gray-600">├─</span> industries_tracked <span className="text-white ml-4">{FRAUD_PRONE_INDUSTRIES.length}</span></p>
          <p><span className="text-gray-600">├─</span> loans_in_tracked <span className="text-white ml-4">{formatNumber(totalIndustryLoans)}</span></p>
          <p><span className="text-gray-600">├─</span> total_funding <span className="text-green-500 ml-4">{formatMoney(totalIndustryAmount)}</span></p>
          <p><span className="text-gray-600">├─</span> critical_industries <span className="text-red-400 ml-4">{criticalIndustries.length}</span></p>
          <p><span className="text-gray-600">├─</span> flagged_loans <span className="text-red-400 ml-4">{formatNumber(totalFlagged)}</span></p>
          <p><span className="text-gray-600">└─</span> flagged_value <span className="text-red-400 ml-4">{formatMoney(totalFlaggedAmount)}</span></p>
        </div>
      </div>

      {/* Toshi Sponsor Banner */}
      <ToshiAdBanner className="mb-8" />

      {/* Explanation */}
      <div className="border border-gray-800 p-4 mb-8">
        <h2 className="text-white font-medium mb-2">What is this</h2>
        <p className="text-sm text-gray-400 leading-relaxed">
          Comprehensive analysis of {formatNumber(pppStats.totalLoans)} PPP loans across 18 fraud-prone industries.
          These NAICS codes appear disproportionately in DOJ prosecutions and OIG reports. Industries with high
          cash volumes, employee turnover, and limited documentation face elevated fraud risk.
        </p>
      </div>

      {/* Critical Alert */}
      {criticalIndustries.length > 0 && (
        <div className="border border-red-800 bg-red-900/10 p-4 mb-8">
          <h2 className="text-red-400 font-medium mb-2">Critical Risk Industries ({criticalIndustries.length})</h2>
          <p className="text-sm text-gray-400 mb-3">
            Industries with &gt;0.5% flag rate or &gt;100 flagged loans require priority investigation.
          </p>
          <div className="flex flex-wrap gap-2">
            {criticalIndustries.map(ind => (
              <span key={ind.naics_code} className="text-xs bg-red-900/50 text-red-400 px-2 py-1 rounded font-mono">
                {ind.naics_code}: {ind.industry_name} ({formatNumber(ind.flagged_count)} flagged)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Industry table */}
      <div className="mb-8">
        <h2 className="text-sm font-medium text-gray-400 mb-3">
          Industry Breakdown
        </h2>
        <div className="border border-gray-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left p-3 font-medium text-gray-400">NAICS</th>
                <th className="text-left p-3 font-medium text-gray-400">Industry</th>
                <th className="text-right p-3 font-medium text-gray-400">Loans</th>
                <th className="text-right p-3 font-medium text-gray-400">Total Amount</th>
                <th className="text-right p-3 font-medium text-gray-400">Avg Loan</th>
                <th className="text-right p-3 font-medium text-gray-400">Flagged</th>
                <th className="text-right p-3 font-medium text-gray-400">Flag Rate</th>
                <th className="text-center p-3 font-medium text-gray-400">Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {industries.map(industry => (
                <tr
                  key={industry.naics_code}
                  className={industry.risk_level === 'critical'
                    ? 'bg-red-900/10 hover:bg-red-900/20'
                    : industry.risk_level === 'high'
                      ? 'bg-yellow-900/5 hover:bg-yellow-900/10'
                      : 'hover:bg-gray-900/50'
                  }
                >
                  <td className="p-3 font-mono text-gray-400">{industry.naics_code}</td>
                  <td className="p-3 text-white">{industry.industry_name}</td>
                  <td className="p-3 text-right font-mono text-white">{formatNumber(industry.loan_count)}</td>
                  <td className="p-3 text-right font-mono text-green-500">{formatMoney(industry.total_amount)}</td>
                  <td className="p-3 text-right font-mono text-gray-400">{formatMoney(industry.avg_loan_size)}</td>
                  <td className="p-3 text-right font-mono text-red-400">{formatNumber(industry.flagged_count)}</td>
                  <td className="p-3 text-right font-mono text-gray-400">{industry.flag_rate.toFixed(2)}%</td>
                  <td className="p-3 text-center">
                    {industry.risk_level === 'critical' ? (
                      <span className="text-xs bg-red-900/50 text-red-400 px-2 py-0.5 rounded">CRITICAL</span>
                    ) : industry.risk_level === 'high' ? (
                      <span className="text-xs bg-yellow-900/50 text-yellow-400 px-2 py-0.5 rounded">HIGH</span>
                    ) : industry.risk_level === 'medium' ? (
                      <span className="text-xs bg-orange-900/50 text-orange-400 px-2 py-0.5 rounded">MED</span>
                    ) : (
                      <span className="text-xs text-gray-600">LOW</span>
                    )}
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-900/30">
                <td className="p-3 text-gray-400" colSpan={2}>Total ({industries.length} industries)</td>
                <td className="p-3 text-right font-mono text-white">{formatNumber(totalIndustryLoans)}</td>
                <td className="p-3 text-right font-mono text-green-500">{formatMoney(totalIndustryAmount)}</td>
                <td className="p-3 text-right font-mono text-gray-400">{formatMoney(totalIndustryAmount / totalIndustryLoans)}</td>
                <td className="p-3 text-right font-mono text-red-400">{formatNumber(totalFlagged)}</td>
                <td className="p-3 text-right font-mono text-gray-400">
                  {totalIndustryLoans > 0 ? ((totalFlagged / totalIndustryLoans) * 100).toFixed(2) : 0}%
                </td>
                <td className="p-3"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* State Breakdown */}
      <div className="mb-8">
        <h2 className="text-sm font-medium text-gray-400 mb-3">
          State Breakdown (Focus States)
        </h2>
        <div className="border border-gray-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left p-3 font-medium text-gray-400">State</th>
                <th className="text-right p-3 font-medium text-gray-400">Childcare</th>
                <th className="text-right p-3 font-medium text-gray-400">Restaurants</th>
                <th className="text-right p-3 font-medium text-gray-400">Taxi/Rideshare</th>
                <th className="text-right p-3 font-medium text-gray-400">Hotels</th>
                <th className="text-right p-3 font-medium text-gray-400">Salons/Barbers</th>
                <th className="text-right p-3 font-medium text-gray-400">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {stateBreakdown.map(s => (
                <tr key={s.state} className="hover:bg-gray-900/50">
                  <td className="p-3 text-white font-medium">{s.state}</td>
                  <td className="p-3 text-right font-mono text-gray-400">{formatNumber(s.childcare)}</td>
                  <td className="p-3 text-right font-mono text-gray-400">{formatNumber(s.restaurants)}</td>
                  <td className="p-3 text-right font-mono text-gray-400">{formatNumber(s.taxi)}</td>
                  <td className="p-3 text-right font-mono text-gray-400">{formatNumber(s.hotels)}</td>
                  <td className="p-3 text-right font-mono text-gray-400">{formatNumber(s.salons)}</td>
                  <td className="p-3 text-right font-mono text-white">
                    {formatNumber(s.childcare + s.restaurants + s.taxi + s.hotels + s.salons)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Risk Level Legend */}
      <div className="border border-gray-800 p-4 mb-8">
        <h3 className="text-white font-medium mb-3">Risk Levels</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs bg-red-900/50 text-red-400 px-2 py-0.5 rounded">CRITICAL</span>
            <span className="text-gray-400">&gt;0.5% flagged or 100+ flags</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-yellow-900/50 text-yellow-400 px-2 py-0.5 rounded">HIGH</span>
            <span className="text-gray-400">&gt;0.2% flagged, DOJ priority</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-orange-900/50 text-orange-400 px-2 py-0.5 rounded">MED</span>
            <span className="text-gray-400">&gt;0.05% flagged, cash-heavy</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">LOW</span>
            <span className="text-gray-400">Below threshold</span>
          </div>
        </div>
      </div>

      {/* Why these industries */}
      <div className="border border-gray-800 p-4 mb-8">
        <h3 className="text-white font-medium mb-3">Why these industries</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-400">
          <div>
            <p className="text-gray-500 mb-2">Cash-heavy operations</p>
            <p>Restaurants, bars, salons, and gas stations handle significant cash, making payroll inflation easier to hide.</p>
          </div>
          <div>
            <p className="text-gray-500 mb-2">High employee turnover</p>
            <p>Industries with seasonal or temporary workers make it difficult to verify employee counts retroactively.</p>
          </div>
          <div>
            <p className="text-gray-500 mb-2">Limited documentation</p>
            <p>Small businesses in these sectors often lack formal HR systems and payroll records.</p>
          </div>
          <div>
            <p className="text-gray-500 mb-2">DOJ prosecution patterns</p>
            <p>These NAICS codes appear disproportionately in federal fraud prosecutions and OIG reports.</p>
          </div>
        </div>
      </div>

      {/* Notable Patterns */}
      <div className="border border-gray-800 p-4 mb-8">
        <h3 className="text-white font-medium mb-3">Notable Patterns</h3>
        <div className="space-y-3 text-sm text-gray-400">
          <div className="flex gap-3">
            <span className="text-red-400">→</span>
            <p><span className="text-white">Childcare (624410)</span>: Highest flagged loan count at {formatNumber(industries.find(i => i.naics_code === '624410')?.flagged_count || 0)}. Minnesota childcare fraud wave involved systematic abuse of this NAICS code.</p>
          </div>
          <div className="flex gap-3">
            <span className="text-yellow-400">→</span>
            <p><span className="text-white">Restaurants (722511/722513)</span>: Combined {formatNumber((industries.find(i => i.naics_code === '722511')?.loan_count || 0) + (industries.find(i => i.naics_code === '722513')?.loan_count || 0))} loans. Cash operations make verification difficult.</p>
          </div>
          <div className="flex gap-3">
            <span className="text-yellow-400">→</span>
            <p><span className="text-white">Beauty Salons (812112)</span>: {formatNumber(industries.find(i => i.naics_code === '812112')?.loan_count || 0)} loans with high self-employment rate creates identity verification challenges.</p>
          </div>
          <div className="flex gap-3">
            <span className="text-orange-400">→</span>
            <p><span className="text-white">Taxi/Rideshare (485310)</span>: {formatNumber(industries.find(i => i.naics_code === '485310')?.loan_count || 0)} loans. Gig economy makes employee verification complex.</p>
          </div>
        </div>
      </div>

      {/* Methodology */}
      <div className="mt-8 border-t border-gray-800 pt-6">
        <h3 className="text-sm font-medium text-gray-400 mb-3">Methodology</h3>
        <p className="text-gray-500 text-sm leading-relaxed">
          Analysis uses the complete PPP database of {formatNumber(pppStats.totalLoans)} loans.
          {formatNumber(pppStats.totalFlagged)} loans are currently flagged across all industries ({((pppStats.totalFlagged / pppStats.totalLoans) * 100).toFixed(2)}% flag rate).
          Flag rate calculated as percentage of loans with automated fraud indicators including: high dollar-per-employee ratios,
          round amounts, timing patterns, and matches against prosecuted fraud cases. Industry classification based on
          self-reported NAICS at time of loan application. State breakdown shows 7 focus states with known fraud concentrations.
        </p>
      </div>
    </div>
  );
}



