import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export interface Provider {
  id: string;
  license_number: string | null;
  name: string;
  dba_name: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  county: string | null;
  license_type: string | null;
  license_status: string | null;
  licensed_capacity: number | null;
  license_effective_date: string | null;
  license_expiration_date: string | null;
  parent_aware_rating: number | null;
  is_accredited: boolean | null;
  latitude: number | null;
  longitude: number | null;
  total_funding: number | null;
}

export interface ProvidersSearchResponse {
  data: Provider[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  stats: {
    totalCapacity: number;
    activeCount: number;
    stateBreakdown: Record<string, number>;
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
  const city = searchParams.get('city');
  const county = searchParams.get('county');
  const licenseType = searchParams.get('licenseType');
  const status = searchParams.get('status');
  const minCapacity = searchParams.get('minCapacity');
  const maxCapacity = searchParams.get('maxCapacity');
  const sortBy = searchParams.get('sortBy') || 'name';
  const sortDir = searchParams.get('sortDir') || 'asc';

  try {
    // Build query
    let query = supabase
      .from('providers')
      .select(`
        id,
        license_number,
        name,
        dba_name,
        address,
        city,
        state,
        zip_code,
        county,
        license_type,
        license_status,
        licensed_capacity,
        license_effective_date,
        license_expiration_date,
        parent_aware_rating,
        is_accredited,
        latitude,
        longitude
      `, { count: 'estimated' });

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,address.ilike.%${search}%,city.ilike.%${search}%,license_number.ilike.%${search}%`);
    }

    if (state) {
      query = query.eq('state', state.toUpperCase());
    }

    if (city) {
      query = query.ilike('city', `%${city}%`);
    }

    if (county) {
      query = query.ilike('county', `%${county}%`);
    }

    if (licenseType) {
      query = query.ilike('license_type', `%${licenseType}%`);
    }

    if (status) {
      query = query.ilike('license_status', `%${status}%`);
    }

    if (minCapacity) {
      query = query.gte('licensed_capacity', parseInt(minCapacity));
    }

    if (maxCapacity) {
      query = query.lte('licensed_capacity', parseInt(maxCapacity));
    }

    // Sorting
    const validSortColumns = ['name', 'licensed_capacity', 'city', 'state', 'license_effective_date'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'name';
    query = query.order(sortColumn, { ascending: sortDir === 'asc', nullsFirst: false });

    // Pagination
    query = query.range(offset, offset + pageSize - 1);

    const { data: providers, error, count } = await query;

    if (error) {
      console.error('Providers query error:', error);
      throw error;
    }

    // Get funding data for these providers
    const providerIds = (providers || []).map(p => p.id);
    let fundingMap: Record<string, number> = {};

    if (providerIds.length > 0) {
      const { data: payments } = await supabase
        .from('payments')
        .select('provider_id, total_amount')
        .in('provider_id', providerIds);

      payments?.forEach(p => {
        fundingMap[p.provider_id] = (fundingMap[p.provider_id] || 0) + p.total_amount;
      });
    }

    // Calculate stats from current page
    let totalCapacity = 0;
    let activeCount = 0;
    const stateBreakdown: Record<string, number> = {};

    const enrichedProviders: Provider[] = (providers || []).map((p) => {
      totalCapacity += p.licensed_capacity || 0;
      if (p.license_status?.toLowerCase().includes('active') ||
          p.license_status?.toLowerCase().includes('licensed')) {
        activeCount++;
      }
      if (p.state) {
        stateBreakdown[p.state] = (stateBreakdown[p.state] || 0) + 1;
      }

      return {
        ...p,
        total_funding: fundingMap[p.id] || null,
      };
    });

    const response: ProvidersSearchResponse = {
      data: enrichedProviders,
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
      stats: {
        totalCapacity,
        activeCount,
        stateBreakdown,
      },
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Providers API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch providers' },
      { status: 500 }
    );
  }
}
