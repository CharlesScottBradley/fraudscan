'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ToshiAdBanner from '../components/ToshiAdBanner';

interface LoanStatus {
  forgiven: number;
  chargedOff: number;
  paidInFull: number;
  pppTotal: number;
  eidlTotal: number;
}

interface Organization {
  id: string;
  legal_name: string;
  name_normalized: string;
  state: string | null;
  city: string | null;
  naics_code: string | null;
  naics_description: string | null;
  industry_sector: string | null;
  total_government_funding: number;
  total_ppp: number;
  total_eidl: number;
  ppp_loan_count: number;
  eidl_loan_count: number;
  first_funding_date: string | null;
  last_funding_date: string | null;
  is_ppp_recipient: boolean;
  is_fraud_prone_industry: boolean;
  is_flagged: boolean;
  fraud_score: number | null;
  address_cluster_size: number | null;
  data_source: string | null;
  loan_status?: LoanStatus;
}

interface SearchResponse {
  organizations: Organization[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  stats: {
    totalFunding: number;
    fraudProneCount: number;
    pppRecipientCount: number;
    avgFunding: number;
  };
}

const US_STATES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
  MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
  OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  DC: 'District of Columbia', PR: 'Puerto Rico',
};

const INDUSTRY_SECTORS: Record<string, string> = {
  '11': 'Agriculture',
  '21': 'Mining',
  '22': 'Utilities',
  '23': 'Construction',
  '31': 'Manufacturing',
  '32': 'Manufacturing',
  '33': 'Manufacturing',
  '42': 'Wholesale Trade',
  '44': 'Retail Trade',
  '45': 'Retail Trade',
  '48': 'Transportation',
  '49': 'Warehousing',
  '51': 'Information',
  '52': 'Finance/Insurance',
  '53': 'Real Estate',
  '54': 'Professional Services',
  '55': 'Management',
  '56': 'Admin Services',
  '61': 'Education',
  '62': 'Healthcare',
  '71': 'Arts/Entertainment',
  '72': 'Accommodation/Food',
  '81': 'Other Services',
  '92': 'Public Admin',
  '99': 'Unknown',
};

function formatMoney(amount: number | null): string {
  if (!amount) return '-';
  if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(2)}B`;
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

export default function OrganizationsPage() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [minFunding, setMinFunding] = useState('');
  const [maxFunding, setMaxFunding] = useState('');
  const [industrySector, setIndustrySector] = useState('');
  const [fraudProneOnly, setFraudProneOnly] = useState(false);
  const [orgType, setOrgType] = useState('');
  const [minClusterSize, setMinClusterSize] = useState('');
  const [sortBy, setSortBy] = useState('total_all_funding');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Stats
  const [stats, setStats] = useState({
    totalFunding: 0,
    fraudProneCount: 0,
    pppRecipientCount: 0,
    avgFunding: 0,
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch data
  useEffect(() => {
    fetchOrgs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, selectedState, minFunding, maxFunding, industrySector, fraudProneOnly, orgType, minClusterSize, page, pageSize, sortBy, sortDir]);

  const fetchOrgs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        sortBy,
        sortDir,
      });

      if (debouncedSearch) params.set('search', debouncedSearch);
      if (selectedState) params.set('state', selectedState);
      if (minFunding) params.set('minFunding', minFunding);
      if (maxFunding) params.set('maxFunding', maxFunding);
      if (industrySector) params.set('sector', industrySector);
      if (fraudProneOnly) params.set('fraudProne', 'true');
      if (orgType) params.set('type', orgType);
      if (minClusterSize) params.set('minClusterSize', minClusterSize);

      const res = await fetch(`/api/organizations?${params}`);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data: SearchResponse = await res.json();

      if (!data || !data.organizations) {
        throw new Error('Invalid response format');
      }

      setOrgs(data.organizations);
      setTotalCount(data.total || 0);
      setTotalPages(data.totalPages || 0);
      setStats(data.stats || { totalFunding: 0, fraudProneCount: 0, pppRecipientCount: 0, avgFunding: 0 });
    } catch (err) {
      console.error('Failed to fetch organizations:', err);
      setError('Failed to load organizations. Please try again.');
      setOrgs([]);
      setTotalCount(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
    setPage(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setSelectedState('');
    setMinFunding('');
    setMaxFunding('');
    setIndustrySector('');
    setFraudProneOnly(false);
    setOrgType('');
    setMinClusterSize('');
    setPage(1);
  };

  const hasFilters = searchTerm || selectedState || minFunding || maxFunding || industrySector || fraudProneOnly || orgType || minClusterSize;

  return (
    <div>
      {/* Header Stats */}
      <div className="font-mono text-sm mb-6">
        <p className="text-gray-500">ORGANIZATIONS_MASTER_REGISTRY</p>
        <div className="mt-2 text-gray-400">
          <p><span className="text-gray-600">&#9500;&#9472;</span> total_organizations <span className="text-white ml-4">12.5M</span></p>
          <p><span className="text-gray-600">&#9500;&#9472;</span> total_funding_tracked <span className="text-green-500 ml-4">$800B+</span></p>
          <p><span className="text-gray-600">&#9500;&#9472;</span> ppp_recipients <span className="text-white ml-4">10.1M</span></p>
          <p><span className="text-gray-600">&#9500;&#9472;</span> eidl_recipients <span className="text-white ml-4">3.7M</span></p>
          <p><span className="text-gray-600">&#9492;&#9472;</span> fraud_prone_industries <span className="text-yellow-500 ml-4">5.9M</span></p>
        </div>
      </div>

      {/* Toshi Sponsor Banner */}
      <ToshiAdBanner className="mb-8" />

      {/* Search Input */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by organization name or city..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 bg-black border border-gray-700 rounded text-sm focus:outline-none focus:border-gray-500"
        />
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap gap-4 mb-6 text-sm">
        <div>
          <label className="block text-gray-500 text-xs mb-1">State</label>
          <select
            value={selectedState}
            onChange={(e) => { setSelectedState(e.target.value); setPage(1); }}
            className="bg-black border border-gray-700 rounded px-3 py-2 focus:outline-none focus:border-gray-500"
          >
            <option value="">All States</option>
            {Object.entries(US_STATES).sort((a, b) => a[1].localeCompare(b[1])).map(([code, name]) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-gray-500 text-xs mb-1">Industry</label>
          <select
            value={industrySector}
            onChange={(e) => { setIndustrySector(e.target.value); setPage(1); }}
            className="bg-black border border-gray-700 rounded px-3 py-2 focus:outline-none focus:border-gray-500"
          >
            <option value="">All Industries</option>
            {Object.entries(INDUSTRY_SECTORS).map(([code, name]) => (
              <option key={code} value={code}>{name} ({code})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-gray-500 text-xs mb-1">Org Type</label>
          <select
            value={orgType}
            onChange={(e) => { setOrgType(e.target.value); setPage(1); }}
            className="bg-black border border-gray-700 rounded px-3 py-2 focus:outline-none focus:border-gray-500"
          >
            <option value="">All Types</option>
            <option value="ppp_recipient">PPP Recipients</option>
            <option value="eidl_only">EIDL Only</option>
            <option value="childcare">Childcare (624410)</option>
          </select>
        </div>

        <div>
          <label className="block text-gray-500 text-xs mb-1">Min Funding</label>
          <input
            type="number"
            placeholder="$0"
            value={minFunding}
            onChange={(e) => { setMinFunding(e.target.value); setPage(1); }}
            className="w-28 px-3 py-2 bg-black border border-gray-700 rounded focus:outline-none focus:border-gray-500"
          />
        </div>

        <div>
          <label className="block text-gray-500 text-xs mb-1">Max Funding</label>
          <input
            type="number"
            placeholder="No limit"
            value={maxFunding}
            onChange={(e) => { setMaxFunding(e.target.value); setPage(1); }}
            className="w-28 px-3 py-2 bg-black border border-gray-700 rounded focus:outline-none focus:border-gray-500"
          />
        </div>

        <div>
          <label className="block text-gray-500 text-xs mb-1">Min Cluster</label>
          <input
            type="number"
            placeholder="3+"
            value={minClusterSize}
            onChange={(e) => { setMinClusterSize(e.target.value); setPage(1); }}
            className="w-20 px-3 py-2 bg-black border border-gray-700 rounded focus:outline-none focus:border-gray-500"
          />
        </div>

        <div className="flex items-end">
          <label className="flex items-center gap-2 px-3 py-2 border border-gray-700 rounded cursor-pointer hover:border-gray-600">
            <input
              type="checkbox"
              checked={fraudProneOnly}
              onChange={(e) => { setFraudProneOnly(e.target.checked); setPage(1); }}
              className="form-checkbox h-4 w-4 text-gray-500 bg-black border-gray-700 rounded"
            />
            <span className="text-gray-400">Fraud-Prone</span>
          </label>
        </div>

        <div>
          <label className="block text-gray-500 text-xs mb-1">Per Page</label>
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
            className="bg-black border border-gray-700 rounded px-3 py-2 focus:outline-none focus:border-gray-500"
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        {hasFilters && (
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="px-4 py-2 border border-gray-700 rounded text-gray-400 hover:text-white hover:border-gray-600"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="mb-4 flex items-center justify-between text-sm">
        <p className="text-gray-500">
          {loading ? 'Loading...' : error ? '' : `Showing ${orgs.length.toLocaleString()} of ${totalCount.toLocaleString()} results`}
        </p>
        {stats.fraudProneCount > 0 && !loading && !error && (
          <p className="text-gray-500">
            {stats.fraudProneCount.toLocaleString()} fraud-prone in results
          </p>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="border border-gray-800 p-8 text-center mb-4">
          <p className="text-gray-400">{error}</p>
          <button
            onClick={fetchOrgs}
            className="mt-4 px-4 py-2 border border-gray-700 rounded text-sm text-gray-400 hover:text-white"
          >
            Retry
          </button>
        </div>
      )}

      {/* Results Table */}
      {!error && (
        <div className="border border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-900">
                <tr>
                  <th className="text-left p-3 font-medium text-gray-400">Risk</th>
                  <th
                    className="text-left p-3 font-medium text-gray-400 cursor-pointer hover:text-white"
                    onClick={() => toggleSort('legal_name')}
                  >
                    Organization {sortBy === 'legal_name' && (sortDir === 'desc' ? '↓' : '↑')}
                  </th>
                  <th className="text-left p-3 font-medium text-gray-400">Location</th>
                  <th className="text-left p-3 font-medium text-gray-400">Industry</th>
                  <th
                    className="text-right p-3 font-medium text-gray-400 cursor-pointer hover:text-white"
                    onClick={() => toggleSort('total_all_funding')}
                  >
                    Total Funding {sortBy === 'total_all_funding' && (sortDir === 'desc' ? '↓' : '↑')}
                  </th>
                  <th className="text-center p-3 font-medium text-gray-400">
                    Loan Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-gray-500">
                      Loading organizations...
                    </td>
                  </tr>
                ) : orgs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-gray-500">
                      No organizations found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  orgs.map((org) => (
                    <tr key={org.id} className="hover:bg-gray-900/50">
                      <td className="p-3">
                        {org.is_fraud_prone_industry && (
                          <span className="text-yellow-500 text-xs">FP</span>
                        )}
                        {org.address_cluster_size && org.address_cluster_size >= 3 && (
                          <span className="text-red-500 text-xs ml-1">CL</span>
                        )}
                      </td>
                      <td className="p-3">
                        <Link
                          href={`/organizations/${org.id}`}
                          className="text-white hover:text-green-400"
                        >
                          {org.legal_name || org.name_normalized}
                        </Link>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {org.data_source === 'sba_eidl' ? 'EIDL Only' : 'PPP Recipient'}
                        </div>
                      </td>
                      <td className="p-3 text-gray-400">
                        {org.city && org.state ? `${org.city}, ${org.state}` : org.state || '-'}
                      </td>
                      <td className="p-3 text-gray-500 text-xs">
                        {org.industry_sector ? INDUSTRY_SECTORS[org.industry_sector] || org.industry_sector : '-'}
                      </td>
                      <td className="p-3 text-right font-mono text-green-500">
                        {formatMoney(org.total_government_funding)}
                      </td>
                      <td className="p-3 text-center">
                        {org.loan_status && (org.loan_status.pppTotal > 0 || org.loan_status.eidlTotal > 0) ? (
                          <div className="flex items-center justify-center gap-2 text-xs flex-wrap">
                            {org.loan_status.forgiven > 0 && (
                              <span className="text-blue-400" title="PPP Forgiven">
                                {org.loan_status.forgiven} Forgiven
                              </span>
                            )}
                            {org.loan_status.paidInFull > 0 && (
                              <span className="text-green-400" title="PPP Paid in Full">
                                {org.loan_status.paidInFull} Paid
                              </span>
                            )}
                            {org.loan_status.chargedOff > 0 && (
                              <span className="text-red-400" title="PPP Charged Off">
                                {org.loan_status.chargedOff} Charged Off
                              </span>
                            )}
                            {org.loan_status.eidlTotal > 0 && (
                              <span className="text-purple-400" title="EIDL Loans">
                                {org.loan_status.eidlTotal} EIDL
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-600">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!error && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="px-4 py-2 border border-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:border-gray-600 text-gray-400 hover:text-white"
            >
              Previous
            </button>
            <span className="text-gray-500">
              Page {page.toLocaleString()} of {totalPages.toLocaleString() || 1}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || totalPages === 0 || loading}
              className="px-4 py-2 border border-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:border-gray-600 text-gray-400 hover:text-white"
            >
              Next
            </button>
          </div>

          {stats.totalFunding > 0 && (
            <div className="text-gray-500">
              Total in results: <span className="text-green-500 font-mono">{formatMoney(stats.totalFunding)}</span>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="mt-8 pt-6 border-t border-gray-800">
        <p className="text-sm text-gray-500 mb-3">Legend</p>
        <div className="flex flex-wrap gap-6 text-xs text-gray-500">
          <span><span className="text-yellow-500">FP</span> = Fraud-Prone Industry</span>
          <span><span className="text-blue-400">Forgiven</span> = PPP loan forgiven by govt</span>
          <span><span className="text-green-400">Paid</span> = PPP paid in full by borrower</span>
          <span><span className="text-red-400">Charged Off</span> = PPP default/write-off</span>
          <span><span className="text-purple-400">EIDL</span> = EIDL loan count (no status data)</span>
        </div>
      </div>
    </div>
  );
}
