import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export interface BudgetJurisdiction {
  id: string;
  name: string;
  type: string;
  state_id: string;
  state_name: string | null;
  fips_code: string | null;
  population: number | null;
  website_url: string | null;
  org_count: number;
  ppp_loan_count: number;
  ppp_loan_total: number;
  childcare_count: number;
  budget_doc_count?: number;
  // Extracted budget data
  total_budget_revenue?: number | null;
  total_budget_expenditure?: number | null;
  budget_fiscal_year?: string | null;
  budget_confidence?: number | null;
}

export interface BudgetDocument {
  id: number;
  jurisdiction_id: string;
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
  jurisdiction?: BudgetJurisdiction;
}

export interface BudgetsSearchResponse {
  jurisdictions?: BudgetJurisdiction[];
  documents?: BudgetDocument[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  stats: {
    totalJurisdictions: number;
    totalDocuments: number;
    totalOrgCount: number;
    totalPPPAmount: number;
    statesWithData: number;
    totalBudgetExpenditure: number;
    extractedCount: number;
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Pagination
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '50'), 100);
  const offset = (page - 1) * pageSize;

  // View mode: 'jurisdictions' (default) or 'documents'
  const view = searchParams.get('view') || 'jurisdictions';

  // Filters
  const search = searchParams.get('search');
  const state = searchParams.get('state');
  const type = searchParams.get('type'); // 'county', 'city'
  const fiscalYear = searchParams.get('fiscalYear');
  const minOrgCount = searchParams.get('minOrgCount');
  const maxOrgCount = searchParams.get('maxOrgCount');
  const minPPP = searchParams.get('minPPP');
  const maxPPP = searchParams.get('maxPPP');
  const minPopulation = searchParams.get('minPopulation');
  const hasOrgs = searchParams.get('hasOrgs'); // 'true' to filter for jurisdictions with orgs
  const hasPPP = searchParams.get('hasPPP'); // 'true' to filter for jurisdictions with PPP
  const hasBudgets = searchParams.get('hasBudgets'); // 'true' to filter for jurisdictions with budget docs
  const sortBy = searchParams.get('sortBy') || 'org_count';
  const sortDir = searchParams.get('sortDir') || 'desc';

  try {
    if (view === 'documents') {
      // Return budget documents with jurisdiction info
      let query = supabase
        .from('budget_documents')
        .select(`
          id,
          jurisdiction_id,
          fiscal_year,
          document_type,
          document_subtype,
          title,
          download_url,
          source_url,
          file_size_bytes,
          pdf_page_count,
          is_scanned,
          status,
          budget_jurisdictions (
            id,
            name,
            type,
            state_id,
            population,
            org_count,
            ppp_loan_count,
            ppp_loan_total
          )
        `, { count: 'exact' });

      if (search) {
        query = query.or(`title.ilike.%${search}%,jurisdiction_id.ilike.%${search}%`);
      }

      if (fiscalYear) {
        query = query.eq('fiscal_year', fiscalYear);
      }

      // Sort
      const validSortColumns = ['fiscal_year', 'title', 'file_size_bytes', 'pdf_page_count'];
      const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'fiscal_year';
      query = query.order(sortColumn, { ascending: sortDir === 'asc' });

      query = query.range(offset, offset + pageSize - 1);

      const { data: documents, error, count } = await query;

      if (error) {
        console.error('Budget documents query error:', error);
        throw error;
      }

      // Transform documents to flatten jurisdiction (Supabase returns array for relations)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const transformedDocs = (documents || []).map((doc: any) => {
        const { budget_jurisdictions, ...rest } = doc;
        return {
          ...rest,
          jurisdiction: Array.isArray(budget_jurisdictions) ? budget_jurisdictions[0] : budget_jurisdictions
        } as BudgetDocument;
      });

      const response: BudgetsSearchResponse = {
        documents: transformedDocs,
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
        stats: {
          totalJurisdictions: 0,
          totalDocuments: count || 0,
          totalOrgCount: 0,
          totalPPPAmount: 0,
          statesWithData: 0,
          totalBudgetExpenditure: 0,
          extractedCount: 0,
        }
      };

      return NextResponse.json(response);

    } else {
      // Return jurisdictions with budget totals (using cached columns)
      let query = supabase
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
          org_count,
          ppp_loan_count,
          ppp_loan_total,
          childcare_count,
          total_budget_revenue,
          total_budget_expenditure,
          budget_fiscal_year,
          budget_confidence
        `, { count: 'exact' });

      // Apply filters
      if (search) {
        query = query.or(`name.ilike.%${search}%,id.ilike.%${search}%`);
      }

      if (state) {
        query = query.eq('state_id', state.toLowerCase());
      }

      if (type) {
        query = query.eq('type', type);
      }

      if (minOrgCount) {
        query = query.gte('org_count', parseInt(minOrgCount));
      }

      if (maxOrgCount) {
        query = query.lte('org_count', parseInt(maxOrgCount));
      }

      if (minPPP) {
        query = query.gte('ppp_loan_total', parseFloat(minPPP));
      }

      if (maxPPP) {
        query = query.lte('ppp_loan_total', parseFloat(maxPPP));
      }

      if (minPopulation) {
        query = query.gte('population', parseInt(minPopulation));
      }

      if (hasOrgs === 'true') {
        query = query.gt('org_count', 0);
      }

      if (hasPPP === 'true') {
        query = query.gt('ppp_loan_count', 0);
      }

      // Filter for jurisdictions with extracted budget data
      if (hasBudgets === 'true') {
        query = query.not('total_budget_expenditure', 'is', null);
      }

      // Sort - default to budget size for jurisdictions with budgets
      const validSortColumns = ['org_count', 'ppp_loan_count', 'ppp_loan_total', 'population', 'name', 'childcare_count', 'total_budget_expenditure'];
      const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'total_budget_expenditure';
      query = query.order(sortColumn, { ascending: sortDir === 'asc', nullsFirst: false });

      query = query.range(offset, offset + pageSize - 1);

      const { data: jurisdictions, error, count } = await query;

      if (error) {
        console.error('Budget jurisdictions query error:', error);
        throw error;
      }

      // Calculate stats
      let totalOrgCount = 0;
      let totalPPPAmount = 0;
      let totalBudgetExpenditure = 0;
      let extractedCount = 0;
      const stateSet = new Set<string>();

      (jurisdictions || []).forEach(j => {
        totalOrgCount += j.org_count || 0;
        totalPPPAmount += j.ppp_loan_total || 0;
        if (j.total_budget_expenditure) {
          totalBudgetExpenditure += j.total_budget_expenditure;
          extractedCount++;
        }
        stateSet.add(j.state_id);
      });

      // Get total document count
      const { count: docCount } = await supabase
        .from('budget_documents')
        .select('id', { count: 'exact', head: true });

      const response: BudgetsSearchResponse = {
        jurisdictions: jurisdictions || [],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
        stats: {
          totalJurisdictions: count || 0,
          totalDocuments: docCount || 0,
          totalOrgCount,
          totalPPPAmount,
          statesWithData: stateSet.size,
          totalBudgetExpenditure,
          extractedCount,
        }
      };

      return NextResponse.json(response);
    }

  } catch (error) {
    console.error('Budgets API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch budget data' },
      { status: 500 }
    );
  }
}
