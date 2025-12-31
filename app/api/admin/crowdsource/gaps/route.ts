import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Simple admin password check for MVP
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'fraudwatch-admin-2024';

function checkAdminAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  const token = authHeader.substring(7);
  return token === ADMIN_PASSWORD;
}

interface CreateGapRequest {
  state_code: string;
  data_type: string;
  category?: string;
  priority?: string;
  difficulty?: string;
  title: string;
  description?: string;
  source_urls?: Array<{ url: string; label: string }>;
  acquisition_method?: string;
  requires_foia?: boolean;
  foia_agency?: string;
  foia_template_key?: string;
  required_fields?: string[];
  optional_fields?: string[];
  estimated_records?: number;
  estimated_value?: string;
  display_order?: number;
}

export async function GET(request: NextRequest) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const includeInactive = searchParams.get('includeInactive') === 'true';

  try {
    let query = supabase
      .from('state_data_gaps')
      .select('*', { count: 'exact' });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    query = query.order('state_code', { ascending: true })
      .order('priority', { ascending: true })
      .order('display_order', { ascending: true });

    const { data: gaps, error, count } = await query;

    if (error) {
      console.error('Error fetching gaps:', error);
      return NextResponse.json(
        { error: 'Failed to fetch gaps' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      gaps: gaps || [],
      total: count || 0,
    });
  } catch (error) {
    console.error('Admin gaps API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const body: CreateGapRequest = await request.json();

  // Validate required fields
  if (!body.state_code || !body.data_type || !body.title) {
    return NextResponse.json(
      { error: 'Missing required fields: state_code, data_type, and title are required' },
      { status: 400 }
    );
  }

  try {
    // Check for duplicate
    const { data: existing } = await supabase
      .from('state_data_gaps')
      .select('id')
      .eq('state_code', body.state_code.toUpperCase())
      .eq('data_type', body.data_type)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'A gap already exists for this state and data type' },
        { status: 409 }
      );
    }

    const gapData: Record<string, unknown> = {
      state_code: body.state_code.toUpperCase(),
      data_type: body.data_type,
      title: body.title,
      category: body.category || null,
      priority: body.priority || 'medium',
      difficulty: body.difficulty || 'medium',
      description: body.description || null,
      source_urls: body.source_urls || [],
      acquisition_method: body.acquisition_method || null,
      requires_foia: body.requires_foia || false,
      foia_agency: body.foia_agency || null,
      foia_template_key: body.foia_template_key || null,
      required_fields: body.required_fields || [],
      optional_fields: body.optional_fields || [],
      estimated_records: body.estimated_records || null,
      estimated_value: body.estimated_value || null,
      display_order: body.display_order || 0,
      status: 'needed',
      is_active: true,
    };

    const { data: gap, error } = await supabase
      .from('state_data_gaps')
      .insert(gapData)
      .select()
      .single();

    if (error) {
      console.error('Error creating gap:', error);
      return NextResponse.json(
        { error: 'Failed to create gap' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      gap,
    });
  } catch (error) {
    console.error('Create gap error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

