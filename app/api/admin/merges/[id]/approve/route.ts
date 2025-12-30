import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: candidateId } = await params;

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
      return NextResponse.json({ error: 'Only pending candidates can be approved' }, { status: 400 });
    }

    // Get both organizations to determine which is older
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('id, created_at, legal_name')
      .in('id', [candidate.org_id_1, candidate.org_id_2]);

    if (orgsError || !orgs || orgs.length !== 2) {
      return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 });
    }

    // Keep the older org, merge the newer one
    const org1 = orgs.find(o => o.id === candidate.org_id_1);
    const org2 = orgs.find(o => o.id === candidate.org_id_2);

    if (!org1 || !org2) {
      return NextResponse.json({ error: 'Organizations not found' }, { status: 404 });
    }

    const org1Date = new Date(org1.created_at);
    const org2Date = new Date(org2.created_at);

    const keepOrgId = org1Date <= org2Date ? org1.id : org2.id;
    const mergeOrgId = org1Date <= org2Date ? org2.id : org1.id;

    // Call the merge_organizations function
    const { data: mergeResult, error: mergeError } = await supabase.rpc('merge_organizations', {
      p_keep_org_id: keepOrgId,
      p_merge_org_id: mergeOrgId,
      p_merge_reason: `Admin approval: ${candidate.match_reason}`,
      p_merged_by: 'admin',
    });

    if (mergeError) {
      console.error('Merge error:', mergeError);
      return NextResponse.json({ error: 'Failed to merge organizations' }, { status: 500 });
    }

    // The merge_organizations function already updates the candidate status to 'auto_merged'
    // But we'll also update reviewed_by and reviewed_at
    await supabase
      .from('organization_merge_candidates')
      .update({
        reviewed_by: 'admin',
        reviewed_at: new Date().toISOString(),
        status: 'approved',
      })
      .eq('id', candidateId);

    return NextResponse.json({
      success: true,
      message: 'Organizations merged successfully',
      result: mergeResult,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
