import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export interface OpenPaymentRecord {
  id: number;
  record_id: number;
  program_year: number;
  covered_recipient_type: string | null;
  covered_recipient_npi: string | null;
  recipient_first_name: string | null;
  recipient_last_name: string | null;
  recipient_city: string | null;
  recipient_state: string | null;
  recipient_specialty: string | null;
  total_amount: number;
  date_of_payment: string | null;
  nature_of_payment: string | null;
  form_of_payment: string | null;
  manufacturer_name: string | null;
  manufacturer_state: string | null;
  product_name: string | null;
  product_category: string | null;
  teaching_hospital_name: string | null;
}

export interface OpenPaymentsSearchResponse {
  payments: OpenPaymentRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  stats: {
    totalPayments: number;
    totalAmount: number;
    avgPayment: number;
    topNatures: { nature: string; count: number; amount: number }[];
    topManufacturers: { name: string; count: number; amount: number }[];
    topStates: { state: string; count: number; amount: number }[];
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Pagination
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '50'), 100);
  const offset = (page - 1) * pageSize;

  // Filters
  const search = searchParams.get('search');
  const state = searchParams.get('state');
  const manufacturer = searchParams.get('manufacturer');
  const nature = searchParams.get('nature');
  const programYear = searchParams.get('year');
  const npi = searchParams.get('npi');
  const minAmount = searchParams.get('minAmount');
  const maxAmount = searchParams.get('maxAmount');

  const sortBy = searchParams.get('sortBy') || 'total_amount';
  const sortDir = searchParams.get('sortDir') || 'desc';

  try {
    let query = supabase
      .from('open_payments_general')
      .select(`
        id,
        record_id,
        program_year,
        covered_recipient_type,
        covered_recipient_npi,
        recipient_first_name,
        recipient_last_name,
        recipient_city,
        recipient_state,
        recipient_specialty,
        total_amount,
        date_of_payment,
        nature_of_payment,
        form_of_payment,
        manufacturer_name,
        manufacturer_state,
        product_name,
        product_category,
        teaching_hospital_name
      `, { count: 'exact' });

    // Apply filters
    if (search) {
      // Search recipient name or manufacturer
      query = query.or(`recipient_last_name.ilike.%${search}%,recipient_first_name.ilike.%${search}%,manufacturer_name.ilike.%${search}%,teaching_hospital_name.ilike.%${search}%`);
    }

    if (state) {
      query = query.eq('recipient_state', state.toUpperCase());
    }

    if (manufacturer) {
      query = query.ilike('manufacturer_name', `%${manufacturer}%`);
    }

    if (nature) {
      query = query.eq('nature_of_payment', nature);
    }

    if (programYear) {
      query = query.eq('program_year', parseInt(programYear));
    }

    if (npi) {
      query = query.eq('covered_recipient_npi', npi);
    }

    if (minAmount) {
      query = query.gte('total_amount', parseFloat(minAmount));
    }

    if (maxAmount) {
      query = query.lte('total_amount', parseFloat(maxAmount));
    }

    // Sorting
    const validSortColumns = ['total_amount', 'date_of_payment', 'recipient_last_name', 'manufacturer_name', 'program_year'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'total_amount';
    query = query.order(sortColumn, { ascending: sortDir === 'asc' });

    // Pagination
    query = query.range(offset, offset + pageSize - 1);

    const { data, count, error } = await query;

    if (error) {
      console.error('Open Payments query error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get aggregate stats (cached or computed)
    const { data: natureCounts } = await supabase
      .from('open_payments_general')
      .select('nature_of_payment, total_amount')
      .limit(5000);

    const natureStats: Record<string, { count: number; amount: number }> = {};
    natureCounts?.forEach(r => {
      if (r.nature_of_payment) {
        if (!natureStats[r.nature_of_payment]) {
          natureStats[r.nature_of_payment] = { count: 0, amount: 0 };
        }
        natureStats[r.nature_of_payment].count++;
        natureStats[r.nature_of_payment].amount += r.total_amount || 0;
      }
    });

    const topNatures = Object.entries(natureStats)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([nature, stats]) => ({ nature, ...stats }));

    const totalAmount = natureCounts?.reduce((sum, r) => sum + (r.total_amount || 0), 0) || 0;
    const avgPayment = natureCounts?.length ? totalAmount / natureCounts.length : 0;

    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      payments: data || [],
      total,
      page,
      pageSize,
      totalPages,
      stats: {
        totalPayments: total,
        totalAmount: Math.round(totalAmount),
        avgPayment: Math.round(avgPayment * 100) / 100,
        topNatures,
        topManufacturers: [],
        topStates: [],
      },
    });
  } catch (error) {
    console.error('Open Payments API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Open Payments data' },
      { status: 500 }
    );
  }
}
