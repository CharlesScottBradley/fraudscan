'use client';

import { useRouter } from 'next/navigation';

interface FiltersProps {
  county: string;
  type: string;
  status: string;
  perPage: string;
  counties: string[];
  types: string[];
  statuses: string[];
}

export default function Filters({
  county,
  type,
  status,
  perPage,
  counties,
  types,
  statuses,
}: FiltersProps) {
  const router = useRouter();

  const buildUrl = (newParams: Record<string, string>) => {
    const current = { county, type, status, perPage };
    const merged = { ...current, ...newParams, page: '1' };
    const searchParams = new URLSearchParams();
    Object.entries(merged).forEach(([key, value]) => {
      if (value && value !== 'all' && !(key === 'page' && value === '1') && !(key === 'perPage' && value === '25')) {
        searchParams.set(key, value);
      }
    });
    const qs = searchParams.toString();
    return `/database${qs ? `?${qs}` : ''}`;
  };

  return (
    <div className="flex gap-4 mb-8 flex-wrap">
      <div>
        <label className="block text-gray-500 text-xs mb-1">County</label>
        <select
          value={county}
          onChange={(e) => router.push(buildUrl({ county: e.target.value }))}
        >
          <option value="all">All Counties</option>
          {counties.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-gray-500 text-xs mb-1">Type</label>
        <select
          value={type}
          onChange={(e) => router.push(buildUrl({ type: e.target.value }))}
        >
          <option value="all">All Types</option>
          {types.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-gray-500 text-xs mb-1">Status</label>
        <select
          value={status}
          onChange={(e) => router.push(buildUrl({ status: e.target.value }))}
        >
          <option value="all">All Statuses</option>
          {statuses.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-gray-500 text-xs mb-1">Per Page</label>
        <select
          value={perPage}
          onChange={(e) => router.push(buildUrl({ perPage: e.target.value }))}
        >
          <option value="10">10</option>
          <option value="25">25</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </select>
      </div>
    </div>
  );
}
