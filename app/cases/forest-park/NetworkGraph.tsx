'use client';

import { useEffect, useRef, useState } from 'react';
import { Network, DataSet } from 'vis-network/standalone';

interface Entity {
  entity_name: string;
  entity_type: string;
  enforcement_record_source: string;
  connected_entities: string[];
  connection_types: string[];
  source_citation: string;
  role?: string;
  sentence?: string;
  conviction_date?: string;
  plea_date?: string;
  sentence_date?: string;
  specialty?: string;
  location?: string;
  case_number?: string;
  function?: string;
  scheme_amount?: string;
  case?: string;
}

interface NetworkGraphProps {
  entities: Entity[];
  onSelectEntity: (entity: Entity | null) => void;
}

// Color mapping for entity types
const ENTITY_COLORS: Record<string, string> = {
  'Hospital': '#ef4444',                          // red
  'Individual - Physician': '#22c55e',            // green
  'Individual - Business Owner/Executive': '#3b82f6', // blue
  'Individual - Business Owner': '#3b82f6',       // blue
  'Individual - Licensed Healthcare Professional': '#8b5cf6', // purple
  'Business Entity - Surgeon Brokerage': '#a855f7', // purple
  'Business Entity - Medical Services': '#a855f7', // purple
  'Business Entity - Outpatient Treatment Center': '#a855f7', // purple
};

// Connection type colors
const CONNECTION_COLORS: Record<string, string> = {
  'Shared Principals/Officers': '#6b7280',
  'Documented Business Transactions': '#f59e0b',
  'Shared Entity Ownership': '#10b981',
  'Shared Business Partnership': '#8b5cf6',
  'Shared Entity': '#3b82f6',
};

function getEntityColor(entityType: string): string {
  for (const [key, color] of Object.entries(ENTITY_COLORS)) {
    if (entityType.includes(key) || key.includes(entityType)) {
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

export default function NetworkGraph({ entities, onSelectEntity }: NetworkGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;

    // Build nodes
    const nodes = new DataSet(
      entities.map((entity, index) => ({
        id: index,
        label: entity.entity_name.length > 20
          ? entity.entity_name.substring(0, 20) + '...'
          : entity.entity_name,
        title: entity.entity_name,
        color: {
          background: getEntityColor(entity.entity_type),
          border: getEntityColor(entity.entity_type),
          highlight: {
            background: '#ffffff',
            border: getEntityColor(entity.entity_type),
          },
        },
        font: {
          color: '#ffffff',
          size: entity.entity_type === 'Hospital' ? 14 : 11,
        },
        size: entity.entity_type === 'Hospital' ? 35 :
              entity.entity_type.includes('Business Entity') ? 25 : 20,
        shape: entity.entity_type === 'Hospital' ? 'diamond' :
               entity.entity_type.includes('Business Entity') ? 'square' : 'dot',
      }))
    );

    // Build edges
    const edgeSet: { id: number; from: number; to: number; color: string; title: string }[] = [];
    const entityNameToIndex: Record<string, number> = {};
    let edgeId = 0;

    entities.forEach((entity, index) => {
      entityNameToIndex[entity.entity_name] = index;
    });

    entities.forEach((entity, fromIndex) => {
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
        width: 1.5,
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
          gravitationalConstant: -50,
          centralGravity: 0.01,
          springLength: 150,
          springConstant: 0.08,
        },
        maxVelocity: 50,
        solver: 'forceAtlas2Based',
        timestep: 0.35,
        stabilization: {
          enabled: true,
          iterations: 150,
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
        onSelectEntity(entities[nodeId]);
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
  }, [entities, onSelectEntity]);

  return (
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
        className="w-full h-[500px] border border-gray-800 bg-gray-950"
      />

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-6 text-xs">
        <div>
          <p className="text-gray-500 mb-2">Entity Types</p>
          <div className="flex flex-wrap gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-red-500 rotate-45"></span>
              <span className="text-gray-400">Hospital</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
              <span className="text-gray-400">Physician</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <span className="text-gray-400">Business Owner</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-purple-500"></span>
              <span className="text-gray-400">Business Entity</span>
            </span>
          </div>
        </div>
        <div>
          <p className="text-gray-500 mb-2">Connection Types</p>
          <div className="flex flex-wrap gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 bg-amber-500"></span>
              <span className="text-gray-400">Business Transactions</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 bg-emerald-500"></span>
              <span className="text-gray-400">Shared Ownership</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 bg-gray-500"></span>
              <span className="text-gray-400">Shared Officers</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
