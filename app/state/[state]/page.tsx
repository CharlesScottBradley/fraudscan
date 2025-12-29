import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import StateMap from '../../components/StateMap';

// All US states with map centers
const STATE_INFO: Record<string, { name: string; center: [number, number]; zoom: number }> = {
  al: { name: 'Alabama', center: [-86.9023, 32.3182], zoom: 6 },
  ak: { name: 'Alaska', center: [-154.4931, 63.3469], zoom: 4 },
  az: { name: 'Arizona', center: [-111.0937, 34.0489], zoom: 6 },
  ar: { name: 'Arkansas', center: [-91.8318, 35.2010], zoom: 6 },
  ca: { name: 'California', center: [-119.4179, 36.7783], zoom: 5 },
  co: { name: 'Colorado', center: [-105.3111, 39.0598], zoom: 6 },
  ct: { name: 'Connecticut', center: [-72.7554, 41.6032], zoom: 8 },
  de: { name: 'Delaware', center: [-75.5277, 38.9108], zoom: 8 },
  fl: { name: 'Florida', center: [-81.5158, 27.6648], zoom: 6 },
  ga: { name: 'Georgia', center: [-82.9001, 32.1656], zoom: 6 },
  hi: { name: 'Hawaii', center: [-155.5828, 19.8968], zoom: 6 },
  id: { name: 'Idaho', center: [-114.7420, 44.0682], zoom: 6 },
  il: { name: 'Illinois', center: [-89.3985, 40.6331], zoom: 6 },
  in: { name: 'Indiana', center: [-86.1349, 40.2672], zoom: 6 },
  ia: { name: 'Iowa', center: [-93.0977, 41.8780], zoom: 6 },
  ks: { name: 'Kansas', center: [-98.4842, 39.0119], zoom: 6 },
  ky: { name: 'Kentucky', center: [-84.2700, 37.8393], zoom: 6 },
  la: { name: 'Louisiana', center: [-91.9623, 30.9843], zoom: 6 },
  me: { name: 'Maine', center: [-69.4455, 45.2538], zoom: 6 },
  md: { name: 'Maryland', center: [-76.6413, 39.0458], zoom: 7 },
  ma: { name: 'Massachusetts', center: [-71.3824, 42.4072], zoom: 7 },
  mi: { name: 'Michigan', center: [-85.6024, 44.3148], zoom: 6 },
  mn: { name: 'Minnesota', center: [-94.6859, 46.7296], zoom: 6 },
  ms: { name: 'Mississippi', center: [-89.3985, 32.3547], zoom: 6 },
  mo: { name: 'Missouri', center: [-91.8318, 37.9643], zoom: 6 },
  mt: { name: 'Montana', center: [-110.3626, 46.8797], zoom: 5 },
  ne: { name: 'Nebraska', center: [-99.9018, 41.4925], zoom: 6 },
  nv: { name: 'Nevada', center: [-116.4194, 38.8026], zoom: 5 },
  nh: { name: 'New Hampshire', center: [-71.5724, 43.1939], zoom: 7 },
  nj: { name: 'New Jersey', center: [-74.4057, 40.0583], zoom: 7 },
  nm: { name: 'New Mexico', center: [-105.8701, 34.5199], zoom: 6 },
  ny: { name: 'New York', center: [-75.4999, 43.0000], zoom: 6 },
  nc: { name: 'North Carolina', center: [-79.0193, 35.7596], zoom: 6 },
  nd: { name: 'North Dakota', center: [-101.0020, 47.5515], zoom: 6 },
  oh: { name: 'Ohio', center: [-82.9071, 40.4173], zoom: 6 },
  ok: { name: 'Oklahoma', center: [-97.0929, 35.0078], zoom: 6 },
  or: { name: 'Oregon', center: [-120.5542, 43.8041], zoom: 6 },
  pa: { name: 'Pennsylvania', center: [-77.1945, 41.2033], zoom: 6 },
  ri: { name: 'Rhode Island', center: [-71.4774, 41.5801], zoom: 9 },
  sc: { name: 'South Carolina', center: [-81.1637, 33.8361], zoom: 7 },
  sd: { name: 'South Dakota', center: [-99.9018, 43.9695], zoom: 6 },
  tn: { name: 'Tennessee', center: [-86.5804, 35.5175], zoom: 6 },
  tx: { name: 'Texas', center: [-99.9018, 31.9686], zoom: 5 },
  ut: { name: 'Utah', center: [-111.0937, 39.3210], zoom: 6 },
  vt: { name: 'Vermont', center: [-72.5778, 44.5588], zoom: 7 },
  va: { name: 'Virginia', center: [-78.6569, 37.4316], zoom: 6 },
  wa: { name: 'Washington', center: [-120.7401, 47.7511], zoom: 6 },
  wv: { name: 'West Virginia', center: [-80.4549, 38.5976], zoom: 7 },
  wi: { name: 'Wisconsin', center: [-89.6165, 44.2563], zoom: 6 },
  wy: { name: 'Wyoming', center: [-107.2903, 43.0760], zoom: 6 },
  dc: { name: 'District of Columbia', center: [-77.0369, 38.9072], zoom: 11 },
};

interface PageProps {
  params: Promise<{ state: string }>;
}

async function getStateProviders(stateCode: string) {
  const stateUpper = stateCode.toUpperCase();

  // Get providers for this state
  const { data: providers } = await supabase
    .from('providers')
    .select(`
      id,
      license_number,
      name,
      city,
      latitude,
      longitude,
      license_type,
      license_status
    `)
    .eq('state', stateUpper);

  // Get funding data for these providers
  const { data: payments } = await supabase
    .from('payments')
    .select('provider_id, total_amount');

  // Create a map of provider_id to total funding
  const fundingMap: Record<string, number> = {};
  payments?.forEach(p => {
    fundingMap[p.provider_id] = (fundingMap[p.provider_id] || 0) + p.total_amount;
  });

  // Merge funding data
  const providersWithFunding = providers?.map(p => ({
    ...p,
    total_funding: fundingMap[p.id] || 0,
  })) || [];

  return providersWithFunding;
}

async function getStateStats(stateCode: string) {
  const stateUpper = stateCode.toUpperCase();

  const { count: providerCount } = await supabase
    .from('providers')
    .select('*', { count: 'exact', head: true })
    .eq('state', stateUpper);

  // Get funding for this state
  const { data: providers } = await supabase
    .from('providers')
    .select('id, latitude')
    .eq('state', stateUpper);

  const providerIds = providers?.map(p => p.id) || [];

  let totalFunding = 0;
  if (providerIds.length > 0) {
    const { data: payments } = await supabase
      .from('payments')
      .select('total_amount')
      .in('provider_id', providerIds);

    totalFunding = payments?.reduce((sum, p) => sum + (p.total_amount || 0), 0) || 0;
  }

  return {
    providerCount: providerCount || 0,
    totalFunding,
    withCoordinates: providers?.filter(p => p.latitude).length || 0,
  };
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

export default async function StatePage({ params }: PageProps) {
  const { state } = await params;
  const stateInfo = STATE_INFO[state.toLowerCase()];

  if (!stateInfo) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">State not found</h1>
        <Link href="/" className="text-gray-400 hover:text-white">
          ← Back to map
        </Link>
      </div>
    );
  }

  const providers = await getStateProviders(state);
  const stats = await getStateStats(state);

  // Top funded providers
  const topFunded = [...providers]
    .filter(p => p.total_funding > 0)
    .sort((a, b) => b.total_funding - a.total_funding)
    .slice(0, 10);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/" className="text-gray-500 hover:text-white text-sm">
            ← Back to US map
          </Link>
          <h1 className="text-2xl font-bold mt-2">{stateInfo.name}</h1>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="border border-gray-800 p-4">
          <p className="text-green-500 font-mono text-2xl font-bold">
            {formatMoney(stats.totalFunding)}
          </p>
          <p className="text-gray-500 text-sm">Fraud tracked</p>
        </div>
        <div className="border border-gray-800 p-4">
          <p className="text-white font-mono text-2xl font-bold">
            {stats.providerCount.toLocaleString()}
          </p>
          <p className="text-gray-500 text-sm">Providers</p>
        </div>
        <div className="border border-gray-800 p-4">
          <p className="text-white font-mono text-2xl font-bold">
            {topFunded.length}
          </p>
          <p className="text-gray-500 text-sm">With funding data</p>
        </div>
      </div>

      {/* Map */}
      <div className="mb-8">
        <StateMap
          providers={providers.map(p => ({
            id: p.id,
            name: p.name,
            latitude: p.latitude,
            longitude: p.longitude,
            license_type: p.license_type,
            total_funding: p.total_funding,
          }))}
          center={stateInfo.center}
          zoom={stateInfo.zoom}
        />
      </div>

      {/* Top funded table */}
      {topFunded.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-4">Top Funded Providers</h2>
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-500 text-sm border-b border-gray-800">
                <th className="pb-3 font-normal w-12">#</th>
                <th className="pb-3 font-normal">Provider</th>
                <th className="pb-3 font-normal">City</th>
                <th className="pb-3 font-normal">Type</th>
                <th className="pb-3 font-normal text-right">Funding</th>
              </tr>
            </thead>
            <tbody>
              {topFunded.map((provider, index) => (
                <tr key={provider.id} className="border-b border-gray-900 hover:bg-gray-950">
                  <td className="py-3 text-gray-500">{index + 1}</td>
                  <td className="py-3">
                    <Link
                      href={`/provider/${provider.license_number}`}
                      className="hover:underline"
                    >
                      {provider.name}
                    </Link>
                  </td>
                  <td className="py-3 text-gray-400">{provider.city || '-'}</td>
                  <td className="py-3 text-gray-400 text-sm">{provider.license_type}</td>
                  <td className="py-3 text-right font-mono text-green-500">
                    {formatMoney(provider.total_funding)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {topFunded.length === 0 && (
        <p className="text-gray-500">No funding data available for {stateInfo.name} yet.</p>
      )}
    </div>
  );
}
