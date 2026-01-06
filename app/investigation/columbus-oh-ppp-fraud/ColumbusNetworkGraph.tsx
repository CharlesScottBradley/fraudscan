'use client';

import { useEffect, useRef, useState } from 'react';
import { Network, DataSet } from 'vis-network/standalone';

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

interface ColumbusNetworkGraphProps {
  entities: Entity[];
  clusters: Cluster[];
  onSelectEntity: (entity: Entity | null) => void;
}

// Entity type colors
const ENTITY_COLORS: Record<string, string> = {
  'Nonprofit': '#8b5cf6',       // purple
  'Individual': '#22c55e',      // green
  'Business - Home Health': '#3b82f6', // blue
  'Business - Transportation': '#f59e0b', // amber
  'Business - Trucking': '#f59e0b', // amber
  'Business - Accounting': '#ef4444', // red
  'Business - Mixed': '#ec4899', // pink
  'Business': '#6b7280',        // gray
};

// Connection type colors
const CONNECTION_COLORS: Record<string, string> = {
  'Officer/Associate': '#6b7280',
  'Same Address': '#3b82f6',
  'Registered Agent': '#22c55e',
  'Same Owner': '#8b5cf6',
  'Suite Sharing': '#ef4444',
  'Same Name Pattern': '#f59e0b',
  'Auditor': '#ec4899',
  'Agent': '#10b981',
};

function getEntityColor(entityType: string, clusterColor?: string): string {
  // If cluster color provided, use it
  if (clusterColor) return clusterColor;

  for (const [key, color] of Object.entries(ENTITY_COLORS)) {
    if (entityType.includes(key)) {
      return color;
    }
  }
  return '#6b7280'; // gray default
}

function getConnectionColor(connectionType: string): string {
  for (const [key, color] of Object.entries(CONNECTION_COLORS)) {
    if (connectionType.includes(key)) {
      return color;
    }
  }
  return '#374151'; // gray default
}

function formatMoney(amount: number): string {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(2)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

export default function ColumbusNetworkGraph({ entities, clusters, onSelectEntity }: ColumbusNetworkGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);

  // Build cluster color map
  const clusterColorMap: Record<string, string> = {};
  clusters.forEach(c => {
    clusterColorMap[c.id] = c.color;
  });

  // Filter entities by selected cluster
  const filteredEntities = selectedCluster
    ? entities.filter(e => e.cluster === selectedCluster || e.cluster === 'cross_state')
    : entities;

  useEffect(() => {
    if (!containerRef.current) return;

    // Build nodes
    const nodes = new DataSet(
      filteredEntities.map((entity, index) => {
        const isKeyFigure = entity.entity_type.includes('Key Figure');
        const isIndividual = entity.entity_type.includes('Individual');
        const isNonprofit = entity.entity_type.includes('Nonprofit');
        const hasRedFlags = entity.red_flags && entity.red_flags.length > 0;

        const baseColor = entity.cluster
          ? clusterColorMap[entity.cluster] || getEntityColor(entity.entity_type)
          : getEntityColor(entity.entity_type);

        return {
          id: index,
          label: entity.entity_name.length > 25
            ? entity.entity_name.substring(0, 25) + '...'
            : entity.entity_name,
          title: `${entity.entity_name}\n${entity.ppp_amount ? formatMoney(entity.ppp_amount) : ''}`,
          color: {
            background: baseColor,
            border: hasRedFlags ? '#ef4444' : baseColor,
            highlight: {
              background: '#ffffff',
              border: baseColor,
            },
          },
          borderWidth: hasRedFlags ? 3 : 2,
          font: {
            color: '#ffffff',
            size: isKeyFigure ? 14 : isNonprofit ? 13 : 11,
          },
          size: isKeyFigure ? 40 : isNonprofit ? 35 : isIndividual ? 20 : 25,
          shape: isKeyFigure ? 'star' : isNonprofit ? 'diamond' : isIndividual ? 'dot' : 'box',
        };
      })
    );

    // Build edges
    const edgeSet: { id: number; from: number; to: number; color: string; title: string; dashes?: boolean }[] = [];
    const entityNameToIndex: Record<string, number> = {};
    let edgeId = 0;

    filteredEntities.forEach((entity, index) => {
      entityNameToIndex[entity.entity_name] = index;
    });

    filteredEntities.forEach((entity, fromIndex) => {
      entity.connected_entities.forEach((connectedName, connIdx) => {
        const toIndex = entityNameToIndex[connectedName];
        if (toIndex !== undefined && fromIndex < toIndex) {
          const connectionType = entity.connection_types[connIdx] || entity.connection_types[0] || 'Unknown';
          edgeSet.push({
            id: edgeId++,
            from: fromIndex,
            to: toIndex,
            color: getConnectionColor(connectionType),
            title: connectionType,
            dashes: connectionType.includes('Cross-state') || connectionType.includes('Auditor'),
          });
        }
      });
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const edges = new DataSet(edgeSet as any);

    // Network options
    const options = {
      nodes: {
        borderWidth: 2,
        shadow: true,
      },
      edges: {
        width: 2,
        smooth: {
          type: 'continuous',
          roundness: 0.5,
        },
        color: {
          inherit: false,
        },
      },
      physics: {
        forceAtlas2Based: {
          gravitationalConstant: -80,
          centralGravity: 0.015,
          springLength: 200,
          springConstant: 0.06,
        },
        maxVelocity: 50,
        solver: 'forceAtlas2Based',
        timestep: 0.35,
        stabilization: {
          enabled: true,
          iterations: 200,
          updateInterval: 25,
        },
      },
      interaction: {
        hover: true,
        tooltipDelay: 200,
        zoomView: true,
        dragView: true,
      },
    };

    // Create network
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const network = new Network(
      containerRef.current,
      { nodes, edges } as any,
      options as any
    );

    networkRef.current = network;

    // Event handlers
    network.on('click', (params) => {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        onSelectEntity(filteredEntities[nodeId]);
      } else {
        onSelectEntity(null);
      }
    });

    network.on('stabilizationIterationsDone', () => {
      setIsLoading(false);
      network.setOptions({ physics: { enabled: false } });
    });

    return () => {
      network.destroy();
    };
  }, [filteredEntities, clusters, onSelectEntity, clusterColorMap]);

  return (
    <div>
      {/* Cluster Filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => { setSelectedCluster(null); setIsLoading(true); }}
          className={`px-3 py-1 text-xs rounded ${
            selectedCluster === null
              ? 'bg-white text-black'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          All Clusters
        </button>
        {clusters.map((cluster) => (
          <button
            key={cluster.id}
            onClick={() => { setSelectedCluster(cluster.id); setIsLoading(true); }}
            className={`px-3 py-1 text-xs rounded flex items-center gap-2 ${
              selectedCluster === cluster.id
                ? 'bg-white text-black'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: cluster.color }}
            />
            {cluster.name}
          </button>
        ))}
      </div>

      {/* Network Graph */}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
            <div className="text-gray-400 font-mono text-sm">
              Rendering network...
            </div>
          </div>
        )}
        <div
          ref={containerRef}
          className="w-full h-[550px] border border-gray-800 bg-gray-950"
        />
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-6 text-xs">
        <div>
          <p className="text-gray-500 mb-2">Entity Types</p>
          <div className="flex flex-wrap gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 text-yellow-400">&#9733;</span>
              <span className="text-gray-400">Key Figure</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-purple-500 rotate-45"></span>
              <span className="text-gray-400">Nonprofit</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
              <span className="text-gray-400">Individual</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-blue-500"></span>
              <span className="text-gray-400">Business</span>
            </span>
          </div>
        </div>
        <div>
          <p className="text-gray-500 mb-2">Connections</p>
          <div className="flex flex-wrap gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 bg-blue-500"></span>
              <span className="text-gray-400">Same Address</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 bg-red-500"></span>
              <span className="text-gray-400">Suite Sharing</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 bg-pink-500 border-dashed"></span>
              <span className="text-gray-400">Auditor</span>
            </span>
          </div>
        </div>
        <div>
          <p className="text-gray-500 mb-2">Red Flags</p>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 border-2 border-red-500 rounded"></span>
            <span className="text-gray-400">Red border = flagged entity</span>
          </div>
        </div>
      </div>
    </div>
  );
}
