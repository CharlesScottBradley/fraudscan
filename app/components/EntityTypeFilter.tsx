'use client';

export type EntityType = 'all' | 'childcare' | 'nursing_home' | 'ppp' | 'sba';

export const ENTITY_COLORS: Record<EntityType, string> = {
  all: '#3b82f6',
  childcare: '#22c55e',
  nursing_home: '#8b5cf6',
  ppp: '#f59e0b',
  sba: '#ef4444',  // Red for SBA loans
};
