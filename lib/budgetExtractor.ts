import Anthropic from '@anthropic-ai/sdk';
import { supabase } from './supabase';

// Types for extracted budget data
export interface ExtractedBudgetData {
  total_revenue: number | null;
  total_expenditure: number | null;
  categories: {
    public_safety?: number | null;
    education?: number | null;
    health_welfare?: number | null;
    infrastructure?: number | null;
    general_government?: number | null;
    parks_recreation?: number | null;
    debt_service?: number | null;
    other?: number | null;
  };
  confidence: number;
  notes: string | null;
  fiscal_year?: string | null;
}

export interface ExtractionResult {
  success: boolean;
  data?: ExtractedBudgetData;
  error?: string;
  processingTimeMs?: number;
}

// Initialize Anthropic client
function getAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required');
  }
  return new Anthropic({ apiKey });
}

// Download PDF and convert to base64
export async function downloadPdfAsBase64(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download PDF: ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return buffer.toString('base64');
}

// Extract budget data from PDF using Claude Vision
export async function extractBudgetFromPDF(
  pdfUrl: string,
  options: { maxPages?: number } = {}
): Promise<ExtractionResult> {
  const startTime = Date.now();

  try {
    // Download PDF
    const pdfBase64 = await downloadPdfAsBase64(pdfUrl);

    // Check file size (Claude has limits)
    const fileSizeMB = (pdfBase64.length * 0.75) / (1024 * 1024);
    if (fileSizeMB > 30) {
      return {
        success: false,
        error: `PDF too large: ${fileSizeMB.toFixed(1)}MB (max 30MB)`,
        processingTimeMs: Date.now() - startTime
      };
    }

    const client = getAnthropicClient();

    const systemPrompt = `You are a budget document analyst. Extract financial data from government budget documents.
Always respond with valid JSON only, no markdown or explanation.`;

    const userPrompt = `Analyze this government budget document and extract the following information:

1. Total Revenue (may be called Total Income, Total Receipts, or similar)
2. Total Expenditure (may be called Total Expenses, Total Appropriations, or similar)
3. Major spending categories with their amounts
4. The fiscal year this budget is for

Look for summary tables, executive summaries, or totals pages. If you find multiple years, focus on the most recent/primary year.

Return ONLY valid JSON in this exact format:
{
  "total_revenue": <number or null if not found>,
  "total_expenditure": <number or null if not found>,
  "categories": {
    "public_safety": <number or null>,
    "education": <number or null>,
    "health_welfare": <number or null>,
    "infrastructure": <number or null>,
    "general_government": <number or null>,
    "parks_recreation": <number or null>,
    "debt_service": <number or null>,
    "other": <number or null>
  },
  "confidence": <0.0 to 1.0 - how confident you are in these numbers>,
  "notes": "<brief note about what you found or any issues>",
  "fiscal_year": "<year like '2024' or 'FY2024' or null>"
}

Important:
- All amounts should be in dollars (not thousands or millions)
- If a value is unclear, use null
- If the document is not a budget, set confidence to 0
- Category names may differ - map to the closest match`;

    const response = await client.beta.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      betas: ['pdfs-2024-09-25'],
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: pdfBase64
              }
            },
            {
              type: 'text',
              text: userPrompt
            }
          ]
        }
      ],
      system: systemPrompt
    });

    // Extract text content from response
    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return {
        success: false,
        error: 'No text response from Claude',
        processingTimeMs: Date.now() - startTime
      };
    }

    // Parse JSON response
    const data = parseBudgetResponse(textContent.text);

    return {
      success: true,
      data,
      processingTimeMs: Date.now() - startTime
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: errorMessage,
      processingTimeMs: Date.now() - startTime
    };
  }
}

// Parse Claude's JSON response
export function parseBudgetResponse(responseText: string): ExtractedBudgetData {
  // Try to extract JSON from the response
  let jsonStr = responseText.trim();

  // Remove markdown code blocks if present
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```\n?$/g, '');
  }

  try {
    const parsed = JSON.parse(jsonStr);

    return {
      total_revenue: parseNumber(parsed.total_revenue),
      total_expenditure: parseNumber(parsed.total_expenditure),
      categories: {
        public_safety: parseNumber(parsed.categories?.public_safety),
        education: parseNumber(parsed.categories?.education),
        health_welfare: parseNumber(parsed.categories?.health_welfare),
        infrastructure: parseNumber(parsed.categories?.infrastructure),
        general_government: parseNumber(parsed.categories?.general_government),
        parks_recreation: parseNumber(parsed.categories?.parks_recreation),
        debt_service: parseNumber(parsed.categories?.debt_service),
        other: parseNumber(parsed.categories?.other)
      },
      confidence: Math.min(1, Math.max(0, parseFloat(parsed.confidence) || 0)),
      notes: parsed.notes || null,
      fiscal_year: parsed.fiscal_year || null
    };
  } catch (e) {
    throw new Error(`Failed to parse budget response: ${e}`);
  }
}

// Helper to parse numbers safely
function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[$,]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }
  return null;
}

// Save extraction results to database
export async function saveBudgetExtraction(
  documentId: number,
  result: ExtractionResult
): Promise<void> {
  if (result.success && result.data) {
    const { error } = await supabase
      .from('budget_documents')
      .update({
        extracted_data: result.data,
        total_revenue: result.data.total_revenue,
        total_expenditure: result.data.total_expenditure,
        extraction_status: 'completed',
        extraction_confidence: result.data.confidence,
        extracted_at: new Date().toISOString(),
        extraction_error: null
      })
      .eq('id', documentId);

    if (error) {
      throw new Error(`Failed to save extraction: ${error.message}`);
    }
  } else {
    const { error } = await supabase
      .from('budget_documents')
      .update({
        extraction_status: 'failed',
        extraction_error: result.error || 'Unknown error',
        extracted_at: new Date().toISOString()
      })
      .eq('id', documentId);

    if (error) {
      throw new Error(`Failed to save extraction error: ${error.message}`);
    }
  }
}

// Get documents pending extraction
export async function getPendingDocuments(options: {
  limit?: number;
  stateId?: string;
} = {}): Promise<Array<{ id: number; jurisdiction_id: string; download_url: string; title: string }>> {
  if (options.stateId) {
    // Query with state filter requires join
    const query = supabase
      .from('budget_documents')
      .select(`
        id, jurisdiction_id, download_url, title,
        budget_jurisdictions!inner(state_id)
      `)
      .or('extraction_status.is.null,extraction_status.eq.pending')
      .not('download_url', 'is', null)
      .eq('budget_jurisdictions.state_id', options.stateId.toLowerCase())
      .limit(options.limit || 500);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get pending documents: ${error.message}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data || []).map((d: any) => ({
      id: d.id,
      jurisdiction_id: d.jurisdiction_id,
      download_url: d.download_url,
      title: d.title
    }));
  }

  // Simple query without state filter
  const query = supabase
    .from('budget_documents')
    .select('id, jurisdiction_id, download_url, title')
    .or('extraction_status.is.null,extraction_status.eq.pending')
    .not('download_url', 'is', null)
    .limit(options.limit || 500);

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get pending documents: ${error.message}`);
  }

  return data || [];
}
