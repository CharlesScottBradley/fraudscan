import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ state: string }> }
) {
  const { state } = await params;
  const stateUpper = state.toUpperCase();

  // Get state public records law info
  const { data: stateInfo, error: stateError } = await supabase
    .from('state_public_records')
    .select('*')
    .eq('state_code', stateUpper)
    .single();

  if (stateError || !stateInfo) {
    // Check if any states exist
    const { data: availableStates } = await supabase
      .from('state_public_records')
      .select('state_code, state_name')
      .eq('is_complete', true);

    return NextResponse.json({
      error: `No FOIA data available for ${stateUpper}`,
      message: 'This state has not been researched yet',
      available_states: availableStates || [],
    }, { status: 404 });
  }

  // Get agency contacts for this state
  const { data: agencies } = await supabase
    .from('foia_agency_contacts')
    .select('*')
    .eq('state_code', stateUpper)
    .order('agency_type');

  // Get request templates
  const { data: templates } = await supabase
    .from('foia_request_templates')
    .select('*')
    .eq('is_active', true)
    .order('display_order');

  // Group agencies by type
  const agenciesByType: Record<string, typeof agencies> = {};
  agencies?.forEach(agency => {
    const type = agency.agency_type || 'general';
    if (!agenciesByType[type]) {
      agenciesByType[type] = [];
    }
    agenciesByType[type].push(agency);
  });

  return NextResponse.json({
    state: {
      code: stateInfo.state_code,
      name: stateInfo.state_name,
      law: {
        name: stateInfo.law_name,
        shortName: stateInfo.law_short_name,
        citation: stateInfo.law_citation,
        url: stateInfo.law_url,
      },
      response: {
        days: stateInfo.response_days,
        notes: stateInfo.response_notes,
      },
      fees: {
        statute: stateInfo.fee_statute,
        notes: stateInfo.fee_notes,
      },
      appeal: {
        body: stateInfo.appeal_body,
        email: stateInfo.appeal_email,
        phone: stateInfo.appeal_phone,
        notes: stateInfo.appeal_notes,
      },
      tips: stateInfo.tips || [],
      denialRemedies: stateInfo.denial_remedies || [],
      salutation: stateInfo.salutation,
      closingText: stateInfo.closing_text,
      isComplete: stateInfo.is_complete,
    },
    agencies: agencies || [],
    agenciesByType,
    templates: templates || [],
  });
}

