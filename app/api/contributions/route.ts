import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export interface Contribution {
  id: string;
  source: 'mn' | 'fec';
  contributor_name: string | null;
  contributor_city: string | null;
  contributor_state: string | null;
  contributor_zip: string | null;
  contributor_employer: string | null;
  contributor_occupation: string | null;
  recipient_name: string | null;
  recipient_committee: string | null;
  amount: number;
  contribution_date: string | null;
  contribution_type: string | null;
  is_fraud_linked: boolean;
  is_actblue: boolean | null;
}

export interface ContributionsSearchResponse {
  data: Contribution[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  stats: {
    totalAmount: number;
    avgAmount: number;
    fraudLinkedCount: number;
    fraudLinkedAmount: number;
    actblueCount: number;
  };
}

async function getContributionStats() {
  try {
    // Get totals from MN donations using RPC
    const { data: mnTotals } = await supabase.rpc('get_donation_totals');
    const mnTotalDonations = mnTotals?.[0]?.total_donations || 0;
    const mnTotalAmount = parseFloat(mnTotals?.[0]?.total_amount || '0');

    // Get top recipients from MN data
    const { data: topRecipients } = await supabase
      .from('political_donations')
      .select('recipient_name, amount')
      .not('recipient_name', 'is', null)
      .order('amount', { ascending: false })
      .limit(5000);

    // Aggregate by recipient
    const recipientTotals = new Map<string, number>();
    topRecipients?.forEach((d: { recipient_name: string; amount: number }) => {
      const current = recipientTotals.get(d.recipient_name) || 0;
      recipientTotals.set(d.recipient_name, current + (d.amount || 0));
    });

    // Sort by total and get top 15
    const topRecipientsList = [...recipientTotals.entries()]
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 15);

    return NextResponse.json({
      totalAmount: mnTotalAmount,
      totalCount: mnTotalDonations,
      topRecipients: topRecipientsList,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({
      totalAmount: 0,
      totalCount: 0,
      topRecipients: [],
    });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Check if requesting summary stats only
  const statsOnly = searchParams.get('stats') === 'true';
  if (statsOnly) {
    return getContributionStats();
  }

  // Pagination
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '50'), 100);
  const offset = (page - 1) * pageSize;

  // Filters
  const search = searchParams.get('search');
  const state = searchParams.get('state');
  const source = searchParams.get('source') || 'all'; // 'mn', 'fec', or 'all'
  const minAmount = searchParams.get('minAmount');
  const maxAmount = searchParams.get('maxAmount');
  const year = searchParams.get('year');
  const fraudLinked = searchParams.get('fraudLinked');
  const actblue = searchParams.get('actblue');
  const sortBy = searchParams.get('sortBy') || 'amount';
  const sortDir = searchParams.get('sortDir') || 'desc';

  try {
    const results: Contribution[] = [];
    let totalCount = 0;

    // Fetch from MN contributions (political_donations table)
    // Note: MN table uses 'receipt_date', 'state', 'year', 'contributor_employer'
    if (source === 'all' || source === 'mn') {
      let mnQuery = supabase
        .from('political_donations')
        .select(`
          id,
          contributor_name,
          contributor_employer,
          contributor_zip,
          recipient_name,
          recipient_type,
          amount,
          receipt_date,
          state,
          year,
          is_fraud_linked
        `, { count: 'estimated' });

      // Apply filters
      if (search) {
        mnQuery = mnQuery.or(`contributor_name.ilike.%${search}%,recipient_name.ilike.%${search}%`);
      }

      if (state) {
        // MN table uses 'state' column for the MN state designation
        mnQuery = mnQuery.eq('state', state.toUpperCase());
      }

      if (minAmount) {
        mnQuery = mnQuery.gte('amount', parseFloat(minAmount));
      }

      if (maxAmount) {
        mnQuery = mnQuery.lte('amount', parseFloat(maxAmount));
      }

      if (year) {
        mnQuery = mnQuery.eq('year', parseInt(year));
      }

      if (fraudLinked === 'true') {
        mnQuery = mnQuery.eq('is_fraud_linked', true);
      }

      // Sorting - map contribution_date to receipt_date for MN
      const sortMapping: Record<string, string> = {
        'amount': 'amount',
        'contribution_date': 'receipt_date',
        'contributor_name': 'contributor_name',
        'recipient_name': 'recipient_name',
      };
      const mnSortColumn = sortMapping[sortBy] || 'amount';
      mnQuery = mnQuery.order(mnSortColumn, { ascending: sortDir === 'asc', nullsFirst: false });

      // Pagination
      mnQuery = mnQuery.range(offset, offset + pageSize - 1);

      const { data: mnData, count: mnCount, error: mnError } = await mnQuery;

      if (mnError) {
        console.error('MN contributions query error:', mnError);
      } else {
        totalCount += mnCount || 0;
        (mnData || []).forEach(d => {
          results.push({
            id: d.id,
            source: 'mn',
            contributor_name: d.contributor_name,
            contributor_city: null, // Not in MN table
            contributor_state: d.state,
            contributor_zip: d.contributor_zip,
            contributor_employer: d.contributor_employer,
            contributor_occupation: null,
            recipient_name: d.recipient_name,
            recipient_committee: d.recipient_type,
            amount: d.amount,
            contribution_date: d.receipt_date,
            contribution_type: null,
            is_fraud_linked: d.is_fraud_linked || false,
            is_actblue: null,
          });
        });
      }
    }

    // Fetch from FEC contributions (if source is 'fec' or 'all')
    if (source === 'fec') {
      let fecQuery = supabase
        .from('fec_contributions')
        .select(`
          id,
          contributor_name,
          contributor_city,
          contributor_state,
          contributor_zip,
          contributor_employer,
          contributor_occupation,
          recipient_name,
          committee_name,
          amount,
          contribution_date,
          transaction_type,
          is_fraud_linked,
          is_actblue
        `, { count: 'estimated' });

      // Apply filters
      if (search) {
        fecQuery = fecQuery.or(`contributor_name.ilike.%${search}%,recipient_name.ilike.%${search}%,committee_name.ilike.%${search}%`);
      }

      if (state) {
        fecQuery = fecQuery.eq('contributor_state', state.toUpperCase());
      }

      if (minAmount) {
        fecQuery = fecQuery.gte('amount', parseFloat(minAmount));
      }

      if (maxAmount) {
        fecQuery = fecQuery.lte('amount', parseFloat(maxAmount));
      }

      if (year) {
        fecQuery = fecQuery.gte('contribution_date', `${year}-01-01`)
          .lte('contribution_date', `${year}-12-31`);
      }

      if (fraudLinked === 'true') {
        fecQuery = fecQuery.eq('is_fraud_linked', true);
      }

      if (actblue === 'true') {
        fecQuery = fecQuery.eq('is_actblue', true);
      } else if (actblue === 'false') {
        fecQuery = fecQuery.eq('is_actblue', false);
      }

      // Sorting
      const validFecSortColumns = ['amount', 'contribution_date', 'contributor_name', 'recipient_name'];
      const fecSortColumn = validFecSortColumns.includes(sortBy) ? sortBy : 'amount';
      fecQuery = fecQuery.order(fecSortColumn, { ascending: sortDir === 'asc', nullsFirst: false });

      // Pagination
      fecQuery = fecQuery.range(offset, offset + pageSize - 1);

      const { data: fecData, count: fecCount, error: fecError } = await fecQuery;

      if (fecError) {
        console.error('FEC contributions query error:', fecError);
      } else {
        totalCount += fecCount || 0;
        (fecData || []).forEach(d => {
          results.push({
            id: d.id,
            source: 'fec',
            contributor_name: d.contributor_name,
            contributor_city: d.contributor_city,
            contributor_state: d.contributor_state,
            contributor_zip: d.contributor_zip,
            contributor_employer: d.contributor_employer,
            contributor_occupation: d.contributor_occupation,
            recipient_name: d.recipient_name,
            recipient_committee: d.committee_name,
            amount: d.amount,
            contribution_date: d.contribution_date,
            contribution_type: d.transaction_type,
            is_fraud_linked: d.is_fraud_linked || false,
            is_actblue: d.is_actblue || false,
          });
        });
      }
    }

    // Calculate stats from current page
    let totalAmount = 0;
    let fraudLinkedCount = 0;
    let fraudLinkedAmount = 0;
    let actblueCount = 0;

    results.forEach(c => {
      totalAmount += c.amount || 0;
      if (c.is_fraud_linked) {
        fraudLinkedCount++;
        fraudLinkedAmount += c.amount || 0;
      }
      if (c.is_actblue) {
        actblueCount++;
      }
    });

    // Sort combined results if source is 'all'
    if (source === 'all') {
      results.sort((a, b) => {
        let aVal: string | number = 0;
        let bVal: string | number = 0;

        switch (sortBy) {
          case 'amount':
            aVal = a.amount || 0;
            bVal = b.amount || 0;
            break;
          case 'contribution_date':
            aVal = a.contribution_date || '';
            bVal = b.contribution_date || '';
            break;
          case 'contributor_name':
            aVal = a.contributor_name || '';
            bVal = b.contributor_name || '';
            break;
          case 'recipient_name':
            aVal = a.recipient_name || '';
            bVal = b.recipient_name || '';
            break;
          default:
            aVal = a.amount || 0;
            bVal = b.amount || 0;
        }

        if (sortDir === 'asc') {
          return aVal > bVal ? 1 : -1;
        }
        return aVal < bVal ? 1 : -1;
      });
    }

    const response: ContributionsSearchResponse = {
      data: results.slice(0, pageSize), // Limit to pageSize
      total: totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
      stats: {
        totalAmount,
        avgAmount: results.length > 0 ? totalAmount / results.length : 0,
        fraudLinkedCount,
        fraudLinkedAmount,
        actblueCount,
      },
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Contributions API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contributions' },
      { status: 500 }
    );
  }
}
