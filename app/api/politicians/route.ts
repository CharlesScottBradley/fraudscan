import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export interface Politician {
  id: string;
  person_id: string | null;
  name: string | null; // Joined from people table
  office_type: string | null;
  office_title: string | null;
  state: string | null;
  district: string | null;
  party: string | null;
  current_term_start: string | null;
  current_term_end: string | null;
  is_current: boolean | null;
  fec_candidate_id: string | null;
  bioguide_id: string | null;
  opensecrets_id: string | null;
  photo_url: string | null;
  website: string | null;
  contribution_count: number;
  total_contributions: number;
}

export interface PoliticiansSearchResponse {
  data: Politician[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  stats: {
    partyBreakdown: Record<string, number>;
    officeBreakdown: Record<string, number>;
    totalContributions: number;
    totalContributionAmount: number;
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Check if only requesting available states
  if (searchParams.get('statesOnly') === 'true') {
    const { data } = await supabase
      .from('politicians')
      .select('state')
      .not('state', 'is', null);

    const uniqueStates = [...new Set(data?.map(p => p.state) || [])].sort();
    return NextResponse.json({ states: uniqueStates });
  }

  // Pagination
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '50'), 100);
  const offset = (page - 1) * pageSize;

  // Filters
  const search = searchParams.get('search');
  const state = searchParams.get('state');
  const party = searchParams.get('party');
  const office = searchParams.get('office');
  // hasFraudLinks filter removed - no longer tracking fraud connections
  const isCurrent = searchParams.get('isCurrent');
  const sortBy = searchParams.get('sortBy') || 'contributions';
  const sortDir = searchParams.get('sortDir') || 'desc';

  try {
    // When sorting by contributions, use the materialized view (already sorted correctly)
    if (sortBy === 'contributions') {
      let mvQuery = supabase
        .from('top_politicians_by_contributions')
        .select('*', { count: 'exact' });

      // Apply filters to materialized view
      if (state) {
        mvQuery = mvQuery.eq('state', state.toUpperCase());
      }
      if (party) {
        const partyUpper = party.toUpperCase();
        if (partyUpper === 'D' || partyUpper === 'DEMOCRAT' || partyUpper === 'DEMOCRATIC') {
          mvQuery = mvQuery.or('party.ilike.%democrat%,party.eq.D');
        } else if (partyUpper === 'R' || partyUpper === 'REPUBLICAN') {
          mvQuery = mvQuery.or('party.ilike.%republican%,party.eq.R');
        } else if (partyUpper === 'I' || partyUpper === 'INDEPENDENT') {
          mvQuery = mvQuery.or('party.ilike.%independent%,party.eq.I');
        } else {
          mvQuery = mvQuery.ilike('party', `%${party}%`);
        }
      }
      if (office) {
        mvQuery = mvQuery.eq('office_type', office.toLowerCase());
      }
      if (search) {
        mvQuery = mvQuery.or(`full_name.ilike.%${search}%,state.ilike.%${search}%`);
      }

      // Sort and paginate
      mvQuery = mvQuery.order('total_amount', { ascending: sortDir === 'asc' });
      mvQuery = mvQuery.range(offset, offset + pageSize - 1);

      const { data: topPoliticians, error: mvError, count } = await mvQuery;

      if (mvError) {
        console.error('Materialized view query error:', mvError);
        return NextResponse.json(
          { error: 'Database query failed', details: mvError.message },
          { status: 500 }
        );
      }

      // Transform materialized view data to Politician format
      const partyBreakdown: Record<string, number> = {};
      const officeBreakdown: Record<string, number> = {};
      let totalContributions = 0;
      let totalContributionAmount = 0;

      const politicians: Politician[] = (topPoliticians || []).map((p) => {
        if (p.party) partyBreakdown[p.party] = (partyBreakdown[p.party] || 0) + 1;
        if (p.office_type) officeBreakdown[p.office_type] = (officeBreakdown[p.office_type] || 0) + 1;
        totalContributions += Number(p.contribution_count) || 0;
        totalContributionAmount += Number(p.total_amount) || 0;

        return {
          id: p.politician_id,
          person_id: null,
          name: p.full_name,
          office_type: p.office_type,
          office_title: p.office_title,
          state: p.state,
          district: null,
          party: p.party,
          current_term_start: null,
          current_term_end: null,
          is_current: null,
          fec_candidate_id: null,
          bioguide_id: null,
          opensecrets_id: null,
          photo_url: null,
          website: null,
          contribution_count: Number(p.contribution_count) || 0,
          total_contributions: Number(p.total_amount) || 0,
        };
      });

      return NextResponse.json({
        data: politicians,
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
        stats: {
          partyBreakdown,
          officeBreakdown,
          totalContributions,
          totalContributionAmount,
        },
        _version: 'v4-mv-sort',
        _source: 'materialized_view'
      });
    }

    // For other sort options, use the regular politicians table
    let query = supabase
      .from('politicians')
      .select(`
        id, person_id, full_name, office_type, office_title, state, district, party,
        current_term_start, current_term_end, is_incumbent, fec_candidate_id,
        bioguide_id, opensecrets_id, photo_url, website
      `, { count: 'exact' });

    // Apply filters
    if (state) {
      query = query.eq('state', state.toUpperCase());
    }

    if (party) {
      const partyUpper = party.toUpperCase();
      if (partyUpper === 'D' || partyUpper === 'DEMOCRAT' || partyUpper === 'DEMOCRATIC') {
        query = query.or('party.ilike.%democrat%,party.eq.D');
      } else if (partyUpper === 'R' || partyUpper === 'REPUBLICAN') {
        query = query.or('party.ilike.%republican%,party.eq.R');
      } else if (partyUpper === 'I' || partyUpper === 'INDEPENDENT') {
        query = query.or('party.ilike.%independent%,party.eq.I');
      } else {
        query = query.ilike('party', `%${party}%`);
      }
    }

    if (office) {
      query = query.eq('office_type', office.toLowerCase());
    }

    // Sorting for non-contribution sorts
    const validSortColumns = ['state', 'party', 'office_type', 'full_name'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'state';
    query = query.order(sortColumn, { ascending: sortDir === 'asc', nullsFirst: false });

    // Pagination
    query = query.range(offset, offset + pageSize - 1);

    const { data: politicians, error, count } = await query;

    if (error) {
      console.error('Politicians query error:', error);
      return NextResponse.json(
        { error: 'Database query failed', details: error.message },
        { status: 500 }
      );
    }

    // Get contribution stats for these politicians using RPC function
    const politicianIds = (politicians || []).map(p => p.id);
    let contributionStats: Record<string, { count: number; amount: number }> = {};

    if (politicianIds.length > 0) {
      const { data: stats } = await supabase.rpc('get_politicians_contribution_stats', {
        politician_ids: politicianIds
      });

      stats?.forEach((s: { politician_id: string; contribution_count: number; total_amount: number }) => {
        contributionStats[s.politician_id] = {
          count: Number(s.contribution_count) || 0,
          amount: Number(s.total_amount) || 0
        };
      });
    }

    // Get names from people table for politicians with person_id
    const personIds = (politicians || []).map(p => p.person_id).filter(Boolean);
    let personNames: Record<string, string> = {};

    if (personIds.length > 0) {
      const { data: people } = await supabase
        .from('people')
        .select('id, full_name')
        .in('id', personIds);

      people?.forEach(person => {
        personNames[person.id] = person.full_name;
      });
    }

    // Process results
    const partyBreakdown: Record<string, number> = {};
    const officeBreakdown: Record<string, number> = {};
    let totalContributions = 0;
    let totalContributionAmount = 0;

    const enrichedPoliticians: Politician[] = (politicians || []).map((p) => {
      const peopleName = p.person_id ? personNames[p.person_id] || null : null;
      const contribData = contributionStats[p.id] || { count: 0, amount: 0 };

      if (p.party) partyBreakdown[p.party] = (partyBreakdown[p.party] || 0) + 1;
      if (p.office_type) officeBreakdown[p.office_type] = (officeBreakdown[p.office_type] || 0) + 1;
      totalContributions += contribData.count;
      totalContributionAmount += contribData.amount;

      const name = p.full_name || peopleName || null;

      return {
        id: p.id,
        person_id: p.person_id,
        name,
        office_type: p.office_type,
        office_title: p.office_title,
        state: p.state,
        district: p.district,
        party: p.party,
        current_term_start: p.current_term_start,
        current_term_end: p.current_term_end,
        is_current: p.is_incumbent,
        fec_candidate_id: p.fec_candidate_id,
        bioguide_id: p.bioguide_id,
        opensecrets_id: p.opensecrets_id,
        photo_url: p.photo_url,
        website: p.website,
        contribution_count: contribData.count,
        total_contributions: contribData.amount,
      };
    });

    // Filter out politicians without names
    let filteredPoliticians = enrichedPoliticians.filter(p => p.name && p.name.trim() !== '');

    // Filter by search (on processed name)
    if (search) {
      const searchLower = search.toLowerCase();
      filteredPoliticians = filteredPoliticians.filter(p =>
        p.name?.toLowerCase().includes(searchLower) ||
        p.state?.toLowerCase().includes(searchLower) ||
        p.office_title?.toLowerCase().includes(searchLower)
      );
    }

    return NextResponse.json({
      data: filteredPoliticians,
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
      stats: {
        partyBreakdown,
        officeBreakdown,
        totalContributions,
        totalContributionAmount,
      },
      _version: 'v4-table-sort',
      _source: 'politicians_table'
    });

  } catch (error) {
    console.error('Politicians API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch politicians' },
      { status: 500 }
    );
  }
}
