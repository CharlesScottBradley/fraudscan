import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '50'), 100);
    const search = searchParams.get('search') || '';
    const state = searchParams.get('state') || '';
    const storeType = searchParams.get('storeType') || '';
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const sortBy = searchParams.get('sortBy') || 'store_name';
    const sortDir = searchParams.get('sortDir') === 'asc' ? true : false;

    const offset = (page - 1) * pageSize;

    let query = supabase
      .from('snap_retailers')
      .select('*', { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.or(`store_name.ilike.%${search}%,address.ilike.%${search}%,city.ilike.%${search}%`);
    }

    if (state) {
      query = query.eq('state', state.toUpperCase());
    }

    if (storeType) {
      query = query.eq('store_type', storeType);
    }

    if (activeOnly) {
      query = query.eq('is_currently_authorized', true);
    }

    // Apply sorting
    const validSortFields = ['store_name', 'city', 'state', 'store_type', 'authorization_date'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'store_name';
    query = query.order(sortField, { ascending: sortDir });

    // Apply pagination
    query = query.range(offset, offset + pageSize - 1);

    const { data, count, error } = await query;

    if (error) {
      console.error('SNAP query error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({
      retailers: data || [],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    });
  } catch (error) {
    console.error('SNAP API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
