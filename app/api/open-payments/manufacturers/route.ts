import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Pagination
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '50'), 100);
  const offset = (page - 1) * pageSize;

  // Filters
  const search = searchParams.get('search');
  const state = searchParams.get('state');
  const name = searchParams.get('name');
  const minTotal = searchParams.get('minTotal');

  const sortBy = searchParams.get('sortBy') || 'total_paid';
  const sortDir = searchParams.get('sortDir') || 'desc';

  try {
    // If looking up a specific manufacturer, get detailed breakdown
    if (name) {
      const { data: payments, error } = await supabase
        .from('open_payments_general')
        .select('*')
        .ilike('manufacturer_name', name)
        .order('total_amount', { ascending: false })
        .limit(1000);

      if (error) throw error;

      if (!payments?.length) {
        return NextResponse.json({ manufacturer: null, payments: [], total: 0 });
      }

      // Aggregate stats
      const totalPaid = payments.reduce((sum, p) => sum + (p.total_amount || 0), 0);
      const paymentCount = payments.length;
      const recipients = new Set(payments.map(p => p.covered_recipient_npi).filter(Boolean));
      const paymentTypes = new Set(payments.map(p => p.nature_of_payment).filter(Boolean));
      const states = new Set(payments.map(p => p.recipient_state).filter(Boolean));

      // Group by payment type
      const byType: Record<string, { count: number; amount: number }> = {};
      payments.forEach(p => {
        if (p.nature_of_payment) {
          if (!byType[p.nature_of_payment]) byType[p.nature_of_payment] = { count: 0, amount: 0 };
          byType[p.nature_of_payment].count++;
          byType[p.nature_of_payment].amount += p.total_amount || 0;
        }
      });

      const byPaymentType = Object.entries(byType)
        .sort((a, b) => b[1].amount - a[1].amount)
        .map(([type, stats]) => ({ type, ...stats }));

      // Group by state
      const byState: Record<string, { count: number; amount: number }> = {};
      payments.forEach(p => {
        if (p.recipient_state) {
          if (!byState[p.recipient_state]) byState[p.recipient_state] = { count: 0, amount: 0 };
          byState[p.recipient_state].count++;
          byState[p.recipient_state].amount += p.total_amount || 0;
        }
      });

      const topStates = Object.entries(byState)
        .sort((a, b) => b[1].amount - a[1].amount)
        .slice(0, 15)
        .map(([state, stats]) => ({ state, ...stats }));

      // Top recipients
      const byRecipient: Record<string, { npi: string; name: string; specialty: string; amount: number; count: number }> = {};
      payments.forEach(p => {
        if (p.covered_recipient_npi) {
          if (!byRecipient[p.covered_recipient_npi]) {
            byRecipient[p.covered_recipient_npi] = {
              npi: p.covered_recipient_npi,
              name: `${p.recipient_first_name || ''} ${p.recipient_last_name || ''}`.trim(),
              specialty: p.recipient_specialty || '',
              amount: 0,
              count: 0,
            };
          }
          byRecipient[p.covered_recipient_npi].amount += p.total_amount || 0;
          byRecipient[p.covered_recipient_npi].count++;
        }
      });

      const topRecipients = Object.values(byRecipient)
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 20);

      const first = payments[0];
      return NextResponse.json({
        manufacturer: {
          name: first.manufacturer_name,
          state: first.manufacturer_state,
          country: first.manufacturer_country,
          totalPaid: Math.round(totalPaid * 100) / 100,
          paymentCount,
          uniqueRecipients: recipients.size,
          uniquePaymentTypes: paymentTypes.size,
          statesReached: states.size,
          byPaymentType,
          topStates,
          topRecipients,
        },
        payments: payments.slice(0, 50),
        total: payments.length,
      });
    }

    // Otherwise, get top manufacturers by aggregating
    const { data: sample, error } = await supabase
      .from('open_payments_general')
      .select('manufacturer_name, manufacturer_state, total_amount, covered_recipient_npi, recipient_state')
      .not('manufacturer_name', 'is', null)
      .limit(50000);

    if (error) throw error;

    // Aggregate by manufacturer
    const byMfr: Record<string, {
      name: string;
      state: string;
      totalPaid: number;
      paymentCount: number;
      uniqueRecipients: Set<string>;
      uniqueStates: Set<string>;
    }> = {};

    sample?.forEach(r => {
      if (!r.manufacturer_name) return;
      if (!byMfr[r.manufacturer_name]) {
        byMfr[r.manufacturer_name] = {
          name: r.manufacturer_name,
          state: r.manufacturer_state || '',
          totalPaid: 0,
          paymentCount: 0,
          uniqueRecipients: new Set(),
          uniqueStates: new Set(),
        };
      }
      byMfr[r.manufacturer_name].totalPaid += r.total_amount || 0;
      byMfr[r.manufacturer_name].paymentCount++;
      if (r.covered_recipient_npi) byMfr[r.manufacturer_name].uniqueRecipients.add(r.covered_recipient_npi);
      if (r.recipient_state) byMfr[r.manufacturer_name].uniqueStates.add(r.recipient_state);
    });

    let manufacturers = Object.values(byMfr).map(m => ({
      name: m.name,
      state: m.state,
      totalPaid: m.totalPaid,
      paymentCount: m.paymentCount,
      uniqueRecipients: m.uniqueRecipients.size,
      statesReached: m.uniqueStates.size,
    }));

    // Apply filters
    if (search) {
      const searchLower = search.toLowerCase();
      manufacturers = manufacturers.filter(m => m.name.toLowerCase().includes(searchLower));
    }

    if (state) {
      manufacturers = manufacturers.filter(m => m.state === state.toUpperCase());
    }

    if (minTotal) {
      manufacturers = manufacturers.filter(m => m.totalPaid >= parseFloat(minTotal));
    }

    // Sort
    if (sortBy === 'total_paid') {
      manufacturers.sort((a, b) => sortDir === 'desc' ? b.totalPaid - a.totalPaid : a.totalPaid - b.totalPaid);
    } else if (sortBy === 'payment_count') {
      manufacturers.sort((a, b) => sortDir === 'desc' ? b.paymentCount - a.paymentCount : a.paymentCount - b.paymentCount);
    } else if (sortBy === 'recipients') {
      manufacturers.sort((a, b) => sortDir === 'desc' ? b.uniqueRecipients - a.uniqueRecipients : a.uniqueRecipients - b.uniqueRecipients);
    } else if (sortBy === 'name') {
      manufacturers.sort((a, b) => {
        const cmp = a.name.localeCompare(b.name);
        return sortDir === 'desc' ? -cmp : cmp;
      });
    }

    const total = manufacturers.length;
    const paginated = manufacturers.slice(offset, offset + pageSize);

    return NextResponse.json({
      manufacturers: paginated.map(m => ({
        ...m,
        totalPaid: Math.round(m.totalPaid * 100) / 100,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('Open Payments manufacturers error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch manufacturer data' },
      { status: 500 }
    );
  }
}
