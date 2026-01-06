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
  const specialty = searchParams.get('specialty');
  const npi = searchParams.get('npi');
  const minTotal = searchParams.get('minTotal');

  const sortBy = searchParams.get('sortBy') || 'total_received';
  const sortDir = searchParams.get('sortDir') || 'desc';

  try {
    // If looking up a specific NPI, aggregate their payments
    if (npi) {
      const { data: payments, error } = await supabase
        .from('open_payments_general')
        .select('*')
        .eq('covered_recipient_npi', npi)
        .order('total_amount', { ascending: false })
        .limit(1000);

      if (error) throw error;

      if (!payments?.length) {
        return NextResponse.json({ physician: null, payments: [], total: 0 });
      }

      // Aggregate stats
      const totalReceived = payments.reduce((sum, p) => sum + (p.total_amount || 0), 0);
      const paymentCount = payments.length;
      const manufacturers = new Set(payments.map(p => p.manufacturer_name).filter(Boolean));
      const paymentTypes = new Set(payments.map(p => p.nature_of_payment).filter(Boolean));

      // Group by manufacturer
      const byMfr: Record<string, { count: number; amount: number }> = {};
      payments.forEach(p => {
        if (p.manufacturer_name) {
          if (!byMfr[p.manufacturer_name]) byMfr[p.manufacturer_name] = { count: 0, amount: 0 };
          byMfr[p.manufacturer_name].count++;
          byMfr[p.manufacturer_name].amount += p.total_amount || 0;
        }
      });

      const topManufacturers = Object.entries(byMfr)
        .sort((a, b) => b[1].amount - a[1].amount)
        .slice(0, 10)
        .map(([name, stats]) => ({ name, ...stats }));

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

      const first = payments[0];
      return NextResponse.json({
        physician: {
          npi,
          firstName: first.recipient_first_name,
          lastName: first.recipient_last_name,
          city: first.recipient_city,
          state: first.recipient_state,
          specialty: first.recipient_specialty,
          totalReceived: Math.round(totalReceived * 100) / 100,
          paymentCount,
          uniqueManufacturers: manufacturers.size,
          uniquePaymentTypes: paymentTypes.size,
          topManufacturers,
          byPaymentType,
        },
        payments: payments.slice(0, 100),
        total: payments.length,
      });
    }

    // Otherwise, get top recipients by aggregating
    // Note: This is expensive on a large dataset. In production, use a materialized view.
    const { data: sample, error } = await supabase
      .from('open_payments_general')
      .select('covered_recipient_npi, recipient_first_name, recipient_last_name, recipient_city, recipient_state, recipient_specialty, total_amount')
      .not('covered_recipient_npi', 'is', null)
      .limit(50000);

    if (error) throw error;

    // Aggregate by NPI
    const byNpi: Record<string, {
      npi: string;
      firstName: string;
      lastName: string;
      city: string;
      state: string;
      specialty: string;
      totalReceived: number;
      paymentCount: number;
    }> = {};

    sample?.forEach(r => {
      if (!r.covered_recipient_npi) return;
      if (!byNpi[r.covered_recipient_npi]) {
        byNpi[r.covered_recipient_npi] = {
          npi: r.covered_recipient_npi,
          firstName: r.recipient_first_name || '',
          lastName: r.recipient_last_name || '',
          city: r.recipient_city || '',
          state: r.recipient_state || '',
          specialty: r.recipient_specialty || '',
          totalReceived: 0,
          paymentCount: 0,
        };
      }
      byNpi[r.covered_recipient_npi].totalReceived += r.total_amount || 0;
      byNpi[r.covered_recipient_npi].paymentCount++;
    });

    let physicians = Object.values(byNpi);

    // Apply filters
    if (search) {
      const searchLower = search.toLowerCase();
      physicians = physicians.filter(p =>
        p.lastName.toLowerCase().includes(searchLower) ||
        p.firstName.toLowerCase().includes(searchLower)
      );
    }

    if (state) {
      physicians = physicians.filter(p => p.state === state.toUpperCase());
    }

    if (specialty) {
      const specLower = specialty.toLowerCase();
      physicians = physicians.filter(p => p.specialty?.toLowerCase().includes(specLower));
    }

    if (minTotal) {
      physicians = physicians.filter(p => p.totalReceived >= parseFloat(minTotal));
    }

    // Sort
    if (sortBy === 'total_received') {
      physicians.sort((a, b) => sortDir === 'desc' ? b.totalReceived - a.totalReceived : a.totalReceived - b.totalReceived);
    } else if (sortBy === 'payment_count') {
      physicians.sort((a, b) => sortDir === 'desc' ? b.paymentCount - a.paymentCount : a.paymentCount - b.paymentCount);
    } else if (sortBy === 'name') {
      physicians.sort((a, b) => {
        const cmp = a.lastName.localeCompare(b.lastName);
        return sortDir === 'desc' ? -cmp : cmp;
      });
    }

    const total = physicians.length;
    const paginated = physicians.slice(offset, offset + pageSize);

    return NextResponse.json({
      physicians: paginated.map(p => ({
        ...p,
        totalReceived: Math.round(p.totalReceived * 100) / 100,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('Open Payments physicians error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch physician data' },
      { status: 500 }
    );
  }
}
