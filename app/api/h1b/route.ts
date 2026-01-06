import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export interface H1BEmployerStat {
  id: string;
  employer_name: string;
  employer_name_normalized: string;
  city: string | null;
  state: string | null;
  zip: string | null;
  naics_code: string | null;
  fiscal_year: number;
  initial_approvals: number;
  initial_denials: number;
  continuing_approvals: number;
  continuing_denials: number;
  total_petitions: number;
  total_approvals: number;
  total_denials: number;
  approval_rate: number;
}

export interface H1BSearchResponse {
  employers: H1BEmployerStat[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  stats: {
    totalRecords: number;
    totalApprovals: number;
    totalDenials: number;
    avgApprovalRate: number;
    topStates: { state: string; count: number }[];
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
  const naicsCode = searchParams.get('naics');
  const fiscalYear = searchParams.get('fiscalYear');
  const minApprovals = searchParams.get('minApprovals');
  const maxApprovalRate = searchParams.get('maxApprovalRate');

  const sortBy = searchParams.get('sortBy') || 'total_approvals';
  const sortDir = searchParams.get('sortDir') || 'desc';

  try {
    let query = supabase
      .from('h1b_employer_stats')
      .select(`
        id,
        employer_name,
        employer_name_normalized,
        city,
        state,
        zip,
        naics_code,
        fiscal_year,
        initial_approvals,
        initial_denials,
        continuing_approvals,
        continuing_denials,
        total_petitions,
        total_approvals,
        total_denials,
        approval_rate
      `, { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.ilike('employer_name', `%${search}%`);
    }

    if (state) {
      query = query.eq('state', state.toUpperCase());
    }

    if (naicsCode) {
      query = query.ilike('naics_code', `${naicsCode}%`);
    }

    if (fiscalYear) {
      query = query.eq('fiscal_year', parseInt(fiscalYear));
    }

    if (minApprovals) {
      query = query.gte('total_approvals', parseInt(minApprovals));
    }

    if (maxApprovalRate) {
      query = query.lte('approval_rate', parseFloat(maxApprovalRate));
    }

    // Sorting
    const validSortColumns = ['total_approvals', 'total_denials', 'approval_rate', 'employer_name', 'fiscal_year', 'total_petitions'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'total_approvals';
    query = query.order(sortColumn, { ascending: sortDir === 'asc' });

    // Pagination
    query = query.range(offset, offset + pageSize - 1);

    const { data, count, error } = await query;

    if (error) {
      console.error('H1B query error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get aggregate stats
    const { data: statsData } = await supabase
      .from('h1b_employer_stats')
      .select('state, total_approvals, total_denials, approval_rate')
      .gte('fiscal_year', 2020)
      .limit(10000);

    const totalApprovals = statsData?.reduce((sum, r) => sum + (r.total_approvals || 0), 0) || 0;
    const totalDenials = statsData?.reduce((sum, r) => sum + (r.total_denials || 0), 0) || 0;
    const rates = statsData?.filter(r => r.approval_rate).map(r => r.approval_rate) || [];
    const avgApprovalRate = rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : 0;

    // Top states
    const stateCounts: Record<string, number> = {};
    statsData?.forEach(r => {
      if (r.state) {
        stateCounts[r.state] = (stateCounts[r.state] || 0) + (r.total_approvals || 0);
      }
    });
    const topStates = Object.entries(stateCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([state, count]) => ({ state, count }));

    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      employers: data || [],
      total,
      page,
      pageSize,
      totalPages,
      stats: {
        totalRecords: total,
        totalApprovals,
        totalDenials,
        avgApprovalRate: Math.round(avgApprovalRate * 10) / 10,
        topStates,
      },
    });
  } catch (error) {
    console.error('H1B API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch H1B employer statistics' },
      { status: 500 }
    );
  }
}
