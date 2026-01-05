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

const STATE_NAMES: Record<string, string> = {
  MN: 'Minnesota',
  OH: 'Ohio',
  WA: 'Washington',
  TX: 'Texas',
  FL: 'Florida',
  CA: 'California',
  NY: 'New York'
};

interface DoubleDipper {
  borrower_name: string;
  borrower_state: string;
  borrower_city: string;
  ppp_amount: number;
  eidl_amount: number;
  combined_amount: number;
  ppp_loan_number: string;
  eidl_fain: string;
  is_flagged: boolean;
  fraud_score: number | null;
  is_fraud_prone_industry: boolean;
  industry_category: string | null;
  risk_level: 'critical' | 'high' | 'medium' | 'low';
}

interface StateStats {
  state: string;
  count: number;
  ppp_total: number;
  eidl_total: number;
  combined_total: number;
  flagged_count: number;
}

async function getStateStats(): Promise<StateStats[]> {
  const states = ['MN', 'OH', 'WA'];
  const stats: StateStats[] = [];

  for (const state of states) {
    // Get EIDL loans with PPP links for this state
    const { data: eidlData } = await supabase
      .from('eidl_loans')
      .select('loan_amount, ppp_loan_id, is_flagged')
      .eq('borrower_state', state)
      .not('ppp_loan_id', 'is', null);

    if (!eidlData || eidlData.length === 0) continue;

    // Get PPP amounts
    const pppIds = eidlData.map(e => e.ppp_loan_id).filter(Boolean);
    const { data: pppData } = await supabase
      .from('ppp_loans')
      .select('id, initial_approval_amount')
      .in('id', pppIds);

    const pppMap = new Map((pppData || []).map(p => [p.id, p.initial_approval_amount || 0]));

    const eidl_total = eidlData.reduce((sum, e) => sum + (e.loan_amount || 0), 0);
    const ppp_total = eidlData.reduce((sum, e) => sum + (pppMap.get(e.ppp_loan_id) || 0), 0);
    const flagged_count = eidlData.filter(e => e.is_flagged).length;

    stats.push({
      state,
      count: eidlData.length,
      ppp_total,
      eidl_total,
      combined_total: ppp_total + eidl_total,
      flagged_count
    });
  }

  return stats.sort((a, b) => b.combined_total - a.combined_total);
}

async function getDoubleDippers(): Promise<DoubleDipper[]> {
  // Get all EIDL loans that have a linked PPP loan
  const { data: eidlData, error: eidlError } = await supabase
    .from('eidl_loans')
    .select('borrower_name, borrower_state, borrower_city, loan_amount, fain, ppp_loan_id, fraud_score, is_flagged, is_fraud_prone_industry, industry_category')
    .not('ppp_loan_id', 'is', null)
    .order('loan_amount', { ascending: false });

  if (eidlError || !eidlData || eidlData.length === 0) {
    console.error('Error fetching double dippers:', eidlError);
    return [];
  }

  // Get corresponding PPP loan details
  const pppIds = eidlData.map(e => e.ppp_loan_id).filter(Boolean);
  const { data: pppData } = await supabase
    .from('ppp_loans')
    .select('id, loan_number, initial_approval_amount, is_flagged, fraud_score')
    .in('id', pppIds);

  const pppMap = new Map((pppData || []).map(p => [p.id, {
    amount: p.initial_approval_amount || 0,
    loan_number: p.loan_number || '',
    is_flagged: p.is_flagged || false,
    fraud_score: p.fraud_score
  }]));

  // Create combined records
  const dippers: DoubleDipper[] = eidlData.map(e => {
    const ppp = pppMap.get(e.ppp_loan_id) || { amount: 0, loan_number: '', is_flagged: false, fraud_score: null };
    const combined = (e.loan_amount || 0) + (ppp.amount || 0);
    const isEitherFlagged = e.is_flagged || ppp.is_flagged;
    const maxFraudScore = Math.max(e.fraud_score || 0, ppp.fraud_score || 0);

    // Determine risk level
    let risk_level: 'critical' | 'high' | 'medium' | 'low' = 'low';
    if (isEitherFlagged || maxFraudScore >= 80) {
      risk_level = 'critical';
    } else if (combined > 1000000 || maxFraudScore >= 60) {
      risk_level = 'high';
    } else if (combined > 500000 || e.is_fraud_prone_industry || maxFraudScore >= 40) {
      risk_level = 'medium';
    }

    return {
      borrower_name: e.borrower_name || 'Unknown',
      borrower_state: e.borrower_state || '',
      borrower_city: e.borrower_city || '',
      ppp_amount: ppp.amount,
      eidl_amount: e.loan_amount || 0,
      combined_amount: combined,
      ppp_loan_number: ppp.loan_number,
      eidl_fain: e.fain || '',
      is_flagged: isEitherFlagged,
      fraud_score: maxFraudScore > 0 ? maxFraudScore : null,
      is_fraud_prone_industry: e.is_fraud_prone_industry || false,
      industry_category: e.industry_category,
      risk_level
    };
  });

  // Sort by risk level first, then by combined amount
  const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  dippers.sort((a, b) => {
    if (riskOrder[a.risk_level] !== riskOrder[b.risk_level]) {
      return riskOrder[a.risk_level] - riskOrder[b.risk_level];
    }
    return b.combined_amount - a.combined_amount;
  });

  return dippers;
}

export const revalidate = 600;

export default async function DoubleDippersPage() {
  const [dippers, stateStats] = await Promise.all([
    getDoubleDippers(),
    getStateStats()
  ]);

  const totalCount = dippers.length;
  const totalPPP = dippers.reduce((sum, d) => sum + d.ppp_amount, 0);
  const totalEIDL = dippers.reduce((sum, d) => sum + d.eidl_amount, 0);
  const totalCombined = totalPPP + totalEIDL;

  const criticalRisk = dippers.filter(d => d.risk_level === 'critical');
  const highRisk = dippers.filter(d => d.risk_level === 'high');
  const flaggedCount = dippers.filter(d => d.is_flagged).length;
  const fraudProneCount = dippers.filter(d => d.is_fraud_prone_industry).length;

  return (
    <div>
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-6">
        <Link href="/investigation" className="hover:text-gray-300">Investigations</Link>
        <span className="mx-2">/</span>
        <span className="text-white">Double Dippers</span>
      </div>

      {/* Terminal-style stats */}
      <div className="font-mono text-sm mb-10">
        <p className="text-gray-500">DOUBLE_DIPPER_ANALYSIS</p>
        <div className="mt-2 text-gray-400">
          <p><span className="text-gray-600">├─</span> businesses_matched <span className="text-white ml-4">{formatNumber(totalCount)}</span></p>
          <p><span className="text-gray-600">├─</span> ppp_total <span className="text-green-500 ml-4">{formatMoney(totalPPP)}</span></p>
          <p><span className="text-gray-600">├─</span> eidl_total <span className="text-green-500 ml-4">{formatMoney(totalEIDL)}</span></p>
          <p><span className="text-gray-600">├─</span> combined_funding <span className="text-green-500 ml-4">{formatMoney(totalCombined)}</span></p>
          <p><span className="text-gray-600">├─</span> critical_risk <span className="text-red-400 ml-4">{criticalRisk.length}</span></p>
          <p><span className="text-gray-600">├─</span> high_risk <span className="text-yellow-400 ml-4">{highRisk.length}</span></p>
          <p><span className="text-gray-600">├─</span> flagged_for_review <span className="text-red-400 ml-4">{flaggedCount}</span></p>
          <p><span className="text-gray-600">└─</span> fraud_prone_industry <span className="text-orange-400 ml-4">{fraudProneCount}</span></p>
        </div>
      </div>

      {/* Explanation */}
      <div className="border border-gray-800 p-4 mb-8">
        <h2 className="text-white font-medium mb-2">What is this</h2>
        <p className="text-sm text-gray-400 leading-relaxed">
          Businesses that received both PPP (Paycheck Protection Program) and EIDL (Economic Injury
          Disaster Loan) funding during COVID-19. While receiving both loans was legal, it was a
          common pattern in fraud cases where businesses inflated needs across multiple programs.
          High combined amounts and flagged loans warrant additional scrutiny.
        </p>
      </div>

      {/* State Breakdown */}
      {stateStats.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-gray-400 mb-3">By State</h2>
          <div className="border border-gray-800 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-900">
                <tr>
                  <th className="text-left p-3 font-medium text-gray-400">State</th>
                  <th className="text-right p-3 font-medium text-gray-400">Count</th>
                  <th className="text-right p-3 font-medium text-gray-400">PPP Total</th>
                  <th className="text-right p-3 font-medium text-gray-400">EIDL Total</th>
                  <th className="text-right p-3 font-medium text-gray-400">Combined</th>
                  <th className="text-right p-3 font-medium text-gray-400">Flagged</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {stateStats.map(s => (
                  <tr key={s.state} className="hover:bg-gray-900/50">
                    <td className="p-3 text-white">{STATE_NAMES[s.state] || s.state}</td>
                    <td className="p-3 text-right font-mono text-white">{formatNumber(s.count)}</td>
                    <td className="p-3 text-right font-mono text-green-500">{formatMoney(s.ppp_total)}</td>
                    <td className="p-3 text-right font-mono text-green-500">{formatMoney(s.eidl_total)}</td>
                    <td className="p-3 text-right font-mono text-green-500">{formatMoney(s.combined_total)}</td>
                    <td className="p-3 text-right font-mono text-red-400">{s.flagged_count > 0 ? s.flagged_count : '-'}</td>
                  </tr>
                ))}
                <tr className="bg-gray-900/30">
                  <td className="p-3 text-gray-400 font-medium">Total</td>
                  <td className="p-3 text-right font-mono text-white">{formatNumber(totalCount)}</td>
                  <td className="p-3 text-right font-mono text-green-500">{formatMoney(totalPPP)}</td>
                  <td className="p-3 text-right font-mono text-green-500">{formatMoney(totalEIDL)}</td>
                  <td className="p-3 text-right font-mono text-green-500">{formatMoney(totalCombined)}</td>
                  <td className="p-3 text-right font-mono text-red-400">{flaggedCount > 0 ? flaggedCount : '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Critical Risk Alert */}
      {criticalRisk.length > 0 && (
        <div className="bg-red-900/20 border border-red-800 p-4 mb-8">
          <h3 className="text-red-400 font-medium mb-2">Critical Risk: {criticalRisk.length} Businesses</h3>
          <p className="text-sm text-gray-400 mb-3">
            These businesses have been flagged for fraud indicators in either their PPP or EIDL loan,
            or have high fraud scores. They require immediate review.
          </p>
          <div className="space-y-2">
            {criticalRisk.slice(0, 5).map((d, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-white">{d.borrower_name}</span>
                <span className="text-green-500 font-mono">{formatMoney(d.combined_amount)}</span>
              </div>
            ))}
            {criticalRisk.length > 5 && (
              <p className="text-gray-500 text-xs">+{criticalRisk.length - 5} more in table below</p>
            )}
          </div>
        </div>
      )}

      {/* Risk Level Legend */}
      <div className="flex gap-4 mb-6 text-sm flex-wrap">
        <span className="text-gray-500">Risk levels:</span>
        <span className="flex items-center gap-1">
          <span className="text-xs bg-red-900/50 text-red-400 px-2 py-0.5 rounded">CRITICAL</span>
          <span className="text-gray-400">Flagged or fraud score 80+</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="text-xs bg-yellow-900/50 text-yellow-400 px-2 py-0.5 rounded">HIGH</span>
          <span className="text-gray-400">&gt;$1M or score 60+</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="text-xs bg-orange-900/50 text-orange-400 px-2 py-0.5 rounded">MED</span>
          <span className="text-gray-400">&gt;$500K or fraud-prone industry</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="text-xs text-gray-600">LOW</span>
          <span className="text-gray-400">&lt;$500K</span>
        </span>
      </div>

      {/* Double dippers table */}
      <div className="mb-8">
        <h2 className="text-sm font-medium text-gray-400 mb-3">
          All Double Dippers ({formatNumber(totalCount)})
        </h2>
        <div className="border border-gray-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left p-3 font-medium text-gray-400">Business Name</th>
                <th className="text-left p-3 font-medium text-gray-400">City</th>
                <th className="text-left p-3 font-medium text-gray-400">State</th>
                <th className="text-right p-3 font-medium text-gray-400">PPP</th>
                <th className="text-right p-3 font-medium text-gray-400">EIDL</th>
                <th className="text-right p-3 font-medium text-gray-400">Combined</th>
                <th className="text-center p-3 font-medium text-gray-400">Risk</th>
                <th className="text-left p-3 font-medium text-gray-400">Industry</th>
                <th className="text-left p-3 font-medium text-gray-400">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {dippers.map((dipper, i) => (
                <tr
                  key={i}
                  className={
                    dipper.risk_level === 'critical'
                      ? 'bg-red-900/10 hover:bg-red-900/20'
                      : dipper.risk_level === 'high'
                      ? 'bg-yellow-900/5 hover:bg-yellow-900/10'
                      : 'hover:bg-gray-900/50'
                  }
                >
                  <td className="p-3 text-white">
                    {dipper.borrower_name}
                    {dipper.is_flagged && (
                      <span className="ml-2 text-xs text-red-400">⚠</span>
                    )}
                  </td>
                  <td className="p-3 text-gray-400">{dipper.borrower_city}</td>
                  <td className="p-3 text-gray-400">{dipper.borrower_state}</td>
                  <td className="p-3 text-right font-mono text-green-500">{formatMoney(dipper.ppp_amount)}</td>
                  <td className="p-3 text-right font-mono text-green-500">{formatMoney(dipper.eidl_amount)}</td>
                  <td className="p-3 text-right font-mono text-green-500">{formatMoney(dipper.combined_amount)}</td>
                  <td className="p-3 text-center">
                    {dipper.risk_level === 'critical' ? (
                      <span className="text-xs bg-red-900/50 text-red-400 px-2 py-0.5 rounded">CRITICAL</span>
                    ) : dipper.risk_level === 'high' ? (
                      <span className="text-xs bg-yellow-900/50 text-yellow-400 px-2 py-0.5 rounded">HIGH</span>
                    ) : dipper.risk_level === 'medium' ? (
                      <span className="text-xs bg-orange-900/50 text-orange-400 px-2 py-0.5 rounded">MED</span>
                    ) : (
                      <span className="text-xs text-gray-600">LOW</span>
                    )}
                  </td>
                  <td className="p-3 text-gray-500 text-xs">
                    {dipper.industry_category || '-'}
                    {dipper.is_fraud_prone_industry && (
                      <span className="ml-1 text-orange-400">⚠</span>
                    )}
                  </td>
                  <td className="p-3">
                    {dipper.ppp_loan_number && (
                      <Link
                        href={`/ppp/${dipper.ppp_loan_number}`}
                        className="text-gray-400 hover:text-green-400 text-xs"
                      >
                        PPP Details
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {dippers.length === 0 && (
        <div className="border border-gray-800 p-8 text-center">
          <p className="text-gray-500">No double dippers found.</p>
          <p className="text-gray-600 text-sm mt-2">
            EIDL-PPP matching may not be complete for all states.
          </p>
        </div>
      )}

      {/* Why Double Dipping Matters */}
      <div className="border border-gray-800 p-4 mb-8">
        <h3 className="text-white font-medium mb-3">Why Double Dipping Matters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-400">
          <div>
            <p className="text-gray-500 mb-1">Overlapping Purpose</p>
            <p>Both PPP and EIDL were designed to help businesses survive COVID-19. Receiving both could indicate legitimate need or exploitation.</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Common Fraud Pattern</p>
            <p>In prosecuted cases, fraudsters often applied to multiple programs simultaneously, sometimes with inflated or fabricated claims.</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Different Requirements</p>
            <p>PPP required payroll documentation while EIDL had looser requirements, making it easier to exploit both programs.</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Prosecution Risk</p>
            <p>DOJ has specifically targeted businesses that received excessive combined funding or used funds for non-business purposes.</p>
          </div>
        </div>
      </div>

      {/* Data Coverage */}
      <div className="border border-gray-800 p-4 mb-8">
        <h3 className="text-white font-medium mb-3">Data Coverage</h3>
        <div className="text-sm text-gray-400">
          <p className="mb-2">
            <strong className="text-white">PPP:</strong> Complete data for all 2020-2021 loans (6.7M+ loans nationwide)
          </p>
          <p className="mb-2">
            <strong className="text-white">EIDL:</strong> April-November 2020 disaster loans (192K loans in database)
          </p>
          <p>
            <strong className="text-white">Matching:</strong> Businesses matched by normalized name between datasets.
            Only exact matches shown. Fuzzy matching may identify additional duplicates.
          </p>
        </div>
      </div>

      {/* Methodology */}
      <div className="mt-8 border-t border-gray-800 pt-6">
        <h3 className="text-sm font-medium text-gray-400 mb-3">Methodology</h3>
        <p className="text-gray-500 text-sm leading-relaxed">
          Double dippers identified by matching EIDL loans to PPP loans via the ppp_loan_id foreign key.
          Risk levels determined by: combined loan amount, fraud flags on either loan, fraud scores from
          automated pattern detection, and whether the business operates in a fraud-prone industry (restaurants,
          childcare, salons, etc.). Critical risk indicates immediate review recommended.
        </p>
      </div>
    </div>
  );
}
