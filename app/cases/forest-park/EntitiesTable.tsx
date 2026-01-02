'use client';

import { useState, useMemo } from 'react';

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

interface EntitiesTableProps {
  entities: Entity[];
  onSelectEntity: (entity: Entity) => void;
}

type SortField = 'name' | 'type' | 'sentence' | 'date' | 'connections';
type SortDirection = 'asc' | 'desc';

function getEntityTypeLabel(entityType: string): string {
  if (entityType === 'Hospital') return 'Hospital';
  if (entityType.includes('Physician')) return 'Physician';
  if (entityType.includes('Business Owner')) return 'Business Owner';
  if (entityType.includes('Licensed Healthcare')) return 'Healthcare Pro';
  if (entityType.includes('Business Entity')) return 'Business Entity';
  return entityType;
}

function parseSentenceMonths(sentence: string | undefined): number {
  if (!sentence) return 0;
  const match = sentence.match(/(\d+)\s*months?/i);
  if (match) return parseInt(match[1], 10);
  const yearsMatch = sentence.match(/(\d+(?:\.\d+)?)\s*years?/i);
  if (yearsMatch) return parseFloat(yearsMatch[1]) * 12;
  return 0;
}

function getDate(entity: Entity): string {
  return entity.conviction_date || entity.plea_date || entity.sentence_date || '';
}

function parseDateForSort(dateStr: string): number {
  if (!dateStr) return 0;
  const months: Record<string, number> = {
    'January': 1, 'February': 2, 'March': 3, 'April': 4,
    'May': 5, 'June': 6, 'July': 7, 'August': 8,
    'September': 9, 'October': 10, 'November': 11, 'December': 12
  };

  for (const [month, num] of Object.entries(months)) {
    if (dateStr.includes(month)) {
      const yearMatch = dateStr.match(/(\d{4})/);
      const year = yearMatch ? parseInt(yearMatch[1], 10) : 2019;
      return year * 100 + num;
    }
  }
  return 0;
}

export default function EntitiesTable({ entities, onSelectEntity }: EntitiesTableProps) {
  const [sortField, setSortField] = useState<SortField>('sentence');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filter, setFilter] = useState<string>('all');

  const filteredEntities = useMemo(() => {
    if (filter === 'all') return entities;
    if (filter === 'individuals') return entities.filter(e => e.entity_type.includes('Individual'));
    if (filter === 'businesses') return entities.filter(e => e.entity_type.includes('Business Entity') || e.entity_type === 'Hospital');
    if (filter === 'physicians') return entities.filter(e => e.entity_type.includes('Physician'));
    return entities;
  }, [entities, filter]);

  const sortedEntities = useMemo(() => {
    const sorted = [...filteredEntities].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'name':
          comparison = a.entity_name.localeCompare(b.entity_name);
          break;
        case 'type':
          comparison = getEntityTypeLabel(a.entity_type).localeCompare(getEntityTypeLabel(b.entity_type));
          break;
        case 'sentence':
          comparison = parseSentenceMonths(a.sentence) - parseSentenceMonths(b.sentence);
          break;
        case 'date':
          comparison = parseDateForSort(getDate(a)) - parseDateForSort(getDate(b));
          break;
        case 'connections':
          comparison = a.connected_entities.length - b.connected_entities.length;
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [filteredEntities, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="text-gray-700 ml-1">-</span>;
    return (
      <span className="text-gray-400 ml-1">
        {sortDirection === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  return (
    <div>
      {/* Filter */}
      <div className="flex items-center gap-4 mb-4 text-sm">
        <span className="text-gray-500">Filter:</span>
        <button
          onClick={() => setFilter('all')}
          className={filter === 'all' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}
        >
          All ({entities.length})
        </button>
        <button
          onClick={() => setFilter('individuals')}
          className={filter === 'individuals' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}
        >
          Individuals
        </button>
        <button
          onClick={() => setFilter('physicians')}
          className={filter === 'physicians' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}
        >
          Physicians
        </button>
        <button
          onClick={() => setFilter('businesses')}
          className={filter === 'businesses' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}
        >
          Entities
        </button>
      </div>

      {/* Table */}
      <div className="border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-900">
            <tr>
              <th
                className="text-left p-3 font-medium text-gray-400 cursor-pointer hover:text-gray-200"
                onClick={() => handleSort('name')}
              >
                Entity <SortIcon field="name" />
              </th>
              <th
                className="text-left p-3 font-medium text-gray-400 cursor-pointer hover:text-gray-200"
                onClick={() => handleSort('type')}
              >
                Type <SortIcon field="type" />
              </th>
              <th
                className="text-left p-3 font-medium text-gray-400 cursor-pointer hover:text-gray-200"
                onClick={() => handleSort('sentence')}
              >
                Sentence <SortIcon field="sentence" />
              </th>
              <th
                className="text-left p-3 font-medium text-gray-400 cursor-pointer hover:text-gray-200"
                onClick={() => handleSort('date')}
              >
                Date <SortIcon field="date" />
              </th>
              <th
                className="text-center p-3 font-medium text-gray-400 cursor-pointer hover:text-gray-200"
                onClick={() => handleSort('connections')}
              >
                Links <SortIcon field="connections" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {sortedEntities.map((entity, idx) => (
              <tr
                key={idx}
                className="hover:bg-gray-900/50 cursor-pointer"
                onClick={() => onSelectEntity(entity)}
              >
                <td className="p-3">
                  <span className="text-white hover:text-green-400">
                    {entity.entity_name}
                  </span>
                  {entity.role && (
                    <p className="text-gray-600 text-xs mt-0.5 truncate max-w-xs">
                      {entity.role}
                    </p>
                  )}
                </td>
                <td className="p-3 text-gray-400 text-xs">
                  {getEntityTypeLabel(entity.entity_type)}
                </td>
                <td className="p-3 font-mono text-white">
                  {entity.sentence || '-'}
                </td>
                <td className="p-3 text-gray-500 text-xs">
                  {getDate(entity) || '-'}
                </td>
                <td className="p-3 text-center text-gray-500">
                  {entity.connected_entities.length}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
