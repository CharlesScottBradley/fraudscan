import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export interface ImproperPayment {
  id: string;
  program_name: string;
  program_acronym: string | null;
  agency: string;
  sub_agency: string | null;
  fiscal_year: number;
  total_outlays: number | null;
  improper_payment_amount: number | null;
  improper_payment_rate: number | null;
  overpayment_amount: number | null;
  underpayment_amount: number | null;
  is_high_priority: boolean;
}

export interface PaymentScorecard {
  program_name: string;
  agency: string;
  fiscal_year: number;
  fiscal_quarter: number;
  scorecard_url: string;
}

export interface ImproperPaymentsResponse {
  payments: ImproperPayment[];
  total: number;
  scorecards: PaymentScorecard[];
  stats: {
    totalImproperPayments: number;
    totalPrograms: number;
    yearsOfData: number;
    topAgencies: Array<{ agency: string; total: number }>;
    trendByYear: Array<{ year: number; total: number; count: number }>;
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Filters
  const agency = searchParams.get('agency');
  const program = searchParams.get('program');
  const fiscalYear = searchParams.get('fiscalYear');
  const minYear = searchParams.get('minYear');
  const maxYear = searchParams.get('maxYear');
  const highPriorityOnly = searchParams.get('highPriority');

  try {
    // Build query for payments
    let query = supabase
      .from('improper_payments')
      .select('*', { count: 'exact' });

    // Apply filters
    if (agency) {
      query = query.eq('agency', agency);
    }

    if (program) {
      query = query.ilike('program_name', `%${program}%`);
    }

    if (fiscalYear) {
      query = query.eq('fiscal_year', parseInt(fiscalYear));
    }

    if (minYear) {
      query = query.gte('fiscal_year', parseInt(minYear));
    }

    if (maxYear) {
      query = query.lte('fiscal_year', parseInt(maxYear));
    }

    if (highPriorityOnly === 'true') {
      query = query.eq('is_high_priority', true);
    }

    // Order by fiscal year descending
    query = query.order('fiscal_year', { ascending: false });

    const { data: payments, error, count } = await query;

    if (error) {
      console.error('Improper payments query error:', error);
      throw error;
    }

    // Calculate aggregate stats
    const { data: allPayments } = await supabase
      .from('improper_payments')
      .select('agency, fiscal_year, improper_payment_amount, program_name');

    let totalImproperPayments = 0;
    const programSet = new Set<string>();
    const yearSet = new Set<number>();
    const agencyTotals: Record<string, number> = {};
    const yearTotals: Record<number, { total: number; count: number }> = {};

    if (allPayments) {
      allPayments.forEach((payment: {
        agency: string;
        fiscal_year: number;
        improper_payment_amount: number | null;
        program_name: string;
      }) => {
        const amount = payment.improper_payment_amount || 0;
        totalImproperPayments += amount;

        if (payment.program_name) {
          programSet.add(payment.program_name);
        }

        if (payment.fiscal_year) {
          yearSet.add(payment.fiscal_year);
        }

        if (payment.agency) {
          agencyTotals[payment.agency] = (agencyTotals[payment.agency] || 0) + amount;
        }

        if (payment.fiscal_year) {
          if (!yearTotals[payment.fiscal_year]) {
            yearTotals[payment.fiscal_year] = { total: 0, count: 0 };
          }
          yearTotals[payment.fiscal_year].total += amount;
          yearTotals[payment.fiscal_year].count += 1;
        }
      });
    }

    // Top 10 agencies by total improper payment amount
    const topAgencies = Object.entries(agencyTotals)
      .map(([agency, total]) => ({ agency, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    // Trend by year
    const trendByYear = Object.entries(yearTotals)
      .map(([year, data]) => ({
        year: parseInt(year),
        total: data.total,
        count: data.count,
      }))
      .sort((a, b) => a.year - b.year);

    // Fetch recent payment scorecards (last 2 fiscal years)
    const { data: scorecards } = await supabase
      .from('payment_scorecards')
      .select('program_name, agency, fiscal_year, fiscal_quarter, scorecard_url')
      .gte('fiscal_year', 2024)
      .order('fiscal_year', { ascending: false })
      .order('fiscal_quarter', { ascending: false })
      .limit(50);

    const response: ImproperPaymentsResponse = {
      payments: payments || [],
      total: count || 0,
      scorecards: scorecards || [],
      stats: {
        totalImproperPayments,
        totalPrograms: programSet.size,
        yearsOfData: yearSet.size,
        topAgencies,
        trendByYear,
      },
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Improper payments API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch improper payments data' },
      { status: 500 }
    );
  }
}
