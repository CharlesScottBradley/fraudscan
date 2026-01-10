import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const politicianId = searchParams.get('id') || '54b68ce8-1a59-4ca3-9c4d-3690e53cd8e6';

  const { data, error } = await supabase
    .from('fec_contributions')
    .select('id, name, transaction_amt, transaction_dt, employer, occupation, city, state, is_fraud_linked')
    .eq('linked_politician_id', politicianId)
    .order('transaction_amt', { ascending: false })
    .limit(10);

  return NextResponse.json({
    politicianId,
    error: error?.message || null,
    count: data?.length || 0,
    sample: data?.slice(0, 3) || [],
  });
}
