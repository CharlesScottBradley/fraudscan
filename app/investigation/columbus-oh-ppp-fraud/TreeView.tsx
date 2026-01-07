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

interface TreeViewProps {
  entities: Entity[];
  onSelectEntity: (entity: Entity | null) => void;
}

// Entity type colors
const ENTITY_COLORS: Record<string, string> = {
  'Individual - Key Figure': '#f59e0b',  // amber - key figures
  'Nonprofit': '#8b5cf6',                // purple
  'Individual': '#22c55e',               // green
  'Business - Home Health': '#3b82f6',   // blue
  'Business - Transportation': '#f97316', // orange
  'Business - Trucking': '#f97316',      // orange
  'Business - Accounting': '#ef4444',    // red
  'Business - Mixed': '#ec4899',         // pink
  'Business': '#6b7280',                 // gray
};

function getEntityColor(entityType: string): string {
  for (const [key, color] of Object.entries(ENTITY_COLORS)) {
    if (entityType.includes(key)) {
      return color;
    }
  }
  return '#6b7280';
}

function formatMoney(amount: number): string {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(2)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

export default function TreeView({ entities, onSelectEntity }: TreeViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;

    // Build hierarchical structure
    // Level 0: Root (Investigation)
    // Level 1: Key Figures (Idris Hassan, Jama Mohamud)
    // Level 2: Organizations they connect to
    // Level 3: Entities connected to those organizations

    const nodeData: { id: number; label: string; level: number; color: any; shape: string; size: number; font: any; title: string }[] = [];
    const edgeData: { from: number; to: number; color: string; arrows?: string }[] = [];
    const entityToId: Record<string, number> = {};
    let nodeId = 0;

    // Root node
    nodeData.push({
      id: nodeId,
      label: 'Columbus OH\nPPP Network',
      level: 0,
      color: { background: '#1f2937', border: '#4b5563' },
      shape: 'box',
      size: 30,
      font: { color: '#ffffff', size: 14, face: 'monospace' },
      title: 'Columbus OH PPP Fraud Network\n$13.86M across 186 entities'
    });
    const rootId = nodeId++;

    // Find key figures (level 1)
    const keyFigures = entities.filter(e => e.entity_type.includes('Key Figure'));
    const keyFigureIds: number[] = [];

    keyFigures.forEach(entity => {
      entityToId[entity.entity_name] = nodeId;
      const hasRedFlags = entity.red_flags && entity.red_flags.length > 0;
      nodeData.push({
        id: nodeId,
        label: entity.entity_name,
        level: 1,
        color: {
          background: getEntityColor(entity.entity_type),
          border: hasRedFlags ? '#ef4444' : getEntityColor(entity.entity_type)
        },
        shape: 'star',
        size: 35,
        font: { color: '#ffffff', size: 12 },
        title: `${entity.entity_name}\n${entity.role || ''}\nPPP: ${entity.ppp_amount ? formatMoney(entity.ppp_amount) : 'N/A'}`
      });
      keyFigureIds.push(nodeId);
      edgeData.push({ from: rootId, to: nodeId, color: '#4b5563' });
      nodeId++;
    });

    // Find SERC and other core organizations (level 2)
    const coreOrgs = entities.filter(e =>
      e.entity_type.includes('Nonprofit') ||
      e.entity_name.includes('SERC') ||
      e.entity_name.includes('H&H Barakad')
    );

    const coreOrgIds: number[] = [];
    coreOrgs.forEach(entity => {
      if (entityToId[entity.entity_name] !== undefined) return; // Skip if already added

      entityToId[entity.entity_name] = nodeId;
      const hasRedFlags = entity.red_flags && entity.red_flags.length > 0;
      nodeData.push({
        id: nodeId,
        label: entity.entity_name.length > 20
          ? entity.entity_name.substring(0, 20) + '...'
          : entity.entity_name,
        level: 2,
        color: {
          background: getEntityColor(entity.entity_type),
          border: hasRedFlags ? '#ef4444' : getEntityColor(entity.entity_type)
        },
        shape: 'diamond',
        size: 30,
        font: { color: '#ffffff', size: 11 },
        title: `${entity.entity_name}\n${entity.ppp_amount ? 'PPP: ' + formatMoney(entity.ppp_amount) : ''}\n${entity.state_funding ? 'State: ' + formatMoney(entity.state_funding) : ''}`
      });
      coreOrgIds.push(nodeId);

      // Connect to key figures who are connected to this org
      keyFigures.forEach((kf, idx) => {
        if (kf.connected_entities.includes(entity.entity_name) ||
            entity.connected_entities.includes(kf.entity_name)) {
          edgeData.push({
            from: keyFigureIds[idx],
            to: nodeId,
            color: '#6b7280'
          });
        }
      });

      nodeId++;
    });

    // Add businesses by cluster (level 3)
    const clusters = ['dublin_granville_2999', 'dublin_granville_2021', 'dublin_granville_2700', 'busch_blvd_6161', 'cleveland_ave'];
    const clusterColors: Record<string, string> = {
      'dublin_granville_2999': '#3b82f6',
      'dublin_granville_2021': '#22c55e',
      'dublin_granville_2700': '#a855f7',
      'busch_blvd_6161': '#f59e0b',
      'cleveland_ave': '#ef4444'
    };

    // Add cluster header nodes (level 2.5 - we'll use level 2)
    const clusterNodeIds: Record<string, number> = {};

    clusters.forEach(clusterId => {
      const clusterEntities = entities.filter(e => e.cluster === clusterId &&
        !e.entity_type.includes('Key Figure') &&
        !e.entity_type.includes('Nonprofit') &&
        !e.entity_name.includes('H&H Barakad'));

      if (clusterEntities.length === 0) return;

      // Cluster header node
      const clusterName = clusterId.replace(/_/g, ' ').replace(/dublin granville/, 'Dublin Granville').replace(/busch blvd/, 'Busch Blvd').replace(/cleveland ave/, 'Cleveland Ave');
      clusterNodeIds[clusterId] = nodeId;
      nodeData.push({
        id: nodeId,
        label: clusterName,
        level: 2,
        color: { background: clusterColors[clusterId] + '40', border: clusterColors[clusterId] },
        shape: 'box',
        size: 25,
        font: { color: clusterColors[clusterId], size: 11, face: 'monospace' },
        title: `Cluster: ${clusterName}\n${clusterEntities.length} entities`
      });

      // Connect cluster to root
      edgeData.push({ from: rootId, to: nodeId, color: clusterColors[clusterId] + '60' });
      const clusterHeaderId = nodeId++;

      // Add top entities in cluster (limit to top 5 by PPP amount)
      const topEntities = clusterEntities
        .filter(e => e.ppp_amount && e.ppp_amount > 0)
        .sort((a, b) => (b.ppp_amount || 0) - (a.ppp_amount || 0))
        .slice(0, 5);

      topEntities.forEach(entity => {
        if (entityToId[entity.entity_name] !== undefined) return;

        entityToId[entity.entity_name] = nodeId;
        const hasRedFlags = entity.red_flags && entity.red_flags.length > 0;
        nodeData.push({
          id: nodeId,
          label: entity.entity_name.length > 18
            ? entity.entity_name.substring(0, 18) + '...'
            : entity.entity_name,
          level: 3,
          color: {
            background: clusterColors[clusterId],
            border: hasRedFlags ? '#ef4444' : clusterColors[clusterId]
          },
          shape: entity.entity_type.includes('Transportation') || entity.entity_type.includes('Trucking') ? 'triangle' : 'box',
          size: 20,
          font: { color: '#ffffff', size: 10 },
          title: `${entity.entity_name}\nPPP: ${formatMoney(entity.ppp_amount || 0)}\nJobs: ${entity.ppp_jobs || 0}`
        });

        edgeData.push({
          from: clusterHeaderId,
          to: nodeId,
          color: clusterColors[clusterId] + '80'
        });
        nodeId++;
      });

      // If there are more entities, add a "more" node
      if (clusterEntities.length > 5) {
        nodeData.push({
          id: nodeId,
          label: `+${clusterEntities.length - 5} more`,
          level: 3,
          color: { background: '#374151', border: '#4b5563' },
          shape: 'box',
          size: 15,
          font: { color: '#9ca3af', size: 9 },
          title: `${clusterEntities.length - 5} additional entities in this cluster`
        });
        edgeData.push({ from: clusterHeaderId, to: nodeId, color: '#4b556340' });
        nodeId++;
      }
    });

    // Add individual PPP recipients connected to network (level 3)
    const individuals = entities.filter(e =>
      e.entity_type.includes('Individual') &&
      !e.entity_type.includes('Key Figure') &&
      e.ppp_amount && e.ppp_amount > 0
    );

    if (individuals.length > 0) {
      // Individual recipients header
      nodeData.push({
        id: nodeId,
        label: 'Individual PPP',
        level: 2,
        color: { background: '#22c55e40', border: '#22c55e' },
        shape: 'box',
        size: 20,
        font: { color: '#22c55e', size: 11, face: 'monospace' },
        title: `Individual PPP recipients connected to network`
      });
      edgeData.push({ from: rootId, to: nodeId, color: '#22c55e60' });
      const indivHeaderId = nodeId++;

      individuals.slice(0, 4).forEach(entity => {
        if (entityToId[entity.entity_name] !== undefined) return;

        entityToId[entity.entity_name] = nodeId;
        nodeData.push({
          id: nodeId,
          label: entity.entity_name.length > 15
            ? entity.entity_name.substring(0, 15) + '...'
            : entity.entity_name,
          level: 3,
          color: { background: '#22c55e', border: '#22c55e' },
          shape: 'dot',
          size: 18,
          font: { color: '#ffffff', size: 9 },
          title: `${entity.entity_name}\nPPP: ${formatMoney(entity.ppp_amount || 0)}`
        });
        edgeData.push({ from: indivHeaderId, to: nodeId, color: '#22c55e80' });
        nodeId++;
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nodes = new DataSet(nodeData as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const edges = new DataSet(edgeData as any);

    const options = {
      layout: {
        hierarchical: {
          direction: 'UD', // Up-Down
          sortMethod: 'directed',
          levelSeparation: 120,
          nodeSpacing: 150,
          treeSpacing: 200,
          blockShifting: true,
          edgeMinimization: true,
          parentCentralization: true,
        }
      },
      nodes: {
        borderWidth: 2,
        shadow: true,
      },
      edges: {
        smooth: {
          type: 'cubicBezier',
          forceDirection: 'vertical',
          roundness: 0.4
        },
        color: {
          inherit: false,
        },
        width: 1.5,
      },
      physics: false,
      interaction: {
        hover: true,
        tooltipDelay: 200,
        zoomView: true,
        dragView: true,
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const network = new Network(
      containerRef.current,
      { nodes, edges } as any,
      options as any
    );

    networkRef.current = network;

    network.on('click', (params) => {
      if (params.nodes.length > 0) {
        const clickedNodeId = params.nodes[0];
        // Find the entity by matching the node
        const clickedNode = nodeData.find(n => n.id === clickedNodeId);
        if (clickedNode && clickedNode.label !== 'Columbus OH\nPPP Network') {
          const entity = entities.find(e =>
            e.entity_name === clickedNode.label ||
            e.entity_name.startsWith(clickedNode.label.replace('...', ''))
          );
          if (entity) {
            onSelectEntity(entity);
          }
        }
      } else {
        onSelectEntity(null);
      }
    });

    network.once('afterDrawing', () => {
      setIsLoading(false);
    });

    // Fit the network to view
    setTimeout(() => {
      network.fit({ animation: { duration: 500, easingFunction: 'easeInOutQuad' } });
    }, 100);

    return () => {
      network.destroy();
    };
  }, [entities, onSelectEntity]);

  return (
    <div>
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
            <div className="text-gray-400 font-mono text-sm">
              Rendering tree...
            </div>
          </div>
        )}
        <div
          ref={containerRef}
          className="w-full h-[650px] border border-gray-800 bg-gray-950"
        />
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-6 text-xs">
        <div>
          <p className="text-gray-500 mb-2">Node Types</p>
          <div className="flex flex-wrap gap-3">
            <span className="flex items-center gap-1.5">
              <span className="text-amber-400">&#9733;</span>
              <span className="text-gray-400">Key Figure</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-purple-500 rotate-45"></span>
              <span className="text-gray-400">Nonprofit</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-blue-500"></span>
              <span className="text-gray-400">Business</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[10px] border-transparent border-b-orange-500"></span>
              <span className="text-gray-400">Transportation</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
              <span className="text-gray-400">Individual</span>
            </span>
          </div>
        </div>
        <div>
          <p className="text-gray-500 mb-2">Clusters</p>
          <div className="flex flex-wrap gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-blue-500"></span>
              <span className="text-gray-400">2999 Dublin Granville</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-amber-500"></span>
              <span className="text-gray-400">6161 Busch Blvd</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-green-500"></span>
              <span className="text-gray-400">2021 Dublin Granville</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
