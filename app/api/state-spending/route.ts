import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export interface SpendingOverview {
  source: string;
  total_amount: number;
  record_count: number;
  unique_recipients: number;
}

export interface SpendingCategory {
  category: string;
  vendor_count: number;
  total_amount: number;
  pct_of_total: number;
}

export interface TopRecipient {
  recipient_name: string;
  organization_id: string | null;
  state_payments: number;
  ppp_amount: number;
  federal_grants: number;
  sba_amount: number;
  total_funding: number;
}

export interface CountySpending {
  county: string;
  recipient_count: number;
  total_amount: number;
}

export interface StateSpendingResponse {
  state: string;
  overview: SpendingOverview[];
  totalTracked: number;
  categories: SpendingCategory[];
  topRecipients: TopRecipient[];
  byCounty: CountySpending[];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const state = searchParams.get('state');

  if (!state || state.length !== 2) {
    return NextResponse.json(
      { error: 'State code required (2 letter abbreviation)' },
      { status: 400 }
    );
  }

  const stateCode = state.toUpperCase();

  try {
    // Call RPCs in parallel
    const [overviewResult, categoriesResult, recipientsResult, countyResult] = await Promise.all([
      supabase.rpc('get_state_spending_overview', { p_state: stateCode }),
      supabase.rpc('get_state_spending_by_category', { p_state: stateCode }),
      supabase.rpc('get_state_top_recipients', { p_state: stateCode, p_limit: 25 }),
      supabase.rpc('get_state_spending_by_county', { p_state: stateCode })
    ]);

    // Handle errors
    if (overviewResult.error) {
      console.error('Overview error:', overviewResult.error);
      return NextResponse.json(
        { error: 'Failed to fetch spending overview' },
        { status: 500 }
      );
    }

    // Log other errors for debugging
    if (recipientsResult.error) {
      console.error('Recipients RPC error:', recipientsResult.error);
    }
    if (categoriesResult.error) {
      console.error('Categories RPC error:', categoriesResult.error);
    }
    if (countyResult.error) {
      console.error('County RPC error:', countyResult.error);
    }

    // Calculate total tracked
    const overview = overviewResult.data as SpendingOverview[];
    const totalTracked = overview.reduce((sum, item) => sum + (Number(item.total_amount) || 0), 0);

    // Build response
    const response: StateSpendingResponse = {
      state: stateCode,
      overview,
      totalTracked,
      categories: (categoriesResult.data || []) as SpendingCategory[],
      topRecipients: (recipientsResult.data || []) as TopRecipient[],
      byCounty: (countyResult.data || []) as CountySpending[]
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('State spending error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch state spending data' },
      { status: 500 }
    );
  }
}
