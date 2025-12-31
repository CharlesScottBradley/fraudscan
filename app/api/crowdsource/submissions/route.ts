import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export interface CrowdsourceSubmission {
  id: string;
  state_code: string;
  data_type: string;
  gap_ids: string[];
  submission_type: string;
  tip_category: string | null;
  title: string;
  description: string | null;
  source_url: string | null;
  file_name: string | null;
  file_type: string | null;
  file_size: number | null;
  status: string;
  is_public: boolean;
  created_at: string;
  contributor?: {
    username: string | null;
  };
}

export interface SubmissionsResponse {
  submissions: CrowdsourceSubmission[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Pagination
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '20'), 50);
  const offset = (page - 1) * pageSize;

  // Filters
  const state = searchParams.get('state');
  const status = searchParams.get('status');
  const dataType = searchParams.get('dataType');
  const submissionType = searchParams.get('submissionType');

  try {
    let query = supabase
      .from('crowdsource_submissions')
      .select(`
        id,
        state_code,
        data_type,
        gap_ids,
        submission_type,
        tip_category,
        title,
        description,
        source_url,
        file_name,
        file_type,
        file_size,
        status,
        is_public,
        created_at,
        contributor:crowdsource_contributors(username)
      `, { count: 'exact' })
      .eq('is_public', true);

    // Apply filters
    if (state) {
      query = query.eq('state_code', state.toUpperCase());
    }

    if (status) {
      query = query.eq('status', status);
    } else {
      // Default to showing only approved submissions publicly
      query = query.eq('status', 'approved');
    }

    if (dataType) {
      query = query.eq('data_type', dataType);
    }

    if (submissionType) {
      query = query.eq('submission_type', submissionType);
    }

    // Order by most recent first
    query = query.order('created_at', { ascending: false });

    // Pagination
    query = query.range(offset, offset + pageSize - 1);

    const { data: rawSubmissions, error, count } = await query;

    if (error) {
      console.error('Error fetching submissions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch submissions' },
        { status: 500 }
      );
    }

    // Transform submissions to handle Supabase join format
    const submissions: CrowdsourceSubmission[] = (rawSubmissions || []).map((s) => {
      // Supabase returns joined data as an object (single) or array (multiple)
      const contributor = Array.isArray(s.contributor)
        ? s.contributor[0]
        : s.contributor;
      return {
        ...s,
        contributor: contributor ? { username: contributor.username } : undefined,
      };
    });

    const response: SubmissionsResponse = {
      submissions,
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Submissions API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

