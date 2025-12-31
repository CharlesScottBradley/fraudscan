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

interface UpdateGapRequest {
  status?: string;
  priority?: string;
  difficulty?: string;
  title?: string;
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
  is_active?: boolean;
  notes?: string;
  completed_by?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const { id } = await params;

  try {
    const { data: gap, error } = await supabase
      .from('state_data_gaps')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Gap not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    // Get related submissions
    const { data: submissions } = await supabase
      .from('crowdsource_submissions')
      .select('id, title, status, created_at, contributor:crowdsource_contributors(username)')
      .contains('gap_ids', [id])
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      ...gap,
      submissions: submissions || [],
    });
  } catch (error) {
    console.error('Error fetching gap:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const { id } = await params;
  const body: UpdateGapRequest = await request.json();

  try {
    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // Copy allowed fields
    const allowedFields = [
      'status', 'priority', 'difficulty', 'title', 'description',
      'source_urls', 'acquisition_method', 'requires_foia', 'foia_agency',
      'foia_template_key', 'required_fields', 'optional_fields',
      'estimated_records', 'estimated_value', 'display_order', 'is_active', 'notes'
    ];

    allowedFields.forEach(field => {
      if (body[field as keyof UpdateGapRequest] !== undefined) {
        updateData[field] = body[field as keyof UpdateGapRequest];
      }
    });

    // Handle completion
    if (body.status === 'complete') {
      updateData.completed_at = new Date().toISOString();
      if (body.completed_by) {
        updateData.completed_by = body.completed_by;
      }
    } else if (body.status && body.status !== 'complete') {
      // Clear completion if status changed away from complete
      updateData.completed_at = null;
      updateData.completed_by = null;
    }

    const { data: gap, error } = await supabase
      .from('state_data_gaps')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Gap not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      gap,
    });
  } catch (error) {
    console.error('Error updating gap:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const { id } = await params;

  try {
    // Soft delete - just mark as inactive
    const { error } = await supabase
      .from('state_data_gaps')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Gap deactivated',
    });
  } catch (error) {
    console.error('Error deleting gap:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

