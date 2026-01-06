import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { data: loan, error } = await supabase
      .from('sba_loans')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'SBA loan not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    // Get other loans from the same borrower
    let relatedLoans: unknown[] = [];
    if (loan.borrower_name) {
      const { data: related } = await supabase
        .from('sba_loans')
        .select('id, sba_loan_number, borrower_name, gross_approval, loan_program, approval_date')
        .ilike('borrower_name', loan.borrower_name)
        .neq('id', id)
        .order('gross_approval', { ascending: false })
        .limit(5);

      relatedLoans = related || [];
    }

    // Get organization if linked
    let organization = null;
    if (loan.organization_id) {
      const { data: org } = await supabase
        .from('organizations')
        .select('id, name, address, city, state, zip, total_government_funding, ppp_loan_count, eidl_loan_count')
        .eq('id', loan.organization_id)
        .single();

      organization = org;
    }

    // Check for PPP loans from same borrower (potential double-dipping)
    let pppLoans: unknown[] = [];
    if (loan.borrower_name) {
      const { data: ppp } = await supabase
        .from('ppp_loans')
        .select('id, borrower_name, initial_approval_amount, forgiveness_amount, date_approved')
        .ilike('borrower_name', `%${loan.borrower_name.substring(0, 30)}%`)
        .eq('borrower_state', loan.borrower_state)
        .limit(5);

      pppLoans = ppp || [];
    }

    return NextResponse.json({
      loan,
      relatedLoans,
      organization,
      pppLoans
    });

  } catch (error) {
    console.error('SBA loan detail API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SBA loan details' },
      { status: 500 }
    );
  }
}
