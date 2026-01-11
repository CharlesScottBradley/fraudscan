import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// Helper to fetch all rows from pac_stats (Supabase has 1000 row limit)
async function getAllPacStats() {
  const allData: { party: string | null; committee_type: string | null; total_received: number; donation_count: number }[] = [];
  let offset = 0;
  const batchSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('pac_stats')
      .select('party, committee_type, total_received, donation_count')
      .gt('donation_count', 0)
      .range(offset, offset + batchSize - 1);

    if (error || !data) break;
    allData.push(...data);
    if (data.length < batchSize) break;
    offset += batchSize;
  }

  return allData;
}

export interface PAC {
  cmte_id: string;
  name: string | null;
  committee_type: string | null;
  party: string | null;
  total_received: number;
  donation_count: number;
  avg_donation: number;
  donor_states_count: number;
  first_donation: string | null;
  last_donation: string | null;
}

export interface PACsResponse {
  data: PAC[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  stats: {
    totalAmount: number;
    totalDonations: number;
    partyBreakdown: Record<string, number>;
    typeBreakdown: Record<string, number>;
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
  const party = searchParams.get('party');
  const type = searchParams.get('type');
  const sortBy = searchParams.get('sortBy') || 'total_received';
  const sortDir = searchParams.get('sortDir') || 'desc';

  try {
    // Build query on pac_stats materialized view
    let query = supabase
      .from('pac_stats')
      .select('*', { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.ilike('committee_name', `%${search}%`);
    }

    if (party) {
      if (party.toLowerCase() === 'democratic' || party.toLowerCase() === 'd') {
        query = query.eq('party', 'Democratic');
      } else if (party.toLowerCase() === 'republican' || party.toLowerCase() === 'r') {
        query = query.eq('party', 'Republican');
      } else {
        query = query.eq('party', party);
      }
    }

    if (type) {
      query = query.ilike('committee_type', `%${type}%`);
    }

    // Only show committees with donations
    query = query.gt('donation_count', 0);

    // Sorting
    const validSortColumns = ['total_received', 'donation_count', 'avg_donation', 'committee_name'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'total_received';
    query = query.order(sortColumn, { ascending: sortDir === 'asc', nullsFirst: false });

    // Pagination
    query = query.range(offset, offset + pageSize - 1);

    const { data: pacs, error, count } = await query;

    if (error) {
      console.error('PACs query error:', error);
      return NextResponse.json(
        { error: 'Database query failed', details: error.message },
        { status: 500 }
      );
    }

    // Calculate stats - paginate to get all rows (Supabase has 1000 row limit)
    const partyBreakdown: Record<string, number> = {};
    const typeBreakdown: Record<string, number> = {};
    let totalAmount = 0;
    let totalDonations = 0;

    const statsData = await getAllPacStats();

    statsData.forEach((p) => {
      totalAmount += Number(p.total_received) || 0;
      totalDonations += Number(p.donation_count) || 0;

      if (p.party) {
        partyBreakdown[p.party] = (partyBreakdown[p.party] || 0) + 1;
      }
      if (p.committee_type) {
        typeBreakdown[p.committee_type] = (typeBreakdown[p.committee_type] || 0) + 1;
      }
    });

    // Transform data
    const formattedPacs: PAC[] = (pacs || []).map((p) => ({
      cmte_id: p.cmte_id,
      name: p.committee_name,
      committee_type: p.committee_type,
      party: p.party,
      total_received: Number(p.total_received) || 0,
      donation_count: Number(p.donation_count) || 0,
      avg_donation: Number(p.avg_donation) || 0,
      donor_states_count: Number(p.donor_states_count) || 0,
      first_donation: p.first_donation,
      last_donation: p.last_donation,
    }));

    const response: PACsResponse = {
      data: formattedPacs,
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
      stats: {
        totalAmount,
        totalDonations,
        partyBreakdown,
        typeBreakdown,
      },
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('PACs API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch PACs' },
      { status: 500 }
    );
  }
}
