import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// US State codes for validation
const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
];

const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
  MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
  OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  DC: 'District of Columbia'
};

export interface StateGapsResponse {
  state_code: string;
  state_name: string;
  gaps: Array<{
    id: string;
    data_type: string;
    category: string | null;
    priority: string;
    difficulty: string;
    status: string;
    title: string;
    description: string | null;
    source_urls: Array<{ url: string; label: string }>;
    acquisition_method: string | null;
    requires_foia: boolean;
    foia_agency: string | null;
    foia_template_key: string | null;
    required_fields: string[];
    submissions_count: number;
    last_submission_at: string | null;
    completed_at: string | null;
    completed_by: string | null;
  }>;
  completion: {
    total: number;
    completed: number;
    partial: number;
    needed: number;
    completionPct: number;
    criticalNeeded: number;
  };
  submissions_count: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ state: string }> }
) {
  const { state } = await params;
  const stateCode = state.toUpperCase();

  // Validate state code
  if (!US_STATES.includes(stateCode)) {
    return NextResponse.json(
      { error: 'Invalid state code' },
      { status: 400 }
    );
  }

  try {
    // Fetch gaps for this state
    const { data: gaps, error: gapsError } = await supabase
      .from('state_data_gaps')
      .select('*')
      .eq('state_code', stateCode)
      .eq('is_active', true)
      .order('priority', { ascending: true })
      .order('display_order', { ascending: true });

    if (gapsError) {
      console.error('Error fetching state gaps:', gapsError);
      return NextResponse.json(
        { error: 'Failed to fetch state data gaps' },
        { status: 500 }
      );
    }

    // Fetch submission count for this state
    const { count: submissionsCount, error: submissionsError } = await supabase
      .from('crowdsource_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('state_code', stateCode)
      .eq('is_public', true);

    if (submissionsError) {
      console.error('Error fetching submissions count:', submissionsError);
    }

    // Calculate completion stats
    const total = gaps?.length || 0;
    const completed = gaps?.filter(g => g.status === 'complete').length || 0;
    const partial = gaps?.filter(g => g.status === 'partial').length || 0;
    const needed = gaps?.filter(g => g.status === 'needed').length || 0;
    const criticalNeeded = gaps?.filter(g => g.priority === 'critical' && g.status !== 'complete').length || 0;
    const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;

    const response: StateGapsResponse = {
      state_code: stateCode,
      state_name: STATE_NAMES[stateCode] || stateCode,
      gaps: gaps || [],
      completion: {
        total,
        completed,
        partial,
        needed,
        completionPct,
        criticalNeeded,
      },
      submissions_count: submissionsCount || 0,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('State gaps API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

