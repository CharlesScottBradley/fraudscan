import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ein: string }> }
) {
  try {
    const { ein } = await params;

    // Clean EIN (remove dashes if present)
    const cleanEin = ein.replace(/-/g, '');

    // Get nonprofit details
    const { data: nonprofit, error } = await supabase
      .from('nonprofits')
      .select('*')
      .or(`ein.eq.${cleanEin},ein_formatted.eq.${ein}`)
      .single();

    if (error || !nonprofit) {
      return NextResponse.json({ error: 'Nonprofit not found' }, { status: 404 });
    }

    // If linked to an organization, get related funding data
    let linkedFunding = null;
    if (nonprofit.organization_id) {
      const [pppResult, grantsResult] = await Promise.all([
        supabase
          .from('ppp_loans')
          .select('loan_number, borrower_name, current_approval_amount, forgiveness_amount, date_approved')
          .eq('organization_id', nonprofit.organization_id)
          .limit(10),
        supabase
          .from('federal_grants')
          .select('award_id, recipient_name, award_amount, awarding_agency, cfda_title')
          .eq('recipient_ein', cleanEin)
          .limit(10),
      ]);

      linkedFunding = {
        ppp: pppResult.data || [],
        grants: grantsResult.data || [],
      };
    } else {
      // Try to find grants by EIN even without org link
      const { data: grants } = await supabase
        .from('federal_grants')
        .select('award_id, recipient_name, award_amount, awarding_agency, cfda_title')
        .eq('recipient_ein', cleanEin)
        .limit(10);

      linkedFunding = {
        ppp: [],
        grants: grants || [],
      };
    }

    return NextResponse.json({
      nonprofit,
      linkedFunding,
    });
  } catch (error) {
    console.error('Nonprofit detail API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
