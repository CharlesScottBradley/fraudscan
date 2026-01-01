import { supabase } from '@/lib/supabase';
import Link from 'next/link';

function formatMoney(amount: number | null): string {
  if (!amount) return '-';
  if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(2)}B`;
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

function formatNumber(num: number): string {
  return num.toLocaleString();
}

interface AddressCluster {
  address: string;
  city: string;
  state: string;
  org_count: number;
  total_ppp: number;
  total_eidl: number;
  business_names: string[];
}

async function getAddressClusters(): Promise<AddressCluster[]> {
  // Query for addresses with multiple PPP loans
  const { data, error } = await supabase
    .from('ppp_loans')
    .select('borrower_address, borrower_city, borrower_state, borrower_name, initial_approval_amount')
    .not('borrower_address', 'is', null)
    .not('borrower_address', 'eq', '')
    .limit(5000);

  if (error || !data) {
    console.error('Error fetching PPP data:', error);
    return [];
  }

  // Group by address
  const addressMap = new Map<string, {
    address: string;
    city: string;
    state: string;
    businesses: Set<string>;
    total_ppp: number;
  }>();

  for (const loan of data) {
    const key = `${loan.borrower_address?.toLowerCase()?.trim()}|${loan.borrower_city?.toLowerCase()?.trim()}|${loan.borrower_state}`;
    
    if (!addressMap.has(key)) {
      addressMap.set(key, {
        address: loan.borrower_address || '',
        city: loan.borrower_city || '',
        state: loan.borrower_state || '',
        businesses: new Set(),
        total_ppp: 0
      });
    }
    
    const entry = addressMap.get(key);
    if (entry) {
      entry.businesses.add(loan.borrower_name || '');
      entry.total_ppp += loan.initial_approval_amount || 0;
    }
  }

  // Filter to addresses with 3+ different businesses
  const clusters: AddressCluster[] = [];
  for (const [, value] of addressMap) {
    if (value.businesses.size >= 3) {
      clusters.push({
        address: value.address,
        city: value.city,
        state: value.state,
        org_count: value.businesses.size,
        total_ppp: value.total_ppp,
        total_eidl: 0, // Would need separate query
        business_names: Array.from(value.businesses).slice(0, 5)
      });
    }
  }

  // Sort by org count, then by total amount
  clusters.sort((a, b) => {
    if (b.org_count !== a.org_count) return b.org_count - a.org_count;
    return b.total_ppp - a.total_ppp;
  });

  return clusters.slice(0, 100);
}

export const revalidate = 600;

export default async function AddressClustersPage() {
  const clusters = await getAddressClusters();

  const totalOrgs = clusters.reduce((sum, c) => sum + c.org_count, 0);
  const totalFunding = clusters.reduce((sum, c) => sum + c.total_ppp, 0);

  return (
    <div>
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-6">
        <Link href="/investigation" className="hover:text-gray-300">Investigations</Link>
        <span className="mx-2">/</span>
        <span className="text-white">Address Clusters</span>
      </div>

      {/* Terminal-style stats */}
      <div className="font-mono text-sm mb-10">
        <p className="text-gray-500">ADDRESS_CLUSTER_ANALYSIS</p>
        <div className="mt-2 text-gray-400">
          <p><span className="text-gray-600">├─</span> suspicious_addresses <span className="text-white ml-4">{formatNumber(clusters.length)}</span></p>
          <p><span className="text-gray-600">├─</span> total_entities <span className="text-white ml-4">{formatNumber(totalOrgs)}</span></p>
          <p><span className="text-gray-600">└─</span> combined_funding <span className="text-green-500 ml-4">{formatMoney(totalFunding)}</span></p>
        </div>
      </div>

      {/* Explanation */}
      <div className="border border-gray-800 p-4 mb-8">
        <h2 className="text-white font-medium mb-2">What is this</h2>
        <p className="text-sm text-gray-400 leading-relaxed">
          Addresses with 3 or more different businesses receiving government loans. This pattern can indicate 
          shell company operations where multiple entities are registered at the same location to receive 
          separate loan disbursements. Legitimate explanations include shared office spaces, business 
          incubators, and multi-tenant commercial buildings.
        </p>
      </div>

      {/* Cluster table */}
      <div className="border border-gray-800 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-900">
            <tr>
              <th className="text-left p-3 font-medium text-gray-400">Address</th>
              <th className="text-left p-3 font-medium text-gray-400">City</th>
              <th className="text-left p-3 font-medium text-gray-400">State</th>
              <th className="text-right p-3 font-medium text-gray-400">Entities</th>
              <th className="text-right p-3 font-medium text-gray-400">PPP Total</th>
              <th className="text-left p-3 font-medium text-gray-400">Sample Businesses</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {clusters.map((cluster, i) => (
              <tr key={i} className="hover:bg-gray-900/50">
                <td className="p-3 text-white font-mono text-xs">{cluster.address}</td>
                <td className="p-3 text-gray-400">{cluster.city}</td>
                <td className="p-3 text-gray-400">{cluster.state}</td>
                <td className="p-3 text-right font-mono text-white">{cluster.org_count}</td>
                <td className="p-3 text-right font-mono text-green-500">{formatMoney(cluster.total_ppp)}</td>
                <td className="p-3 text-gray-500 text-xs max-w-xs truncate">
                  {cluster.business_names.join(', ')}
                  {cluster.org_count > 5 && ` (+${cluster.org_count - 5} more)`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {clusters.length === 0 && (
        <div className="border border-gray-800 p-8 text-center">
          <p className="text-gray-500">No suspicious address clusters found in current sample.</p>
          <p className="text-gray-600 text-sm mt-2">
            This analysis samples 5,000 loans. Full database scan required for complete results.
          </p>
        </div>
      )}

      {/* Methodology */}
      <div className="mt-8 border-t border-gray-800 pt-6">
        <h3 className="text-sm font-medium text-gray-400 mb-3">Methodology</h3>
        <p className="text-gray-500 text-sm leading-relaxed">
          Addresses normalized by lowercase and trim. Clusters identified where 3 or more distinct 
          business names received PPP loans at the same address. Results sorted by entity count, 
          then by total funding amount. Current analysis limited to sample of 5,000 loans.
        </p>
      </div>
    </div>
  );
}

