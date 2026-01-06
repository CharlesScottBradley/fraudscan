'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

interface WAProvider {
  id: string;
  provider_sf_id: string;
  license_number: string | null;
  display_name: string | null;
  city: string | null;
  license_status: string | null;
  facility_type: string | null;
  licensed_capacity: number | null;
  early_achievers_status: string | null;
  head_start: boolean;
  eceap: boolean;
}

interface WAChildcareStats {
  total: number;
  active: number;
  totalCapacity: number;
  withComplaints: number;
  facilityTypes: Record<string, number>;
}

export default function WAChildcareSection() {
  const [providers, setProviders] = useState<WAProvider[]>([]);
  const [stats, setStats] = useState<WAChildcareStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchData();
  }, [page, search, cityFilter, statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '25',
      });
      if (search) params.set('search', search);
      if (cityFilter) params.set('city', cityFilter);
      if (statusFilter) params.set('status', statusFilter);

      const response = await fetch(`/api/wa-childcare?${params}`);
      const data = await response.json();

      setProviders(data.data || []);
      setTotalPages(data.totalPages || 1);
      setStats({
        total: data.total || 0,
        active: data.stats?.activeCount || 0,
        totalCapacity: data.stats?.totalCapacity || 0,
        withComplaints: 0, // Would need separate query
        facilityTypes: data.stats?.facilityTypeBreakdown || {},
      });
    } catch (err) {
      console.error('Error fetching WA childcare data:', err);
    }
    setLoading(false);
  };

  if (loading && !stats) {
    return (
      <div className="mt-10 border border-gray-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Washington Childcare Providers</h2>
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mt-10 border border-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold">Washington Childcare Providers</h2>
          <p className="text-gray-500 text-sm">
            Detailed provider data from WA DCYF
          </p>
        </div>
        {stats && (
          <div className="text-right">
            <p className="text-2xl font-bold text-green-500">{stats.total.toLocaleString()}</p>
            <p className="text-gray-500 text-xs">Total Providers</p>
          </div>
        )}
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-900 rounded p-3">
            <p className="text-gray-500 text-xs">Active</p>
            <p className="text-lg font-semibold">{stats.active.toLocaleString()}</p>
          </div>
          <div className="bg-gray-900 rounded p-3">
            <p className="text-gray-500 text-xs">Total Capacity</p>
            <p className="text-lg font-semibold">{stats.totalCapacity.toLocaleString()}</p>
          </div>
          <div className="bg-gray-900 rounded p-3">
            <p className="text-gray-500 text-xs">Family Homes</p>
            <p className="text-lg font-semibold">
              {(stats.facilityTypes['Family Child Care Home'] || 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-gray-900 rounded p-3">
            <p className="text-gray-500 text-xs">Centers</p>
            <p className="text-lg font-semibold">
              {(stats.facilityTypes['Child Care Center'] || 0).toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="Search name, license, city..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm w-64"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
        >
          <option value="">All Status</option>
          <option value="Open">Open</option>
          <option value="Closed">Closed</option>
        </select>
        <input
          type="text"
          placeholder="City..."
          value={cityFilter}
          onChange={(e) => { setCityFilter(e.target.value); setPage(1); }}
          className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm w-40"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left py-2 px-2 text-gray-500 font-normal">Provider</th>
              <th className="text-left py-2 px-2 text-gray-500 font-normal">City</th>
              <th className="text-left py-2 px-2 text-gray-500 font-normal">Type</th>
              <th className="text-right py-2 px-2 text-gray-500 font-normal">Capacity</th>
              <th className="text-left py-2 px-2 text-gray-500 font-normal">Status</th>
              <th className="text-left py-2 px-2 text-gray-500 font-normal">Programs</th>
            </tr>
          </thead>
          <tbody>
            {providers.map((p) => (
              <tr key={p.id} className="border-b border-gray-900 hover:bg-gray-900/50">
                <td className="py-2 px-2">
                  <Link
                    href={`/wa-provider/${p.provider_sf_id}`}
                    className="text-blue-400 hover:underline"
                  >
                    {p.display_name || p.license_number || 'Unknown'}
                  </Link>
                  <p className="text-gray-600 text-xs">{p.license_number}</p>
                </td>
                <td className="py-2 px-2 text-gray-400">{p.city || '-'}</td>
                <td className="py-2 px-2 text-gray-400 text-xs">
                  {p.facility_type?.replace('Child Care ', '').replace(' Home', '') || '-'}
                </td>
                <td className="py-2 px-2 text-right">{p.licensed_capacity || '-'}</td>
                <td className="py-2 px-2">
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    p.license_status === 'Open'
                      ? 'bg-green-900/50 text-green-400'
                      : 'bg-red-900/50 text-red-400'
                  }`}>
                    {p.license_status || '-'}
                  </span>
                </td>
                <td className="py-2 px-2">
                  <div className="flex gap-1">
                    {p.early_achievers_status && (
                      <span className="px-1 py-0.5 rounded text-xs bg-purple-900/50 text-purple-300">EA</span>
                    )}
                    {p.head_start && (
                      <span className="px-1 py-0.5 rounded text-xs bg-blue-900/50 text-blue-300">HS</span>
                    )}
                    {p.eceap && (
                      <span className="px-1 py-0.5 rounded text-xs bg-cyan-900/50 text-cyan-300">EC</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 bg-gray-800 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-gray-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 bg-gray-800 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {providers.length === 0 && !loading && (
        <p className="text-gray-500 text-center py-8">No providers found matching your filters.</p>
      )}
    </div>
  );
}
