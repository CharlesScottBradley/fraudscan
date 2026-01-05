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
  total_funding: number;
  shell_company_count: number;
  ppp_recipient_count: number;
  org_names: string[];
  has_shell_company: boolean;
}

interface ShellCompany {
  legal_name: string;
  address_normalized: string;
  city: string;
  state: string;
  total_government_funding: number;
}

async function getShellCompanies(): Promise<ShellCompany[]> {
  const { data } = await supabase
    .from('organizations')
    .select('legal_name, address_normalized, city, state, total_government_funding')
    .eq('is_shell_company', true)
    .not('address_normalized', 'is', null);

  return (data || []).map(d => ({
    legal_name: d.legal_name || 'Unknown',
    address_normalized: d.address_normalized || '',
    city: d.city || '',
    state: d.state || '',
    total_government_funding: d.total_government_funding || 0
  }));
}

async function getAddressClusters(): Promise<AddressCluster[]> {
  // Query organizations from focus states with addresses
  const FOCUS_STATES = ['MN', 'OH', 'WA', 'TX', 'FL', 'CA', 'NY'];

  const clusters: AddressCluster[] = [];
  const addressMap = new Map<string, {
    address: string;
    city: string;
    state: string;
    orgs: Set<string>;
    total_funding: number;
    shell_count: number;
    ppp_count: number;
  }>();

  // Query each state separately to manage data size
  for (const state of FOCUS_STATES) {
    const { data, error } = await supabase
      .from('organizations')
      .select('legal_name, address_normalized, city, state, total_government_funding, is_shell_company, is_ppp_recipient')
      .eq('state', state)
      .not('address_normalized', 'is', null)
      .not('address_normalized', 'eq', '')
      .limit(20000);

    if (error || !data) continue;

    for (const org of data) {
      const key = `${org.address_normalized}|${org.city}|${org.state}`;

      if (!addressMap.has(key)) {
        addressMap.set(key, {
          address: org.address_normalized || '',
          city: org.city || '',
          state: org.state || '',
          orgs: new Set(),
          total_funding: 0,
          shell_count: 0,
          ppp_count: 0
        });
      }

      const entry = addressMap.get(key);
      if (entry && org.legal_name) {
        entry.orgs.add(org.legal_name);
        entry.total_funding += org.total_government_funding || 0;
        if (org.is_shell_company) entry.shell_count++;
        if (org.is_ppp_recipient) entry.ppp_count++;
      }
    }
  }

  // Filter to addresses with 3+ different organizations
  for (const [, value] of addressMap) {
    if (value.orgs.size >= 3) {
      clusters.push({
        address: value.address,
        city: value.city,
        state: value.state,
        org_count: value.orgs.size,
        total_funding: value.total_funding,
        shell_company_count: value.shell_count,
        ppp_recipient_count: value.ppp_count,
        org_names: Array.from(value.orgs).slice(0, 5),
        has_shell_company: value.shell_count > 0
      });
    }
  }

  // Sort: shell companies first, then by org count, then by total funding
  clusters.sort((a, b) => {
    if (a.has_shell_company !== b.has_shell_company) {
      return a.has_shell_company ? -1 : 1;
    }
    if (b.org_count !== a.org_count) return b.org_count - a.org_count;
    return b.total_funding - a.total_funding;
  });

  return clusters.slice(0, 150);
}

export const revalidate = 600;

export default async function AddressClustersPage() {
  const [clusters, shellCompanies] = await Promise.all([
    getAddressClusters(),
    getShellCompanies()
  ]);

  const totalOrgs = clusters.reduce((sum, c) => sum + c.org_count, 0);
  const totalFunding = clusters.reduce((sum, c) => sum + c.total_funding, 0);
  const shellClusters = clusters.filter(c => c.has_shell_company);
  const highRiskClusters = clusters.filter(c => c.org_count >= 5);

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
          <p><span className="text-gray-600">├─</span> with_shell_companies <span className="text-red-400 ml-4">{shellClusters.length}</span></p>
          <p><span className="text-gray-600">├─</span> high_risk_5plus <span className="text-red-400 ml-4">{highRiskClusters.length}</span></p>
          <p><span className="text-gray-600">├─</span> total_entities <span className="text-white ml-4">{formatNumber(totalOrgs)}</span></p>
          <p><span className="text-gray-600">├─</span> shell_companies_flagged <span className="text-red-400 ml-4">{shellCompanies.length}</span></p>
          <p><span className="text-gray-600">└─</span> combined_funding <span className="text-green-500 ml-4">{formatMoney(totalFunding)}</span></p>
        </div>
      </div>

      {/* Explanation */}
      <div className="border border-gray-800 p-4 mb-8">
        <h2 className="text-white font-medium mb-2">What is this</h2>
        <p className="text-sm text-gray-400 leading-relaxed">
          Addresses with 3 or more different organizations receiving government funding. This pattern can indicate
          shell company operations where multiple entities are registered at the same location to receive
          separate disbursements. Addresses with confirmed shell companies are highlighted in red.
        </p>
      </div>

      {/* Flagged Shell Companies */}
      {shellCompanies.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-gray-400 mb-3">
            Confirmed Shell Companies ({shellCompanies.length})
          </h2>
          <div className="border border-red-800 bg-red-900/10 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-red-900/30">
                <tr>
                  <th className="text-left p-3 font-medium text-red-400">Company Name</th>
                  <th className="text-left p-3 font-medium text-red-400">Address</th>
                  <th className="text-left p-3 font-medium text-red-400">City</th>
                  <th className="text-left p-3 font-medium text-red-400">State</th>
                  <th className="text-right p-3 font-medium text-red-400">Funding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-800/50">
                {shellCompanies.map((shell, i) => (
                  <tr key={i} className="hover:bg-red-900/20">
                    <td className="p-3 text-white">{shell.legal_name}</td>
                    <td className="p-3 font-mono text-xs text-gray-400">{shell.address_normalized}</td>
                    <td className="p-3 text-gray-400">{shell.city}</td>
                    <td className="p-3 text-gray-400">{shell.state}</td>
                    <td className="p-3 text-right font-mono text-green-500">{formatMoney(shell.total_government_funding)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cluster table */}
      <div className="mb-8">
        <h2 className="text-sm font-medium text-gray-400 mb-3">
          Address Clusters (3+ Organizations)
        </h2>
        <div className="border border-gray-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left p-3 font-medium text-gray-400">Address</th>
                <th className="text-left p-3 font-medium text-gray-400">City</th>
                <th className="text-left p-3 font-medium text-gray-400">State</th>
                <th className="text-right p-3 font-medium text-gray-400">Orgs</th>
                <th className="text-right p-3 font-medium text-gray-400">PPP</th>
                <th className="text-right p-3 font-medium text-gray-400">Total Funding</th>
                <th className="text-center p-3 font-medium text-gray-400">Risk</th>
                <th className="text-left p-3 font-medium text-gray-400">Sample Organizations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {clusters.map((cluster, i) => (
                <tr
                  key={i}
                  className={cluster.has_shell_company
                    ? 'bg-red-900/10 hover:bg-red-900/20'
                    : 'hover:bg-gray-900/50'
                  }
                >
                  <td className="p-3 text-white font-mono text-xs">{cluster.address}</td>
                  <td className="p-3 text-gray-400">{cluster.city}</td>
                  <td className="p-3 text-gray-400">{cluster.state}</td>
                  <td className="p-3 text-right font-mono text-white">{cluster.org_count}</td>
                  <td className="p-3 text-right font-mono text-gray-400">{cluster.ppp_recipient_count}</td>
                  <td className="p-3 text-right font-mono text-green-500">{formatMoney(cluster.total_funding)}</td>
                  <td className="p-3 text-center">
                    {cluster.has_shell_company ? (
                      <span className="text-xs bg-red-900/50 text-red-400 px-2 py-0.5 rounded">SHELL</span>
                    ) : cluster.org_count >= 10 ? (
                      <span className="text-xs bg-yellow-900/50 text-yellow-400 px-2 py-0.5 rounded">HIGH</span>
                    ) : cluster.org_count >= 5 ? (
                      <span className="text-xs bg-orange-900/50 text-orange-400 px-2 py-0.5 rounded">MED</span>
                    ) : (
                      <span className="text-xs text-gray-600">LOW</span>
                    )}
                  </td>
                  <td className="p-3 text-gray-500 text-xs max-w-xs truncate">
                    {cluster.org_names.join(', ')}
                    {cluster.org_count > 5 && ` (+${cluster.org_count - 5} more)`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {clusters.length === 0 && (
        <div className="border border-gray-800 p-8 text-center">
          <p className="text-gray-500">No suspicious address clusters found.</p>
        </div>
      )}

      {/* Risk Level Legend */}
      <div className="border border-gray-800 p-4 mb-8">
        <h3 className="text-white font-medium mb-3">Risk Levels</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs bg-red-900/50 text-red-400 px-2 py-0.5 rounded">SHELL</span>
            <span className="text-gray-400">Confirmed shell company</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-yellow-900/50 text-yellow-400 px-2 py-0.5 rounded">HIGH</span>
            <span className="text-gray-400">10+ organizations</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-orange-900/50 text-orange-400 px-2 py-0.5 rounded">MED</span>
            <span className="text-gray-400">5-9 organizations</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">LOW</span>
            <span className="text-gray-400">3-4 organizations</span>
          </div>
        </div>
      </div>

      {/* Common Legitimate Explanations */}
      <div className="border border-gray-800 p-4 mb-8">
        <h3 className="text-white font-medium mb-3">Common Legitimate Explanations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-400">
          <div>
            <p className="text-gray-500 mb-1">Shared Office Spaces</p>
            <p>Coworking facilities like WeWork, Regus host many small businesses at one address.</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Business Incubators</p>
            <p>Startup incubators and accelerators may have dozens of companies at one location.</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Commercial Mail Services</p>
            <p>UPS Stores, mailbox services provide addresses for many businesses.</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Multi-Tenant Buildings</p>
            <p>Office buildings, strip malls naturally have multiple business tenants.</p>
          </div>
        </div>
      </div>

      {/* Methodology */}
      <div className="mt-8 border-t border-gray-800 pt-6">
        <h3 className="text-sm font-medium text-gray-400 mb-3">Methodology</h3>
        <p className="text-gray-500 text-sm leading-relaxed">
          Analysis uses the unified organizations table ({formatNumber(6613102)} entities) querying
          focus states (MN, OH, WA, TX, FL, CA, NY). Addresses are normalized and grouped.
          Shell company flags are set based on pattern detection including: registered agent addresses
          with high entity counts, addresses linked to prosecuted fraud cases, and entities with
          suspicious incorporation patterns. Results sorted by shell company presence, then entity count.
        </p>
      </div>
    </div>
  );
}
