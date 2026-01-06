import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const state = searchParams.get('state');
  const year = searchParams.get('year');

  try {
    // Build filter for all queries
    let countQuery = supabase
      .from('open_payments_general')
      .select('*', { count: 'exact', head: true });

    if (state) countQuery = countQuery.eq('recipient_state', state.toUpperCase());
    if (year) countQuery = countQuery.eq('program_year', parseInt(year));

    const { count: totalPayments } = await countQuery;

    // Get payment type breakdown (sample-based for large dataset)
    const { data: natureSample } = await supabase
      .from('open_payments_general')
      .select('nature_of_payment, total_amount')
      .limit(10000);

    const byNature: Record<string, { count: number; amount: number }> = {};
    let sampleTotal = 0;
    natureSample?.forEach(r => {
      if (r.nature_of_payment) {
        if (!byNature[r.nature_of_payment]) {
          byNature[r.nature_of_payment] = { count: 0, amount: 0 };
        }
        byNature[r.nature_of_payment].count++;
        byNature[r.nature_of_payment].amount += r.total_amount || 0;
        sampleTotal += r.total_amount || 0;
      }
    });

    const topPaymentTypes = Object.entries(byNature)
      .sort((a, b) => b[1].amount - a[1].amount)
      .slice(0, 10)
      .map(([type, stats]) => ({
        type,
        count: stats.count,
        amount: Math.round(stats.amount * 100) / 100,
      }));

    // Get state breakdown
    const { data: stateSample } = await supabase
      .from('open_payments_general')
      .select('recipient_state, total_amount')
      .not('recipient_state', 'is', null)
      .limit(10000);

    const byState: Record<string, { count: number; amount: number }> = {};
    stateSample?.forEach(r => {
      if (r.recipient_state) {
        if (!byState[r.recipient_state]) {
          byState[r.recipient_state] = { count: 0, amount: 0 };
        }
        byState[r.recipient_state].count++;
        byState[r.recipient_state].amount += r.total_amount || 0;
      }
    });

    const topStates = Object.entries(byState)
      .sort((a, b) => b[1].amount - a[1].amount)
      .slice(0, 15)
      .map(([state, stats]) => ({
        state,
        count: stats.count,
        amount: Math.round(stats.amount * 100) / 100,
      }));

    // Get manufacturer breakdown
    const { data: mfrSample } = await supabase
      .from('open_payments_general')
      .select('manufacturer_name, total_amount')
      .not('manufacturer_name', 'is', null)
      .limit(10000);

    const byMfr: Record<string, { count: number; amount: number }> = {};
    mfrSample?.forEach(r => {
      if (r.manufacturer_name) {
        if (!byMfr[r.manufacturer_name]) {
          byMfr[r.manufacturer_name] = { count: 0, amount: 0 };
        }
        byMfr[r.manufacturer_name].count++;
        byMfr[r.manufacturer_name].amount += r.total_amount || 0;
      }
    });

    const topManufacturers = Object.entries(byMfr)
      .sort((a, b) => b[1].amount - a[1].amount)
      .slice(0, 15)
      .map(([name, stats]) => ({
        name,
        count: stats.count,
        amount: Math.round(stats.amount * 100) / 100,
      }));

    // Get year breakdown
    const { data: yearSample } = await supabase
      .from('open_payments_general')
      .select('program_year, total_amount')
      .limit(10000);

    const byYear: Record<number, { count: number; amount: number }> = {};
    yearSample?.forEach(r => {
      if (r.program_year) {
        if (!byYear[r.program_year]) {
          byYear[r.program_year] = { count: 0, amount: 0 };
        }
        byYear[r.program_year].count++;
        byYear[r.program_year].amount += r.total_amount || 0;
      }
    });

    const byYearList = Object.entries(byYear)
      .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
      .map(([year, stats]) => ({
        year: parseInt(year),
        count: stats.count,
        amount: Math.round(stats.amount * 100) / 100,
      }));

    // Estimate total amount (extrapolate from sample)
    const avgPaymentInSample = natureSample?.length ? sampleTotal / natureSample.length : 0;
    const estimatedTotalAmount = avgPaymentInSample * (totalPayments || 0);

    return NextResponse.json({
      totalPayments: totalPayments || 0,
      estimatedTotalAmount: Math.round(estimatedTotalAmount),
      avgPayment: Math.round(avgPaymentInSample * 100) / 100,
      topPaymentTypes,
      topStates,
      topManufacturers,
      byYear: byYearList,
      sampleSize: natureSample?.length || 0,
    });
  } catch (error) {
    console.error('Open Payments stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Open Payments statistics' },
      { status: 500 }
    );
  }
}
