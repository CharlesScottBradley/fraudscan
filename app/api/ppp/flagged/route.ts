import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// Specialized endpoint for flagged PPP loans with fraud indicators
export interface FlaggedPPPLoan {
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
  flags: {
    HIGH_DOLLAR_PER_EMPLOYEE?: { per_employee: number; severity: string };
    SOLE_PROP_HIGH_LOAN?: { amount: number; severity: string };
    ZERO_EMPLOYEES?: { amount: number; severity: string };
    CHARGED_OFF?: { severity: string };
    FORGIVENESS_EXCEEDS_LOAN?: { ratio: number; severity: string };
    CHILDCARE_ANOMALY?: { per_employee: number; severity: string };
    MISMATCHED_ENTITY_TYPE?: { severity: string };
  };
  flag_types: string[];
}

export interface FlaggedPPPResponse {
  loans: FlaggedPPPLoan[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  stats: {
    totalFlagged: number;
    totalAmount: number;
    byFlag: Record<string, { count: number; amount: number }>;
    byState: Record<string, { count: number; amount: number }>;
    bySeverity: {
      high: number;
      medium: number;
      low: number;
    };
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  // Pagination
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '50'), 100);
  const offset = (page - 1) * pageSize;

  // Filters
  const state = searchParams.get('state');
  const minScore = parseInt(searchParams.get('minScore') || '25');
  const flagType = searchParams.get('flagType'); // e.g., HIGH_DOLLAR_PER_EMPLOYEE
  const severity = searchParams.get('severity'); // high, medium, low
  const sortBy = searchParams.get('sortBy') || 'fraud_score';
  const sortDir = searchParams.get('sortDir') || 'desc';

  try {
    // Use the ppp_flagged_loans view for better performance
    let query = supabase
      .from('ppp_flagged_loans')
      .select('*', { count: 'exact' })
      .gte('fraud_score', minScore);

    // Apply filters
    if (state) {
      query = query.eq('borrower_state', state.toUpperCase());
    }

    if (flagType) {
      // Filter by specific flag type using JSONB contains
      query = query.not('flags->>' + flagType, 'is', null);
    }

    // Sorting
    const validSortColumns = ['fraud_score', 'initial_approval_amount', 'amount_per_employee', 'date_approved'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'fraud_score';
    query = query.order(sortColumn, { ascending: sortDir === 'asc' });

    // Pagination
    query = query.range(offset, offset + pageSize - 1);

    const { data: loans, error, count } = await query;

    if (error) {
      console.error('Flagged PPP query error:', error);
      throw error;
    }

    // Add flag_types array for easy frontend filtering
    const loansWithFlagTypes = (loans || []).map(loan => ({
      ...loan,
      flag_types: Object.keys(loan.flags || {})
    }));

    // Get aggregate statistics
    const { data: statsData } = await supabase
      .from('ppp_flagged_loans')
      .select('borrower_state, initial_approval_amount, flags, fraud_score')
      .gte('fraud_score', 25)
      .limit(5000); // Sample for stats

    const byFlag: Record<string, { count: number; amount: number }> = {};
    const byState: Record<string, { count: number; amount: number }> = {};
    let totalAmount = 0;
    const bySeverity = { high: 0, medium: 0, low: 0 };

    if (statsData) {
      statsData.forEach((loan: { borrower_state: string; initial_approval_amount: number; flags: Record<string, { severity?: string }> }) => {
        totalAmount += loan.initial_approval_amount || 0;
        
        // Count by state
        const st = loan.borrower_state;
        if (st) {
          if (!byState[st]) byState[st] = { count: 0, amount: 0 };
          byState[st].count++;
          byState[st].amount += loan.initial_approval_amount || 0;
        }

        // Count by flag type and severity
        if (loan.flags) {
          Object.entries(loan.flags).forEach(([flagName, flagData]) => {
            if (!byFlag[flagName]) byFlag[flagName] = { count: 0, amount: 0 };
            byFlag[flagName].count++;
            byFlag[flagName].amount += loan.initial_approval_amount || 0;

            // Count by severity
            const flagSeverity = (flagData as { severity?: string })?.severity;
            if (flagSeverity === 'high') bySeverity.high++;
            else if (flagSeverity === 'medium') bySeverity.medium++;
            else if (flagSeverity === 'low') bySeverity.low++;
          });
        }
      });
    }

    const response: FlaggedPPPResponse = {
      loans: loansWithFlagTypes,
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
      stats: {
        totalFlagged: count || 0,
        totalAmount,
        byFlag,
        byState,
        bySeverity
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Flagged PPP API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch flagged PPP loans' },
      { status: 500 }
    );
  }
}

