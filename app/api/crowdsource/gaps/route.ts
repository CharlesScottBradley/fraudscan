import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export interface StateDataGap {
  id: string;
  state_code: string;
  data_type: string;
  category: string | null;
  priority: string;
  difficulty: string;
  status: string;
  estimated_records: number | null;
  estimated_value: string | null;
  title: string;
  description: string | null;
  source_urls: Array<{ url: string; label: string }>;
  acquisition_method: string | null;
  requires_foia: boolean;
  foia_agency: string | null;
  foia_template_key: string | null;
  required_fields: string[];
  optional_fields: string[];
  submissions_count: number;
  last_submission_at: string | null;
  completed_at: string | null;
  completed_by: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface GapsResponse {
  gaps: StateDataGap[];
  total: number;
  stats: {
    totalGaps: number;
    completedGaps: number;
    criticalGaps: number;
    foiaRequired: number;
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Filters
  const state = searchParams.get('state');
  const priority = searchParams.get('priority');
  const status = searchParams.get('status');
  const category = searchParams.get('category');
  const difficulty = searchParams.get('difficulty');
  const limit = searchParams.get('limit');

  try {
    let query = supabase
      .from('state_data_gaps')
      .select('*', { count: 'exact' })
      .eq('is_active', true);

    // Apply filters
    if (state) {
      query = query.eq('state_code', state.toUpperCase());
    }

    if (priority) {
      query = query.eq('priority', priority);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }

    // Order by priority (critical first), then display_order
    query = query.order('priority', { ascending: true })
      .order('display_order', { ascending: true });

    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const { data: gaps, error, count } = await query;

    if (error) {
      console.error('Error fetching gaps:', error);
      return NextResponse.json(
        { error: 'Failed to fetch data gaps' },
        { status: 500 }
      );
    }

    // Calculate stats
    const totalGaps = gaps?.length || 0;
    const completedGaps = gaps?.filter(g => g.status === 'complete').length || 0;
    const criticalGaps = gaps?.filter(g => g.priority === 'critical' && g.status !== 'complete').length || 0;
    const foiaRequired = gaps?.filter(g => g.requires_foia && g.status !== 'complete').length || 0;

    const response: GapsResponse = {
      gaps: gaps || [],
      total: count || 0,
      stats: {
        totalGaps,
        completedGaps,
        criticalGaps,
        foiaRequired,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Gaps API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

