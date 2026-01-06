import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export interface FederalGrant {
  id: string;
  award_id: string;
  fain: string | null;
  recipient_name: string;
  recipient_city: string | null;
  recipient_state: string;
  recipient_zip: string | null;
  recipient_county: string | null;
  award_amount: number;
  total_obligation: number | null;
  award_type: string | null;
  awarding_agency: string | null;
  cfda_number: string | null;
  cfda_title: string | null;
  award_date: string | null;
  start_date: string | null;
  end_date: string | null;
  award_description: string | null;
  is_fraud_prone_industry: boolean;
  industry_category: string | null;
}

export interface GrantSearchResponse {
  grants: FederalGrant[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  stats: {
    totalAmount: number;
    avgGrant: number;
    fraudProneCount: number;
    topAgencies: { agency: string; count: number; amount: number }[];
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
  const minAmount = searchParams.get('minAmount');
  const maxAmount = searchParams.get('maxAmount');
  const agency = searchParams.get('agency');
  const cfdaNumber = searchParams.get('cfda');
  const awardType = searchParams.get('awardType');
  const fraudProne = searchParams.get('fraudProne');
  const industryCategory = searchParams.get('industry');
  const county = searchParams.get('county');
  const year = searchParams.get('year');
  const sortBy = searchParams.get('sortBy') || 'award_amount';
  const sortDir = searchParams.get('sortDir') || 'desc';

  try {
    // Build query
    let query = supabase
      .from('federal_grants')
      .select(`
        id,
        award_id,
        fain,
        recipient_name,
        recipient_city,
        recipient_state,
        recipient_zip,
        recipient_county,
        award_amount,
        total_obligation,
        award_type,
        awarding_agency,
        cfda_number,
        cfda_title,
        award_date,
        start_date,
        end_date,
        award_description,
        is_fraud_prone_industry,
        industry_category
      `, { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.or(`recipient_name.ilike.%${search}%,awarding_agency.ilike.%${search}%,cfda_title.ilike.%${search}%,award_description.ilike.%${search}%`);
    }

    if (state) {
      query = query.eq('recipient_state', state.toUpperCase());
    }

    if (minAmount) {
      query = query.gte('award_amount', parseFloat(minAmount));
    }

    if (maxAmount) {
      query = query.lte('award_amount', parseFloat(maxAmount));
    }

    if (agency) {
      query = query.ilike('awarding_agency', `%${agency}%`);
    }

    if (cfdaNumber) {
      query = query.eq('cfda_number', cfdaNumber);
    }

    if (awardType) {
      query = query.ilike('award_type', `%${awardType}%`);
    }

    if (fraudProne === 'true') {
      query = query.eq('is_fraud_prone_industry', true);
    } else if (fraudProne === 'false') {
      query = query.eq('is_fraud_prone_industry', false);
    }

    if (industryCategory) {
      query = query.eq('industry_category', industryCategory);
    }

    if (county) {
      query = query.ilike('recipient_county', `%${county}%`);
    }

    if (year) {
      // Filter by award year
      const yearInt = parseInt(year);
      query = query
        .gte('award_date', `${yearInt}-01-01`)
        .lte('award_date', `${yearInt}-12-31`);
    }

    // Sorting
    const validSortColumns = ['award_amount', 'award_date', 'recipient_name', 'awarding_agency', 'total_obligation'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'award_amount';
    query = query.order(sortColumn, { ascending: sortDir === 'asc', nullsFirst: false });

    // Pagination
    query = query.range(offset, offset + pageSize - 1);

    const { data: grants, error, count } = await query;

    if (error) {
      console.error('Federal grants query error:', error);
      throw error;
    }

    // Get aggregate stats for the filtered results (limited sample for performance)
    let statsQuery = supabase
      .from('federal_grants')
      .select('award_amount, is_fraud_prone_industry, awarding_agency');

    // Apply same filters for stats
    if (search) {
      statsQuery = statsQuery.or(`recipient_name.ilike.%${search}%,awarding_agency.ilike.%${search}%,cfda_title.ilike.%${search}%`);
    }
    if (state) {
      statsQuery = statsQuery.eq('recipient_state', state.toUpperCase());
    }
    if (minAmount) {
      statsQuery = statsQuery.gte('award_amount', parseFloat(minAmount));
    }
    if (maxAmount) {
      statsQuery = statsQuery.lte('award_amount', parseFloat(maxAmount));
    }
    if (agency) {
      statsQuery = statsQuery.ilike('awarding_agency', `%${agency}%`);
    }
    if (cfdaNumber) {
      statsQuery = statsQuery.eq('cfda_number', cfdaNumber);
    }
    if (fraudProne === 'true') {
      statsQuery = statsQuery.eq('is_fraud_prone_industry', true);
    }
    if (industryCategory) {
      statsQuery = statsQuery.eq('industry_category', industryCategory);
    }
    if (year) {
      const yearInt = parseInt(year);
      statsQuery = statsQuery
        .gte('award_date', `${yearInt}-01-01`)
        .lte('award_date', `${yearInt}-12-31`);
    }

    // Limit stats calculation for performance
    const statsLimit = 15000;
    statsQuery = statsQuery.limit(statsLimit);

    const { data: statsData } = await statsQuery;

    let totalAmount = 0;
    let fraudProneCount = 0;
    const agencyStats: Record<string, { count: number; amount: number }> = {};

    if (statsData) {
      statsData.forEach((grant: { award_amount: number; is_fraud_prone_industry: boolean; awarding_agency: string | null }) => {
        totalAmount += grant.award_amount || 0;
        if (grant.is_fraud_prone_industry) fraudProneCount++;

        const agencyName = grant.awarding_agency || 'Unknown';
        if (!agencyStats[agencyName]) {
          agencyStats[agencyName] = { count: 0, amount: 0 };
        }
        agencyStats[agencyName].count++;
        agencyStats[agencyName].amount += grant.award_amount || 0;
      });
    }

    // Get top 5 agencies
    const topAgencies = Object.entries(agencyStats)
      .map(([agency, stats]) => ({ agency, ...stats }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    const response: GrantSearchResponse = {
      grants: grants || [],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
      stats: {
        totalAmount,
        avgGrant: statsData?.length ? totalAmount / statsData.length : 0,
        fraudProneCount,
        topAgencies
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Federal grants API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch federal grants' },
      { status: 500 }
    );
  }
}
