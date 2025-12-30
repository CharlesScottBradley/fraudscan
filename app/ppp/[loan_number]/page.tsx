'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface PPPLoanDetail {
  id: string;
  loan_number: string;
  borrower_name: string;
  borrower_address: string;
  borrower_city: string;
  borrower_state: string;
  borrower_zip: string;
  initial_approval_amount: number;
  forgiveness_amount: number | null;
  jobs_reported: number;
  amount_per_employee: number | null;
  business_type: string;
  naics_code: string;
  loan_status: string;
  date_approved: string;
  forgiveness_date: string | null;
  fraud_score: number;
  is_flagged: boolean;
  flags: Record<string, { severity?: string; [key: string]: unknown }>;
  lender: string | null;
  cd: string | null;
  race: string | null;
  ethnicity: string | null;
  gender: string | null;
  veteran: string | null;
  non_profit: boolean | null;
}

interface LoanAtAddress {
  loan_number: string;
  borrower_name: string;
  initial_approval_amount: number;
  jobs_reported: number;
  date_approved: string;
  is_flagged: boolean;
}

interface PPPLoanDetailResponse {
  loan: PPPLoanDetail;
  loansAtAddress: LoanAtAddress[];
  naicsDescription: string | null;
}

function formatMoney(amount: number | null): string {
  if (!amount) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: string | null): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function getFlagLabel(flagKey: string): string {
  const labels: Record<string, string> = {
    'HIGH_DOLLAR_PER_EMPLOYEE': 'High Dollar per Employee',
    'SOLE_PROP_HIGH_LOAN': 'Sole Proprietor High Loan Amount',
    'ZERO_EMPLOYEES': 'Zero Employees Reported',
    'CHARGED_OFF': 'Loan Charged Off',
    'FORGIVENESS_EXCEEDS_LOAN': 'Forgiveness Exceeds Original Loan',
    'CHILDCARE_ANOMALY': 'Childcare Provider Anomaly',
    'MISMATCHED_ENTITY_TYPE': 'Mismatched Entity Type',
  };
  return labels[flagKey] || flagKey.replace(/_/g, ' ');
}

function getFlagDescription(flagKey: string, flagData: { per_employee?: number; amount?: number; ratio?: number; [key: string]: unknown }): string {
  switch (flagKey) {
    case 'HIGH_DOLLAR_PER_EMPLOYEE':
      return `$${flagData.per_employee?.toLocaleString() || 0} per employee (typical range: $20K-$40K)`;
    case 'SOLE_PROP_HIGH_LOAN':
      return `${formatMoney(flagData.amount || 0)} loan for sole proprietor (max typically $20,833)`;
    case 'ZERO_EMPLOYEES':
      return `${formatMoney(flagData.amount || 0)} loan with zero employees reported`;
    case 'CHARGED_OFF':
      return 'Loan was charged off and not repaid';
    case 'FORGIVENESS_EXCEEDS_LOAN':
      return `Forgiveness is ${((flagData.ratio || 1) * 100).toFixed(1)}% of original loan amount`;
    case 'CHILDCARE_ANOMALY':
      return `$${flagData.per_employee?.toLocaleString() || 0} per employee for childcare provider`;
    case 'MISMATCHED_ENTITY_TYPE':
      return 'Business type does not match typical entity classifications';
    default:
      return 'Flagged for review';
  }
}

export default function PPPLoanDetailPage() {
  const params = useParams();
  const loan_number = params.loan_number as string;

  const [data, setData] = useState<PPPLoanDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLoanDetail();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loan_number]);

  const fetchLoanDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/ppp/${loan_number}`);
      if (!res.ok) {
        throw new Error('Loan not found');
      }
      const loanData: PPPLoanDetailResponse = await res.json();
      if (!loanData || !loanData.loan) {
        throw new Error('Invalid response format');
      }
      setData(loanData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load loan');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <p className="text-gray-500">Loading loan details...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-20 text-center">
        <p className="text-gray-400 mb-4">{error || 'Loan not found'}</p>
        <Link href="/ppp" className="text-green-500 hover:text-green-400">
          Back to PPP Search
        </Link>
      </div>
    );
  }

  const { loan, loansAtAddress, naicsDescription } = data;
  const flags = Object.entries(loan.flags || {});

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-6 text-sm text-gray-500">
        <Link href="/ppp" className="hover:text-green-400">PPP Loans</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-400">{loan.loan_number}</span>
      </div>

      {/* Terminal-style loan summary */}
      <div className="font-mono text-sm mb-10">
        <p className="text-gray-500">LOAN_{loan.loan_number}</p>
        <div className="mt-2 text-gray-400">
          <p><span className="text-gray-600">├─</span> borrower <span className="text-white ml-4">{loan.borrower_name}</span></p>
          <p><span className="text-gray-600">├─</span> approved <span className="text-green-500 ml-4">{formatMoney(loan.initial_approval_amount)}</span></p>
          <p><span className="text-gray-600">├─</span> forgiven <span className="text-green-500 ml-4">{formatMoney(loan.forgiveness_amount)}</span></p>
          <p><span className="text-gray-600">├─</span> jobs_reported <span className="text-white ml-4">{loan.jobs_reported || 0}</span></p>
          <p><span className="text-gray-600">├─</span> per_employee <span className="text-green-500 ml-4">{loan.amount_per_employee ? formatMoney(loan.amount_per_employee) : '-'}</span></p>
          <p><span className="text-gray-600">├─</span> fraud_score <span className="text-white ml-4">{loan.fraud_score}/100</span></p>
          <p><span className="text-gray-600">└─</span> status <span className="text-white ml-4">{loan.is_flagged ? 'Flagged' : 'Clear'}</span></p>
        </div>
      </div>

      {/* Flag Reasons */}
      {loan.is_flagged && flags.length > 0 && (
        <div className="mb-8 border border-gray-800 p-6">
          <h2 className="text-lg font-bold mb-4">Flag Reasons</h2>
          <div className="space-y-4">
            {flags.map(([flagKey, flagData]) => {
              const severity = (flagData as { severity?: string }).severity || 'medium';
              return (
                <div key={flagKey} className="flex items-start gap-4">
                  <div className="text-gray-500 text-xs uppercase w-16 pt-0.5 flex-shrink-0">
                    {severity}
                  </div>
                  <div className="flex-1">
                    <p className="text-white mb-1">{getFlagLabel(flagKey)}</p>
                    <p className="text-sm text-gray-500">
                      {getFlagDescription(flagKey, flagData as { per_employee?: number; amount?: number; ratio?: number })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Business Details */}
      <div className="mb-8">
        <h2 className="text-lg font-bold mb-4">Business Details</h2>
        <div className="border border-gray-800 divide-y divide-gray-800">
          <div className="p-4 flex justify-between">
            <span className="text-gray-500">Address</span>
            <span className="text-gray-400 text-right">
              {loan.borrower_address}<br />
              {loan.borrower_city}, {loan.borrower_state} {loan.borrower_zip}
            </span>
          </div>
          <div className="p-4 flex justify-between">
            <span className="text-gray-500">Business Type</span>
            <span className="text-gray-400">{loan.business_type}</span>
          </div>
          <div className="p-4 flex justify-between">
            <span className="text-gray-500">NAICS Code</span>
            <span className="text-gray-400">
              {loan.naics_code}
              {naicsDescription && (
                <span className="text-gray-600 text-sm ml-2">({naicsDescription})</span>
              )}
            </span>
          </div>
          <div className="p-4 flex justify-between">
            <span className="text-gray-500">Loan Status</span>
            <span className="text-gray-400">{loan.loan_status}</span>
          </div>
          <div className="p-4 flex justify-between">
            <span className="text-gray-500">Date Approved</span>
            <span className="text-gray-400">{formatDate(loan.date_approved)}</span>
          </div>
          {loan.forgiveness_date && (
            <div className="p-4 flex justify-between">
              <span className="text-gray-500">Forgiveness Date</span>
              <span className="text-gray-400">{formatDate(loan.forgiveness_date)}</span>
            </div>
          )}
          {loan.lender && (
            <div className="p-4 flex justify-between">
              <span className="text-gray-500">Lender</span>
              <span className="text-gray-400">{loan.lender}</span>
            </div>
          )}
          {loan.non_profit !== null && (
            <div className="p-4 flex justify-between">
              <span className="text-gray-500">Non-Profit</span>
              <span className="text-gray-400">{loan.non_profit ? 'Yes' : 'No'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Other Loans at Address */}
      {loansAtAddress.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-2">
            Other PPP Loans at This Address
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            {loansAtAddress.length} other loan{loansAtAddress.length !== 1 ? 's' : ''} at the same address
          </p>
          <div className="border border-gray-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-900">
                <tr>
                  <th className="text-left p-3 font-medium text-gray-400">Business Name</th>
                  <th className="text-right p-3 font-medium text-gray-400">Amount</th>
                  <th className="text-right p-3 font-medium text-gray-400">Jobs</th>
                  <th className="text-left p-3 font-medium text-gray-400">Approved</th>
                  <th className="text-center p-3 font-medium text-gray-400">Status</th>
                  <th className="text-right p-3 font-medium text-gray-400">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {loansAtAddress.map((otherLoan) => (
                  <tr key={otherLoan.loan_number} className="hover:bg-gray-900/50">
                    <td className="p-3 text-white">{otherLoan.borrower_name}</td>
                    <td className="p-3 text-right font-mono text-green-500">
                      {formatMoney(otherLoan.initial_approval_amount)}
                    </td>
                    <td className="p-3 text-right font-mono text-white">
                      {otherLoan.jobs_reported || '-'}
                    </td>
                    <td className="p-3 text-gray-400">{formatDate(otherLoan.date_approved)}</td>
                    <td className="p-3 text-center text-gray-500 text-xs">
                      {otherLoan.is_flagged ? 'Flagged' : 'Clear'}
                    </td>
                    <td className="p-3 text-right">
                      <Link
                        href={`/ppp/${otherLoan.loan_number}`}
                        className="text-gray-500 hover:text-white text-xs"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Related Records */}
      <div className="mb-8 pt-6 border-t border-gray-800">
        <h2 className="text-lg font-bold mb-4">Related Records</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 border border-gray-800">
            <div>
              <p className="text-white mb-1">Search Organization Database</p>
              <p className="text-sm text-gray-500">
                Check if this business is registered in our provider database
              </p>
            </div>
            <Link
              href={`/database?search=${encodeURIComponent(loan.borrower_name)}`}
              className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
            >
              Search
            </Link>
          </div>
          <div className="flex items-center justify-between p-4 border border-gray-800">
            <div>
              <p className="text-white mb-1">Search Fraud Cases</p>
              <p className="text-sm text-gray-500">
                Check for related fraud investigations or enforcement actions
              </p>
            </div>
            <Link
              href={`/cases?search=${encodeURIComponent(loan.borrower_name)}`}
              className="px-4 py-2 border border-gray-700 text-gray-400 rounded text-sm hover:text-white hover:border-gray-600"
            >
              Search
            </Link>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Link
          href="/ppp"
          className="px-4 py-2 border border-gray-700 rounded text-sm text-gray-400 hover:text-white hover:border-gray-600"
        >
          Back to Search
        </Link>
        {loan.is_flagged && (
          <Link
            href="/ppp/flagged"
            className="px-4 py-2 border border-gray-700 rounded text-sm text-gray-400 hover:text-white hover:border-gray-600"
          >
            View All Flagged Loans
          </Link>
        )}
      </div>
    </div>
  );
}
