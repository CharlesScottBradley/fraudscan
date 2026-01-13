'use client';

import { useState } from 'react';
import USMap, { StateEntityStats } from './components/USMap';
import { EntityType, ENTITY_COLORS } from './components/EntityTypeFilter';
import EmailSignup from './components/EmailSignup';

interface HomePageClientProps {
  stateStats: Record<string, StateEntityStats>;
  entityCounts: {
    childcare: number;
    nursing_home: number;
    ppp: number;
    sba: number;
    h1b: number;
  };
  totalFraud: number;
  totalOrganizations: number;
}

const FILTERS: { id: EntityType; label: string }[] = [
  { id: 'all', label: 'All Entities' },
  { id: 'childcare', label: 'Childcare' },
  { id: 'nursing_home', label: 'Nursing Homes' },
  { id: 'h1b', label: 'H-1B Employers' },
  { id: 'ppp', label: 'PPP (Historical)' },
  { id: 'sba', label: 'SBA' },
];

function formatMoney(amount: number): string {
  if (amount >= 1000000000) {
    return `$${(amount / 1000000000).toFixed(2)}B`;
  }
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(2)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return `$${amount.toLocaleString()}`;
}

export default function HomePageClient({ 
  stateStats, 
  entityCounts, 
  totalFraud, 
  totalOrganizations 
}: HomePageClientProps) {
  const [activeType, setActiveType] = useState<EntityType>('all');

  return (
    <div className="h-full flex flex-col">
      {/* Stats row */}
      <div className="flex flex-wrap gap-x-16 gap-y-6 mb-8">
        <div>
          <p className="text-white font-mono text-4xl font-bold">
            {totalOrganizations.toLocaleString()}
          </p>
          <p className="text-gray-500 mt-1 text-sm">Entities tracked</p>
        </div>
        <div>
          <p className="text-green-500 font-mono text-4xl font-bold">
            {formatMoney(totalFraud)}
          </p>
          <p className="text-gray-500 mt-1 text-sm">Prosecutions documented</p>
        </div>
        <div className="ml-auto">
          <EmailSignup
            source="homepage"
            variant="terminal"
            label="Get updates on government spending data"
          />
        </div>
      </div>

      {/* Filter row */}
      <div className="flex items-center gap-4 mb-4">
        {FILTERS.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveType(filter.id)}
            className={`text-sm transition-colors ${
              activeType === filter.id 
                ? 'text-white' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
            style={activeType === filter.id ? { color: ENTITY_COLORS[filter.id] } : undefined}
          >
            {filter.label}
          </button>
        ))}
      </div>
      
      {/* Map */}
      <div className="flex-1">
        <USMap 
          stateData={stateStats} 
          activeEntityType={activeType}
          colorBy="count"
        />
      </div>
    </div>
  );
}
