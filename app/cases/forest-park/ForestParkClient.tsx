'use client';

import { useState } from 'react';
import NetworkGraph from './NetworkGraph';
import EntitySidebar from './EntitySidebar';
import EntitiesTable from './EntitiesTable';
import Timeline from './Timeline';

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

interface NetworkData {
  network_metadata: {
    title: string;
    date_created: string;
    total_entities: number;
    total_connections: number;
    excluded_individuals: number;
    business_entities: number;
    primary_case: string;
    data_sources: string[];
  };
  entities: Entity[];
}

interface ForestParkClientProps {
  data: NetworkData;
}

export default function ForestParkClient({ data }: ForestParkClientProps) {
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [activeTab, setActiveTab] = useState<'network' | 'timeline'>('network');

  // Filter to Forest Park case entities (exclude Operation Brace Yourself and 2024 enforcement entities)
  const forestParkEntities = data.entities.filter(e =>
    !e.case?.includes('Operation Brace Yourself') &&
    !e.case?.includes('2024 National Health Care Fraud')
  );

  // Calculate stats
  const totalPrisonMonths = forestParkEntities.reduce((sum, entity) => {
    if (!entity.sentence) return sum;
    const match = entity.sentence.match(/(\d+)\s*months?/i);
    if (match) return sum + parseInt(match[1], 10);
    return sum;
  }, 0);

  const totalPrisonYears = (totalPrisonMonths / 12).toFixed(1);

  // Count individuals with sentences
  const sentencedCount = forestParkEntities.filter(e => e.sentence).length;

  return (
    <div className={selectedEntity ? 'mr-96' : ''}>
      {/* Header */}
      <div className="mb-8">
        <p className="text-gray-500 text-sm uppercase tracking-wide mb-2">Case Study</p>
        <h1 className="text-3xl font-bold mb-2">Forest Park Medical Center</h1>
        <p className="text-gray-400">Healthcare Fraud Network Analysis</p>
      </div>

      {/* Terminal-style stats */}
      <div className="font-mono text-sm mb-10">
        <p className="text-gray-500">CASE_SUMMARY</p>
        <div className="mt-2 text-gray-400">
          <p><span className="text-gray-600">├─</span> case_number <span className="text-white ml-4">3:16-CR-516</span></p>
          <p><span className="text-gray-600">├─</span> court <span className="text-white ml-4">Northern District of Texas</span></p>
          <p><span className="text-gray-600">├─</span> total_entities <span className="text-white ml-4">{forestParkEntities.length}</span></p>
          <p><span className="text-gray-600">├─</span> individuals_sentenced <span className="text-white ml-4">{sentencedCount}</span></p>
          <p><span className="text-gray-600">├─</span> total_prison_time <span className="text-white ml-4">{totalPrisonYears} years</span></p>
          <p><span className="text-gray-600">├─</span> restitution_ordered <span className="text-green-500 ml-4">$82.9M</span></p>
          <p><span className="text-gray-600">└─</span> status <span className="text-gray-400 ml-4">Sentenced</span></p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-6 mb-6 border-b border-gray-800 pb-4">
        <button
          onClick={() => setActiveTab('network')}
          className={activeTab === 'network' ? 'text-white font-medium' : 'text-gray-500 hover:text-gray-300'}
        >
          Network Graph
        </button>
        <button
          onClick={() => setActiveTab('timeline')}
          className={activeTab === 'timeline' ? 'text-white font-medium' : 'text-gray-500 hover:text-gray-300'}
        >
          Timeline
        </button>
      </div>

      {/* Network Graph or Timeline */}
      {activeTab === 'network' && (
        <div className="mb-10">
          <NetworkGraph
            entities={forestParkEntities}
            onSelectEntity={setSelectedEntity}
          />
          <p className="text-gray-600 text-xs mt-2">
            Click on a node to view entity details. Drag to reposition nodes.
          </p>
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="mb-10 max-w-2xl">
          <Timeline entities={forestParkEntities} />
        </div>
      )}

      {/* Entities Table */}
      <div className="mb-10">
        <h2 className="text-lg font-bold mb-4">All Entities</h2>
        <EntitiesTable
          entities={forestParkEntities}
          onSelectEntity={setSelectedEntity}
        />
      </div>

      {/* Case Summary */}
      <div className="border border-gray-800 p-6 mb-10">
        <h2 className="text-lg font-bold mb-4">Case Summary</h2>
        <div className="space-y-4 text-sm text-gray-400 leading-relaxed">
          <p>
            Forest Park Medical Center was a Dallas-area hospital founded in 2008 by physicians
            Wade Barker and Richard Toussaint. Between 2009 and 2016, hospital executives and
            affiliated physicians engaged in a scheme to pay illegal kickbacks to surgeons in
            exchange for patient referrals.
          </p>
          <p>
            The kickbacks were disguised as legitimate business transactions and routed through
            shell companies controlled by Jackson Jacob and brokered by Hospital Business Concepts,
            a surgeon brokerage owned by Andrew Hillman and Semyon Narosov.
          </p>
          <p>
            Surgeons received payments ranging from hundreds of thousands to millions of dollars
            for referring patients to Forest Park, regardless of medical necessity. The scheme
            defrauded Medicare, Medicaid, TRICARE, and private insurers.
          </p>
          <p>
            Fifteen individuals were convicted and sentenced to federal prison terms ranging from
            12 months to 150 months. Courts ordered restitution totaling approximately $82.9 million.
          </p>
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

      {/* Entity Sidebar */}
      <EntitySidebar
        entity={selectedEntity}
        onClose={() => setSelectedEntity(null)}
      />
    </div>
  );
}
