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

interface DonationsMapProps {
  stateData: Record<string, { total_amount: number; donation_count: number }>;
}

export default function DonationsMap({ stateData }: DonationsMapProps) {
  const router = useRouter();
  const [hoveredState, setHoveredState] = useState<string | null>(null);

  const getStateColor = (stateCode: string) => {
    const data = stateData[stateCode];

    // No data - dark gray
    if (!data || data.donation_count === 0) return '#1a1a1a';

    // Has data - green intensity based on amount
    const maxAmount = Math.max(...Object.values(stateData).map(d => d.total_amount));
    if (maxAmount === 0) return '#22c55e';

    const intensity = Math.min(data.total_amount / maxAmount, 1);
    // Interpolate from dim green to bright green
    const r = Math.round(20 + (14 * intensity));
    const g = Math.round(80 + (117 * intensity));
    const b = Math.round(40 + (54 * intensity));
    return `rgb(${r}, ${g}, ${b})`;
  };

  const formatMoney = (amount: number) => {
    if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(2)}B`;
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount.toLocaleString()}`;
  };

  const hasData = (stateCode: string) => {
    const data = stateData[stateCode];
    return data && data.donation_count > 0;
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
              const hasStateData = hasData(stateCode);

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={getStateColor(stateCode)}
                  stroke="#333"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: 'none', cursor: hasStateData ? 'pointer' : 'default' },
                    hover: { outline: 'none', fill: hasStateData ? '#3b82f6' : '#1a1a1a' },
                    pressed: { outline: 'none' },
                  }}
                  onClick={() => {
                    if (stateCode && hasStateData) {
                      router.push(`/donations/${stateCode.toLowerCase()}`);
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
          {stateData[hoveredState]?.donation_count > 0 ? (
            <>
              <p className="text-green-500 font-mono text-lg">
                {formatMoney(stateData[hoveredState]?.total_amount || 0)}
              </p>
              <p className="text-gray-400">
                {(stateData[hoveredState]?.donation_count || 0).toLocaleString()} donations
              </p>
            </>
          ) : (
            <p className="text-gray-500">No data yet</p>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 text-xs text-gray-500">
        <p>Click a state to view donations</p>
        <p><span className="text-green-500">■</span> Green = donation data available</p>
      </div>
    </div>
  );
}
