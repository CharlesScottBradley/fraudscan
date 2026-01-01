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
  fraud_connection_count: number;
  total_fraud_linked_amount: number;
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
    fraudLinkedCount: number;
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
  const hasFraudLinks = searchParams.get('hasFraudLinks');
  const isCurrent = searchParams.get('isCurrent');
  const sortBy = searchParams.get('sortBy') || 'state';
  const sortDir = searchParams.get('sortDir') || 'asc';

  try {
    // Build query - use only columns that exist in the table
    // Note: politicians table may have different columns than schema.sql defines
    let query = supabase
      .from('politicians')
      .select(`*`, { count: 'exact' });

    // Apply filters
    if (state) {
      query = query.eq('state', state.toUpperCase());
    }

    if (party) {
      // Support single letter or full party name
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

    // Note: is_current filter removed - column may not exist in actual table

    // Sorting - use only columns that are likely to exist
    const validSortColumns = ['state', 'party', 'office_type', 'created_at'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
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

    // Get political connections (fraud links) for these politicians
    const politicianIds = (politicians || []).map(p => p.id);
    let fraudConnections: Record<string, { count: number; amount: number }> = {};

    if (politicianIds.length > 0) {
      const { data: connections } = await supabase
        .from('political_connections')
        .select('politician_id, total_amount, case_id')
        .in('politician_id', politicianIds)
        .not('case_id', 'is', null);

      connections?.forEach(c => {
        if (!fraudConnections[c.politician_id]) {
          fraudConnections[c.politician_id] = { count: 0, amount: 0 };
        }
        fraudConnections[c.politician_id].count++;
        fraudConnections[c.politician_id].amount += c.total_amount || 0;
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
    let fraudLinkedCount = 0;

    const enrichedPoliticians: Politician[] = (politicians || []).map((p) => {
      // Get name from people lookup
      const peopleName = p.person_id ? personNames[p.person_id] || null : null;

      const fraudData = fraudConnections[p.id] || { count: 0, amount: 0 };

      if (p.party) {
        partyBreakdown[p.party] = (partyBreakdown[p.party] || 0) + 1;
      }
      if (p.office_type) {
        officeBreakdown[p.office_type] = (officeBreakdown[p.office_type] || 0) + 1;
      }
      if (fraudData.count > 0) {
        fraudLinkedCount++;
      }

      return {
        id: p.id,
        person_id: p.person_id,
        name: peopleName,
        office_type: p.office_type,
        office_title: p.office_title,
        state: p.state,
        district: p.district,
        party: p.party,
        current_term_start: p.current_term_start,
        current_term_end: p.current_term_end,
        is_current: p.is_current,
        fec_candidate_id: p.fec_candidate_id,
        bioguide_id: p.bioguide_id,
        opensecrets_id: p.opensecrets_id,
        photo_url: p.photo_url,
        website: p.website,
        fraud_connection_count: fraudData.count,
        total_fraud_linked_amount: fraudData.amount,
      };
    });

    // Filter by search (on processed name)
    let filteredPoliticians = enrichedPoliticians;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredPoliticians = enrichedPoliticians.filter(p =>
        p.name?.toLowerCase().includes(searchLower) ||
        p.state?.toLowerCase().includes(searchLower) ||
        p.office_title?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by fraud links
    if (hasFraudLinks === 'true') {
      filteredPoliticians = filteredPoliticians.filter(p => p.fraud_connection_count > 0);
    } else if (hasFraudLinks === 'false') {
      filteredPoliticians = filteredPoliticians.filter(p => p.fraud_connection_count === 0);
    }

    const response: PoliticiansSearchResponse = {
      data: filteredPoliticians,
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
      stats: {
        partyBreakdown,
        officeBreakdown,
        fraudLinkedCount,
      },
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Politicians API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch politicians' },
      { status: 500 }
    );
  }
}
