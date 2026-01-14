import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // First get the politician's bioguide_id
  const { data: politician, error: politicianError } = await supabase
    .from('politicians')
    .select('id, bioguide_id, full_name')
    .eq('id', id)
    .single();

  if (politicianError || !politician) {
    return NextResponse.json({ error: 'Politician not found' }, { status: 404 });
  }

  const bioguideId = politician.bioguide_id;

  // If no bioguide_id, return empty results
  if (!bioguideId) {
    return NextResponse.json({
      votes: [],
      stats: {
        totalVotes: 0,
        yeaCount: 0,
        nayCount: 0,
        yeaPercent: 0,
        recentBills: 0
      }
    });
  }

  // Get member votes with roll call info
  // Using a raw query approach since we need to join tables
  const { data: votesData, error: votesError } = await supabase
    .from('member_votes')
    .select(`
      id,
      vote,
      member_name,
      roll_call_id
    `)
    .eq('member_id', bioguideId)
    .order('roll_call_id', { ascending: false })
    .limit(100);

  if (votesError) {
    return NextResponse.json({ error: votesError.message }, { status: 500 });
  }

  // Get roll call details for these votes
  const rollCallIds = [...new Set(votesData?.map(v => v.roll_call_id) || [])];
  let rollCallMap = new Map<number, {
    vote_date: string;
    vote_question: string;
    vote_description: string;
    vote_result: string;
    bill_id: string | null;
    bill_type: string | null;
    bill_number: number | null;
    chamber: string;
  }>();

  if (rollCallIds.length > 0) {
    const { data: rollCalls } = await supabase
      .from('roll_call_votes')
      .select(`
        id,
        vote_date,
        vote_question,
        vote_description,
        vote_result,
        bill_id,
        bill_type,
        bill_number,
        chamber
      `)
      .in('id', rollCallIds);

    if (rollCalls) {
      rollCalls.forEach(rc => rollCallMap.set(rc.id, {
        vote_date: rc.vote_date,
        vote_question: rc.vote_question,
        vote_description: rc.vote_description,
        vote_result: rc.vote_result,
        bill_id: rc.bill_id,
        bill_type: rc.bill_type,
        bill_number: rc.bill_number,
        chamber: rc.chamber
      }));
    }
  }

  // Get bill titles for votes that have bill_ids
  const billIds = [...new Set(
    Array.from(rollCallMap.values())
      .filter(rc => rc.bill_id)
      .map(rc => rc.bill_id)
  )];

  let billMap = new Map<string, { title: string; short_title: string | null }>();

  if (billIds.length > 0) {
    const { data: bills } = await supabase
      .from('congressional_bills')
      .select('bill_id, title, short_title')
      .in('bill_id', billIds);

    if (bills) {
      bills.forEach(b => billMap.set(b.bill_id, {
        title: b.title,
        short_title: b.short_title
      }));
    }
  }

  // Enrich votes with roll call and bill info
  const enrichedVotes = (votesData || []).map(v => {
    const rollCall = rollCallMap.get(v.roll_call_id);
    const bill = rollCall?.bill_id ? billMap.get(rollCall.bill_id) : null;

    return {
      id: v.id,
      vote: v.vote,
      voteDate: rollCall?.vote_date || null,
      voteQuestion: rollCall?.vote_question || null,
      voteDescription: rollCall?.vote_description || null,
      voteResult: rollCall?.vote_result || null,
      billId: rollCall?.bill_id || null,
      billType: rollCall?.bill_type || null,
      billNumber: rollCall?.bill_number || null,
      billTitle: bill?.short_title || bill?.title || null,
      chamber: rollCall?.chamber || null
    };
  });

  // Calculate stats from all votes
  const { data: allVotes, error: allVotesError } = await supabase
    .from('member_votes')
    .select('vote')
    .eq('member_id', bioguideId);

  let stats = {
    totalVotes: 0,
    yeaCount: 0,
    nayCount: 0,
    presentCount: 0,
    notVotingCount: 0,
    yeaPercent: 0
  };

  if (!allVotesError && allVotes) {
    stats.totalVotes = allVotes.length;
    stats.yeaCount = allVotes.filter(v => v.vote === 'Yea' || v.vote === 'Yes' || v.vote === 'Aye').length;
    stats.nayCount = allVotes.filter(v => v.vote === 'Nay' || v.vote === 'No').length;
    stats.presentCount = allVotes.filter(v => v.vote === 'Present').length;
    stats.notVotingCount = allVotes.filter(v => v.vote === 'Not Voting').length;

    const votedCount = stats.yeaCount + stats.nayCount;
    stats.yeaPercent = votedCount > 0 ? Math.round((stats.yeaCount / votedCount) * 100) : 0;
  }

  return NextResponse.json({
    votes: enrichedVotes,
    stats
  });
}
