import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '50'), 100);
    const search = searchParams.get('search') || '';
    const state = searchParams.get('state') || '';
    const subsection = searchParams.get('subsection') || '';
    const nteeCode = searchParams.get('nteeCode') || '';
    const minAssets = searchParams.get('minAssets') ? parseInt(searchParams.get('minAssets')!) : null;
    const maxAssets = searchParams.get('maxAssets') ? parseInt(searchParams.get('maxAssets')!) : null;
    const minIncome = searchParams.get('minIncome') ? parseInt(searchParams.get('minIncome')!) : null;
    const maxIncome = searchParams.get('maxIncome') ? parseInt(searchParams.get('maxIncome')!) : null;
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortDir = searchParams.get('sortDir') === 'asc' ? true : false;

    const offset = (page - 1) * pageSize;

    let query = supabase
      .from('nonprofits')
      .select(`
        id,
        ein,
        ein_formatted,
        name,
        city,
        state,
        zip,
        subsection,
        subsection_desc,
        ruling_date,
        deductibility_desc,
        foundation_desc,
        status_desc,
        asset_amount,
        income_amount,
        revenue_amount,
        ntee_code,
        ntee_desc,
        organization_id
      `, { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,ein.ilike.%${search}%,city.ilike.%${search}%`);
    }

    if (state) {
      query = query.eq('state', state.toUpperCase());
    }

    if (subsection) {
      query = query.eq('subsection', subsection);
    }

    if (nteeCode) {
      query = query.ilike('ntee_code', `${nteeCode}%`);
    }

    if (minAssets !== null) {
      query = query.gte('asset_amount', minAssets);
    }

    if (maxAssets !== null) {
      query = query.lte('asset_amount', maxAssets);
    }

    if (minIncome !== null) {
      query = query.gte('income_amount', minIncome);
    }

    if (maxIncome !== null) {
      query = query.lte('income_amount', maxIncome);
    }

    // Apply sorting
    const validSortFields = ['name', 'city', 'state', 'asset_amount', 'income_amount', 'ruling_date'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'name';
    query = query.order(sortField, { ascending: sortDir, nullsFirst: false });

    // Apply pagination
    query = query.range(offset, offset + pageSize - 1);

    const { data, count, error } = await query;

    if (error) {
      console.error('Nonprofits query error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({
      nonprofits: data || [],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    });
  } catch (error) {
    console.error('Nonprofits API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
