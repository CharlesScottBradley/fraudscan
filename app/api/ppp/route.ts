import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export interface PPPLoan {
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
}

export interface PPPSearchResponse {
  loans: PPPLoan[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  stats: {
    totalAmount: number;
    avgLoan: number;
    flaggedCount: number;
    chargedOffCount: number;
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  // Pagination
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '50'), 100);
  const offset = (page - 1) * pageSize;

  // Filters
  const search = searchParams.get('search');
  const state = searchParams.get('state');
  const minAmount = searchParams.get('minAmount');
  const maxAmount = searchParams.get('maxAmount');
  const flagged = searchParams.get('flagged');
  const minScore = searchParams.get('minScore');
  const naicsCode = searchParams.get('naics');
  const loanStatus = searchParams.get('status');
  const businessType = searchParams.get('businessType');
  // Default to initial_approval_amount which has a proper index
  const sortBy = searchParams.get('sortBy') || 'initial_approval_amount';
  const sortDir = searchParams.get('sortDir') || 'desc';

  try {
    // Build query - use count: 'estimated' for large tables to avoid timeout
    let query = supabase
      .from('ppp_loans')
      .select(`
        id,
        loan_number,
        borrower_name,
        borrower_address,
        borrower_city,
        borrower_state,
        borrower_zip,
        initial_approval_amount,
        forgiveness_amount,
        jobs_reported,
        business_type,
        naics_code,
        loan_status,
        date_approved,
        forgiveness_date,
        fraud_score,
        is_flagged,
        flags
      `, { count: 'estimated' });

    // Apply filters
    if (search) {
      query = query.or(`borrower_name.ilike.%${search}%,borrower_address.ilike.%${search}%,loan_number.ilike.%${search}%`);
    }

    if (state) {
      query = query.eq('borrower_state', state.toUpperCase());
    }

    if (minAmount) {
      query = query.gte('initial_approval_amount', parseFloat(minAmount));
    }

    if (maxAmount) {
      query = query.lte('initial_approval_amount', parseFloat(maxAmount));
    }

    if (flagged === 'true') {
      query = query.eq('is_flagged', true);
    } else if (flagged === 'false') {
      query = query.eq('is_flagged', false);
    }

    if (minScore) {
      query = query.gte('fraud_score', parseInt(minScore));
    }

    if (naicsCode) {
      query = query.eq('naics_code', naicsCode);
    }

    if (loanStatus) {
      query = query.eq('loan_status', loanStatus);
    }

    if (businessType) {
      query = query.ilike('business_type', `%${businessType}%`);
    }

    // Sorting - use indexed columns for better performance
    const validSortColumns = ['initial_approval_amount', 'jobs_reported', 'date_approved', 'borrower_name'];
    // fraud_score sort only works well when filtering to flagged loans (which have scores > 0)
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'initial_approval_amount';
    query = query.order(sortColumn, { ascending: sortDir === 'asc' });

    // Pagination
    query = query.range(offset, offset + pageSize - 1);

    const { data: loans, error, count } = await query;

    if (error) {
      console.error('PPP query error:', error);
      throw error;
    }

    // Calculate amount per employee
    const loansWithCalc = (loans || []).map(loan => ({
      ...loan,
      amount_per_employee: loan.jobs_reported > 0 
        ? Math.round((loan.initial_approval_amount / loan.jobs_reported) * 100) / 100 
        : null
    }));

    // Calculate stats from current page results only (avoid slow aggregate query)
    let totalAmount = 0;
    let flaggedCount = 0;
    let chargedOffCount = 0;

    loansWithCalc.forEach((loan) => {
      totalAmount += loan.initial_approval_amount || 0;
      if (loan.is_flagged) flaggedCount++;
      if (loan.loan_status === 'Charged Off') chargedOffCount++;
    });

    const response: PPPSearchResponse = {
      loans: loansWithCalc,
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
      stats: {
        totalAmount,
        avgLoan: loansWithCalc.length ? totalAmount / loansWithCalc.length : 0,
        flaggedCount,
        chargedOffCount
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('PPP API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch PPP loans' },
      { status: 500 }
    );
  }
}

