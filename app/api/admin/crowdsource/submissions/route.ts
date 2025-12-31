import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Simple admin password check for MVP
// TODO: Replace with Supabase Auth
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'fraudwatch-admin-2024';

function checkAdminAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  const token = authHeader.substring(7);
  return token === ADMIN_PASSWORD;
}

export interface AdminSubmission {
  id: string;
  state_code: string;
  data_type: string;
  gap_ids: string[];
  submission_type: string;
  tip_category: string | null;
  title: string;
  description: string | null;
  tip_content: string | null;
  related_entities: Array<{ type: string; name: string; role?: string }>;
  source_url: string | null;
  source_description: string | null;
  file_path: string | null;
  file_name: string | null;
  file_size: number | null;
  file_type: string | null;
  submitter_email: string;
  submitter_ip: string | null;
  status: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_notes: string | null;
  rejection_reason: string | null;
  imported_at: string | null;
  records_imported: number | null;
  is_public: boolean;
  created_at: string;
  contributor?: {
    id: string;
    username: string | null;
    email: string | null;
  };
}

export interface AdminSubmissionsResponse {
  submissions: AdminSubmission[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  stats: {
    pending: number;
    under_review: number;
    approved: number;
    rejected: number;
  };
}

export async function GET(request: NextRequest) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);

  // Pagination
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '20'), 100);
  const offset = (page - 1) * pageSize;

  // Filters
  const status = searchParams.get('status');
  const state = searchParams.get('state');
  const submissionType = searchParams.get('submissionType');

  try {
    let query = supabase
      .from('crowdsource_submissions')
      .select(`
        *,
        contributor:crowdsource_contributors(id, username, email)
      `, { count: 'exact' });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (state) {
      query = query.eq('state_code', state.toUpperCase());
    }

    if (submissionType) {
      query = query.eq('submission_type', submissionType);
    }

    // Order by most recent first
    query = query.order('created_at', { ascending: false });

    // Pagination
    query = query.range(offset, offset + pageSize - 1);

    const { data: submissions, error, count } = await query;

    if (error) {
      console.error('Error fetching admin submissions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch submissions' },
        { status: 500 }
      );
    }

    // Get status counts
    const { data: statusCounts } = await supabase
      .from('crowdsource_submissions')
      .select('status')
      .then(result => {
        const counts = { pending: 0, under_review: 0, approved: 0, rejected: 0 };
        (result.data || []).forEach(s => {
          if (s.status in counts) {
            counts[s.status as keyof typeof counts]++;
          }
        });
        return { data: counts };
      });

    const response: AdminSubmissionsResponse = {
      submissions: submissions || [],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
      stats: statusCounts || { pending: 0, under_review: 0, approved: 0, rejected: 0 },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Admin submissions API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

