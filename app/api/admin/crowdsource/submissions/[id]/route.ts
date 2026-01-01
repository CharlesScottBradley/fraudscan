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

// Points awarded on approval
const APPROVAL_POINTS: Record<string, number> = {
  file_upload: 20,
  tip: 20,
  lead: 20,
  connection: 30,
  document: 20,
};

// Additional points for specific achievements
const ACHIEVEMENT_POINTS = {
  CRITICAL_GAP: 200,
  FOIA_DATA: 100,
  FIRST_STATE_SUBMISSION: 25,
};

interface UpdateRequest {
  status?: 'pending' | 'under_review' | 'approved' | 'rejected' | 'imported';
  review_notes?: string;
  rejection_reason?: string;
  records_imported?: number;
  admin_username?: string;
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
    const { data: submission, error } = await supabase
      .from('crowdsource_submissions')
      .select(`
        *,
        contributor:crowdsource_contributors(id, username, email, points, rank)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Submission not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    // Get related gaps if any
    let relatedGaps = null;
    if (submission.gap_ids && submission.gap_ids.length > 0) {
      const { data: gaps } = await supabase
        .from('state_data_gaps')
        .select('id, title, priority, status')
        .in('id', submission.gap_ids);
      relatedGaps = gaps;
    }

    // Generate signed URL for file if present
    let fileUrl = null;
    if (submission.file_path) {
      const { data: signedUrl } = await supabase.storage
        .from('crowdsource')
        .createSignedUrl(submission.file_path, 3600); // 1 hour expiry
      fileUrl = signedUrl?.signedUrl;
    }

    return NextResponse.json({
      ...submission,
      related_gaps: relatedGaps,
      file_url: fileUrl,
    });
  } catch (error) {
    console.error('Error fetching submission:', error);
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
  const body: UpdateRequest = await request.json();

  try {
    // Fetch current submission
    const { data: submission, error: fetchError } = await supabase
      .from('crowdsource_submissions')
      .select('*, contributor:crowdsource_contributors(*)')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Submission not found' },
          { status: 404 }
        );
      }
      throw fetchError;
    }

    const previousStatus = submission.status;
    const newStatus = body.status;

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.status) {
      updateData.status = body.status;
    }

    if (body.review_notes !== undefined) {
      updateData.review_notes = body.review_notes;
    }

    if (body.rejection_reason !== undefined) {
      updateData.rejection_reason = body.rejection_reason;
    }

    if (body.records_imported !== undefined) {
      updateData.records_imported = body.records_imported;
      updateData.imported_at = new Date().toISOString();
    }

    // Set reviewed fields if status is changing from pending
    if (newStatus && newStatus !== 'pending' && previousStatus === 'pending') {
      updateData.reviewed_at = new Date().toISOString();
      updateData.reviewed_by = body.admin_username || 'admin';
    }

    // Update submission
    const { data: updatedSubmission, error: updateError } = await supabase
      .from('crowdsource_submissions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Handle approval - award points and badges
    if (newStatus === 'approved' && previousStatus !== 'approved' && submission.contributor_id) {
      const basePoints = APPROVAL_POINTS[submission.submission_type] || 20;
      let bonusPoints = 0;

      // Check for additional achievements
      if (submission.gap_ids && submission.gap_ids.length > 0) {
        // Check if any gaps are critical or require FOIA
        const { data: gaps } = await supabase
          .from('state_data_gaps')
          .select('id, priority, requires_foia')
          .in('id', submission.gap_ids);

        if (gaps?.some(g => g.priority === 'critical')) {
          bonusPoints += ACHIEVEMENT_POINTS.CRITICAL_GAP;
        }
        if (gaps?.some(g => g.requires_foia)) {
          bonusPoints += ACHIEVEMENT_POINTS.FOIA_DATA;
        }
      }

      // Check if first submission for this state by this contributor
      const { count: stateSubmissions } = await supabase
        .from('crowdsource_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('contributor_id', submission.contributor_id)
        .eq('state_code', submission.state_code)
        .eq('status', 'approved')
        .neq('id', id); // Exclude current submission

      const isFirstState = (stateSubmissions || 0) === 0;

      // Use database function to handle points, rank, and badges atomically
      await supabase.rpc('update_contributor_on_approval', {
        p_contributor_id: submission.contributor_id,
        p_base_points: basePoints,
        p_bonus_points: bonusPoints,
        p_is_first_state: isFirstState,
      });

      // Update gap submission counts
      if (submission.gap_ids && submission.gap_ids.length > 0) {
        for (const gapId of submission.gap_ids) {
          const { data: gap } = await supabase
            .from('state_data_gaps')
            .select('submissions_count')
            .eq('id', gapId)
            .single();

          if (gap) {
            await supabase
              .from('state_data_gaps')
              .update({
                submissions_count: (gap.submissions_count || 0) + 1,
                last_submission_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq('id', gapId);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      submission: updatedSubmission,
    });
  } catch (error) {
    console.error('Error updating submission:', error);
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
    // Fetch submission to get file path
    const { data: submission, error: fetchError } = await supabase
      .from('crowdsource_submissions')
      .select('file_path')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Submission not found' },
          { status: 404 }
        );
      }
      throw fetchError;
    }

    // Delete file from storage if present
    if (submission.file_path) {
      await supabase.storage.from('crowdsource').remove([submission.file_path]);
    }

    // Delete submission
    const { error: deleteError } = await supabase
      .from('crowdsource_submissions')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({
      success: true,
      message: 'Submission deleted',
    });
  } catch (error) {
    console.error('Error deleting submission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

