'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface PPPLoan {
  id: string;
  loan_number: string;
  initial_approval_amount: number;
  forgiveness_amount: number | null;
  jobs_reported: number | null;
  date_approved: string | null;
  loan_status: string | null;
  is_flagged: boolean;
}

interface EIDLLoan {
  id: string;
  fain: string;
  loan_amount: number;
  action_date: string | null;
}

interface RelatedOrg {
  id: string;
  legal_name: string;
  total_government_funding: number;
  relationship: string;
}

interface EarmarkReceived {
  id: string;
  fiscal_year: number;
  amount_requested: number | null;
  industry: string | null;
  subcommittee: string | null;
  project_description: string | null;
  politician_name: string | null;
  politician_id: string | null;
  bioguide_id: string | null;
}

interface StatePayment {
  id: number;
  vendor_name: string;
  amount: number;
  agency: string | null;
  fiscal_year: number | null;
  payment_date: string | null;
  state: string;
}

interface FederalGrant {
  id: string;
  award_amount: number;
  awarding_agency: string | null;
  cfda_title: string | null;
  award_date: string | null;
  award_type: string | null;
}

interface SBALoan {
  id: string;
  gross_approval: number;
  loan_program: string | null;
  approval_date: string | null;
  lender_name: string | null;
}

interface OrganizationDetail {
  id: string;
  legal_name: string;
  dba_name: string | null;
  name_normalized: string;
  entity_type: string | null;
  ein: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  county: string | null;
  naics_code: string | null;
  naics_description: string | null;
  industry_sector: string | null;
  total_government_funding: number;
  first_funding_date: string | null;
  last_funding_date: string | null;
  is_ppp_recipient: boolean;
  is_fraud_prone_industry: boolean;
  is_flagged: boolean;
  fraud_score: number | null;
  address_cluster_size: number | null;
  data_source: string | null;
  ppp_loans: PPPLoan[];
  eidl_loans: EIDLLoan[];
  state_payments: StatePayment[];
  federal_grants: FederalGrant[];
  sba_loans: SBALoan[];
  related_orgs: RelatedOrg[];
}

function formatMoney(amount: number | null): string {
  if (!amount) return '-';
  if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(2)}B`;
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export default function OrganizationDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [org, setOrg] = useState<OrganizationDetail | null>(null);
  const [earmarksReceived, setEarmarksReceived] = useState<EarmarkReceived[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchOrganization();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchOrganization = async () => {
    setLoading(true);
    setError(null);
    try {
      const [orgRes, earmarksRes] = await Promise.all([
        fetch(`/api/organizations/${id}`),
        fetch(`/api/organizations/${id}/earmarks`)
      ]);

      if (orgRes.status === 404) {
        setError('Organization not found');
        return;
      }

      if (!orgRes.ok) {
        throw new Error(`HTTP ${orgRes.status}`);
      }

      const data = await orgRes.json();
      setOrg(data);

      // Earmarks are optional - don't fail if endpoint doesn't exist
      if (earmarksRes.ok) {
        const earmarksData = await earmarksRes.json();
        setEarmarksReceived(earmarksData.earmarks || []);
      }
    } catch (err) {
      console.error('Failed to fetch organization:', err);
      setError('Failed to load organization details.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-500">
        Loading organization details...
      </div>
    );
  }

  if (error || !org) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 mb-4">{error || 'Organization not found'}</p>
        <Link href="/organizations" className="text-gray-500 hover:text-white">
          ← Back to Organizations
        </Link>
      </div>
    );
  }

  const totalPPP = org.ppp_loans.reduce((sum, l) => sum + (l.initial_approval_amount || 0), 0);
  const totalEIDL = org.eidl_loans.reduce((sum, l) => sum + (l.loan_amount || 0), 0);
  const totalStatePayments = (org.state_payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalFederalGrants = (org.federal_grants || []).reduce((sum, g) => sum + (g.award_amount || 0), 0);
  const totalSBA = (org.sba_loans || []).reduce((sum, l) => sum + (l.gross_approval || 0), 0);

  return (
    <div>
      {/* Back Link */}
      <Link href="/organizations" className="text-gray-500 hover:text-white text-sm mb-6 inline-block">
        ← Back to Organizations
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">
          {org.legal_name || org.name_normalized}
        </h1>
        {org.dba_name && (
          <p className="text-gray-400">DBA: {org.dba_name}</p>
        )}

        {/* Risk Badges */}
        <div className="flex gap-2 mt-3">
          {org.is_fraud_prone_industry && (
            <span className="px-2 py-1 text-xs bg-yellow-900/50 text-yellow-400 border border-yellow-800 rounded">
              High-Risk Industry
            </span>
          )}
          {org.address_cluster_size && org.address_cluster_size >= 3 && (
            <span className="px-2 py-1 text-xs bg-red-900/50 text-red-400 border border-red-800 rounded">
              Address Cluster ({org.address_cluster_size} orgs)
            </span>
          )}
          {org.is_ppp_recipient && (
            <span className="px-2 py-1 text-xs bg-blue-900/50 text-blue-400 border border-blue-800 rounded">
              PPP Recipient
            </span>
          )}
        </div>
      </div>

      {/* Funding Sources Summary */}
      <div className="mb-6 p-4 border border-gray-800 bg-gray-900/30">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-gray-400">Funding Sources</h2>
          <span className="text-xs text-gray-500">
            This entity appears in {
              [(org.state_payments || []).length > 0, org.ppp_loans.length > 0,
               (org.federal_grants || []).length > 0, (org.sba_loans || []).length > 0,
               org.eidl_loans.length > 0, earmarksReceived.length > 0].filter(Boolean).length
            } data sources
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {(org.state_payments || []).length > 0 && (
            <span className="px-3 py-1.5 text-sm bg-purple-900/50 text-purple-300 border border-purple-800 rounded">
              State Checkbook <span className="text-purple-400 font-mono ml-1">{formatMoney(totalStatePayments)}</span>
            </span>
          )}
          {(org.federal_grants || []).length > 0 && (
            <span className="px-3 py-1.5 text-sm bg-blue-900/50 text-blue-300 border border-blue-800 rounded">
              Federal Grants <span className="text-blue-400 font-mono ml-1">{formatMoney(totalFederalGrants)}</span>
            </span>
          )}
          {org.ppp_loans.length > 0 && (
            <span className="px-3 py-1.5 text-sm bg-amber-900/50 text-amber-300 border border-amber-800 rounded">
              PPP Loans <span className="text-amber-400 font-mono ml-1">{formatMoney(totalPPP)}</span>
            </span>
          )}
          {(org.sba_loans || []).length > 0 && (
            <span className="px-3 py-1.5 text-sm bg-red-900/50 text-red-300 border border-red-800 rounded">
              SBA Loans <span className="text-red-400 font-mono ml-1">{formatMoney(totalSBA)}</span>
            </span>
          )}
          {org.eidl_loans.length > 0 && (
            <span className="px-3 py-1.5 text-sm bg-cyan-900/50 text-cyan-300 border border-cyan-800 rounded">
              EIDL Loans <span className="text-cyan-400 font-mono ml-1">{formatMoney(totalEIDL)}</span>
            </span>
          )}
          {earmarksReceived.length > 0 && (
            <span className="px-3 py-1.5 text-sm bg-green-900/50 text-green-300 border border-green-800 rounded">
              Earmarks <span className="text-green-400 font-mono ml-1">{formatMoney(earmarksReceived.reduce((sum, e) => sum + (e.amount_requested || 0), 0))}</span>
            </span>
          )}
          {(org.state_payments || []).length === 0 && org.ppp_loans.length === 0 &&
           (org.federal_grants || []).length === 0 && (org.sba_loans || []).length === 0 &&
           org.eidl_loans.length === 0 && earmarksReceived.length === 0 && (
            <span className="text-gray-500 text-sm">No linked funding records</span>
          )}
        </div>
        {org.legal_name && (
          <div className="mt-3 pt-3 border-t border-gray-800">
            <Link
              href={`/donations/search?q=${encodeURIComponent(org.legal_name)}`}
              className="text-sm text-gray-400 hover:text-green-400"
            >
              Search political donations →
            </Link>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="border border-gray-800 p-4">
          <p className="text-gray-500 text-xs mb-1">Total Funding</p>
          <p className="text-xl font-mono text-green-500">{formatMoney(org.total_government_funding)}</p>
        </div>
        <div className="border border-gray-800 p-4">
          <p className="text-gray-500 text-xs mb-1">State Payments</p>
          <p className="text-xl font-mono text-white">{(org.state_payments || []).length}</p>
          <p className="text-xs text-gray-500 mt-1">{formatMoney(totalStatePayments)}</p>
        </div>
        <div className="border border-gray-800 p-4">
          <p className="text-gray-500 text-xs mb-1">PPP Loans</p>
          <p className="text-xl font-mono text-white">{org.ppp_loans.length}</p>
          <p className="text-xs text-gray-500 mt-1">{formatMoney(totalPPP)}</p>
        </div>
        <div className="border border-gray-800 p-4">
          <p className="text-gray-500 text-xs mb-1">Federal Grants</p>
          <p className="text-xl font-mono text-white">{(org.federal_grants || []).length}</p>
          <p className="text-xs text-gray-500 mt-1">{formatMoney(totalFederalGrants)}</p>
        </div>
        <div className="border border-gray-800 p-4">
          <p className="text-gray-500 text-xs mb-1">SBA Loans</p>
          <p className="text-xl font-mono text-white">{(org.sba_loans || []).length}</p>
          <p className="text-xs text-gray-500 mt-1">{formatMoney(totalSBA)}</p>
        </div>
        <div className="border border-gray-800 p-4">
          <p className="text-gray-500 text-xs mb-1">EIDL Loans</p>
          <p className="text-xl font-mono text-white">{org.eidl_loans.length}</p>
          <p className="text-xs text-gray-500 mt-1">{formatMoney(totalEIDL)}</p>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        {/* Organization Info */}
        <div className="border border-gray-800 p-6">
          <h2 className="text-lg font-medium text-white mb-4">Organization Details</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Address</dt>
              <dd className="text-gray-300 text-right">
                {org.address || '-'}
                {org.city && <><br />{org.city}, {org.state} {org.zip}</>}
              </dd>
            </div>
            {org.county && (
              <div className="flex justify-between">
                <dt className="text-gray-500">County</dt>
                <dd className="text-gray-300">{org.county}</dd>
              </div>
            )}
            {org.ein && (
              <div className="flex justify-between">
                <dt className="text-gray-500">EIN</dt>
                <dd className="text-gray-300 font-mono">{org.ein}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-gray-500">Entity Type</dt>
              <dd className="text-gray-300">{org.entity_type || '-'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Data Source</dt>
              <dd className="text-gray-300">{org.data_source || '-'}</dd>
            </div>
          </dl>
        </div>

        {/* Industry Info */}
        <div className="border border-gray-800 p-6">
          <h2 className="text-lg font-medium text-white mb-4">Industry Classification</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">NAICS Code</dt>
              <dd className="text-gray-300 font-mono">{org.naics_code || '-'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Industry</dt>
              <dd className="text-gray-300 text-right max-w-[200px]">{org.naics_description || '-'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Sector</dt>
              <dd className="text-gray-300">{org.industry_sector || '-'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">High-Risk Industry</dt>
              <dd className={org.is_fraud_prone_industry ? 'text-yellow-400' : 'text-gray-500'}>
                {org.is_fraud_prone_industry ? 'Yes' : 'No'}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* PPP Loans Table */}
      {org.ppp_loans.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-medium text-white mb-4">PPP Loans ({org.ppp_loans.length})</h2>
          <div className="border border-gray-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-900">
                <tr>
                  <th className="text-left p-3 font-medium text-gray-400">Loan Number</th>
                  <th className="text-right p-3 font-medium text-gray-400">Amount</th>
                  <th className="text-right p-3 font-medium text-gray-400">Forgiven</th>
                  <th className="text-right p-3 font-medium text-gray-400">Jobs</th>
                  <th className="text-left p-3 font-medium text-gray-400">Date</th>
                  <th className="text-left p-3 font-medium text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {org.ppp_loans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-gray-900/50">
                    <td className="p-3">
                      <Link
                        href={`/ppp/${loan.loan_number}`}
                        className="text-white hover:text-green-400 font-mono text-xs"
                      >
                        {loan.loan_number}
                      </Link>
                      {loan.is_flagged && (
                        <span className="ml-2 text-yellow-500 text-xs">Flagged</span>
                      )}
                    </td>
                    <td className="p-3 text-right font-mono text-green-500">
                      {formatMoney(loan.initial_approval_amount)}
                    </td>
                    <td className="p-3 text-right font-mono text-gray-400">
                      {formatMoney(loan.forgiveness_amount)}
                    </td>
                    <td className="p-3 text-right text-gray-400">
                      {loan.jobs_reported || '-'}
                    </td>
                    <td className="p-3 text-gray-500 text-xs">
                      {formatDate(loan.date_approved)}
                    </td>
                    <td className="p-3 text-gray-500 text-xs">
                      {loan.loan_status || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EIDL Loans Table */}
      {org.eidl_loans.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-medium text-white mb-4">EIDL Loans ({org.eidl_loans.length})</h2>
          <div className="border border-gray-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-900">
                <tr>
                  <th className="text-left p-3 font-medium text-gray-400">FAIN</th>
                  <th className="text-right p-3 font-medium text-gray-400">Amount</th>
                  <th className="text-left p-3 font-medium text-gray-400">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {org.eidl_loans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-gray-900/50">
                    <td className="p-3 font-mono text-xs text-gray-300">
                      {loan.fain}
                    </td>
                    <td className="p-3 text-right font-mono text-green-500">
                      {formatMoney(loan.loan_amount)}
                    </td>
                    <td className="p-3 text-gray-500 text-xs">
                      {formatDate(loan.action_date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* State Payments Table */}
      {(org.state_payments || []).length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-medium text-white mb-4">State Payments ({org.state_payments.length})</h2>
          <div className="border border-gray-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-900">
                <tr>
                  <th className="text-left p-3 font-medium text-gray-400">Agency</th>
                  <th className="text-right p-3 font-medium text-gray-400">Amount</th>
                  <th className="text-left p-3 font-medium text-gray-400">Year</th>
                  <th className="text-left p-3 font-medium text-gray-400">State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {org.state_payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-900/50">
                    <td className="p-3 text-gray-300 text-xs">
                      {payment.agency || '-'}
                    </td>
                    <td className="p-3 text-right font-mono text-green-500">
                      {formatMoney(payment.amount)}
                    </td>
                    <td className="p-3 text-gray-500 text-xs">
                      {payment.fiscal_year || '-'}
                    </td>
                    <td className="p-3 text-gray-500 text-xs">
                      {payment.state}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Federal Grants Table */}
      {(org.federal_grants || []).length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-medium text-white mb-4">Federal Grants ({org.federal_grants.length})</h2>
          <div className="border border-gray-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-900">
                <tr>
                  <th className="text-left p-3 font-medium text-gray-400">Program</th>
                  <th className="text-left p-3 font-medium text-gray-400">Agency</th>
                  <th className="text-right p-3 font-medium text-gray-400">Amount</th>
                  <th className="text-left p-3 font-medium text-gray-400">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {org.federal_grants.map((grant) => (
                  <tr key={grant.id} className="hover:bg-gray-900/50">
                    <td className="p-3 text-gray-300 text-xs max-w-[200px] truncate">
                      {grant.cfda_title || '-'}
                    </td>
                    <td className="p-3 text-gray-400 text-xs max-w-[150px] truncate">
                      {grant.awarding_agency || '-'}
                    </td>
                    <td className="p-3 text-right font-mono text-green-500">
                      {formatMoney(grant.award_amount)}
                    </td>
                    <td className="p-3 text-gray-500 text-xs">
                      {formatDate(grant.award_date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SBA Loans Table */}
      {(org.sba_loans || []).length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-medium text-white mb-4">SBA Loans ({org.sba_loans.length})</h2>
          <div className="border border-gray-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-900">
                <tr>
                  <th className="text-left p-3 font-medium text-gray-400">Program</th>
                  <th className="text-left p-3 font-medium text-gray-400">Lender</th>
                  <th className="text-right p-3 font-medium text-gray-400">Amount</th>
                  <th className="text-left p-3 font-medium text-gray-400">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {org.sba_loans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-gray-900/50">
                    <td className="p-3 text-gray-300 text-xs">
                      {loan.loan_program || '-'}
                    </td>
                    <td className="p-3 text-gray-400 text-xs max-w-[150px] truncate">
                      {loan.lender_name || '-'}
                    </td>
                    <td className="p-3 text-right font-mono text-green-500">
                      {formatMoney(loan.gross_approval)}
                    </td>
                    <td className="p-3 text-gray-500 text-xs">
                      {formatDate(loan.approval_date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Earmarks Received */}
      {earmarksReceived.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-medium text-white mb-2">Earmarks Received ({earmarksReceived.length})</h2>
          <p className="text-sm text-gray-500 mb-4">
            Congressional earmarks directed to this organization
          </p>
          <div className="border border-gray-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-900">
                <tr>
                  <th className="text-left p-3 font-medium text-gray-400">Member of Congress</th>
                  <th className="text-right p-3 font-medium text-gray-400">Amount</th>
                  <th className="text-left p-3 font-medium text-gray-400">Industry</th>
                  <th className="text-center p-3 font-medium text-gray-400">FY</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {earmarksReceived.map((earmark) => (
                  <tr key={earmark.id} className="hover:bg-gray-900/50">
                    <td className="p-3">
                      {earmark.politician_id ? (
                        <Link
                          href={`/politician/${earmark.politician_id}`}
                          className="text-white hover:text-green-400"
                        >
                          {earmark.politician_name}
                        </Link>
                      ) : (
                        <span className="text-gray-300">
                          {earmark.politician_name || 'Unknown'}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right font-mono text-green-500">
                      {formatMoney(earmark.amount_requested)}
                    </td>
                    <td className="p-3 text-gray-400 text-xs">
                      {earmark.industry || '-'}
                    </td>
                    <td className="p-3 text-center text-gray-500">
                      {earmark.fiscal_year}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {earmarksReceived.length > 0 && (
            <div className="mt-3 p-3 bg-gray-900/30 border border-gray-800 text-sm">
              <span className="text-gray-500">Total Earmarked: </span>
              <span className="font-mono text-green-500">
                {formatMoney(earmarksReceived.reduce((sum, e) => sum + (e.amount_requested || 0), 0))}
              </span>
              <span className="text-gray-600 ml-4">
                from {new Set(earmarksReceived.map(e => e.bioguide_id).filter(Boolean)).size} member(s) of Congress
              </span>
            </div>
          )}
        </div>
      )}

      {/* Related Organizations */}
      {org.related_orgs.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-medium text-white mb-2">Related Organizations</h2>
          <p className="text-sm text-gray-500 mb-4">
            Organizations at the same address (potential shell company indicator)
          </p>
          <div className="border border-gray-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-900">
                <tr>
                  <th className="text-left p-3 font-medium text-gray-400">Organization</th>
                  <th className="text-right p-3 font-medium text-gray-400">Total Funding</th>
                  <th className="text-left p-3 font-medium text-gray-400">Relationship</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {org.related_orgs.map((related) => (
                  <tr key={related.id} className="hover:bg-gray-900/50">
                    <td className="p-3">
                      <Link
                        href={`/organizations/${related.id}`}
                        className="text-white hover:text-green-400"
                      >
                        {related.legal_name}
                      </Link>
                    </td>
                    <td className="p-3 text-right font-mono text-green-500">
                      {formatMoney(related.total_government_funding)}
                    </td>
                    <td className="p-3 text-gray-500 text-xs">
                      {related.relationship === 'same_address' ? 'Same Address' : related.relationship}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
