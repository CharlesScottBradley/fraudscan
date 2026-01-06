import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export interface WAProviderDetail {
  id: string;
  provider_sf_id: string;
  license_number: string | null;
  provider_numeric_id: string | null;
  display_name: string | null;
  license_name: string | null;
  address: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string;
  zip_code: string | null;
  county: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  provider_status: string | null;
  license_status: string | null;
  facility_type: string | null;
  license_type: string | null;
  regulation_type: string | null;
  regulation_authority: string | null;
  licensed_capacity: number | null;
  total_available_slots: number | null;
  ages_raw: string | null;
  age_min_months: number | null;
  age_max_months: number | null;
  school_district: string | null;
  languages_spoken: string[];
  languages_of_instruction: string[];
  hours: Array<{
    day: string;
    open_time: string | null;
    close_time: string | null;
    raw: string | null;
  }> | null;
  primary_contact_name: string | null;
  early_achievers_status: string | null;
  early_achievers_specializations: string[];
  head_start: boolean;
  early_head_start: boolean;
  eceap: boolean;
  food_program_participation: string | null;
  subsidy_participation: string | null;
  tribal_information: string | null;
  certifications: string[];
  source_url: string | null;
  fetched_at: string | null;
  created_at: string;
  updated_at: string;
  // Related data
  contacts: Array<{
    id: string;
    full_name: string | null;
    role: string | null;
    email: string | null;
    phone: string | null;
    start_date: string | null;
  }>;
  inspections: Array<{
    id: string;
    inspection_date: string | null;
    inspection_type: string | null;
    checklist_type: string | null;
    document_url: string | null;
  }>;
  complaints: Array<{
    id: string;
    complaint_id: string | null;
    compliance_issue_descriptions: string | null;
    serious_injury_field: string | null;
    valid_issues_count: number | null;
    complaint_resolution: string | null;
    received_on: string | null;
    resolved_on: string | null;
    self_reported: boolean;
    document_url: string | null;
  }>;
  license_history: Array<{
    id: string;
    license_id: string | null;
    regulation_type: string | null;
    regulation_authority: string | null;
    facility_type: string | null;
    license_type: string | null;
    license_status: string | null;
    license_issue_date: string | null;
    license_closure_date: string | null;
    license_status_reason: string | null;
  }>;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Get provider by ID or provider_sf_id
    let query = supabase
      .from('wa_childcare_providers')
      .select('*');

    // Check if it's a UUID or Salesforce ID
    if (id.length === 18 && id.startsWith('00')) {
      // Salesforce ID format
      query = query.eq('provider_sf_id', id);
    } else if (id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      // UUID format
      query = query.eq('id', id);
    } else {
      // Try license number
      query = query.eq('license_number', id);
    }

    const { data: provider, error: providerError } = await query.single();

    if (providerError || !provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    // Get related data in parallel
    const [
      { data: contacts },
      { data: inspections },
      { data: complaints },
      { data: licenseHistory }
    ] = await Promise.all([
      supabase
        .from('wa_provider_contacts')
        .select('id, full_name, role, email, phone, start_date')
        .eq('provider_id', provider.id)
        .order('role', { ascending: true }),
      supabase
        .from('wa_provider_inspections')
        .select('id, inspection_date, inspection_type, checklist_type, document_url')
        .eq('provider_id', provider.id)
        .order('inspection_date', { ascending: false }),
      supabase
        .from('wa_provider_complaints')
        .select('id, complaint_id, compliance_issue_descriptions, serious_injury_field, valid_issues_count, complaint_resolution, received_on, resolved_on, self_reported, document_url')
        .eq('provider_id', provider.id)
        .order('received_on', { ascending: false }),
      supabase
        .from('wa_license_history')
        .select('id, license_id, regulation_type, regulation_authority, facility_type, license_type, license_status, license_issue_date, license_closure_date, license_status_reason')
        .eq('provider_id', provider.id)
        .order('license_issue_date', { ascending: false })
    ]);

    const response: WAProviderDetail = {
      ...provider,
      contacts: contacts || [],
      inspections: inspections || [],
      complaints: complaints || [],
      license_history: licenseHistory || []
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error('WA Childcare detail API error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
