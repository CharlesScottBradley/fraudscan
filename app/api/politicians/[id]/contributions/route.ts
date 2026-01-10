import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data, error } = await supabase
    .from('fec_contributions')
    .select('id, name, transaction_amt, transaction_dt, employer, occupation, city, state, is_fraud_linked')
    .eq('linked_politician_id', id)
    .order('transaction_amt', { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}
