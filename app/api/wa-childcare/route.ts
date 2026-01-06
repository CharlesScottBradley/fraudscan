import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export interface WAProvider {
  id: string;
  provider_sf_id: string;
  license_number: string | null;
  display_name: string | null;
  license_name: string | null;
  address: string | null;
  city: string | null;
  state: string;
  zip_code: string | null;
  county: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  license_status: string | null;
  facility_type: string | null;
  license_type: string | null;
  licensed_capacity: number | null;
  early_achievers_status: string | null;
  head_start: boolean;
  eceap: boolean;
  languages_spoken: string[];
  // Counts for related records
  contact_count?: number;
  inspection_count?: number;
  complaint_count?: number;
}

export interface WAProvidersResponse {
  data: WAProvider[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  stats: {
    totalCapacity: number;
    activeCount: number;
    facilityTypeBreakdown: Record<string, number>;
    cityBreakdown: Record<string, number>;
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
  const city = searchParams.get('city');
  const status = searchParams.get('status');
  const facilityType = searchParams.get('facilityType');
  const hasComplaints = searchParams.get('hasComplaints');
  const earlyAchievers = searchParams.get('earlyAchievers');
  const minCapacity = searchParams.get('minCapacity');
  const maxCapacity = searchParams.get('maxCapacity');
  const sortBy = searchParams.get('sortBy') || 'display_name';
  const sortDir = searchParams.get('sortDir') || 'asc';

  try {
    // Build query
    let query = supabase
      .from('wa_childcare_providers')
      .select(`
        id,
        provider_sf_id,
        license_number,
        display_name,
        license_name,
        address,
        city,
        state,
        zip_code,
        county,
        latitude,
        longitude,
        phone,
        email,
        website,
        license_status,
        facility_type,
        license_type,
        licensed_capacity,
        early_achievers_status,
        head_start,
        eceap,
        languages_spoken
      `, { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.or(`display_name.ilike.%${search}%,license_number.ilike.%${search}%,city.ilike.%${search}%,license_name.ilike.%${search}%`);
    }

    if (city) {
      query = query.ilike('city', `%${city}%`);
    }

    if (status) {
      query = query.eq('license_status', status);
    }

    if (facilityType) {
      query = query.ilike('facility_type', `%${facilityType}%`);
    }

    if (earlyAchievers === 'true') {
      query = query.not('early_achievers_status', 'is', null);
    }

    if (minCapacity) {
      query = query.gte('licensed_capacity', parseInt(minCapacity));
    }

    if (maxCapacity) {
      query = query.lte('licensed_capacity', parseInt(maxCapacity));
    }

    // Sorting
    const validSortFields = ['display_name', 'city', 'licensed_capacity', 'license_status', 'facility_type'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'display_name';
    query = query.order(sortField, { ascending: sortDir === 'asc', nullsFirst: false });

    // Pagination
    query = query.range(offset, offset + pageSize - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('WA Childcare query error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get complaint counts for providers with complaints (if filter is set)
    let providersWithComplaints = new Set<string>();
    if (hasComplaints === 'true' && data) {
      const providerIds = data.map(p => p.id);
      const { data: complaints } = await supabase
        .from('wa_provider_complaints')
        .select('provider_id')
        .in('provider_id', providerIds);

      if (complaints) {
        providersWithComplaints = new Set(complaints.map(c => c.provider_id));
      }
    }

    // Filter by complaints if needed
    let filteredData = data || [];
    if (hasComplaints === 'true') {
      filteredData = filteredData.filter(p => providersWithComplaints.has(p.id));
    }

    // Calculate stats
    const stats = {
      totalCapacity: filteredData.reduce((sum, p) => sum + (p.licensed_capacity || 0), 0),
      activeCount: filteredData.filter(p => p.license_status === 'Open').length,
      facilityTypeBreakdown: {} as Record<string, number>,
      cityBreakdown: {} as Record<string, number>
    };

    for (const provider of filteredData) {
      const ft = provider.facility_type || 'Unknown';
      stats.facilityTypeBreakdown[ft] = (stats.facilityTypeBreakdown[ft] || 0) + 1;

      const cityName = provider.city || 'Unknown';
      stats.cityBreakdown[cityName] = (stats.cityBreakdown[cityName] || 0) + 1;
    }

    const response: WAProvidersResponse = {
      data: filteredData,
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
      stats
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error('WA Childcare API error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
