import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdminAuth, unauthorizedResponse } from '@/lib/adminAuth';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * GET /api/admin/emails
 * List emails from the inbox with filtering and pagination
 */
export async function GET(request: NextRequest) {
  const auth = verifyAdminAuth(request);
  if (!auth.authorized) {
    return unauthorizedResponse(auth);
  }

  const supabase = getSupabase();

  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '25', 10);
  const status = searchParams.get('status') || '';
  const category = searchParams.get('category') || '';
  const includeSpam = searchParams.get('includeSpam') === 'true';

  const offset = (page - 1) * pageSize;

  try {
    let query = supabase
      .from('email_inbox')
      .select('*', { count: 'exact' });

    // Filter out spam by default
    if (!includeSpam) {
      query = query.eq('is_spam', false);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (category) {
      query = query.eq('category', category);
    }

    query = query
      .order('received_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    const { data: emails, error, count } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch emails' }, { status: 500 });
    }

    // Get stats
    const { data: statsData } = await supabase
      .from('email_inbox')
      .select('status, is_spam, category');

    const stats = {
      total: statsData?.length || 0,
      new: statsData?.filter(e => e.status === 'new' && !e.is_spam).length || 0,
      reviewed: statsData?.filter(e => e.status === 'reviewed').length || 0,
      responded: statsData?.filter(e => e.status === 'responded').length || 0,
      spam: statsData?.filter(e => e.is_spam).length || 0,
      byCategory: {
        contact: statsData?.filter(e => e.category === 'contact').length || 0,
        inquiry: statsData?.filter(e => e.category === 'inquiry').length || 0,
        tip: statsData?.filter(e => e.category === 'tip').length || 0,
        media: statsData?.filter(e => e.category === 'media').length || 0,
        legal: statsData?.filter(e => e.category === 'legal').length || 0,
        other: statsData?.filter(e => e.category === 'other').length || 0,
      }
    };

    return NextResponse.json({
      emails,
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
      stats
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
