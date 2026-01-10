import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Fetch top 100 contributions, count, and all amounts for sum in parallel
  const [contributionsResult, countResult, amountsResult] = await Promise.all([
    supabase
      .from('fec_contributions')
      .select('id, name, transaction_amt, transaction_dt, employer, occupation, city, state')
      .eq('linked_politician_id', id)
      .order('transaction_amt', { ascending: false })
      .limit(100),
    supabase
      .from('fec_contributions')
      .select('*', { count: 'exact', head: true })
      .eq('linked_politician_id', id),
    supabase
      .from('fec_contributions')
      .select('transaction_amt')
      .eq('linked_politician_id', id)
      .limit(500000)
  ]);

  if (contributionsResult.error) {
    return NextResponse.json({ error: contributionsResult.error.message }, { status: 500 });
  }

  const totalCount = countResult.count || 0;
  const totalAmount = (amountsResult.data || []).reduce(
    (sum, row) => sum + (row.transaction_amt || 0),
    0
  );

  return NextResponse.json({
    contributions: contributionsResult.data || [],
    totalCount,
    totalAmount
  });
}
