import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export interface JurisdictionDetail {
  id: string;
  name: string;
  type: string;
  state_id: string;
  state_name: string | null;
  fips_code: string | null;
  population: number | null;
  website_url: string | null;
  budget_page_url: string | null;
  org_count: number;
  ppp_loan_count: number;
  ppp_loan_total: number;
  childcare_count: number;
  budget_documents: Array<{
    id: number;
    fiscal_year: string;
    document_type: string;
    document_subtype: string | null;
    title: string;
    download_url: string;
    source_url: string | null;
    file_size_bytes: number | null;
    pdf_page_count: number | null;
    is_scanned: boolean | null;
    status: string;
  }>;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Get jurisdiction with budget documents
    const { data: jurisdiction, error } = await supabase
      .from('budget_jurisdictions')
      .select(`
        id,
        name,
        type,
        state_id,
        state_name,
        fips_code,
        population,
        website_url,
        budget_page_url,
        org_count,
        ppp_loan_count,
        ppp_loan_total,
        childcare_count,
        budget_documents (
          id,
          fiscal_year,
          document_type,
          document_subtype,
          title,
          download_url,
          source_url,
          file_size_bytes,
          pdf_page_count,
          is_scanned,
          status
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Jurisdiction not found' },
          { status: 404 }
        );
      }
      console.error('Jurisdiction query error:', error);
      throw error;
    }

    // Get sample organizations from this jurisdiction
    let orgsQuery;
    if (jurisdiction.type === 'county') {
      orgsQuery = supabase
        .from('organizations')
        .select('id, name, city, state, ppp_loan_count, total_ppp_amount')
        .ilike('county', jurisdiction.name.replace(/\s+County$/i, ''))
        .eq('state', jurisdiction.state_id.toUpperCase())
        .order('total_ppp_amount', { ascending: false, nullsFirst: false })
        .limit(10);
    } else if (jurisdiction.type === 'city') {
      const cityName = jurisdiction.name.replace(/^City of\s+/i, '');
      orgsQuery = supabase
        .from('organizations')
        .select('id, name, city, state, ppp_loan_count, total_ppp_amount')
        .ilike('city', cityName)
        .eq('state', jurisdiction.state_id.toUpperCase())
        .order('total_ppp_amount', { ascending: false, nullsFirst: false })
        .limit(10);
    }

    const { data: sampleOrgs } = orgsQuery ? await orgsQuery : { data: [] };

    return NextResponse.json({
      ...jurisdiction,
      sample_organizations: sampleOrgs || []
    });

  } catch (error) {
    console.error('Jurisdiction detail API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jurisdiction details' },
      { status: 500 }
    );
  }
}
