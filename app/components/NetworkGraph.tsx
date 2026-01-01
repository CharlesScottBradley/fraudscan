'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Network, DataSet } from 'vis-network/standalone';

export interface NetworkNode {
  id: string;
  label: string;
  type: 'person' | 'company' | 'politician' | 'committee' | 'provider' | 'organization' | 'vendor' | 'fraud_case';
  group?: string;
  metadata?: Record<string, unknown>;
}

export interface NetworkEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
  type: 'donation' | 'employment' | 'ppp_loan' | 'eidl_loan' | 'state_grant' | 'defendant' | 'ownership' | 'other';
  amount?: number;
  metadata?: Record<string, unknown>;
}

interface NetworkGraphProps {
  initialNodes?: NetworkNode[];
  initialEdges?: NetworkEdge[];
  onNodeClick?: (nodeId: string, node: NetworkNode) => void;
  onNodeDoubleClick?: (nodeId: string, node: NetworkNode) => void;
  onEdgeClick?: (edgeId: string, edge: NetworkEdge) => void;
  height?: string;
}

const NODE_COLORS: Record<NetworkNode['type'], { background: string; border: string }> = {
  person: { background: '#3b82f6', border: '#1d4ed8' },        // Blue
  company: { background: '#f59e0b', border: '#d97706' },       // Yellow/Orange
  politician: { background: '#ef4444', border: '#dc2626' },    // Red
  committee: { background: '#8b5cf6', border: '#7c3aed' },     // Purple
  provider: { background: '#10b981', border: '#059669' },      // Green
  organization: { background: '#06b6d4', border: '#0891b2' },  // Cyan - unified orgs
  vendor: { background: '#84cc16', border: '#65a30d' },        // Lime - state vendors
  fraud_case: { background: '#dc2626', border: '#991b1b' },    // Dark Red - fraud cases
};

const EDGE_COLORS: Record<NetworkEdge['type'], string> = {
  donation: '#ef4444',      // Red - money to politicians
  employment: '#3b82f6',    // Blue - works for
  ppp_loan: '#f59e0b',      // Yellow - PPP money
  eidl_loan: '#f97316',     // Orange - EIDL money
  state_grant: '#84cc16',   // Lime - state grants
  defendant: '#dc2626',     // Dark Red - defendant link
  ownership: '#8b5cf6',     // Purple - owns/controls
  other: '#6b7280',         // Gray
};

function formatMoney(amount: number): string {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

export default function NetworkGraph({
  initialNodes = [],
  initialEdges = [],
  onNodeClick,
  onNodeDoubleClick,
  onEdgeClick,
  height = '600px',
}: NetworkGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);
  const nodesDataSet = useRef<DataSet<Record<string, unknown>>>(new DataSet());
  const edgesDataSet = useRef<DataSet<Record<string, unknown>>>(new DataSet());
  const nodeMapRef = useRef<Map<string, NetworkNode>>(new Map());
  const edgeMapRef = useRef<Map<string, NetworkEdge>>(new Map());

  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<NetworkEdge | null>(null);

  // Add nodes to the graph
  const addNodes = useCallback((nodes: NetworkNode[]) => {
    const visNodes = nodes.map(node => {
      nodeMapRef.current.set(node.id, node);
      const colors = NODE_COLORS[node.type];
      return {
        id: node.id,
        label: node.label,
        group: node.group || node.type,
        color: {
          background: colors.background,
          border: colors.border,
          highlight: { background: colors.background, border: '#fff' },
        },
        font: { color: '#fff', size: 12 },
        shape: node.type === 'person' ? 'dot' : 'box',
        size: node.type === 'company' || node.type === 'provider' ? 25 : 20,
      };
    });
    nodesDataSet.current.update(visNodes);
  }, []);

  // Add edges to the graph
  const addEdges = useCallback((edges: NetworkEdge[]) => {
    const visEdges = edges.map(edge => {
      edgeMapRef.current.set(edge.id, edge);
      const color = EDGE_COLORS[edge.type];
      return {
        id: edge.id,
        from: edge.from,
        to: edge.to,
        label: edge.amount ? formatMoney(edge.amount) : edge.label,
        color: { color, highlight: '#fff' },
        font: { color: '#9ca3af', size: 10, strokeWidth: 0 },
        arrows: { to: { enabled: true, scaleFactor: 0.5 } },
        width: edge.amount ? Math.max(1, Math.min(5, Math.log10(edge.amount) - 1)) : 1,
        smooth: { type: 'curvedCW', roundness: 0.2 },
      };
    });
    edgesDataSet.current.update(visEdges);
  }, []);

  // Remove nodes
  const removeNodes = useCallback((nodeIds: string[]) => {
    nodeIds.forEach(id => nodeMapRef.current.delete(id));
    nodesDataSet.current.remove(nodeIds);
  }, []);

  // Remove edges
  const removeEdges = useCallback((edgeIds: string[]) => {
    edgeIds.forEach(id => edgeMapRef.current.delete(id));
    edgesDataSet.current.remove(edgeIds);
  }, []);

  // Clear the graph
  const clearGraph = useCallback(() => {
    nodeMapRef.current.clear();
    edgeMapRef.current.clear();
    nodesDataSet.current.clear();
    edgesDataSet.current.clear();
  }, []);

  // Initialize the network
  useEffect(() => {
    if (!containerRef.current) return;

    const options = {
      nodes: {
        borderWidth: 2,
        shadow: true,
        font: { color: '#fff' },
      },
      edges: {
        width: 1,
        shadow: true,
        smooth: {
          enabled: true,
          type: 'continuous',
          roundness: 0.5,
        },
      },
      physics: {
        enabled: true,
        solver: 'forceAtlas2Based',
        forceAtlas2Based: {
          gravitationalConstant: -50,
          centralGravity: 0.01,
          springLength: 150,
          springConstant: 0.08,
          damping: 0.4,
        },
        stabilization: {
          enabled: true,
          iterations: 100,
          updateInterval: 25,
        },
      },
      interaction: {
        hover: true,
        tooltipDelay: 200,
        hideEdgesOnDrag: true,
        navigationButtons: true,
        keyboard: true,
      },
      layout: {
        improvedLayout: true,
      },
    };

    const network = new Network(
      containerRef.current,
      { nodes: nodesDataSet.current, edges: edgesDataSet.current },
      options
    );

    // Event handlers
    network.on('click', (params) => {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        const node = nodeMapRef.current.get(nodeId);
        if (node) {
          setSelectedNode(node);
          setSelectedEdge(null);
          onNodeClick?.(nodeId, node);
        }
      } else if (params.edges.length > 0) {
        const edgeId = params.edges[0];
        const edge = edgeMapRef.current.get(edgeId);
        if (edge) {
          setSelectedEdge(edge);
          setSelectedNode(null);
          onEdgeClick?.(edgeId, edge);
        }
      } else {
        setSelectedNode(null);
        setSelectedEdge(null);
      }
    });

    network.on('doubleClick', (params) => {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        const node = nodeMapRef.current.get(nodeId);
        if (node) {
          onNodeDoubleClick?.(nodeId, node);
        }
      }
    });

    networkRef.current = network;

    // Add initial data
    if (initialNodes.length > 0) {
      addNodes(initialNodes);
    }
    if (initialEdges.length > 0) {
      addEdges(initialEdges);
    }

    return () => {
      network.destroy();
    };
  }, []);

  // Update when initial data changes
  useEffect(() => {
    if (initialNodes.length > 0) {
      addNodes(initialNodes);
    }
  }, [initialNodes, addNodes]);

  useEffect(() => {
    if (initialEdges.length > 0) {
      addEdges(initialEdges);
    }
  }, [initialEdges, addEdges]);

  return (
    <div className="relative">
      {/* Graph container */}
      <div
        ref={containerRef}
        style={{ height, width: '100%' }}
        className="bg-gray-950 border border-gray-800 rounded"
      />

      {/* Legend */}
      <div className="absolute top-4 left-4 bg-black/80 p-3 rounded text-xs space-y-2">
        <p className="text-gray-400 font-medium mb-2">Node Types</p>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: NODE_COLORS.person.background }} />
          <span className="text-gray-300">Person</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded" style={{ backgroundColor: NODE_COLORS.company.background }} />
          <span className="text-gray-300">Company</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded" style={{ backgroundColor: NODE_COLORS.politician.background }} />
          <span className="text-gray-300">Politician</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded" style={{ backgroundColor: NODE_COLORS.provider.background }} />
          <span className="text-gray-300">Provider</span>
        </div>
        <p className="text-gray-400 font-medium mt-3 mb-2">Edge Types</p>
        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5" style={{ backgroundColor: EDGE_COLORS.donation }} />
          <span className="text-gray-300">Donation</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5" style={{ backgroundColor: EDGE_COLORS.ppp_loan }} />
          <span className="text-gray-300">PPP Loan</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5" style={{ backgroundColor: EDGE_COLORS.employment }} />
          <span className="text-gray-300">Employment</span>
        </div>
      </div>

      {/* Selected item info */}
      {(selectedNode || selectedEdge) && (
        <div className="absolute top-4 right-4 bg-black/80 p-4 rounded max-w-xs">
          {selectedNode && (
            <div>
              <p className="text-white font-medium">{selectedNode.label}</p>
              <p className="text-gray-400 text-sm capitalize">{selectedNode.type}</p>
              {selectedNode.metadata && (
                <div className="mt-2 text-xs text-gray-500">
                  {Object.entries(selectedNode.metadata).map(([key, value]) => (
                    <p key={key}>{key}: {String(value)}</p>
                  ))}
                </div>
              )}
              <p className="text-gray-500 text-xs mt-2">Double-click to expand connections</p>
            </div>
          )}
          {selectedEdge && (
            <div>
              <p className="text-white font-medium capitalize">{selectedEdge.type.replace('_', ' ')}</p>
              {selectedEdge.amount && (
                <p className="text-green-500 font-mono">{formatMoney(selectedEdge.amount)}</p>
              )}
              {selectedEdge.label && !selectedEdge.amount && (
                <p className="text-gray-400 text-sm">{selectedEdge.label}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Controls hint */}
      <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-2 rounded text-xs text-gray-500">
        Scroll to zoom | Drag to pan | Click node for info | Double-click to expand
      </div>
    </div>
  );
}

// Export helper functions for external use
export { formatMoney };
