import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export interface H1BFraudFlag {
  id: string;
  employer_name: string;
  employer_name_normalized: string;
  state: string | null;
  flag_type: string;
  flag_reason: string;
  severity: string;
  evidence: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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
  const flagType = searchParams.get('flagType');
  const severity = searchParams.get('severity');
  const activeOnly = searchParams.get('activeOnly') !== 'false';

  const sortBy = searchParams.get('sortBy') || 'created_at';
  const sortDir = searchParams.get('sortDir') || 'desc';

  try {
    let query = supabase
      .from('h1b_fraud_flags')
      .select(`
        id,
        employer_name,
        employer_name_normalized,
        state,
        flag_type,
        flag_reason,
        severity,
        evidence,
        is_active,
        created_at,
        updated_at
      `, { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.ilike('employer_name', `%${search}%`);
    }

    if (state) {
      query = query.eq('state', state.toUpperCase());
    }

    if (flagType) {
      query = query.eq('flag_type', flagType);
    }

    if (severity) {
      query = query.eq('severity', severity);
    }

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    // Sorting
    const validSortColumns = ['created_at', 'employer_name', 'flag_type', 'severity'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    query = query.order(sortColumn, { ascending: sortDir === 'asc' });

    // Pagination
    query = query.range(offset, offset + pageSize - 1);

    const { data, count, error } = await query;

    if (error) {
      console.error('H1B flags query error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get stats by flag type and severity
    const { data: allFlags } = await supabase
      .from('h1b_fraud_flags')
      .select('flag_type, severity, is_active')
      .eq('is_active', true);

    const byFlagType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};

    allFlags?.forEach(f => {
      byFlagType[f.flag_type] = (byFlagType[f.flag_type] || 0) + 1;
      bySeverity[f.severity] = (bySeverity[f.severity] || 0) + 1;
    });

    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      flags: data || [],
      total,
      page,
      pageSize,
      totalPages,
      stats: {
        totalFlags: allFlags?.length || 0,
        byFlagType: Object.entries(byFlagType).map(([type, count]) => ({ type, count })),
        bySeverity: Object.entries(bySeverity).map(([severity, count]) => ({ severity, count })),
      },
    });
  } catch (error) {
    console.error('H1B flags API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch H1B fraud flags' },
      { status: 500 }
    );
  }
}
