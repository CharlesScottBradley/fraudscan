import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Pagination
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '25', 10);
    const offset = (page - 1) * pageSize;

    // Filters
    const minConfidence = parseFloat(searchParams.get('minConfidence') || '0');
    const state = searchParams.get('state') || '';
    const status = searchParams.get('status') || 'pending';

    // Build query
    let query = supabase
      .from('organization_merge_candidates')
      .select(`
        id,
        org_id_1,
        org_id_2,
        confidence_score,
        match_reason,
        name_similarity,
        same_state,
        same_city,
        same_zip,
        status,
        created_at,
        org1:organizations!organization_merge_candidates_org_id_1_fkey(
          id,
          legal_name,
          address,
          city,
          state,
          zip_code,
          total_government_funding,
          created_at
        ),
        org2:organizations!organization_merge_candidates_org_id_2_fkey(
          id,
          legal_name,
          address,
          city,
          state,
          zip_code,
          total_government_funding,
          created_at
        )
      `, { count: 'exact' });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (minConfidence > 0) {
      query = query.gte('confidence_score', minConfidence);
    }

    // Note: State filter requires checking both orgs - handled client-side or via RPC

    // Apply pagination and sorting
    query = query
      .order('confidence_score', { ascending: false })
      .range(offset, offset + pageSize - 1);

    const { data: candidates, error, count } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch merge candidates' }, { status: 500 });
    }

    // Filter by state if specified (client-side filter since it involves both orgs)
    let filteredCandidates = candidates || [];
    if (state) {
      filteredCandidates = filteredCandidates.filter(c =>
        (c.org1 as any)?.state === state || (c.org2 as any)?.state === state
      );
    }

    // Get stats
    const { data: statsData } = await supabase
      .from('organization_merge_candidates')
      .select('status');

    const stats = {
      pending: statsData?.filter(s => s.status === 'pending').length || 0,
      approved: statsData?.filter(s => s.status === 'approved').length || 0,
      rejected: statsData?.filter(s => s.status === 'rejected').length || 0,
      auto_merged: statsData?.filter(s => s.status === 'auto_merged').length || 0,
    };

    return NextResponse.json({
      candidates: filteredCandidates,
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
      stats,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
