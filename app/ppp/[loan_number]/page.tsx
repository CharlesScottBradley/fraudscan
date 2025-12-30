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

function getFlagBadgeColor(severity: string | undefined): string {
  switch (severity) {
    case 'high':
      return 'bg-red-900/40 text-red-400 border-red-800';
    case 'medium':
      return 'bg-amber-900/40 text-amber-400 border-amber-800';
    case 'low':
      return 'bg-yellow-900/40 text-yellow-400 border-yellow-800';
    default:
      return 'bg-gray-800 text-gray-400 border-gray-700';
  }
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
      setData(loanData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load loan');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading loan details...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-red-400">Error: {error || 'Loan not found'}</p>
        <Link href="/ppp" className="text-green-400 hover:underline">
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

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h1 className="text-2xl font-bold mb-2">{loan.borrower_name}</h1>
            <p className="text-gray-500">Loan #{loan.loan_number}</p>
          </div>
          <div>
            {loan.is_flagged ? (
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded bg-amber-900/40 text-amber-400 border border-amber-800">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Flagged for Review
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded bg-green-900/40 text-green-400 border border-green-800">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                No Issues Detected
              </span>
            )}
          </div>
        </div>
        <p className="text-3xl font-mono font-bold text-green-500">
          {formatMoney(loan.initial_approval_amount)}
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-800 border border-gray-700 p-4">
          <p className="text-xs text-gray-400 mb-1">APPROVAL AMOUNT</p>
          <p className="text-xl font-mono font-bold text-white">
            {formatMoney(loan.initial_approval_amount)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Approved {formatDate(loan.date_approved)}</p>
        </div>

        <div className="bg-gray-800 border border-gray-700 p-4">
          <p className="text-xs text-gray-400 mb-1">FORGIVENESS AMOUNT</p>
          <p className="text-xl font-mono font-bold text-white">
            {formatMoney(loan.forgiveness_amount)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {loan.forgiveness_date ? formatDate(loan.forgiveness_date) : 'Not forgiven'}
          </p>
        </div>

        <div className="bg-gray-800 border border-gray-700 p-4">
          <p className="text-xs text-gray-400 mb-1">JOBS REPORTED</p>
          <p className="text-xl font-mono font-bold text-white">
            {loan.jobs_reported || 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">Employees retained</p>
        </div>

        <div className="bg-gray-800 border border-gray-700 p-4">
          <p className="text-xs text-gray-400 mb-1">$ PER JOB</p>
          <p className="text-xl font-mono font-bold text-white">
            {loan.amount_per_employee ? formatMoney(loan.amount_per_employee) : '-'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {loan.amount_per_employee && loan.amount_per_employee > 50000
              ? 'Above typical range'
              : 'Per employee'}
          </p>
        </div>
      </div>

      {/* Flag Reasons */}
      {loan.is_flagged && flags.length > 0 && (
        <div className="mb-8 bg-amber-900/20 border border-amber-800 rounded p-6">
          <h2 className="text-lg font-bold mb-4 text-amber-400">Flag Reasons</h2>
          <div className="space-y-3">
            {flags.map(([flagKey, flagData]) => {
              const severity = (flagData as { severity?: string }).severity;
              return (
                <div key={flagKey} className="flex items-start gap-3">
                  <div className={`px-3 py-1 rounded text-xs border ${getFlagBadgeColor(severity)}`}>
                    {severity?.toUpperCase() || 'FLAG'}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-white mb-1">{getFlagLabel(flagKey)}</p>
                    <p className="text-sm text-gray-400">
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
        <div className="bg-gray-800 border border-gray-700 rounded divide-y divide-gray-700">
          <div className="p-4 flex justify-between">
            <span className="text-gray-400">Address</span>
            <span className="text-white text-right">
              {loan.borrower_address}<br />
              {loan.borrower_city}, {loan.borrower_state} {loan.borrower_zip}
            </span>
          </div>
          <div className="p-4 flex justify-between">
            <span className="text-gray-400">Business Type</span>
            <span className="text-white">{loan.business_type}</span>
          </div>
          <div className="p-4 flex justify-between">
            <span className="text-gray-400">NAICS Code</span>
            <span className="text-white">
              {loan.naics_code}
              {naicsDescription && (
                <span className="text-gray-500 text-sm ml-2">({naicsDescription})</span>
              )}
            </span>
          </div>
          <div className="p-4 flex justify-between">
            <span className="text-gray-400">Loan Status</span>
            <span className={`px-2 py-0.5 rounded text-xs ${
              loan.loan_status === 'Paid in Full' || loan.loan_status === 'Exemption 4'
                ? 'bg-green-900/40 text-green-400 border border-green-800'
                : loan.loan_status === 'Charged Off'
                ? 'bg-red-900/40 text-red-400 border border-red-800'
                : 'bg-gray-700 text-gray-300 border border-gray-600'
            }`}>
              {loan.loan_status}
            </span>
          </div>
          {loan.lender && (
            <div className="p-4 flex justify-between">
              <span className="text-gray-400">Lender</span>
              <span className="text-white">{loan.lender}</span>
            </div>
          )}
          {loan.non_profit !== null && (
            <div className="p-4 flex justify-between">
              <span className="text-gray-400">Non-Profit</span>
              <span className="text-white">{loan.non_profit ? 'Yes' : 'No'}</span>
            </div>
          )}
          <div className="p-4 flex justify-between">
            <span className="text-gray-400">Fraud Score</span>
            <span className={`font-mono ${
              loan.fraud_score >= 75 ? 'text-red-400' :
              loan.fraud_score >= 50 ? 'text-amber-400' :
              loan.fraud_score >= 25 ? 'text-yellow-400' :
              'text-green-400'
            }`}>
              {loan.fraud_score}/100
            </span>
          </div>
        </div>
      </div>

      {/* Other Loans at Address (Shell Company Detection) */}
      {loansAtAddress.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4">
            Other PPP Loans at This Address
            <span className="text-sm font-normal text-amber-400 ml-3">
              ({loansAtAddress.length} loan{loansAtAddress.length !== 1 ? 's' : ''})
            </span>
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Multiple loans at the same address may indicate a shared office space, property management company, or potential shell company structure.
          </p>
          <div className="border border-gray-800 overflow-hidden rounded">
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
                    <td className="p-3 text-center">
                      {otherLoan.is_flagged && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-amber-900/40 text-amber-400 border border-amber-800">
                          Flagged
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <Link
                        href={`/ppp/${otherLoan.loan_number}`}
                        className="text-gray-400 hover:text-white text-xs"
                      >
                        View →
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
          <div className="flex items-center justify-between p-4 bg-gray-800 border border-gray-700 rounded">
            <div>
              <p className="text-white font-medium mb-1">Search Organization Database</p>
              <p className="text-sm text-gray-400">
                Check if this business is registered in our provider database
              </p>
            </div>
            <Link
              href={`/database?search=${encodeURIComponent(loan.borrower_name)}`}
              className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
            >
              Search →
            </Link>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-800 border border-gray-700 rounded">
            <div>
              <p className="text-white font-medium mb-1">Search Fraud Cases</p>
              <p className="text-sm text-gray-400">
                Check for related fraud investigations or enforcement actions
              </p>
            </div>
            <Link
              href={`/fraud-cases?search=${encodeURIComponent(loan.borrower_name)}`}
              className="px-4 py-2 bg-gray-700 text-white rounded text-sm hover:bg-gray-600"
            >
              Search →
            </Link>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Link
          href="/ppp"
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded text-sm hover:bg-gray-700"
        >
          Back to Search
        </Link>
        {loan.is_flagged && (
          <Link
            href="/ppp/flagged"
            className="px-4 py-2 bg-amber-900/40 text-amber-400 border border-amber-800 rounded text-sm hover:bg-amber-900/60"
          >
            View All Flagged Loans
          </Link>
        )}
      </div>
    </div>
  );
}
