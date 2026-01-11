import { supabase } from '@/lib/supabase';
import DatabaseTable from './DatabaseTable';
import ToshiAdBanner from '../components/ToshiAdBanner';

async function getCounts() {
  const [providerResult, pppResult, sbaResult] = await Promise.all([
    supabase.from('providers').select('*', { count: 'exact', head: true }),
    supabase.from('ppp_loans').select('*', { count: 'exact', head: true }),
    supabase.from('sba_loans').select('*', { count: 'exact', head: true }),
  ]);

  return {
    providerCount: providerResult.count || 0,
    pppCount: pppResult.count || 0,
    sbaCount: sbaResult.count || 0,
  };
}

export const revalidate = 60;

export default async function DatabasePage() {
  const { providerCount, pppCount, sbaCount } = await getCounts();
  const totalCount = providerCount + pppCount + sbaCount;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Database</h1>
        <p className="text-gray-500">
          Search {totalCount.toLocaleString()} providers, PPP loans, and SBA loans nationwide
        </p>
      </div>

      {/* Toshi Sponsor Banner */}
      <ToshiAdBanner className="mb-8" />

      <DatabaseTable
        initialProviderCount={providerCount}
        initialPPPCount={pppCount}
        initialSBACount={sbaCount}
      />
    </div>
  );
}
