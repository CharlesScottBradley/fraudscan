import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/budgets/extract?status=pending - Get extraction status
// Note: Actual extraction is handled by external workers on Dokploy
export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  try {
    let query = supabase
      .from('budget_documents')
      .select('id, title, jurisdiction_id, extraction_status, extraction_confidence, extracted_at, extraction_error', { count: 'exact' });

    if (status) {
      if (status === 'pending') {
        query = query.or('extraction_status.is.null,extraction_status.eq.pending');
      } else {
        query = query.eq('extraction_status', status);
      }
    }

    query = query.order('id', { ascending: true }).limit(100);

    const { data, count, error } = await query;

    if (error) {
      throw error;
    }

    // Get stats
    const { data: stats } = await supabase
      .from('budget_documents')
      .select('extraction_status')
      .not('extraction_status', 'is', null);

    const statusCounts: Record<string, number> = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0
    };

    stats?.forEach(s => {
      if (s.extraction_status && statusCounts[s.extraction_status] !== undefined) {
        statusCounts[s.extraction_status]++;
      }
    });

    // Count nulls as pending
    const { count: nullCount } = await supabase
      .from('budget_documents')
      .select('id', { count: 'exact', head: true })
      .is('extraction_status', null);

    statusCounts.pending += nullCount || 0;

    return NextResponse.json({
      documents: data,
      total: count,
      stats: statusCounts
    });

  } catch (error) {
    console.error('Budget extraction status error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch extraction status' },
      { status: 500 }
    );
  }
}
