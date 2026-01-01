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

interface IndustryStats {
  naics_code: string;
  industry_name: string;
  loan_count: number;
  total_amount: number;
  flagged_count: number;
  flagged_amount: number;
  flag_rate: number;
}

// Known fraud-prone NAICS codes
const FRAUD_PRONE_INDUSTRIES = [
  { code: '722511', name: 'Full-Service Restaurants', risk: 'high' },
  { code: '722513', name: 'Limited-Service Restaurants', risk: 'high' },
  { code: '721110', name: 'Hotels and Motels', risk: 'high' },
  { code: '447110', name: 'Gas Stations with Convenience Stores', risk: 'high' },
  { code: '445120', name: 'Convenience Stores', risk: 'high' },
  { code: '812111', name: 'Barber Shops', risk: 'medium' },
  { code: '812112', name: 'Beauty Salons', risk: 'medium' },
  { code: '812191', name: 'Diet and Weight Reducing Centers', risk: 'medium' },
  { code: '453991', name: 'Tobacco Stores', risk: 'high' },
  { code: '812310', name: 'Coin-Operated Laundries', risk: 'medium' },
  { code: '812320', name: 'Dry Cleaning and Laundry Services', risk: 'medium' },
  { code: '561422', name: 'Telemarketing Bureaus and Call Centers', risk: 'high' },
  { code: '624410', name: 'Child Day Care Services', risk: 'high' },
  { code: '485310', name: 'Taxi and Rideshare Services', risk: 'high' },
  { code: '485320', name: 'Limousine Service', risk: 'medium' },
  { code: '722410', name: 'Drinking Places (Alcoholic Beverages)', risk: 'medium' },
  { code: '811111', name: 'General Auto Repair', risk: 'medium' },
  { code: '453310', name: 'Used Merchandise Stores', risk: 'medium' },
];

async function getIndustryStats(): Promise<IndustryStats[]> {
  // Get PPP loans by NAICS code for fraud-prone industries
  const naicsCodes = FRAUD_PRONE_INDUSTRIES.map(i => i.code);
  
  const { data, error } = await supabase
    .from('ppp_loans')
    .select('naics_code, initial_approval_amount, is_flagged')
    .in('naics_code', naicsCodes)
    .limit(50000);

  if (error || !data) {
    console.error('Error fetching industry data:', error);
    return [];
  }

  // Aggregate by NAICS code
  const statsMap = new Map<string, {
    count: number;
    total: number;
    flagged_count: number;
    flagged_amount: number;
  }>();

  for (const loan of data) {
    const code = loan.naics_code;
    if (!code) continue;

    if (!statsMap.has(code)) {
      statsMap.set(code, { count: 0, total: 0, flagged_count: 0, flagged_amount: 0 });
    }

    const entry = statsMap.get(code);
    if (entry) {
      entry.count++;
      entry.total += loan.initial_approval_amount || 0;
      if (loan.is_flagged) {
        entry.flagged_count++;
        entry.flagged_amount += loan.initial_approval_amount || 0;
      }
    }
  }

  // Build results with industry names
  const results: IndustryStats[] = [];
  for (const industry of FRAUD_PRONE_INDUSTRIES) {
    const stats = statsMap.get(industry.code);
    if (stats && stats.count > 0) {
      results.push({
        naics_code: industry.code,
        industry_name: industry.name,
        loan_count: stats.count,
        total_amount: stats.total,
        flagged_count: stats.flagged_count,
        flagged_amount: stats.flagged_amount,
        flag_rate: (stats.flagged_count / stats.count) * 100
      });
    }
  }

  // Sort by total amount
  results.sort((a, b) => b.total_amount - a.total_amount);

  return results;
}

export const revalidate = 600;

export default async function IndustryAnalysisPage() {
  const industries = await getIndustryStats();

  const totalLoans = industries.reduce((sum, i) => sum + i.loan_count, 0);
  const totalAmount = industries.reduce((sum, i) => sum + i.total_amount, 0);
  const totalFlagged = industries.reduce((sum, i) => sum + i.flagged_count, 0);
  const totalFlaggedAmount = industries.reduce((sum, i) => sum + i.flagged_amount, 0);

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
          <p><span className="text-gray-600">├─</span> industries_tracked <span className="text-white ml-4">{FRAUD_PRONE_INDUSTRIES.length}</span></p>
          <p><span className="text-gray-600">├─</span> loans_in_sample <span className="text-white ml-4">{formatNumber(totalLoans)}</span></p>
          <p><span className="text-gray-600">├─</span> total_funding <span className="text-green-500 ml-4">{formatMoney(totalAmount)}</span></p>
          <p><span className="text-gray-600">├─</span> flagged_loans <span className="text-white ml-4">{formatNumber(totalFlagged)}</span></p>
          <p><span className="text-gray-600">└─</span> flagged_value <span className="text-green-500 ml-4">{formatMoney(totalFlaggedAmount)}</span></p>
        </div>
      </div>

      {/* Explanation */}
      <div className="border border-gray-800 p-4 mb-8">
        <h2 className="text-white font-medium mb-2">What is this</h2>
        <p className="text-sm text-gray-400 leading-relaxed">
          Analysis of PPP loans in industries with historically high fraud rates. These NAICS codes 
          appear frequently in DOJ prosecutions and OIG reports. High fraud rates in these industries 
          are driven by cash-heavy operations, ease of falsifying payroll, and limited documentation 
          requirements for small businesses.
        </p>
      </div>

      {/* Industry table */}
      <div className="border border-gray-800 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-900">
            <tr>
              <th className="text-left p-3 font-medium text-gray-400">NAICS</th>
              <th className="text-left p-3 font-medium text-gray-400">Industry</th>
              <th className="text-right p-3 font-medium text-gray-400">Loans</th>
              <th className="text-right p-3 font-medium text-gray-400">Total Amount</th>
              <th className="text-right p-3 font-medium text-gray-400">Flagged</th>
              <th className="text-right p-3 font-medium text-gray-400">Flagged Amount</th>
              <th className="text-right p-3 font-medium text-gray-400">Flag Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {industries.map(industry => (
              <tr key={industry.naics_code} className="hover:bg-gray-900/50">
                <td className="p-3 font-mono text-gray-400">{industry.naics_code}</td>
                <td className="p-3 text-white">{industry.industry_name}</td>
                <td className="p-3 text-right font-mono text-white">{formatNumber(industry.loan_count)}</td>
                <td className="p-3 text-right font-mono text-green-500">{formatMoney(industry.total_amount)}</td>
                <td className="p-3 text-right font-mono text-white">{formatNumber(industry.flagged_count)}</td>
                <td className="p-3 text-right font-mono text-green-500">{formatMoney(industry.flagged_amount)}</td>
                <td className="p-3 text-right font-mono text-gray-400">{industry.flag_rate.toFixed(1)}%</td>
              </tr>
            ))}
            <tr className="bg-gray-900/30">
              <td className="p-3 text-gray-400" colSpan={2}>Total</td>
              <td className="p-3 text-right font-mono text-white">{formatNumber(totalLoans)}</td>
              <td className="p-3 text-right font-mono text-green-500">{formatMoney(totalAmount)}</td>
              <td className="p-3 text-right font-mono text-white">{formatNumber(totalFlagged)}</td>
              <td className="p-3 text-right font-mono text-green-500">{formatMoney(totalFlaggedAmount)}</td>
              <td className="p-3 text-right font-mono text-gray-400">
                {totalLoans > 0 ? ((totalFlagged / totalLoans) * 100).toFixed(1) : 0}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Why these industries */}
      <div className="mt-8 border border-gray-800 p-4">
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

      {/* Methodology */}
      <div className="mt-8 border-t border-gray-800 pt-6">
        <h3 className="text-sm font-medium text-gray-400 mb-3">Methodology</h3>
        <p className="text-gray-500 text-sm leading-relaxed">
          Analysis based on sample of up to 50,000 PPP loans in tracked NAICS codes. Flag rate 
          calculated as percentage of loans with automated fraud indicators (high dollar-per-employee, 
          round amounts, timing patterns). Industry classification based on self-reported NAICS at 
          time of loan application.
        </p>
      </div>
    </div>
  );
}

