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

interface DoubleDipper {
  borrower_name: string;
  borrower_state: string;
  ppp_amount: number;
  eidl_amount: number;
  combined_amount: number;
  ppp_loan_number: string;
  eidl_fain: string;
  risk_level: string;
}

async function getDoubleDippers(): Promise<{ dippers: DoubleDipper[]; stats: { count: number; ppp_total: number; eidl_total: number } }> {
  // Get EIDL loans that have a linked PPP loan
  const { data: eidlData, error: eidlError } = await supabase
    .from('eidl_loans')
    .select('borrower_name, borrower_state, loan_amount, fain, ppp_loan_id, fraud_score')
    .not('ppp_loan_id', 'is', null)
    .order('loan_amount', { ascending: false })
    .limit(200);

  if (eidlError || !eidlData || eidlData.length === 0) {
    console.error('Error fetching double dippers:', eidlError);
    return { dippers: [], stats: { count: 0, ppp_total: 0, eidl_total: 0 } };
  }

  // Get corresponding PPP loan details
  const pppIds = eidlData.map(e => e.ppp_loan_id).filter(Boolean);
  const { data: pppData } = await supabase
    .from('ppp_loans')
    .select('id, loan_number, initial_approval_amount')
    .in('id', pppIds);

  const pppMap = new Map((pppData || []).map(p => [p.id, { amount: p.initial_approval_amount, loan_number: p.loan_number }]));

  // Create combined records
  const dippers: DoubleDipper[] = eidlData.map(e => {
    const ppp = pppMap.get(e.ppp_loan_id) || { amount: 0, loan_number: '' };
    const combined = (e.loan_amount || 0) + (ppp.amount || 0);
    
    let risk_level = 'low';
    if (combined > 1000000) risk_level = 'high';
    else if (combined > 500000) risk_level = 'medium';
    
    return {
      borrower_name: e.borrower_name,
      borrower_state: e.borrower_state,
      ppp_amount: ppp.amount || 0,
      eidl_amount: e.loan_amount || 0,
      combined_amount: combined,
      ppp_loan_number: ppp.loan_number || '',
      eidl_fain: e.fain || '',
      risk_level
    };
  });

  // Sort by combined amount
  dippers.sort((a, b) => b.combined_amount - a.combined_amount);

  // Get total count
  const { count } = await supabase
    .from('eidl_loans')
    .select('*', { count: 'exact', head: true })
    .not('ppp_loan_id', 'is', null);

  const stats = {
    count: count || 0,
    ppp_total: dippers.reduce((sum, d) => sum + d.ppp_amount, 0),
    eidl_total: dippers.reduce((sum, d) => sum + d.eidl_amount, 0)
  };

  return { dippers: dippers.slice(0, 100), stats };
}

export const revalidate = 600;

export default async function DoubleDippersPage() {
  const { dippers, stats } = await getDoubleDippers();

  const highRisk = dippers.filter(d => d.risk_level === 'high').length;
  const mediumRisk = dippers.filter(d => d.risk_level === 'medium').length;

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
          <p><span className="text-gray-600">├─</span> businesses_matched <span className="text-white ml-4">{formatNumber(stats.count)}</span></p>
          <p><span className="text-gray-600">├─</span> ppp_total <span className="text-green-500 ml-4">{formatMoney(stats.ppp_total)}</span></p>
          <p><span className="text-gray-600">├─</span> eidl_total <span className="text-green-500 ml-4">{formatMoney(stats.eidl_total)}</span></p>
          <p><span className="text-gray-600">├─</span> combined <span className="text-green-500 ml-4">{formatMoney(stats.ppp_total + stats.eidl_total)}</span></p>
          <p><span className="text-gray-600">└─</span> high_risk <span className="text-white ml-4">{highRisk} ({mediumRisk} medium)</span></p>
        </div>
      </div>

      {/* Explanation */}
      <div className="border border-gray-800 p-4 mb-8">
        <h2 className="text-white font-medium mb-2">What is this</h2>
        <p className="text-sm text-gray-400 leading-relaxed">
          Businesses that received both PPP (Paycheck Protection Program) and EIDL (Economic Injury 
          Disaster Loan) funding during COVID-19. While receiving both loans was legal, it was a 
          common pattern in fraud cases where businesses inflated needs across multiple programs. 
          High combined amounts warrant additional scrutiny.
        </p>
      </div>

      {/* Risk levels */}
      <div className="flex gap-4 mb-6 text-sm">
        <span className="text-gray-500">Risk levels:</span>
        <span className="text-gray-400">High: &gt;$1M combined</span>
        <span className="text-gray-400">Medium: $500K-$1M</span>
        <span className="text-gray-400">Low: &lt;$500K</span>
      </div>

      {/* Double dippers table */}
      <div className="border border-gray-800 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-900">
            <tr>
              <th className="text-left p-3 font-medium text-gray-400">Business Name</th>
              <th className="text-left p-3 font-medium text-gray-400">State</th>
              <th className="text-right p-3 font-medium text-gray-400">PPP</th>
              <th className="text-right p-3 font-medium text-gray-400">EIDL</th>
              <th className="text-right p-3 font-medium text-gray-400">Combined</th>
              <th className="text-center p-3 font-medium text-gray-400">Risk</th>
              <th className="text-left p-3 font-medium text-gray-400">View</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {dippers.map((dipper, i) => (
              <tr key={i} className="hover:bg-gray-900/50">
                <td className="p-3 text-white">{dipper.borrower_name}</td>
                <td className="p-3 text-gray-400">{dipper.borrower_state}</td>
                <td className="p-3 text-right font-mono text-green-500">{formatMoney(dipper.ppp_amount)}</td>
                <td className="p-3 text-right font-mono text-green-500">{formatMoney(dipper.eidl_amount)}</td>
                <td className="p-3 text-right font-mono text-green-500">{formatMoney(dipper.combined_amount)}</td>
                <td className="p-3 text-center text-gray-400 text-xs">{dipper.risk_level}</td>
                <td className="p-3">
                  {dipper.ppp_loan_number && (
                    <Link 
                      href={`/ppp/${dipper.ppp_loan_number}`}
                      className="text-gray-400 hover:text-green-400 text-xs"
                    >
                      PPP
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {dippers.length === 0 && (
        <div className="border border-gray-800 p-8 text-center">
          <p className="text-gray-500">No double dippers found.</p>
          <p className="text-gray-600 text-sm mt-2">
            EIDL-PPP matching may not be complete for all states.
          </p>
        </div>
      )}

      {stats.count > 100 && (
        <p className="text-gray-600 text-xs mt-4">
          Showing top 100 of {formatNumber(stats.count)} total matches, sorted by combined amount.
        </p>
      )}

      {/* Methodology */}
      <div className="mt-8 border-t border-gray-800 pt-6">
        <h3 className="text-sm font-medium text-gray-400 mb-3">Methodology</h3>
        <p className="text-gray-500 text-sm leading-relaxed">
          Businesses matched by normalized name between PPP and EIDL datasets. Only exact matches 
          included - fuzzy matching may identify additional duplicates. Risk levels based on 
          combined loan amount only. EIDL data covers April-November 2020.
        </p>
      </div>
    </div>
  );
}

