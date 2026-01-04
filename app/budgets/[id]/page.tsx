import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

interface ExtractedData {
  total_revenue: number | null;
  total_expenditure: number | null;
  categories?: {
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

interface BudgetDocument {
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
  // Extraction fields
  extracted_data?: ExtractedData | null;
  total_revenue?: number | null;
  total_expenditure?: number | null;
  extraction_status?: string | null;
  extraction_confidence?: number | null;
}

interface SampleOrg {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  ppp_loan_count: number | null;
  total_ppp_amount: number | null;
}

interface JurisdictionDetail {
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
  budget_documents: BudgetDocument[];
  sample_organizations?: SampleOrg[];
}

function formatMoney(amount: number | null): string {
  if (!amount) return '-';
  if (amount >= 1000000000) {
    return `$${(amount / 1000000000).toFixed(2)}B`;
  }
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return `$${amount.toLocaleString()}`;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '-';
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / 1024).toFixed(0)} KB`;
}

async function getJurisdiction(id: string): Promise<JurisdictionDetail | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/budgets/${id}`, {
      next: { revalidate: 60 }
    });

    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error('Failed to fetch jurisdiction');
    }

    return res.json();
  } catch (err) {
    console.error('Jurisdiction fetch error:', err);
    // Fall back to direct Supabase query
    const { data, error } = await supabase
      .from('budget_jurisdictions')
      .select(`
        id, name, type, state_id, state_name, fips_code, population,
        website_url, budget_page_url, org_count, ppp_loan_count, ppp_loan_total, childcare_count,
        budget_documents (
          id, fiscal_year, document_type, document_subtype, title,
          download_url, source_url, file_size_bytes, pdf_page_count, is_scanned, status,
          extracted_data, total_revenue, total_expenditure, extraction_status, extraction_confidence
        )
      `)
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return data as JurisdictionDetail;
  }
}

export const revalidate = 60;

export default async function JurisdictionPage({ params }: PageProps) {
  const { id } = await params;
  const jurisdiction = await getJurisdiction(id);

  if (!jurisdiction) {
    notFound();
  }

  const stateUpper = jurisdiction.state_id.toUpperCase();

  return (
    <div className="max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/" className="hover:text-white">Home</Link>
        <span>/</span>
        <Link href="/budgets" className="hover:text-white">Budgets</Link>
        <span>/</span>
        <Link href={`/state/${jurisdiction.state_id}`} className="hover:text-white">
          {jurisdiction.state_name || stateUpper}
        </Link>
        <span>/</span>
        <span className="text-white">{jurisdiction.name}</span>
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold">{jurisdiction.name}</h1>
          <span className={`px-2 py-1 rounded text-xs ${
            jurisdiction.type === 'county'
              ? 'bg-amber-900/40 text-amber-400'
              : 'bg-cyan-900/40 text-cyan-400'
          }`}>
            {jurisdiction.type}
          </span>
        </div>
        <p className="text-gray-400">
          {jurisdiction.state_name || stateUpper}
          {jurisdiction.population && ` • Population: ${jurisdiction.population.toLocaleString()}`}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="border border-gray-800 p-4">
          <p className="text-green-500 font-mono text-xl font-bold">
            {jurisdiction.org_count.toLocaleString()}
          </p>
          <p className="text-gray-500 text-sm">Organizations</p>
        </div>
        <div className="border border-gray-800 p-4">
          <p className="text-purple-500 font-mono text-xl font-bold">
            {jurisdiction.ppp_loan_count.toLocaleString()}
          </p>
          <p className="text-gray-500 text-sm">PPP Loans</p>
        </div>
        <div className="border border-gray-800 p-4">
          <p className="text-purple-400 font-mono text-xl font-bold">
            {formatMoney(jurisdiction.ppp_loan_total)}
          </p>
          <p className="text-gray-500 text-sm">PPP Total</p>
        </div>
        <div className="border border-gray-800 p-4">
          <p className="text-amber-500 font-mono text-xl font-bold">
            {jurisdiction.budget_documents.length}
          </p>
          <p className="text-gray-500 text-sm">Budget Documents</p>
        </div>
      </div>

      {/* Extracted Budget Data */}
      {(() => {
        // Find documents with extracted data
        const extractedDocs = jurisdiction.budget_documents.filter(
          d => d.extraction_status === 'completed' && d.extracted_data
        );

        if (extractedDocs.length === 0) return null;

        // Use most recent extracted document
        const latestDoc = extractedDocs[0];
        const data = latestDoc.extracted_data;
        if (!data) return null;

        const categories = data.categories || {};
        const categoryEntries = Object.entries(categories)
          .filter(([, val]) => val && val > 0)
          .sort((a, b) => ((b[1] as number) || 0) - ((a[1] as number) || 0));

        return (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-lg font-bold">Extracted Budget Data</h2>
              <span className="text-xs bg-green-900/40 text-green-400 px-2 py-0.5 rounded">
                {(latestDoc.extraction_confidence ?? data.confidence * 100).toFixed(0)}% confidence
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="border border-gray-800 p-4">
                <p className="text-blue-500 font-mono text-xl font-bold">
                  {formatMoney(data.total_revenue)}
                </p>
                <p className="text-gray-500 text-sm">Total Revenue</p>
              </div>
              <div className="border border-gray-800 p-4">
                <p className="text-red-400 font-mono text-xl font-bold">
                  {formatMoney(data.total_expenditure)}
                </p>
                <p className="text-gray-500 text-sm">Total Expenditure</p>
              </div>
            </div>

            {categoryEntries.length > 0 && (
              <div className="border border-gray-800 rounded p-4">
                <h3 className="text-sm font-medium text-gray-400 mb-3">Spending by Category</h3>
                <div className="space-y-2">
                  {categoryEntries.map(([key, val]) => {
                    const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                    const percentage = data.total_expenditure
                      ? (((val as number) / data.total_expenditure) * 100).toFixed(1)
                      : null;
                    return (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-gray-300">{label}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-gray-400">{formatMoney(val as number)}</span>
                          {percentage && (
                            <span className="text-xs text-gray-500">({percentage}%)</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {data.notes && (
              <p className="text-gray-500 text-sm mt-3 italic">{data.notes}</p>
            )}

            <p className="text-gray-600 text-xs mt-2">
              Data extracted from: {latestDoc.title} ({latestDoc.fiscal_year})
            </p>
          </div>
        );
      })()}

      {/* External Links */}
      {(jurisdiction.website_url || jurisdiction.budget_page_url) && (
        <div className="mb-6 flex gap-4">
          {jurisdiction.website_url && (
            <a
              href={jurisdiction.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              Official Website →
            </a>
          )}
          {jurisdiction.budget_page_url && (
            <a
              href={jurisdiction.budget_page_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              Budget Portal →
            </a>
          )}
        </div>
      )}

      {/* Budget Documents */}
      <div className="mb-8">
        <h2 className="text-lg font-bold mb-4">Budget Documents</h2>
        {jurisdiction.budget_documents.length === 0 ? (
          <div className="border border-gray-800 p-8 text-center text-gray-500">
            No budget documents available yet.
          </div>
        ) : (
          <div className="border border-gray-800 rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-900">
                <tr>
                  <th className="text-left p-3 font-medium text-gray-400">Document</th>
                  <th className="text-left p-3 font-medium text-gray-400">Year</th>
                  <th className="text-left p-3 font-medium text-gray-400">Type</th>
                  <th className="text-right p-3 font-medium text-gray-400">Extracted</th>
                  <th className="text-right p-3 font-medium text-gray-400">Size</th>
                  <th className="text-right p-3 font-medium text-gray-400">Download</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {jurisdiction.budget_documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-900/50">
                    <td className="p-3">
                      <span className="font-medium">{doc.title}</span>
                      {doc.is_scanned && (
                        <span className="ml-2 text-xs text-yellow-500">(scanned)</span>
                      )}
                    </td>
                    <td className="p-3 text-gray-400">{doc.fiscal_year}</td>
                    <td className="p-3">
                      <span className="text-xs bg-gray-800 px-2 py-0.5 rounded">
                        {doc.document_type}
                        {doc.document_subtype && ` / ${doc.document_subtype}`}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {doc.extraction_status === 'completed' ? (
                        <span className="text-xs bg-green-900/40 text-green-400 px-2 py-0.5 rounded">
                          {formatMoney(doc.total_expenditure ?? null)}
                        </span>
                      ) : doc.extraction_status === 'failed' ? (
                        <span className="text-xs bg-red-900/40 text-red-400 px-2 py-0.5 rounded">
                          failed
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500">-</span>
                      )}
                    </td>
                    <td className="p-3 text-right text-gray-400 font-mono">
                      {formatFileSize(doc.file_size_bytes)}
                    </td>
                    <td className="p-3 text-right">
                      <a
                        href={doc.download_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300"
                      >
                        PDF →
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sample Organizations */}
      {jurisdiction.sample_organizations && jurisdiction.sample_organizations.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4">Top Organizations in {jurisdiction.name}</h2>
          <div className="border border-gray-800 rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-900">
                <tr>
                  <th className="text-left p-3 font-medium text-gray-400">Organization</th>
                  <th className="text-left p-3 font-medium text-gray-400">City</th>
                  <th className="text-right p-3 font-medium text-gray-400">PPP Loans</th>
                  <th className="text-right p-3 font-medium text-gray-400">PPP Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {jurisdiction.sample_organizations.map((org) => (
                  <tr key={org.id} className="hover:bg-gray-900/50">
                    <td className="p-3 font-medium">{org.name}</td>
                    <td className="p-3 text-gray-400">{org.city || '-'}</td>
                    <td className="p-3 text-right text-gray-400">
                      {org.ppp_loan_count || 0}
                    </td>
                    <td className="p-3 text-right font-mono text-purple-400">
                      {formatMoney(org.total_ppp_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-gray-500 text-sm mt-2">
            Showing top 10 organizations by PPP loan amount
          </p>
        </div>
      )}

      {/* Link to state page */}
      <div className="border-t border-gray-800 pt-6">
        <Link
          href={`/state/${jurisdiction.state_id}`}
          className="text-gray-400 hover:text-white"
        >
          ← Explore all data in {jurisdiction.state_name || stateUpper}
        </Link>
      </div>
    </div>
  );
}
