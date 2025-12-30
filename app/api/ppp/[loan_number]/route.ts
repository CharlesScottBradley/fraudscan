import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export interface PPPLoanDetail {
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
  flags: Record<string, unknown>;
  lender: string | null;
  cd: string | null;
  race: string | null;
  ethnicity: string | null;
  gender: string | null;
  veteran: string | null;
  non_profit: boolean | null;
}

export interface PPPLoanDetailResponse {
  loan: PPPLoanDetail;
  loansAtAddress: Array<{
    loan_number: string;
    borrower_name: string;
    initial_approval_amount: number;
    jobs_reported: number;
    date_approved: string;
    is_flagged: boolean;
  }>;
  naicsDescription: string | null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ loan_number: string }> }
) {
  const { loan_number } = await params;

  try {
    // Get the loan details
    const { data: loan, error } = await supabase
      .from('ppp_loans')
      .select('*')
      .eq('loan_number', loan_number)
      .single();

    if (error || !loan) {
      return NextResponse.json(
        { error: 'Loan not found' },
        { status: 404 }
      );
    }

    // Calculate amount per employee
    const amount_per_employee = loan.jobs_reported > 0
      ? Math.round((loan.initial_approval_amount / loan.jobs_reported) * 100) / 100
      : null;

    const loanDetail: PPPLoanDetail = {
      ...loan,
      amount_per_employee
    };

    // Get other loans at the same address (shell company detection)
    const { data: loansAtAddress } = await supabase
      .from('ppp_loans')
      .select('loan_number, borrower_name, initial_approval_amount, jobs_reported, date_approved, is_flagged')
      .eq('borrower_address', loan.borrower_address)
      .eq('borrower_zip', loan.borrower_zip)
      .neq('loan_number', loan_number)
      .order('initial_approval_amount', { ascending: false })
      .limit(10);

    // Get NAICS description (you may want to create a separate naics_codes table)
    // For now, we'll return null and handle it on the frontend
    const naicsDescription = getNAICSDescription(loan.naics_code);

    const response: PPPLoanDetailResponse = {
      loan: loanDetail,
      loansAtAddress: loansAtAddress || [],
      naicsDescription
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('PPP loan detail API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch loan details' },
      { status: 500 }
    );
  }
}

// Basic NAICS code descriptions - in production this should come from a database table
function getNAICSDescription(code: string): string | null {
  const naicsMap: Record<string, string> = {
    '624410': 'Child Day Care Services',
    '531210': 'Offices of Real Estate Agents and Brokers',
    '541110': 'Offices of Lawyers',
    '621111': 'Offices of Physicians (except Mental Health Specialists)',
    '236220': 'Commercial and Institutional Building Construction',
    '722511': 'Full-Service Restaurants',
    '541211': 'Offices of Certified Public Accountants',
    '541330': 'Engineering Services',
    '541512': 'Computer Systems Design Services',
    '238220': 'Plumbing, Heating, and Air-Conditioning Contractors',
    '531110': 'Lessors of Residential Buildings and Dwellings',
    '236118': 'Residential Remodelers',
    '722513': 'Limited-Service Restaurants',
    '531120': 'Lessors of Nonresidential Buildings (except Miniwarehouses)',
    '541611': 'Administrative Management and General Management Consulting Services',
    '621210': 'Offices of Dentists',
    '238210': 'Electrical Contractors and Other Wiring Installation Contractors',
    '236115': 'New Single-Family Housing Construction (except For-Sale Builders)',
    '811111': 'General Automotive Repair',
    '541219': 'Other Accounting Services',
  };

  return naicsMap[code] || null;
}
