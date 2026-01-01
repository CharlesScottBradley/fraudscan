import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export interface FraudCase {
  id: string;
  case_number: string | null;
  case_name: string;
  court: string | null;
  state: string | null;
  fraud_type: string | null;
  fraud_types: string[] | null;
  total_fraud_amount: number | null;
  total_restitution: number | null;
  status: string;
  date_sentenced: string | null;
  date_convicted: string | null;
  date_indicted: string | null;
  date_charged: string | null;
  doj_press_url: string | null;
  summary: string | null;
  created_at: string;
}

export interface CasesSearchResponse {
  data: FraudCase[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  stats: {
    totalAmount: number;
    convictedCount: number;
    sentencedCount: number;
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
  const status = searchParams.get('status');
  const fraudType = searchParams.get('fraudType');
  const minAmount = searchParams.get('minAmount');
  const maxAmount = searchParams.get('maxAmount');
  const sortBy = searchParams.get('sortBy') || 'total_fraud_amount';
  const sortDir = searchParams.get('sortDir') || 'desc';

  try {
    // Build query
    let query = supabase
      .from('cases')
      .select(`
        id,
        case_number,
        case_name,
        court,
        state,
        fraud_type,
        fraud_types,
        total_fraud_amount,
        total_restitution,
        status,
        date_sentenced,
        date_convicted,
        date_indicted,
        date_charged,
        doj_press_url,
        summary,
        created_at
      `, { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.or(`case_name.ilike.%${search}%,case_number.ilike.%${search}%,summary.ilike.%${search}%`);
    }

    if (state) {
      query = query.eq('state', state.toUpperCase());
    }

    if (status) {
      query = query.eq('status', status.toLowerCase());
    }

    if (fraudType) {
      // Check both fraud_type (single) and fraud_types (array)
      query = query.or(`fraud_type.ilike.%${fraudType}%,fraud_types.cs.{${fraudType}}`);
    }

    if (minAmount) {
      query = query.gte('total_fraud_amount', parseFloat(minAmount));
    }

    if (maxAmount) {
      query = query.lte('total_fraud_amount', parseFloat(maxAmount));
    }

    // Sorting
    const validSortColumns = ['total_fraud_amount', 'date_sentenced', 'date_indicted', 'case_name', 'created_at'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'total_fraud_amount';
    query = query.order(sortColumn, { ascending: sortDir === 'asc', nullsFirst: false });

    // Pagination
    query = query.range(offset, offset + pageSize - 1);

    const { data: cases, error, count } = await query;

    if (error) {
      console.error('Cases query error:', error);
      throw error;
    }

    // Calculate stats from current page
    let totalAmount = 0;
    let convictedCount = 0;
    let sentencedCount = 0;

    (cases || []).forEach((c) => {
      totalAmount += c.total_fraud_amount || 0;
      if (c.status === 'convicted') convictedCount++;
      if (c.status === 'sentenced') sentencedCount++;
    });

    const response: CasesSearchResponse = {
      data: cases || [],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
      stats: {
        totalAmount,
        convictedCount,
        sentencedCount,
      },
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Cases API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cases' },
      { status: 500 }
    );
  }
}
