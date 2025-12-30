import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: candidateId } = await params;
    const body = await request.json();
    const notes = body.notes || '';

    // Get the merge candidate
    const { data: candidate, error: fetchError } = await supabase
      .from('organization_merge_candidates')
      .select('*')
      .eq('id', candidateId)
      .single();

    if (fetchError || !candidate) {
      return NextResponse.json({ error: 'Merge candidate not found' }, { status: 404 });
    }

    if (candidate.status !== 'pending') {
      return NextResponse.json({ error: 'Only pending candidates can be rejected' }, { status: 400 });
    }

    // Update status to rejected
    const { error: updateError } = await supabase
      .from('organization_merge_candidates')
      .update({
        status: 'rejected',
        reviewed_by: 'admin',
        reviewed_at: new Date().toISOString(),
        review_notes: notes,
      })
      .eq('id', candidateId);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({ error: 'Failed to reject merge candidate' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Merge candidate rejected',
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
