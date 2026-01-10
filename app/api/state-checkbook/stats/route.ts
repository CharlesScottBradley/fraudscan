import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export interface StateCheckbookStats {
  state: string;
  fiscal_year: number;
  record_count: number;
  total_amount: number;
  unique_vendors: number;
  unique_agencies: number;
  avg_payment: number;
  max_payment: number;
  matched_organizations: number;
}

export interface StateCheckbookStatsResponse {
  stats: StateCheckbookStats[];
  summary: {
    totalRecords: number;
    totalAmount: number;
    totalVendors: number;
    totalAgencies: number;
    statesCount: number;
    fiscalYearsCount: number;
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const state = searchParams.get('state');

  try {
    // Query the materialized view for fast stats
    let query = supabase
      .from('state_checkbook_stats')
      .select('*')
      .order('state')
      .order('fiscal_year', { ascending: false });

    if (state) {
      query = query.eq('state', state.toUpperCase());
    }

    const { data: stats, error } = await query;

    if (error) {
      console.error('State checkbook stats query error:', error);
      throw error;
    }

    // Calculate summary
    let totalRecords = 0;
    let totalAmount = 0;
    let totalVendors = 0;
    let totalAgencies = 0;
    const statesSet = new Set<string>();
    const fySet = new Set<number>();

    if (stats) {
      for (const stat of stats) {
        totalRecords += stat.record_count || 0;
        totalAmount += parseFloat(stat.total_amount) || 0;
        totalVendors += stat.unique_vendors || 0;
        totalAgencies += stat.unique_agencies || 0;
        statesSet.add(stat.state);
        if (stat.fiscal_year) fySet.add(stat.fiscal_year);
      }
    }

    const response: StateCheckbookStatsResponse = {
      stats: stats || [],
      summary: {
        totalRecords,
        totalAmount,
        totalVendors,
        totalAgencies,
        statesCount: statesSet.size,
        fiscalYearsCount: fySet.size,
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('State checkbook stats API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch state checkbook stats' },
      { status: 500 }
    );
  }
}
