'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
} from 'react-simple-maps';
import { EntityType, ENTITY_COLORS } from './EntityTypeFilter';

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

export interface EntityStats {
  count: number;
  geocoded?: number;
  funding?: number;
  amount?: number;
  flagged?: number;
}

export interface StateEntityStats {
  childcare: EntityStats;
  nursing_home: EntityStats;
  ppp: EntityStats & { amount: number; flagged: number };
  fraud_cases: { count: number; amount: number };
  total_count: number;
  total_funding: number;
}

interface USMapProps {
  stateData: Record<string, StateEntityStats>;
  activeEntityType?: EntityType;
  colorBy?: 'count' | 'funding' | 'fraud';
}

export default function USMap({ stateData, activeEntityType = 'all', colorBy = 'count' }: USMapProps) {
  const router = useRouter();
  const [hoveredState, setHoveredState] = useState<string | null>(null);

  const getStateCount = (stateCode: string): number => {
    const data = stateData[stateCode];
    if (!data) return 0;
    
    switch (activeEntityType) {
      case 'childcare': return data.childcare?.count || 0;
      case 'nursing_home': return data.nursing_home?.count || 0;
      case 'ppp': return data.ppp?.count || 0;
      default: return data.total_count || 0;
    }
  };

  const getStateColor = (stateCode: string): string => {
    const count = getStateCount(stateCode);
    if (count === 0) return '#111';
    
    const baseColor = ENTITY_COLORS[activeEntityType] || ENTITY_COLORS.all;
    const maxCount = Math.max(...Object.keys(stateData).map(s => getStateCount(s)));
    const intensity = maxCount > 0 ? count / maxCount : 0;
    
    return adjustColorIntensity(baseColor, intensity);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toLocaleString();
  };

  const formatMoney = (amount: number) => {
    if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(1)}B`;
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount.toLocaleString()}`;
  };

  const getTooltipContent = (stateCode: string) => {
    const data = stateData[stateCode];
    if (!data) return null;

    const count = getStateCount(stateCode);
    if (count === 0) return { name: STATE_NAMES[stateCode], count: 0, detail: 'No data' };

    let detail = '';
    switch (activeEntityType) {
      case 'childcare':
        detail = `${formatNumber(data.childcare.count)} providers`;
        break;
      case 'nursing_home':
        detail = `${formatNumber(data.nursing_home.count)} facilities`;
        break;
      case 'ppp':
        detail = `${formatNumber(data.ppp.count)} loans · ${formatMoney(data.ppp.amount)}`;
        break;
      default:
        const parts = [];
        if (data.childcare.count > 0) parts.push(`${formatNumber(data.childcare.count)} childcare`);
        if (data.ppp.count > 0) parts.push(`${formatNumber(data.ppp.count)} PPP`);
        if (data.nursing_home.count > 0) parts.push(`${formatNumber(data.nursing_home.count)} nursing`);
        detail = parts.join(' · ') || 'No data';
    }

    return { name: STATE_NAMES[stateCode], count, detail };
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
                  stroke="#222"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: 'none' },
                    hover: { outline: 'none', fill: '#444' },
                    pressed: { outline: 'none' },
                  }}
                  onClick={() => {
                    if (stateCode) router.push(`/state/${stateCode.toLowerCase()}`);
                  }}
                  onMouseEnter={() => setHoveredState(stateCode)}
                  onMouseLeave={() => setHoveredState(null)}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>

      {/* Minimal tooltip */}
      {hoveredState && (
        <div className="absolute top-4 right-4 text-sm">
          {(() => {
            const tip = getTooltipContent(hoveredState);
            if (!tip) return null;
            return (
              <>
                <p className="font-medium">{tip.name}</p>
                <p className="text-gray-500">{tip.detail}</p>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}

function adjustColorIntensity(hexColor: string, intensity: number): string {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  
  const factor = 0.2 + (intensity * 0.8);
  
  return `rgb(${Math.round(r * factor)}, ${Math.round(g * factor)}, ${Math.round(b * factor)})`;
}
