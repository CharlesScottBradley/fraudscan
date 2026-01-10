import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Fetch top 100 contributions and total count in parallel
  const [contributionsResult, countResult] = await Promise.all([
    supabase
      .from('fec_contributions')
      .select('id, name, transaction_amt, transaction_dt, employer, occupation, city, state')
      .eq('linked_politician_id', id)
      .order('transaction_amt', { ascending: false })
      .limit(100),
    supabase
      .from('fec_contributions')
      .select('*', { count: 'exact', head: true })
      .eq('linked_politician_id', id)
  ]);

  if (contributionsResult.error) {
    return NextResponse.json({ error: contributionsResult.error.message }, { status: 500 });
  }

  const totalCount = countResult.count || 0;

  // Try to get total via RPC function (if available)
  let totalAmount = 0;
  const { data: rpcData, error: rpcError } = await supabase.rpc(
    'get_politician_contribution_total',
    { politician_id: id }
  );

  if (!rpcError && rpcData !== null) {
    totalAmount = rpcData;
  } else {
    // Fallback: sum from top 100 (shown contributions only)
    totalAmount = (contributionsResult.data || []).reduce(
      (sum, row) => sum + (row.transaction_amt || 0),
      0
    );
  }

  return NextResponse.json({
    contributions: contributionsResult.data || [],
    totalCount,
    totalAmount
  });
}
