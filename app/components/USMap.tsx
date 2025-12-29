'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
} from 'react-simple-maps';

const geoUrl = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';

// State FIPS codes to abbreviations
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

interface USMapProps {
  stateData: Record<string, { count: number; funding: number }>;
}

export default function USMap({ stateData }: USMapProps) {
  const router = useRouter();
  const [hoveredState, setHoveredState] = useState<string | null>(null);

  const getStateColor = (stateCode: string) => {
    const data = stateData[stateCode];

    // No data at all - dark
    if (!data || data.count === 0) return '#1a1a1a';

    // Has funding data - show green intensity based on funding
    if (data.funding > 0) {
      const maxFunding = Math.max(...Object.values(stateData).map(d => d.funding));
      if (maxFunding === 0) return '#22c55e'; // base green

      const intensity = data.funding / maxFunding;
      const r = Math.round(34 + (34 * (1 - intensity)));
      const g = Math.round(197 - (100 * (1 - intensity)));
      const b = Math.round(94 - (60 * (1 - intensity)));
      return `rgb(${r}, ${g}, ${b})`;
    }

    // Has providers but no funding - show blue
    return '#3b82f6';
  };

  const formatMoney = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount.toLocaleString()}`;
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

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={getStateColor(stateCode)}
                  stroke="#333"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: 'none' },
                    hover: { outline: 'none', fill: '#3b82f6' },
                    pressed: { outline: 'none' },
                  }}
                  onClick={() => {
                    if (stateCode) {
                      router.push(`/state/${stateCode.toLowerCase()}`);
                    }
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
        <div className="absolute top-4 right-4 bg-black border border-gray-700 p-4 text-sm">
          <p className="font-bold">{STATE_NAMES[hoveredState] || hoveredState}</p>
          <p className="text-gray-400">
            {stateData[hoveredState]?.count || 0} providers
          </p>
          <p className="text-green-500 font-mono">
            {formatMoney(stateData[hoveredState]?.funding || 0)} tracked
          </p>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 text-xs text-gray-500">
        <p>Click a state to view providers</p>
        <p><span className="text-green-500">■</span> Green = fraud data available</p>
        <p><span className="text-blue-500">■</span> Blue = providers tracked</p>
      </div>
    </div>
  );
}
