'use client';

import { useState } from 'react';
import Link from 'next/link';
import ColumbusNetworkGraph from './ColumbusNetworkGraph';
import TreeView from './TreeView';
import EntitySidebar from './EntitySidebar';

interface Entity {
  entity_name: string;
  entity_type: string;
  cluster?: string;
  address?: string;
  ppp_amount?: number;
  ppp_jobs?: number;
  ppp_loans?: number;
  connected_entities: string[];
  connection_types: string[];
  notes?: string;
  red_flags?: string[];
  registered_agent?: string;
  role?: string;
  state_funding?: number;
  file_number?: string;
  naics?: string;
  state?: string;
  status?: string;
}

interface Cluster {
  id: string;
  name: string;
  description: string;
  total_entities: number;
  total_ppp: number;
  total_jobs: number;
  color: string;
}

interface Pattern {
  pattern: string;
  description: string;
  examples: string[];
  severity: string;
}

interface NetworkData {
  network_metadata: {
    title: string;
    date_created: string;
    total_ppp_exposure: number;
    total_entities: number;
    total_jobs_claimed: number;
    clusters_identified: number;
    primary_nexus: string;
    data_sources: string[];
  };
  clusters: Cluster[];
  entities: Entity[];
  patterns: Pattern[];
  red_flag_summary: Record<string, number>;
}

interface ColumbusClientProps {
  data: NetworkData;
}

function formatMoney(amount: number): string {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(2)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

export default function ColumbusClient({ data }: ColumbusClientProps) {
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [activeTab, setActiveTab] = useState<'tree' | 'network' | 'clusters' | 'patterns'>('tree');

  // Count entities with red flags
  const flaggedEntities = data.entities.filter(e => e.red_flags && e.red_flags.length > 0).length;

  return (
    <div className={selectedEntity ? 'mr-96' : ''}>
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-6">
        <Link href="/investigation" className="hover:text-gray-300">Investigations</Link>
        <span className="mx-2">/</span>
        <span className="text-white">Columbus OH PPP Fraud Network</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <p className="text-gray-500 text-sm uppercase tracking-wide mb-2">Investigation</p>
        <h1 className="text-3xl font-bold mb-2">Columbus OH PPP Fraud Network</h1>
        <p className="text-gray-400">Multi-cluster analysis of potential PPP fraud centered on SERC</p>
      </div>

      {/* Terminal-style stats */}
      <div className="font-mono text-sm mb-10">
        <p className="text-gray-500">INVESTIGATION_SUMMARY</p>
        <div className="mt-2 text-gray-400">
          <p><span className="text-gray-600">+-</span> total_ppp_exposure <span className="text-green-500 ml-4">{formatMoney(data.network_metadata.total_ppp_exposure)}</span></p>
          <p><span className="text-gray-600">+-</span> total_entities <span className="text-white ml-4">{data.network_metadata.total_entities}</span></p>
          <p><span className="text-gray-600">+-</span> total_jobs_claimed <span className="text-white ml-4">{data.network_metadata.total_jobs_claimed.toLocaleString()}</span></p>
          <p><span className="text-gray-600">+-</span> clusters_identified <span className="text-white ml-4">{data.network_metadata.clusters_identified}</span></p>
          <p><span className="text-gray-600">+-</span> entities_with_red_flags <span className="text-red-400 ml-4">{flaggedEntities}</span></p>
          <p><span className="text-gray-600">+-</span> primary_nexus <span className="text-yellow-400 ml-4">{data.network_metadata.primary_nexus}</span></p>
          <p><span className="text-gray-600">L-</span> status <span className="text-gray-400 ml-4">Under Investigation</span></p>
        </div>
      </div>

      {/* Alert Banner */}
      <div className="bg-yellow-900/20 border border-yellow-800 p-4 mb-8">
        <div className="flex items-start gap-3">
          <span className="text-yellow-500 text-xl">!</span>
          <div>
            <h2 className="text-yellow-400 font-medium mb-1">Cross-State Connection Identified</h2>
            <p className="text-sm text-gray-400">
              H&H Barakad Accounting, which audits SERC, was sanctioned by Ohio for conducting audits
              before being legally authorized. The same firm audits MAK Community Enrichment Services
              in Minnesota, which is <span className="text-yellow-400">under federal investigation</span> for
              daycare fraud similar to Feeding Our Future.
            </p>
          </div>
        </div>
      </div>

      {/* What is this */}
      <div className="border border-gray-800 p-4 mb-8">
        <h2 className="text-white font-medium mb-2">What is this investigation</h2>
        <p className="text-sm text-gray-400 leading-relaxed mb-3">
          Analysis of PPP loan clusters in Columbus, Ohio centered around the Somali Education and
          Resource Center (SERC) and connected home health and transportation businesses. The investigation
          spans 5 geographic clusters with $13.86M in total PPP exposure.
        </p>
        <p className="text-sm text-gray-400 leading-relaxed">
          Key concerns include: address laundering (using commercial addresses for PPP while registered
          elsewhere), suite sharing between unrelated businesses, the same individuals operating both
          healthcare and trucking companies, and connections to a sanctioned accounting firm with
          cross-state fraud ties.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-6 mb-6 border-b border-gray-800 pb-4">
        <button
          onClick={() => setActiveTab('tree')}
          className={activeTab === 'tree' ? 'text-white font-medium' : 'text-gray-500 hover:text-gray-300'}
        >
          Tree View
        </button>
        <button
          onClick={() => setActiveTab('network')}
          className={activeTab === 'network' ? 'text-white font-medium' : 'text-gray-500 hover:text-gray-300'}
        >
          Network Graph
        </button>
        <button
          onClick={() => setActiveTab('clusters')}
          className={activeTab === 'clusters' ? 'text-white font-medium' : 'text-gray-500 hover:text-gray-300'}
        >
          Clusters
        </button>
        <button
          onClick={() => setActiveTab('patterns')}
          className={activeTab === 'patterns' ? 'text-white font-medium' : 'text-gray-500 hover:text-gray-300'}
        >
          Fraud Patterns
        </button>
      </div>

      {/* Tree View Tab */}
      {activeTab === 'tree' && (
        <div className="mb-10">
          <TreeView
            entities={data.entities}
            onSelectEntity={setSelectedEntity}
          />
          <p className="text-gray-600 text-xs mt-2">
            Hierarchical view showing key figures, clusters, and top entities. Click any node to view details.
          </p>
        </div>
      )}

      {/* Network Graph Tab */}
      {activeTab === 'network' && (
        <div className="mb-10">
          <ColumbusNetworkGraph
            entities={data.entities}
            clusters={data.clusters}
            onSelectEntity={setSelectedEntity}
          />
          <p className="text-gray-600 text-xs mt-2">
            Click on a node to view entity details. Use cluster buttons to filter. Drag to reposition nodes.
          </p>
        </div>
      )}

      {/* Clusters Tab */}
      {activeTab === 'clusters' && (
        <div className="mb-10 space-y-4">
          {data.clusters.map((cluster) => (
            <div
              key={cluster.id}
              className="border border-gray-800 p-4 hover:border-gray-700 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: cluster.color }}
                  />
                  <div>
                    <h3 className="text-white font-medium">{cluster.name}</h3>
                    <p className="text-gray-500 text-sm">{cluster.description}</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-mono text-green-500">{formatMoney(cluster.total_ppp)}</p>
                  <p className="text-xs text-gray-500">PPP Total</p>
                </div>
                <div>
                  <p className="text-2xl font-mono text-white">{cluster.total_entities}</p>
                  <p className="text-xs text-gray-500">Entities</p>
                </div>
                <div>
                  <p className="text-2xl font-mono text-white">{cluster.total_jobs}</p>
                  <p className="text-xs text-gray-500">Jobs Claimed</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Patterns Tab */}
      {activeTab === 'patterns' && (
        <div className="mb-10 space-y-4">
          {data.patterns.map((pattern, idx) => (
            <div
              key={idx}
              className={`border p-4 ${
                pattern.severity === 'high'
                  ? 'border-red-800 bg-red-900/10'
                  : 'border-gray-800'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-white font-medium">{pattern.pattern}</h3>
                <span
                  className={`text-xs px-2 py-0.5 rounded ${
                    pattern.severity === 'high'
                      ? 'bg-red-900/30 text-red-400'
                      : 'bg-yellow-900/30 text-yellow-400'
                  }`}
                >
                  {pattern.severity} severity
                </span>
              </div>
              <p className="text-sm text-gray-400 mb-3">{pattern.description}</p>
              <div>
                <p className="text-xs text-gray-500 mb-2">Examples:</p>
                <div className="flex flex-wrap gap-2">
                  {pattern.examples.map((example, i) => (
                    <span key={i} className="bg-gray-800 px-2 py-1 rounded text-xs text-gray-300">
                      {example}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Key Entities Table */}
      <div className="mb-10">
        <h2 className="text-lg font-bold mb-4">Key Entities</h2>
        <div className="border border-gray-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left p-3 font-medium text-gray-400">Entity</th>
                <th className="text-left p-3 font-medium text-gray-400">Type</th>
                <th className="text-right p-3 font-medium text-gray-400">PPP</th>
                <th className="text-right p-3 font-medium text-gray-400">Jobs</th>
                <th className="text-left p-3 font-medium text-gray-400">Cluster</th>
                <th className="text-left p-3 font-medium text-gray-400">Flags</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {data.entities
                .filter(e => (e.ppp_amount && e.ppp_amount > 50000) || e.entity_type.includes('Key Figure') || e.entity_type.includes('Nonprofit'))
                .sort((a, b) => (b.ppp_amount || 0) - (a.ppp_amount || 0))
                .map((entity, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-gray-900/50 cursor-pointer"
                    onClick={() => setSelectedEntity(entity)}
                  >
                    <td className="p-3 text-white font-medium">{entity.entity_name}</td>
                    <td className="p-3 text-gray-400 text-xs">{entity.entity_type}</td>
                    <td className="p-3 text-right font-mono text-green-500">
                      {entity.ppp_amount ? formatMoney(entity.ppp_amount) : '-'}
                    </td>
                    <td className="p-3 text-right font-mono text-white">
                      {entity.ppp_jobs || '-'}
                    </td>
                    <td className="p-3">
                      {entity.cluster && (
                        <span
                          className="px-2 py-0.5 rounded text-xs"
                          style={{
                            backgroundColor: data.clusters.find(c => c.id === entity.cluster)?.color + '30',
                            color: data.clusters.find(c => c.id === entity.cluster)?.color
                          }}
                        >
                          {entity.cluster.replace(/_/g, ' ')}
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      {entity.red_flags && entity.red_flags.length > 0 && (
                        <span className="text-red-400 text-xs">
                          {entity.red_flags.length} flag{entity.red_flags.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Red Flag Summary */}
      <div className="border border-gray-800 p-4 mb-8">
        <h3 className="text-white font-medium mb-3">Red Flag Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(data.red_flag_summary).map(([key, count]) => (
            <div key={key} className="bg-gray-900 p-3 rounded text-center">
              <p className="text-2xl font-mono text-red-400">{count}</p>
              <p className="text-xs text-gray-500">{key.replace(/_/g, ' ')}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Data Sources */}
      <div className="text-xs text-gray-600 border-t border-gray-800 pt-6">
        <p className="text-gray-500 mb-2">Data Sources</p>
        <ul className="space-y-1">
          {data.network_metadata.data_sources.map((source, idx) => (
            <li key={idx}>{source}</li>
          ))}
        </ul>
      </div>

      {/* Related Links */}
      <div className="border-t border-gray-800 pt-6 mt-8">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Related</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <Link href="/investigation/mn-medicaid-fraud" className="text-gray-400 hover:text-green-400">
            Minnesota Medicaid Fraud
          </Link>
          <span className="text-gray-700">|</span>
          <Link href="/investigation" className="text-gray-400 hover:text-green-400">
            All Investigations
          </Link>
          <span className="text-gray-700">|</span>
          <Link href="/cases" className="text-gray-400 hover:text-green-400">
            Fraud Cases
          </Link>
          <span className="text-gray-700">|</span>
          <Link href="/tip" className="text-gray-400 hover:text-green-400">
            Submit a Tip
          </Link>
        </div>
      </div>

      {/* Entity Sidebar */}
      <EntitySidebar
        entity={selectedEntity}
        onClose={() => setSelectedEntity(null)}
      />
    </div>
  );
}
