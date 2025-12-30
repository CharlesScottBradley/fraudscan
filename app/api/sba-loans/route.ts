import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export interface SBALoan {
  id: string;
  sba_loan_number: string;
  loan_program: string;
  loan_subprogram: string;
  borrower_name: string;
  borrower_address: string;
  borrower_city: string;
  borrower_state: string;
  borrower_zip: string;
  borrower_county: string;
  gross_approval: number;
  sba_guaranteed_amount: number | null;
  term_months: number | null;
  interest_rate: number | null;
  lender_name: string;
  naics_code: string;
  naics_description: string;
  business_type: string;
  franchise_name: string | null;
  jobs_supported: number | null;
  approval_date: string;
  is_fraud_prone_industry: boolean;
  industry_category: string | null;
}

export interface SBASearchResponse {
  loans: SBALoan[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  stats: {
    totalAmount: number;
    avgLoan: number;
    fraudProneCount: number;
    by7a: number;
    by504: number;
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
  const program = searchParams.get('program'); // '7a' or '504'
  const fraudProne = searchParams.get('fraudProne');
  const industryCategory = searchParams.get('industry');
  const naicsCode = searchParams.get('naics');
  const lender = searchParams.get('lender');
  const county = searchParams.get('county');
  const sortBy = searchParams.get('sortBy') || 'gross_approval';
  const sortDir = searchParams.get('sortDir') || 'desc';

  try {
    // Build query
    let query = supabase
      .from('sba_loans')
      .select(`
        id,
        sba_loan_number,
        loan_program,
        loan_subprogram,
        borrower_name,
        borrower_address,
        borrower_city,
        borrower_state,
        borrower_zip,
        borrower_county,
        gross_approval,
        sba_guaranteed_amount,
        term_months,
        interest_rate,
        lender_name,
        naics_code,
        naics_description,
        business_type,
        franchise_name,
        jobs_supported,
        approval_date,
        is_fraud_prone_industry,
        industry_category
      `, { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.or(`borrower_name.ilike.%${search}%,borrower_address.ilike.%${search}%,lender_name.ilike.%${search}%,naics_description.ilike.%${search}%`);
    }

    if (state) {
      query = query.eq('borrower_state', state.toUpperCase());
    }

    if (minAmount) {
      query = query.gte('gross_approval', parseFloat(minAmount));
    }

    if (maxAmount) {
      query = query.lte('gross_approval', parseFloat(maxAmount));
    }

    if (program) {
      query = query.eq('loan_program', program);
    }

    if (fraudProne === 'true') {
      query = query.eq('is_fraud_prone_industry', true);
    } else if (fraudProne === 'false') {
      query = query.eq('is_fraud_prone_industry', false);
    }

    if (industryCategory) {
      query = query.eq('industry_category', industryCategory);
    }

    if (naicsCode) {
      query = query.eq('naics_code', naicsCode);
    }

    if (lender) {
      query = query.ilike('lender_name', `%${lender}%`);
    }

    if (county) {
      query = query.ilike('borrower_county', `%${county}%`);
    }

    // Sorting
    const validSortColumns = ['gross_approval', 'approval_date', 'borrower_name', 'term_months', 'jobs_supported'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'gross_approval';
    query = query.order(sortColumn, { ascending: sortDir === 'asc' });

    // Pagination
    query = query.range(offset, offset + pageSize - 1);

    const { data: loans, error, count } = await query;

    if (error) {
      console.error('SBA query error:', error);
      throw error;
    }

    // Get aggregate stats for the filtered results
    let statsQuery = supabase
      .from('sba_loans')
      .select('gross_approval, is_fraud_prone_industry, loan_program');

    // Apply same filters for stats
    if (search) {
      statsQuery = statsQuery.or(`borrower_name.ilike.%${search}%,borrower_address.ilike.%${search}%,lender_name.ilike.%${search}%`);
    }
    if (state) {
      statsQuery = statsQuery.eq('borrower_state', state.toUpperCase());
    }
    if (minAmount) {
      statsQuery = statsQuery.gte('gross_approval', parseFloat(minAmount));
    }
    if (maxAmount) {
      statsQuery = statsQuery.lte('gross_approval', parseFloat(maxAmount));
    }
    if (program) {
      statsQuery = statsQuery.eq('loan_program', program);
    }
    if (fraudProne === 'true') {
      statsQuery = statsQuery.eq('is_fraud_prone_industry', true);
    }
    if (industryCategory) {
      statsQuery = statsQuery.eq('industry_category', industryCategory);
    }

    // Limit stats calculation
    const statsLimit = 15000;
    statsQuery = statsQuery.limit(statsLimit);

    const { data: statsData } = await statsQuery;
    
    let totalAmount = 0;
    let fraudProneCount = 0;
    let by7a = 0;
    let by504 = 0;
    
    if (statsData) {
      statsData.forEach((loan: { gross_approval: number; is_fraud_prone_industry: boolean; loan_program: string }) => {
        totalAmount += loan.gross_approval || 0;
        if (loan.is_fraud_prone_industry) fraudProneCount++;
        if (loan.loan_program === '7a') by7a++;
        if (loan.loan_program === '504') by504++;
      });
    }

    const response: SBASearchResponse = {
      loans: loans || [],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
      stats: {
        totalAmount,
        avgLoan: statsData?.length ? totalAmount / statsData.length : 0,
        fraudProneCount,
        by7a,
        by504
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('SBA API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SBA loans' },
      { status: 500 }
    );
  }
}

