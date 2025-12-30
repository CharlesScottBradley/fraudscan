import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const VALID_STATES = ['MN', 'OH', 'WA'];

function formatCSVValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function arrayToCSV(data: Record<string, unknown>[], columns: string[]): string {
  const header = columns.join(',');
  const rows = data.map(row => 
    columns.map(col => formatCSVValue(row[col])).join(',')
  );
  return [header, ...rows].join('\n');
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ state: string }> }
) {
  const { state } = await params;
  const stateCode = state.toUpperCase();
  
  if (!VALID_STATES.includes(stateCode)) {
    return NextResponse.json({ error: 'Invalid state' }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const dataType = searchParams.get('type') || 'summary';

  try {
    if (dataType === 'ppp') {
      // Export PPP loans
      const { data: pppLoans, error } = await supabase
        .from('ppp_loans')
        .select('loan_number, borrower_name, borrower_city, borrower_zip, naics_code, business_type, initial_approval_amount, jobs_reported, date_approved, lender, is_flagged, fraud_score, race, ethnicity, gender, veteran')
        .eq('borrower_state', stateCode)
        .order('initial_approval_amount', { ascending: false })
        .limit(10000);

      if (error) throw error;

      const columns = ['loan_number', 'borrower_name', 'borrower_city', 'borrower_zip', 'naics_code', 'business_type', 'initial_approval_amount', 'jobs_reported', 'date_approved', 'lender', 'is_flagged', 'fraud_score', 'race', 'ethnicity', 'gender', 'veteran'];
      const csv = arrayToCSV(pppLoans || [], columns);

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${stateCode}_ppp_loans.csv"`,
        },
      });
    }

    if (dataType === 'eidl') {
      // Export EIDL loans
      const { data: eidlLoans, error } = await supabase
        .from('eidl_loans')
        .select('sba_loan_number, borrower_name, borrower_city, borrower_zip, naics_code, business_type, loan_amount, jobs_supported, date_approved, is_flagged, fraud_score, ppp_loan_id')
        .eq('borrower_state', stateCode)
        .order('loan_amount', { ascending: false })
        .limit(10000);

      if (error) throw error;

      const columns = ['sba_loan_number', 'borrower_name', 'borrower_city', 'borrower_zip', 'naics_code', 'business_type', 'loan_amount', 'jobs_supported', 'date_approved', 'is_flagged', 'fraud_score', 'ppp_loan_id'];
      const csv = arrayToCSV(eidlLoans || [], columns);

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${stateCode}_eidl_loans.csv"`,
        },
      });
    }

    if (dataType === 'flagged') {
      // Export flagged loans only (PPP + EIDL)
      const { data: pppFlagged } = await supabase
        .from('ppp_loans')
        .select('loan_number, borrower_name, borrower_city, borrower_zip, naics_code, initial_approval_amount, fraud_score')
        .eq('borrower_state', stateCode)
        .eq('is_flagged', true)
        .order('fraud_score', { ascending: false })
        .limit(5000);

      const { data: eidlFlagged } = await supabase
        .from('eidl_loans')
        .select('sba_loan_number, borrower_name, borrower_city, borrower_zip, naics_code, loan_amount, fraud_score')
        .eq('borrower_state', stateCode)
        .eq('is_flagged', true)
        .order('fraud_score', { ascending: false })
        .limit(5000);

      const combined = [
        ...(pppFlagged || []).map(r => ({ ...r, loan_type: 'PPP', amount: r.initial_approval_amount })),
        ...(eidlFlagged || []).map(r => ({ ...r, loan_type: 'EIDL', amount: r.loan_amount })),
      ].sort((a, b) => (b.fraud_score || 0) - (a.fraud_score || 0));

      const columns = ['loan_type', 'loan_number', 'sba_loan_number', 'borrower_name', 'borrower_city', 'borrower_zip', 'naics_code', 'amount', 'fraud_score'];
      const csv = arrayToCSV(combined, columns);

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${stateCode}_flagged_loans.csv"`,
        },
      });
    }

    if (dataType === 'double-dippers') {
      // Export double dippers
      const { data: doubleDippers, error } = await supabase
        .from('eidl_loans')
        .select('sba_loan_number, borrower_name, borrower_city, borrower_zip, loan_amount, ppp_loan_id')
        .eq('borrower_state', stateCode)
        .not('ppp_loan_id', 'is', null)
        .order('loan_amount', { ascending: false });

      if (error) throw error;

      const columns = ['sba_loan_number', 'borrower_name', 'borrower_city', 'borrower_zip', 'loan_amount', 'ppp_loan_id'];
      const csv = arrayToCSV(doubleDippers || [], columns);

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${stateCode}_double_dippers.csv"`,
        },
      });
    }

    // Default: summary stats
    const [pppData, eidlData, sbaData] = await Promise.all([
      supabase.from('ppp_loans').select('initial_approval_amount, is_flagged').eq('borrower_state', stateCode),
      supabase.from('eidl_loans').select('loan_amount, is_flagged').eq('borrower_state', stateCode),
      supabase.from('sba_loans').select('loan_amount').eq('borrower_state', stateCode),
    ]);

    const ppp = pppData.data || [];
    const eidl = eidlData.data || [];
    const sba = sbaData.data || [];

    const summary = [
      { metric: 'PPP Loan Count', value: ppp.length },
      { metric: 'PPP Total Amount', value: ppp.reduce((s, r) => s + (r.initial_approval_amount || 0), 0) },
      { metric: 'PPP Flagged Count', value: ppp.filter(r => r.is_flagged).length },
      { metric: 'EIDL Loan Count', value: eidl.length },
      { metric: 'EIDL Total Amount', value: eidl.reduce((s, r) => s + (r.loan_amount || 0), 0) },
      { metric: 'EIDL Flagged Count', value: eidl.filter(r => r.is_flagged).length },
      { metric: 'SBA 7a/504 Loan Count', value: sba.length },
      { metric: 'SBA 7a/504 Total Amount', value: sba.reduce((s, r) => s + (r.loan_amount || 0), 0) },
    ];

    const csv = arrayToCSV(summary, ['metric', 'value']);

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${stateCode}_summary.csv"`,
      },
    });

  } catch (err) {
    console.error('Export error:', err);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}

