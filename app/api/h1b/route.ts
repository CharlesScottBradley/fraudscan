import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export interface H1BApplication {
  id: string;
  case_number: string;
  case_status: string;
  received_date: string | null;
  decision_date: string | null;
  visa_class: string;
  employer_name: string;
  employer_city: string;
  employer_state: string;
  naics_code: string | null;
  job_title: string;
  soc_code: string | null;
  soc_title: string | null;
  wage_rate_from: number | null;
  wage_rate_to: number | null;
  wage_unit: string | null;
  worksite_city: string;
  worksite_state: string;
  worksite_county: string | null;
  latitude: number | null;
  longitude: number | null;
  fiscal_year: number;
}

export interface H1BSearchResponse {
  applications: H1BApplication[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  stats: {
    totalApplications: number;
    certifiedCount: number;
    avgWage: number;
    topEmployers: { name: string; count: number }[];
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
  const worksiteState = searchParams.get('worksiteState');
  const naicsCode = searchParams.get('naics');
  const visaClass = searchParams.get('visaClass');
  const caseStatus = searchParams.get('status');
  const minWage = searchParams.get('minWage');
  const maxWage = searchParams.get('maxWage');
  const fiscalYear = searchParams.get('fiscalYear');

  // Geo bounds for map
  const minLat = searchParams.get('minLat');
  const maxLat = searchParams.get('maxLat');
  const minLng = searchParams.get('minLng');
  const maxLng = searchParams.get('maxLng');

  const sortBy = searchParams.get('sortBy') || 'decision_date';
  const sortDir = searchParams.get('sortDir') || 'desc';

  try {
    let query = supabase
      .from('h1b_applications')
      .select(`
        id,
        case_number,
        case_status,
        received_date,
        decision_date,
        visa_class,
        employer_name,
        employer_city,
        employer_state,
        naics_code,
        job_title,
        soc_code,
        soc_title,
        wage_rate_from,
        wage_rate_to,
        wage_unit,
        worksite_city,
        worksite_state,
        worksite_county,
        latitude,
        longitude,
        fiscal_year
      `, { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.or(`employer_name.ilike.%${search}%,job_title.ilike.%${search}%`);
    }

    if (state) {
      query = query.eq('employer_state', state.toUpperCase());
    }

    if (worksiteState) {
      query = query.eq('worksite_state', worksiteState.toUpperCase());
    }

    if (naicsCode) {
      query = query.ilike('naics_code', `${naicsCode}%`);
    }

    if (visaClass) {
      query = query.eq('visa_class', visaClass);
    }

    if (caseStatus) {
      query = query.eq('case_status', caseStatus);
    }

    if (minWage) {
      query = query.gte('wage_rate_from', parseFloat(minWage));
    }

    if (maxWage) {
      query = query.lte('wage_rate_from', parseFloat(maxWage));
    }

    if (fiscalYear) {
      query = query.eq('fiscal_year', parseInt(fiscalYear));
    }

    // Geo bounds filtering for map
    if (minLat && maxLat && minLng && maxLng) {
      query = query
        .gte('latitude', parseFloat(minLat))
        .lte('latitude', parseFloat(maxLat))
        .gte('longitude', parseFloat(minLng))
        .lte('longitude', parseFloat(maxLng));
    }

    // Sorting
    const validSortColumns = ['decision_date', 'wage_rate_from', 'employer_name', 'case_number'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'decision_date';
    query = query.order(sortColumn, { ascending: sortDir === 'asc' });

    // Pagination
    query = query.range(offset, offset + pageSize - 1);

    const { data, count, error } = await query;

    if (error) {
      console.error('H1B query error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get stats
    const { data: statsData } = await supabase
      .from('h1b_applications')
      .select('case_status, wage_rate_from, employer_name')
      .limit(10000);

    const certifiedCount = statsData?.filter(r => r.case_status === 'Certified').length || 0;
    const wages = statsData?.filter(r => r.wage_rate_from).map(r => r.wage_rate_from) || [];
    const avgWage = wages.length > 0 ? wages.reduce((a, b) => a + b, 0) / wages.length : 0;

    // Top employers
    const employerCounts: Record<string, number> = {};
    statsData?.forEach(r => {
      if (r.employer_name) {
        employerCounts[r.employer_name] = (employerCounts[r.employer_name] || 0) + 1;
      }
    });
    const topEmployers = Object.entries(employerCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      applications: data || [],
      total,
      page,
      pageSize,
      totalPages,
      stats: {
        totalApplications: total,
        certifiedCount,
        avgWage: Math.round(avgWage),
        topEmployers,
      },
    });
  } catch (error) {
    console.error('H1B API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch H1B applications' },
      { status: 500 }
    );
  }
}
