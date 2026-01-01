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
      const res = await fetch(`/api/organizations/${id}`);

      if (res.status === 404) {
        setError('Organization not found');
        return;
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      setOrg(data);
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
              Fraud-Prone Industry
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

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="border border-gray-800 p-4">
          <p className="text-gray-500 text-xs mb-1">Total Funding</p>
          <p className="text-xl font-mono text-green-500">{formatMoney(org.total_government_funding)}</p>
        </div>
        <div className="border border-gray-800 p-4">
          <p className="text-gray-500 text-xs mb-1">PPP Loans</p>
          <p className="text-xl font-mono text-white">{org.ppp_loans.length}</p>
          <p className="text-xs text-gray-500 mt-1">{formatMoney(totalPPP)}</p>
        </div>
        <div className="border border-gray-800 p-4">
          <p className="text-gray-500 text-xs mb-1">EIDL Loans</p>
          <p className="text-xl font-mono text-white">{org.eidl_loans.length}</p>
          <p className="text-xs text-gray-500 mt-1">{formatMoney(totalEIDL)}</p>
        </div>
        <div className="border border-gray-800 p-4">
          <p className="text-gray-500 text-xs mb-1">Funding Period</p>
          <p className="text-sm text-white">
            {formatDate(org.first_funding_date)}
          </p>
          <p className="text-xs text-gray-500">to {formatDate(org.last_funding_date)}</p>
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
              <dt className="text-gray-500">Fraud-Prone</dt>
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
