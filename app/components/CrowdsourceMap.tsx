'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
} from 'react-simple-maps';

const geoUrl = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';

const FIPS_TO_ABBR: Record<string, string> = {
  '01': 'AL', '02': 'AK', '04': 'AZ', '05': 'AR', '06': 'CA',
  '08': 'CO', '09': 'CT', '10': 'DE', '11': 'DC', '12': 'FL',
  '13': 'GA', '15': 'HI', '16': 'ID', '17': 'IL', '18': 'IN',
  '19': 'IA', '20': 'KS', '21': 'KY', '22': 'LA', '23': 'ME',
  '24': 'MD', '25': 'MA', '26': 'MI', '27': 'MN', '28': 'MS',
  '29': 'MO', '30': 'MT', '31': 'NE', '32': 'NV', '33': 'NH',
  '34': 'NJ', '35': 'NM', '36': 'NY', '37': 'NC', '38': 'ND',
  '39': 'OH', '40': 'OK', '41': 'OR', '42': 'PA', '44': 'RI',
  '45': 'SC', '46': 'SD', '47': 'TN', '48': 'TX', '49': 'UT',
  '50': 'VT', '51': 'VA', '53': 'WA', '54': 'WV', '55': 'WI',
  '56': 'WY',
};

const STATE_NAMES: Record<string, string> = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
  'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
  'DC': 'Washington DC', 'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii',
  'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
  'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine',
  'MD': 'Maryland', 'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota',
  'MS': 'Mississippi', 'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska',
  'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico',
  'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
  'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island',
  'SC': 'South Carolina', 'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas',
  'UT': 'Utah', 'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington',
  'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming',
};

export interface StateCoverage {
  state_code: string;
  total_gaps: number;
  completed: number;
  completion_pct: number;
  critical_needed?: number;
}

interface CrowdsourceMapProps {
  stateCoverage: StateCoverage[];
}

export default function CrowdsourceMap({ stateCoverage }: CrowdsourceMapProps) {
  const router = useRouter();
  const [hoveredState, setHoveredState] = useState<string | null>(null);

  const getStateCoverage = (stateCode: string): StateCoverage | undefined => {
    return stateCoverage.find(s => s.state_code === stateCode);
  };

  const getStateColor = (stateCode: string): string => {
    const coverage = getStateCoverage(stateCode);
    
    // No data gaps defined yet - dark gray
    if (!coverage || coverage.total_gaps === 0) return '#1a1a1a';
    
    const pct = coverage.completion_pct;
    
    // Color scale from dark (needs work) to lighter (more complete)
    // Using grayscale to fit the brand
    if (pct >= 90) return '#4b5563'; // gray-600 - almost done
    if (pct >= 75) return '#3f3f46'; // zinc-700
    if (pct >= 50) return '#374151'; // gray-700
    if (pct >= 25) return '#27272a'; // zinc-800
    return '#1f1f1f'; // very dark - lots needed
  };

  const getTooltipContent = (stateCode: string) => {
    const coverage = getStateCoverage(stateCode);
    const name = STATE_NAMES[stateCode] || stateCode;
    
    if (!coverage || coverage.total_gaps === 0) {
      return { name, detail: 'No data needs defined' };
    }
    
    const needed = coverage.total_gaps - coverage.completed;
    return {
      name,
      detail: `${coverage.completion_pct}% complete - ${needed} data gaps remaining`,
    };
  };

  return (
    <div className="relative">
      <ComposableMap
        projection="geoAlbersUsa"
        style={{ width: '100%', height: 'auto' }}
      >
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const fips = geo.id;
              const stateCode = FIPS_TO_ABBR[fips] || '';
              const isHovered = hoveredState === stateCode;

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={isHovered ? '#525252' : getStateColor(stateCode)}
                  stroke="#000"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: 'none', cursor: 'pointer' },
                    hover: { outline: 'none', cursor: 'pointer' },
                    pressed: { outline: 'none' },
                  }}
                  onClick={() => {
                    if (stateCode) router.push(`/crowdsource/${stateCode.toLowerCase()}`);
                  }}
                  onMouseEnter={() => setHoveredState(stateCode)}
                  onMouseLeave={() => setHoveredState(null)}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>

      {/* Tooltip */}
      {hoveredState && (
        <div className="absolute top-4 right-4 text-sm text-right">
          {(() => {
            const tip = getTooltipContent(hoveredState);
            return (
              <>
                <p className="font-medium text-white">{tip.name}</p>
                <p className="text-gray-500">{tip.detail}</p>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}

