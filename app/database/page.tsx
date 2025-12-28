import { supabase, Provider } from '@/lib/supabase';
import Link from 'next/link';
import Filters from './Filters';

interface ProviderWithPayments extends Provider {
  payments: { fiscal_year: number; total_amount: number }[];
}

interface PageProps {
  searchParams: Promise<{
    county?: string;
    type?: string;
    status?: string;
    page?: string;
    perPage?: string;
  }>;
}

async function getProviders(filters: {
  county?: string;
  type?: string;
  status?: string;
}): Promise<ProviderWithPayments[]> {
  let query = supabase
    .from('providers')
    .select(`
      *,
      payments (
        fiscal_year,
        total_amount
      )
    `)
    .order('name', { ascending: true });

  if (filters.county && filters.county !== 'all') {
    query = query.eq('county', filters.county);
  }
  if (filters.type && filters.type !== 'all') {
    query = query.eq('license_type', filters.type);
  }
  if (filters.status && filters.status !== 'all') {
    query = query.eq('license_status', filters.status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching providers:', error);
    return [];
  }

  return (data || []) as ProviderWithPayments[];
}

async function getFilterOptions() {
  const { data: providers } = await supabase
    .from('providers')
    .select('county, license_type, license_status');

  const counties = [...new Set(providers?.map(p => p.county).filter(Boolean))].sort();
  const types = [...new Set(providers?.map(p => p.license_type).filter(Boolean))].sort();
  const statuses = [...new Set(providers?.map(p => p.license_status).filter(Boolean))].sort();

  return { counties, types, statuses };
}

function formatMoney(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(2)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return `$${amount.toLocaleString()}`;
}

export const revalidate = 60;

export default async function DatabasePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const county = params.county || 'all';
  const type = params.type || 'all';
  const status = params.status || 'all';
  const page = parseInt(params.page || '1', 10);
  const perPage = parseInt(params.perPage || '25', 10);

  const [allProviders, filterOptions] = await Promise.all([
    getProviders({ county, type, status }),
    getFilterOptions(),
  ]);

  const providersWithTotals = allProviders.map(p => ({
    ...p,
    totalFunding: p.payments?.reduce((sum, pay) => sum + (pay.total_amount || 0), 0) || 0,
  }));

  const totalCount = providersWithTotals.length;
  const totalPages = Math.ceil(totalCount / perPage);
  const startIndex = (page - 1) * perPage;
  const providers = providersWithTotals.slice(startIndex, startIndex + perPage);

  const buildPageUrl = (newPage: number) => {
    const searchParams = new URLSearchParams();
    if (county !== 'all') searchParams.set('county', county);
    if (type !== 'all') searchParams.set('type', type);
    if (status !== 'all') searchParams.set('status', status);
    if (perPage !== 25) searchParams.set('perPage', String(perPage));
    if (newPage !== 1) searchParams.set('page', String(newPage));
    const qs = searchParams.toString();
    return `/database${qs ? `?${qs}` : ''}`;
  };

  return (
    <div>
      <div className="mb-8">
        <p className="text-gray-500">{totalCount} providers</p>
      </div>

      <Filters
        county={county}
        type={type}
        status={status}
        perPage={String(perPage)}
        counties={filterOptions.counties}
        types={filterOptions.types}
        statuses={filterOptions.statuses}
      />

      <table className="w-full">
        <thead>
          <tr className="text-left text-gray-500 text-sm border-b border-gray-800">
            <th className="pb-3 font-normal">Provider</th>
            <th className="pb-3 font-normal">City</th>
            <th className="pb-3 font-normal">County</th>
            <th className="pb-3 font-normal">Type</th>
            <th className="pb-3 font-normal">Status</th>
            <th className="pb-3 font-normal text-right">Funding</th>
          </tr>
        </thead>
        <tbody>
          {providers.map((provider) => (
            <tr key={provider.id} className="border-b border-gray-900 hover:bg-gray-950">
              <td className="py-4">
                <Link href={`/provider/${provider.license_number}`} className="hover:underline">
                  {provider.name}
                </Link>
              </td>
              <td className="py-4 text-gray-400">{provider.city || '-'}</td>
              <td className="py-4 text-gray-400">{provider.county || '-'}</td>
              <td className="py-4 text-gray-400 text-sm">{provider.license_type || '-'}</td>
              <td className="py-4 text-gray-400 text-sm">{provider.license_status || '-'}</td>
              <td className="py-4 text-right font-mono">
                {provider.totalFunding > 0 ? (
                  <span className="text-green-500">{formatMoney(provider.totalFunding)}</span>
                ) : (
                  <span className="text-gray-600">N/A</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between">
          <p className="text-gray-500 text-sm">
            Showing {startIndex + 1}-{Math.min(startIndex + perPage, totalCount)} of {totalCount}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={buildPageUrl(page - 1)}
                className="px-3 py-1 text-sm text-gray-400 hover:text-white"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={buildPageUrl(page + 1)}
                className="px-3 py-1 text-sm text-gray-400 hover:text-white"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
