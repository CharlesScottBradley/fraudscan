import { supabase, Provider } from '@/lib/supabase';
import Link from 'next/link';

interface ProviderWithPayments extends Provider {
  payments: { fiscal_year: number; total_amount: number }[];
}

async function getProvidersWithFunding(): Promise<ProviderWithPayments[]> {
  // First get all provider IDs that have payments
  const { data: paymentProviders, error: paymentError } = await supabase
    .from('payments')
    .select('provider_id');

  if (paymentError || !paymentProviders) {
    console.error('Error fetching payment providers:', paymentError);
    return [];
  }

  const providerIds = [...new Set(paymentProviders.map(p => p.provider_id))];

  if (providerIds.length === 0) {
    return [];
  }

  // Then fetch only those providers with their payments
  const { data, error } = await supabase
    .from('providers')
    .select(`
      *,
      payments (
        fiscal_year,
        total_amount
      )
    `)
    .in('id', providerIds);

  if (error) {
    console.error('Error fetching providers:', error);
    return [];
  }

  return (data || []) as ProviderWithPayments[];
}

async function getTotalFunding(): Promise<number> {
  const { data, error } = await supabase
    .from('payments')
    .select('total_amount');

  if (error || !data) return 0;
  return data.reduce((sum, p) => sum + (p.total_amount || 0), 0);
}

export const revalidate = 60;

function formatMoney(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(2)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return `$${amount.toLocaleString()}`;
}

export default async function Home() {
  const providers = await getProvidersWithFunding();
  const totalFunding = await getTotalFunding();

  const providersWithTotals = providers.map(p => ({
    ...p,
    totalFunding: p.payments?.reduce((sum, pay) => sum + (pay.total_amount || 0), 0) || 0,
    fy2025: p.payments?.find(pay => pay.fiscal_year === 2025)?.total_amount || 0,
    fy2024: p.payments?.find(pay => pay.fiscal_year === 2024)?.total_amount || 0,
  }));

  const topFunded = [...providersWithTotals]
    .filter(p => p.totalFunding > 0)
    .sort((a, b) => b.totalFunding - a.totalFunding);

  return (
    <div>
      <div className="mb-12">
        <p className="text-green-500 font-mono text-4xl font-bold">
          {formatMoney(totalFunding)}
        </p>
        <p className="text-gray-500 mt-1">Total CCAP funding tracked</p>
      </div>

      {topFunded.length > 0 ? (
        <table className="w-full">
          <thead>
            <tr className="text-left text-gray-500 text-sm border-b border-gray-800">
              <th className="pb-3 font-normal w-12">#</th>
              <th className="pb-3 font-normal">Provider</th>
              <th className="pb-3 font-normal">City</th>
              <th className="pb-3 font-normal text-right">FY 2025</th>
              <th className="pb-3 font-normal text-right">FY 2024</th>
              <th className="pb-3 font-normal text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {topFunded.map((provider, index) => (
              <tr key={provider.id} className="border-b border-gray-900 hover:bg-gray-950">
                <td className="py-4 text-gray-500">{index + 1}</td>
                <td className="py-4">
                  <Link href={`/provider/${provider.license_number}`} className="hover:underline">
                    {provider.name}
                  </Link>
                </td>
                <td className="py-4 text-gray-400">{provider.city || '-'}</td>
                <td className="py-4 text-right font-mono text-gray-400">
                  {provider.fy2025 > 0 ? formatMoney(provider.fy2025) : '-'}
                </td>
                <td className="py-4 text-right font-mono text-gray-400">
                  {provider.fy2024 > 0 ? formatMoney(provider.fy2024) : '-'}
                </td>
                <td className="py-4 text-right font-mono">
                  <span className="text-green-500 font-bold">{formatMoney(provider.totalFunding)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-gray-500">No funding data available yet.</p>
      )}
    </div>
  );
}
