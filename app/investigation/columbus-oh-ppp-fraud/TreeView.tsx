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

interface Daycare {
  name: string;
  address: string;
  zip: string;
  status: string;
  ppp_amount: number | null;
  notes: string;
}

interface DaycaresData {
  summary: {
    total_identified: number;
    ppp_recipients: number;
    total_ppp_amount: number;
    corridor: string;
  };
  daycares_list: Daycare[];
}

interface TreeViewProps {
  entities: Entity[];
  daycares?: DaycaresData;
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

export default function TreeView({ entities, daycares, onSelectEntity }: TreeViewProps) {
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
      label: 'Columbus OH\nFraud Network',
      level: 0,
      color: { background: '#1f2937', border: '#4b5563' },
      shape: 'box',
      size: 30,
      font: { color: '#ffffff', size: 14, face: 'monospace' },
      title: 'Columbus OH Fraud Network\n$13.86M PPP + $14M daycare subsidies'
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

    // Add Daycares branch (connected to root, as SERC umbrella)
    if (daycares && daycares.daycares_list.length > 0) {
      const daycareColor = '#a855f7'; // purple for daycares

      // Daycare header node
      nodeData.push({
        id: nodeId,
        label: `SERC Daycares\n(${daycares.summary.total_identified})`,
        level: 2,
        color: { background: daycareColor + '40', border: daycareColor },
        shape: 'box',
        size: 25,
        font: { color: daycareColor, size: 11, face: 'monospace' },
        title: `SERC-Connected Daycare Network\n${daycares.summary.total_identified} daycares identified\nPPP: ${formatMoney(daycares.summary.total_ppp_amount)}`
      });
      edgeData.push({ from: rootId, to: nodeId, color: daycareColor + '60' });
      const daycareHeaderId = nodeId++;

      // Sort daycares: PPP recipients first, then by name
      const sortedDaycares = [...daycares.daycares_list].sort((a, b) => {
        if (a.ppp_amount && !b.ppp_amount) return -1;
        if (!a.ppp_amount && b.ppp_amount) return 1;
        if (a.ppp_amount && b.ppp_amount) return b.ppp_amount - a.ppp_amount;
        return a.name.localeCompare(b.name);
      });

      // Show top 8 daycares (prioritizing PPP recipients)
      sortedDaycares.slice(0, 8).forEach(daycare => {
        const hasPPP = daycare.ppp_amount && daycare.ppp_amount > 0;
        nodeData.push({
          id: nodeId,
          label: daycare.name.length > 18
            ? daycare.name.substring(0, 18) + '...'
            : daycare.name,
          level: 3,
          color: {
            background: hasPPP ? '#22c55e' : daycareColor,
            border: hasPPP ? '#22c55e' : daycareColor
          },
          shape: 'ellipse',
          size: hasPPP ? 22 : 18,
          font: { color: '#ffffff', size: 9 },
          title: `${daycare.name}\n${daycare.address}\n${hasPPP ? 'PPP: ' + formatMoney(daycare.ppp_amount!) : 'No PPP'}\n${daycare.notes}`
        });
        edgeData.push({
          from: daycareHeaderId,
          to: nodeId,
          color: hasPPP ? '#22c55e80' : daycareColor + '80'
        });
        nodeId++;
      });

      // Add "more" node if there are additional daycares
      if (daycares.daycares_list.length > 8) {
        nodeData.push({
          id: nodeId,
          label: `+${daycares.daycares_list.length - 8} more`,
          level: 3,
          color: { background: '#374151', border: '#4b5563' },
          shape: 'box',
          size: 15,
          font: { color: '#9ca3af', size: 9 },
          title: `${daycares.daycares_list.length - 8} additional daycares in network`
        });
        edgeData.push({ from: daycareHeaderId, to: nodeId, color: '#4b556340' });
        nodeId++;
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nodes = new DataSet(nodeData as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const edges = new DataSet(edgeData as any);

    const options = {
      layout: {
        hierarchical: {
          direction: 'LR', // Left-Right (flows vertically down the page)
          sortMethod: 'directed',
          levelSeparation: 200,
          nodeSpacing: 80,
          treeSpacing: 100,
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
          forceDirection: 'horizontal',
          roundness: 0.5
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
        if (clickedNode && clickedNode.label !== 'Columbus OH\nFraud Network') {
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
  }, [entities, daycares, onSelectEntity]);

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
          className="w-full h-[800px] border border-gray-800 bg-gray-950"
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
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-2 rounded-full bg-purple-500"></span>
              <span className="text-gray-400">Daycare</span>
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
