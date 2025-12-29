import { supabase } from '@/lib/supabase';
import DatabaseTable from './DatabaseTable';

async function getCounts() {
  const [providerResult, pppResult] = await Promise.all([
    supabase.from('providers').select('*', { count: 'exact', head: true }),
    supabase.from('ppp_loans').select('*', { count: 'exact', head: true }),
  ]);

  return {
    providerCount: providerResult.count || 0,
    pppCount: pppResult.count || 0,
  };
}

export const revalidate = 60;

export default async function DatabasePage() {
  const { providerCount, pppCount } = await getCounts();
  const totalCount = providerCount + pppCount;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Database</h1>
        <p className="text-gray-500">
          Search {totalCount.toLocaleString()} providers and PPP loans nationwide
        </p>
      </div>

      <DatabaseTable
        initialProviderCount={providerCount}
        initialPPPCount={pppCount}
      />
    </div>
  );
}
