import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  extractBudgetFromPDF,
  saveBudgetExtraction,
  ExtractedBudgetData
} from '@/lib/budgetExtractor';

export const runtime = 'nodejs';
export const maxDuration = 120; // 2 minute timeout for PDF processing

interface ExtractRequest {
  document_id: number;
  force?: boolean;
}

interface ExtractResponse {
  success: boolean;
  document_id: number;
  data?: ExtractedBudgetData;
  error?: string;
  processingTimeMs?: number;
}

// POST /api/budgets/extract - Extract budget data from a single document
export async function POST(request: Request): Promise<Response> {
  try {
    // Simple API key check (you may want to use your existing auth)
    const authHeader = request.headers.get('authorization');
    const apiKey = authHeader?.replace('Bearer ', '') || request.headers.get('x-api-key');

    // Allow if service role key or a configured extraction key
    const validKeys = [
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      process.env.BUDGET_EXTRACTION_API_KEY
    ].filter(Boolean);

    if (!apiKey || !validKeys.includes(apiKey)) {
      return NextResponse.json(
        { error: 'Unauthorized. Provide valid API key in Authorization header.' },
        { status: 401 }
      );
    }

    const body: ExtractRequest = await request.json();
    const { document_id, force = false } = body;

    if (!document_id || typeof document_id !== 'number') {
      return NextResponse.json(
        { error: 'document_id is required and must be a number' },
        { status: 400 }
      );
    }

    // Get document details
    const { data: doc, error: docError } = await supabase
      .from('budget_documents')
      .select('id, jurisdiction_id, download_url, title, extraction_status')
      .eq('id', document_id)
      .single();

    if (docError || !doc) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    if (!doc.download_url) {
      return NextResponse.json(
        { error: 'Document has no download URL' },
        { status: 400 }
      );
    }

    // Check if already extracted
    if (doc.extraction_status === 'completed' && !force) {
      // Return existing data
      const { data: existing } = await supabase
        .from('budget_documents')
        .select('extracted_data, total_revenue, total_expenditure, extraction_confidence')
        .eq('id', document_id)
        .single();

      return NextResponse.json({
        success: true,
        document_id,
        data: existing?.extracted_data,
        message: 'Already extracted. Use force=true to re-extract.'
      });
    }

    // Mark as processing
    await supabase
      .from('budget_documents')
      .update({ extraction_status: 'processing' })
      .eq('id', document_id);

    // Extract budget data
    const result = await extractBudgetFromPDF(doc.download_url);

    // Save results
    await saveBudgetExtraction(document_id, result);

    const response: ExtractResponse = {
      success: result.success,
      document_id,
      data: result.data,
      error: result.error,
      processingTimeMs: result.processingTimeMs
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Budget extraction API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Extraction failed' },
      { status: 500 }
    );
  }
}

// GET /api/budgets/extract?status=pending - Get extraction status
export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  try {
    let query = supabase
      .from('budget_documents')
      .select('id, title, jurisdiction_id, extraction_status, extraction_confidence, extracted_at, extraction_error', { count: 'exact' });

    if (status) {
      if (status === 'pending') {
        query = query.or('extraction_status.is.null,extraction_status.eq.pending');
      } else {
        query = query.eq('extraction_status', status);
      }
    }

    query = query.order('id', { ascending: true }).limit(100);

    const { data, count, error } = await query;

    if (error) {
      throw error;
    }

    // Get stats
    const { data: stats } = await supabase
      .from('budget_documents')
      .select('extraction_status')
      .not('extraction_status', 'is', null);

    const statusCounts: Record<string, number> = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0
    };

    stats?.forEach(s => {
      if (s.extraction_status && statusCounts[s.extraction_status] !== undefined) {
        statusCounts[s.extraction_status]++;
      }
    });

    // Count nulls as pending
    const { count: nullCount } = await supabase
      .from('budget_documents')
      .select('id', { count: 'exact', head: true })
      .is('extraction_status', null);

    statusCounts.pending += nullCount || 0;

    return NextResponse.json({
      documents: data,
      total: count,
      stats: statusCounts
    });

  } catch (error) {
    console.error('Budget extraction status error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch extraction status' },
      { status: 500 }
    );
  }
}
