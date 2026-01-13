import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface Nonprofit {
  id: string;
  ein: string;
  ein_formatted: string;
  name: string;
  name_normalized: string;
  ico: string | null;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  subsection: string;
  subsection_desc: string;
  affiliation: number;
  classification: number;
  ruling_date: string;
  deductibility: number;
  deductibility_desc: string;
  foundation: number;
  foundation_desc: string;
  organization: number;
  status: number;
  status_desc: string;
  tax_period: number;
  asset_code: number;
  income_code: number;
  filing_req_code: number;
  pf_filing_req_code: number;
  accounting_period: number;
  asset_amount: number;
  income_amount: number;
  revenue_amount: number;
  ntee_code: string;
  ntee_desc: string;
  group_exemption_number: string;
  organization_id: string | null;
  data_source: string;
  created_at: string;
}

interface PPPLoan {
  loan_number: string;
  borrower_name: string;
  current_approval_amount: number;
  forgiveness_amount: number;
  date_approved: string;
}

interface FederalGrant {
  award_id: string;
  recipient_name: string;
  award_amount: number;
  awarding_agency: string;
  cfda_title: string;
}

function formatMoney(amount: number | null): string {
  if (!amount || amount === 0) return '-';
  if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(2)}B`;
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

async function getNonprofit(ein: string): Promise<{
  nonprofit: Nonprofit;
  linkedFunding: { ppp: PPPLoan[]; grants: FederalGrant[] };
} | null> {
  const cleanEin = ein.replace(/-/g, '');

  const { data: nonprofit, error } = await supabase
    .from('nonprofits')
    .select('*')
    .or(`ein.eq.${cleanEin},ein_formatted.eq.${ein}`)
    .single();

  if (error || !nonprofit) {
    return null;
  }

  // Get linked funding data
  let ppp: PPPLoan[] = [];
  let grants: FederalGrant[] = [];

  if (nonprofit.organization_id) {
    const { data: pppData } = await supabase
      .from('ppp_loans')
      .select('loan_number, borrower_name, current_approval_amount, forgiveness_amount, date_approved')
      .eq('organization_id', nonprofit.organization_id)
      .limit(10);
    ppp = pppData || [];
  }

  // Try to find grants by EIN
  const { data: grantsData } = await supabase
    .from('federal_grants')
    .select('award_id, recipient_name, award_amount, awarding_agency, cfda_title')
    .eq('recipient_ein', cleanEin)
    .limit(10);
  grants = grantsData || [];

  return {
    nonprofit,
    linkedFunding: { ppp, grants },
  };
}

export async function generateMetadata({ params }: { params: Promise<{ ein: string }> }) {
  const { ein } = await params;
  const data = await getNonprofit(ein);

  if (!data) {
    return { title: 'Nonprofit Not Found | SomaliScan' };
  }

  return {
    title: `${data.nonprofit.name} | Nonprofit | SomaliScan`,
    description: `${data.nonprofit.subsection_desc} in ${data.nonprofit.city}, ${data.nonprofit.state}. EIN: ${data.nonprofit.ein_formatted}`,
  };
}

export default async function NonprofitDetailPage({
  params,
}: {
  params: Promise<{ ein: string }>;
}) {
  const { ein } = await params;
  const data = await getNonprofit(ein);

  if (!data) {
    notFound();
  }

  const { nonprofit: np, linkedFunding } = data;
  const hasFunding = linkedFunding.ppp.length > 0 || linkedFunding.grants.length > 0;

  return (
    <div className="max-w-4xl">
      {/* Breadcrumb */}
      <div className="mb-4 text-sm">
        <Link href="/nonprofits" className="text-gray-500 hover:text-gray-400">
          Nonprofits
        </Link>
        <span className="text-gray-600 mx-2">/</span>
        <span className="text-gray-400">{np.ein_formatted}</span>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">{np.name}</h1>
        <p className="text-gray-400 mt-1 font-mono">{np.ein_formatted}</p>
      </div>

      {/* Terminal-style summary */}
      <div className="font-mono text-sm mb-8">
        <p className="text-gray-500">NONPROFIT_PROFILE</p>
        <div className="mt-2 text-gray-400">
          <p><span className="text-gray-600">├─</span> tax_status <span className="text-white ml-4">{np.subsection_desc || `501(c)(${np.subsection})`}</span></p>
          <p><span className="text-gray-600">├─</span> assets <span className="text-green-500 ml-4">{formatMoney(np.asset_amount)}</span></p>
          <p><span className="text-gray-600">├─</span> income <span className="text-white ml-4">{formatMoney(np.income_amount)}</span></p>
          <p><span className="text-gray-600">├─</span> ruling_date <span className="text-white ml-4">{np.ruling_date ? new Date(np.ruling_date).toLocaleDateString() : '-'}</span></p>
          <p><span className="text-gray-600">└─</span> status <span className="text-white ml-4">{np.status_desc}</span></p>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Location */}
        <div className="border border-gray-800 p-4">
          <h3 className="text-sm font-medium text-gray-400 mb-3">Location</h3>
          <div className="space-y-2 text-sm">
            {np.street && <p className="text-white">{np.street}</p>}
            <p className="text-white">{np.city}, {np.state} {np.zip}</p>
            {np.country && np.country !== 'US' && (
              <p className="text-gray-500">{np.country}</p>
            )}
          </div>
        </div>

        {/* Tax Details */}
        <div className="border border-gray-800 p-4">
          <h3 className="text-sm font-medium text-gray-400 mb-3">Tax Details</h3>
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-gray-500">Deductibility:</span>{' '}
              <span className="text-white">{np.deductibility_desc || '-'}</span>
            </p>
            <p>
              <span className="text-gray-500">Foundation:</span>{' '}
              <span className="text-white">{np.foundation_desc || '-'}</span>
            </p>
            {np.ntee_code && (
              <p>
                <span className="text-gray-500">NTEE Code:</span>{' '}
                <span className="text-white font-mono">{np.ntee_code}</span>
                {np.ntee_desc && <span className="text-gray-500 ml-2">({np.ntee_desc})</span>}
              </p>
            )}
          </div>
        </div>

        {/* Financials */}
        <div className="border border-gray-800 p-4">
          <h3 className="text-sm font-medium text-gray-400 mb-3">Financials</h3>
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-gray-500">Assets:</span>{' '}
              <span className="text-green-500 font-mono">{formatMoney(np.asset_amount)}</span>
            </p>
            <p>
              <span className="text-gray-500">Income:</span>{' '}
              <span className="text-white font-mono">{formatMoney(np.income_amount)}</span>
            </p>
            <p>
              <span className="text-gray-500">Revenue:</span>{' '}
              <span className="text-white font-mono">{formatMoney(np.revenue_amount)}</span>
            </p>
            {np.tax_period && (
              <p>
                <span className="text-gray-500">Tax Period:</span>{' '}
                <span className="text-white font-mono">{np.tax_period}</span>
              </p>
            )}
          </div>
        </div>

        {/* Registration */}
        <div className="border border-gray-800 p-4">
          <h3 className="text-sm font-medium text-gray-400 mb-3">Registration</h3>
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-gray-500">EIN:</span>{' '}
              <span className="text-white font-mono">{np.ein_formatted}</span>
            </p>
            <p>
              <span className="text-gray-500">Ruling Date:</span>{' '}
              <span className="text-white">{np.ruling_date ? new Date(np.ruling_date).toLocaleDateString() : '-'}</span>
            </p>
            {np.group_exemption_number && np.group_exemption_number !== '0000' && (
              <p>
                <span className="text-gray-500">Group Exemption:</span>{' '}
                <span className="text-white font-mono">{np.group_exemption_number}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Linked Funding */}
      {hasFunding && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Linked Government Funding</h2>

          {/* PPP Loans */}
          {linkedFunding.ppp.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-400 mb-3">PPP Loans</h3>
              <div className="border border-gray-800 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-900">
                    <tr>
                      <th className="text-left p-3 font-medium text-gray-400">Loan</th>
                      <th className="text-right p-3 font-medium text-gray-400">Amount</th>
                      <th className="text-right p-3 font-medium text-gray-400">Forgiven</th>
                      <th className="text-left p-3 font-medium text-gray-400">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {linkedFunding.ppp.map((loan) => (
                      <tr key={loan.loan_number} className="hover:bg-gray-900/50">
                        <td className="p-3">
                          <Link
                            href={`/ppp/${loan.loan_number}`}
                            className="text-white hover:text-green-400"
                          >
                            {loan.loan_number}
                          </Link>
                        </td>
                        <td className="p-3 text-right font-mono text-green-500">
                          {formatMoney(loan.current_approval_amount)}
                        </td>
                        <td className="p-3 text-right font-mono text-white">
                          {formatMoney(loan.forgiveness_amount)}
                        </td>
                        <td className="p-3 text-gray-500 text-xs">
                          {loan.date_approved}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Federal Grants */}
          {linkedFunding.grants.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-3">Federal Grants</h3>
              <div className="border border-gray-800 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-900">
                    <tr>
                      <th className="text-left p-3 font-medium text-gray-400">Award</th>
                      <th className="text-left p-3 font-medium text-gray-400">Agency</th>
                      <th className="text-right p-3 font-medium text-gray-400">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {linkedFunding.grants.map((grant) => (
                      <tr key={grant.award_id} className="hover:bg-gray-900/50">
                        <td className="p-3">
                          <Link
                            href={`/federal-grants/${grant.award_id}`}
                            className="text-white hover:text-green-400"
                          >
                            {grant.cfda_title || grant.award_id}
                          </Link>
                        </td>
                        <td className="p-3 text-gray-500 text-xs">
                          {grant.awarding_agency || '-'}
                        </td>
                        <td className="p-3 text-right font-mono text-green-500">
                          {formatMoney(grant.award_amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Link to Organization if exists */}
      {np.organization_id && (
        <div className="mb-8 p-4 border border-gray-800 bg-gray-900/30">
          <p className="text-sm text-gray-400">
            This nonprofit is linked to our{' '}
            <Link
              href={`/organizations/${np.organization_id}`}
              className="text-green-500 hover:underline"
            >
              unified entity registry
            </Link>
            {' '}for cross-dataset analysis.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Link
          href={`/donations/search?q=${encodeURIComponent(np.name)}`}
          className="px-4 py-2 border border-gray-700 rounded text-sm text-gray-400 hover:text-white hover:border-gray-600"
        >
          Search Political Donations
        </Link>
        <Link
          href={`/federal-grants?search=${encodeURIComponent(np.name)}`}
          className="px-4 py-2 border border-gray-700 rounded text-sm text-gray-400 hover:text-white hover:border-gray-600"
        >
          Search Federal Grants
        </Link>
        <Link
          href={`/checkbook?search=${encodeURIComponent(np.name)}`}
          className="px-4 py-2 border border-gray-700 rounded text-sm text-gray-400 hover:text-white hover:border-gray-600"
        >
          Search State Checkbook
        </Link>
      </div>

      {/* Data Source */}
      <div className="mt-8 pt-6 border-t border-gray-800 text-xs text-gray-600">
        <p>Source: {np.data_source || 'IRS Exempt Organizations BMF'}</p>
        <p className="mt-1">Last updated: {new Date(np.created_at).toLocaleDateString()}</p>
      </div>
    </div>
  );
}
