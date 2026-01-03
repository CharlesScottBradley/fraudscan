'use client';

export type EntityType = 'all' | 'childcare' | 'nursing_home' | 'ppp' | 'sba' | 'h1b';

export const ENTITY_COLORS: Record<EntityType, string> = {
  all: '#3b82f6',
  childcare: '#22c55e',
  nursing_home: '#8b5cf6',
  ppp: '#f59e0b',
  sba: '#ef4444',
  h1b: '#06b6d4',  // Cyan for H-1B visas
};
