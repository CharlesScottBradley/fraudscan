'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import ToshiAdBanner from '../../components/ToshiAdBanner';

// Dynamically import NetworkGraph to avoid SSR issues with vis-network
const NetworkGraph = dynamic(() => import('@/app/components/NetworkGraph'), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] bg-gray-950 border border-gray-800 flex items-center justify-center">
      <p className="text-gray-500">Loading graph...</p>
    </div>
  ),
});

interface NetworkNode {
  id: string;
  label: string;
  type: 'person' | 'company' | 'politician' | 'committee' | 'provider' | 'organization' | 'vendor' | 'fraud_case';
  group?: string;
  metadata?: Record<string, unknown>;
}

interface NetworkEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
  type: 'donation' | 'employment' | 'ppp_loan' | 'eidl_loan' | 'state_grant' | 'defendant' | 'ownership' | 'other';
  amount?: number;
  metadata?: Record<string, unknown>;
}

interface SearchResult {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

// Preset examples to explore
const PRESETS = [
  { label: 'Feeding Our Future', query: 'Feeding Our Future', type: 'case' },
  { label: 'PPP Cases', query: 'PPP', type: 'case' },
  { label: 'State of Minnesota', query: 'Minnesota State', type: 'vendor' },
  { label: 'Healthcare Orgs', query: 'health', type: 'org' },
  { label: 'Tim Walz', query: 'Walz', type: 'recipient' },
  { label: 'DFL House Caucus', query: 'DFL House', type: 'recipient' },
  { label: 'New Horizon Academy', query: 'New Horizon', type: 'provider' },
  { label: 'EIDL Recipients', query: 'consulting', type: 'eidl' },
];

export default function NetworkExplorerPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NetworkNode[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [edges, setEdges] = useState<NetworkEdge[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState({ nodes: 0, edges: 0, totalDonations: 0 });

  // Search for entities
  const handleSearch = useCallback(async (query: string, type?: string | null) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const params = new URLSearchParams({ q: query });
      if (type) params.set('type', type);

      const res = await fetch(`/api/network?${params}`);
      const data: SearchResult = await res.json();
      setSearchResults(data.nodes);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Add a node to the graph and expand its connections
  const addNodeToGraph = useCallback(async (node: NetworkNode) => {
    // Add the node if not already present
    setNodes(prev => {
      if (prev.some(n => n.id === node.id)) return prev;
      return [...prev, node];
    });

    // Expand connections
    await expandNode(node.id);

    // Clear search
    setSearchQuery('');
    setSearchResults([]);
  }, []);

  // Expand a node to show its connections
  const expandNode = useCallback(async (nodeId: string) => {
    if (expandedNodes.has(nodeId)) return;

    try {
      const res = await fetch(`/api/network?expand=${encodeURIComponent(nodeId)}`);
      const data: SearchResult = await res.json();

      // Add new nodes
      setNodes(prev => {
        const existing = new Set(prev.map(n => n.id));
        const newNodes = data.nodes.filter(n => !existing.has(n.id));
        return [...prev, ...newNodes];
      });

      // Add new edges
      setEdges(prev => {
        const existing = new Set(prev.map(e => e.id));
        const newEdges = data.edges.filter(e => !existing.has(e.id));
        return [...prev, ...newEdges];
      });

      setExpandedNodes(prev => new Set([...prev, nodeId]));

      // Update stats
      setStats(prev => ({
        nodes: prev.nodes + data.nodes.length,
        edges: prev.edges + data.edges.length,
        totalDonations: data.edges
          .filter(e => e.type === 'donation')
          .reduce((sum, e) => sum + (e.amount || 0), prev.totalDonations),
      }));
    } catch (error) {
      console.error('Expand error:', error);
    }
  }, [expandedNodes]);

  // Handle node double-click
  const handleNodeDoubleClick = useCallback((nodeId: string) => {
    expandNode(nodeId);
  }, [expandNode]);

  // Clear the graph
  const clearGraph = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setExpandedNodes(new Set());
    setStats({ nodes: 0, edges: 0, totalDonations: 0 });
  }, []);

  // Load a preset
  const loadPreset = useCallback(async (preset: typeof PRESETS[0]) => {
    clearGraph();
    await handleSearch(preset.query, preset.type);
  }, [clearGraph, handleSearch]);

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Network Explorer</h1>
            <p className="text-gray-500">
              Visualize connections between donors, politicians, and organizations
            </p>
          </div>
          <Link href="/donations" className="text-gray-400 hover:text-white text-sm">
            &larr; Back to donations
          </Link>
        </div>
      </div>

      {/* Toshi Sponsor Banner */}
      <ToshiAdBanner className="mb-8" />

      {/* Controls */}
      <div className="mb-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Search */}
        <div className="lg:col-span-2">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleSearch(e.target.value);
              }}
              placeholder="Search for a person, company, or politician..."
              className="w-full bg-gray-900 border border-gray-700 px-4 py-3 text-sm focus:outline-none focus:border-gray-500"
            />
            {isSearching && (
              <span className="absolute right-3 top-3 text-gray-500 text-sm">Searching...</span>
            )}

            {/* Search results dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-gray-900 border border-gray-700 max-h-64 overflow-y-auto">
                {searchResults.map((node) => (
                  <button
                    key={node.id}
                    onClick={() => addNodeToGraph(node)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-800 flex items-center justify-between"
                  >
                    <span>{node.label}</span>
                    <span className="text-xs text-gray-500 capitalize">{node.type}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={clearGraph}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-sm"
          >
            Clear Graph
          </button>
        </div>
      </div>

      {/* Presets */}
      <div className="mb-6">
        <p className="text-sm text-gray-500 mb-2">Quick start - explore these entities:</p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => loadPreset(preset)}
              className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-sm rounded"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      {nodes.length > 0 && (
        <div className="mb-4 flex gap-6 text-sm">
          <span className="text-gray-400">
            <span className="text-white font-mono">{nodes.length}</span> nodes
          </span>
          <span className="text-gray-400">
            <span className="text-white font-mono">{edges.length}</span> connections
          </span>
          {stats.totalDonations > 0 && (
            <span className="text-gray-400">
              <span className="text-green-500 font-mono">
                ${stats.totalDonations.toLocaleString()}
              </span> in donations shown
            </span>
          )}
        </div>
      )}

      {/* Graph */}
      {nodes.length > 0 ? (
        <NetworkGraph
          initialNodes={nodes}
          initialEdges={edges}
          onNodeDoubleClick={handleNodeDoubleClick}
          height="600px"
        />
      ) : (
        <div className="h-[600px] bg-gray-950 border border-gray-800 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 mb-4">Search for an entity to start exploring connections</p>
            <p className="text-gray-600 text-sm">
              Or click a preset above to see example networks
            </p>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
        <div className="p-4 bg-gray-900 border border-gray-800">
          <h3 className="font-medium mb-2">Node Types</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500"></span> Person</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-yellow-500"></span> Company</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500"></span> Politician</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-purple-500"></span> Committee</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500"></span> Provider</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-cyan-500"></span> Organization</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-lime-500"></span> Vendor</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-700"></span> Fraud Case</div>
          </div>
        </div>
        <div className="p-4 bg-gray-900 border border-gray-800">
          <h3 className="font-medium mb-2">Connection Types</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2"><span className="w-6 h-0.5 bg-red-500"></span> Donation</div>
            <div className="flex items-center gap-2"><span className="w-6 h-0.5 bg-blue-500"></span> Employment</div>
            <div className="flex items-center gap-2"><span className="w-6 h-0.5 bg-yellow-500"></span> PPP Loan</div>
            <div className="flex items-center gap-2"><span className="w-6 h-0.5 bg-orange-500"></span> EIDL Loan</div>
            <div className="flex items-center gap-2"><span className="w-6 h-0.5 bg-lime-500"></span> State Grant</div>
            <div className="flex items-center gap-2"><span className="w-6 h-0.5 bg-red-700"></span> Defendant</div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 p-4 bg-gray-900 border border-gray-800 text-sm">
        <h3 className="font-medium mb-2">How to use</h3>
        <ul className="text-gray-400 space-y-1 list-disc list-inside">
          <li>Search for entities: companies, people, fraud cases, state vendors, organizations</li>
          <li>Click a result to add it to the graph</li>
          <li>Double-click any node to expand and see its connections</li>
          <li>Drag nodes to rearrange, scroll to zoom</li>
        </ul>
      </div>

      {/* Data sources */}
      <div className="mt-4 text-xs text-gray-600">
        Data: MN Campaign Finance, SBA PPP/EIDL Loans, OpenTheBooks State Checkbooks, DOJ Fraud Cases, MN DHS Licensing
      </div>
    </div>
  );
}
