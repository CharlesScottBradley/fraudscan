import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export interface DonorsResponse {
  donors: {
    name: string;
    employer: string | null;
    occupation: string | null;
    city: string | null;
    state: string | null;
    total_amount: number;
    donation_count: number;
    last_donation: string | null;
  }[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ cmte_id: string }> }
) {
  const { cmte_id } = await params;
  const { searchParams } = new URL(request.url);

  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '50'), 100);
  const search = searchParams.get('search');

  if (!cmte_id) {
    return NextResponse.json({ error: 'Committee ID required' }, { status: 400 });
  }

  try {
    // Build query for contributions
    let query = supabase
      .from('fec_contributions')
      .select('name, employer, occupation, city, state, transaction_amt, transaction_dt')
      .eq('cmte_id', cmte_id)
      .not('name', 'is', null);

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    // Get all matching contributions to aggregate (up to 10000)
    const { data: contributions, error } = await query.limit(10000);

    if (error) {
      console.error('Donors query error:', error);
      return NextResponse.json(
        { error: 'Database query failed', details: error.message },
        { status: 500 }
      );
    }

    // Aggregate by donor name
    const donorMap = new Map<string, {
      name: string;
      employer: string | null;
      occupation: string | null;
      city: string | null;
      state: string | null;
      total_amount: number;
      donation_count: number;
      last_donation: string | null;
    }>();

    contributions?.forEach(c => {
      const key = c.name?.toUpperCase() || '';
      if (!key) return;

      const existing = donorMap.get(key);
      const donationDate = c.transaction_dt;

      if (existing) {
        existing.total_amount += Number(c.transaction_amt) || 0;
        existing.donation_count += 1;
        if (donationDate && (!existing.last_donation || donationDate > existing.last_donation)) {
          existing.last_donation = donationDate;
        }
      } else {
        donorMap.set(key, {
          name: c.name || '',
          employer: c.employer,
          occupation: c.occupation,
          city: c.city,
          state: c.state,
          total_amount: Number(c.transaction_amt) || 0,
          donation_count: 1,
          last_donation: donationDate,
        });
      }
    });

    // Sort by total amount
    const allDonors = Array.from(donorMap.values())
      .sort((a, b) => b.total_amount - a.total_amount);

    const total = allDonors.length;
    const totalPages = Math.ceil(total / pageSize);
    const offset = (page - 1) * pageSize;

    const donors = allDonors.slice(offset, offset + pageSize);

    const response: DonorsResponse = {
      donors,
      total,
      page,
      pageSize,
      totalPages,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Donors API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch donors' },
      { status: 500 }
    );
  }
}
