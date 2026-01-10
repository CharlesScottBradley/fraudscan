import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Fetch top 100 contributions and total stats in parallel
  const [contributionsResult, statsResult] = await Promise.all([
    supabase
      .from('fec_contributions')
      .select('id, name, transaction_amt, transaction_dt, employer, occupation, city, state')
      .eq('linked_politician_id', id)
      .order('transaction_amt', { ascending: false })
      .limit(100),
    supabase
      .from('fec_contributions')
      .select('transaction_amt.sum(), id.count()')
      .eq('linked_politician_id', id)
      .single()
  ]);

  if (contributionsResult.error) {
    return NextResponse.json({ error: contributionsResult.error.message }, { status: 500 });
  }

  const totalCount = statsResult.data?.count || 0;
  const totalAmount = statsResult.data?.sum || 0;

  return NextResponse.json({
    contributions: contributionsResult.data || [],
    totalCount,
    totalAmount
  });
}
