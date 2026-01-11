'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ToshiAdBanner from '../components/ToshiAdBanner';

interface FederalGrant {
  id: string;
  award_id: string;
  fain: string | null;
  recipient_name: string;
  recipient_city: string | null;
  recipient_state: string;
  recipient_zip: string | null;
  recipient_county: string | null;
  award_amount: number;
  total_obligation: number | null;
  award_type: string | null;
  awarding_agency: string | null;
  cfda_number: string | null;
  cfda_title: string | null;
  award_date: string | null;
  fiscal_year: number | null;
  start_date: string | null;
  end_date: string | null;
  award_description: string | null;
  is_fraud_prone_industry: boolean;
  industry_category: string | null;
}

interface GrantSearchResponse {
  grants: FederalGrant[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  stats: {
    totalAmount: number;
    avgGrant: number;
    fraudProneCount: number;
    topAgencies: { agency: string; count: number; amount: number }[];
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
  DC: 'District of Columbia', PR: 'Puerto Rico', VI: 'Virgin Islands', GU: 'Guam',
  AS: 'American Samoa', MP: 'Northern Mariana Islands',
};

function formatMoney(amount: number | null): string {
  if (!amount) return '-';
  if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(2)}B`;
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function FederalGrantsPage() {
  const [grants, setGrants] = useState<FederalGrant[]>([]);
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
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [agency, setAgency] = useState('');
  const [fiscalYear, setFiscalYear] = useState('');
  const [fraudProneOnly, setFraudProneOnly] = useState(false);
  const [sortBy, setSortBy] = useState('award_amount');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Stats
  const [stats, setStats] = useState({
    totalAmount: 0,
    avgGrant: 0,
    fraudProneCount: 0,
    topAgencies: [] as { agency: string; count: number; amount: number }[],
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
    fetchGrants();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, selectedState, minAmount, maxAmount, agency, fiscalYear, fraudProneOnly, page, pageSize, sortBy, sortDir]);

  const fetchGrants = async () => {
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
      if (minAmount) params.set('minAmount', minAmount);
      if (maxAmount) params.set('maxAmount', maxAmount);
      if (agency) params.set('agency', agency);
      if (fiscalYear) params.set('fiscalYear', fiscalYear);
      if (fraudProneOnly) params.set('fraudProne', 'true');

      const res = await fetch(`/api/grants?${params}`);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data: GrantSearchResponse = await res.json();

      if (!data || !data.grants) {
        throw new Error('Invalid response format');
      }

      setGrants(data.grants);
      setTotalCount(data.total || 0);
      setTotalPages(data.totalPages || 0);
      setStats(data.stats || { totalAmount: 0, avgGrant: 0, fraudProneCount: 0, topAgencies: [] });
    } catch (err) {
      console.error('Failed to fetch federal grants:', err);
      setError('Failed to load federal grants. Please try again.');
      setGrants([]);
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
    setMinAmount('');
    setMaxAmount('');
    setAgency('');
    setFiscalYear('');
    setFraudProneOnly(false);
    setPage(1);
  };

  const hasFilters = searchTerm || selectedState || minAmount || maxAmount || agency || fiscalYear || fraudProneOnly;

  return (
    <div>
      {/* Terminal-style stats header */}
      <div className="font-mono text-sm mb-10">
        <p className="text-gray-500">FEDERAL_GRANTS_DATABASE</p>
        <div className="mt-2 text-gray-400">
          <p><span className="text-gray-600">|-</span> grants_tracked <span className="text-white ml-4">3.68M</span></p>
          <p><span className="text-gray-600">|-</span> total_disbursed <span className="text-green-500 ml-4">$1.2T</span></p>
          <p><span className="text-gray-600">|-</span> awarding_agencies <span className="text-white ml-4">2,847</span></p>
          <p><span className="text-gray-600">|_</span> fraud_prone_industries <span className="text-white ml-4">{stats.fraudProneCount.toLocaleString()}</span></p>
        </div>
      </div>

      {/* Toshi Sponsor Banner */}
      <ToshiAdBanner className="mb-8" />

      {/* Search Input */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by recipient, agency, or program..."
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
          <label className="block text-gray-500 text-xs mb-1">Agency</label>
          <input
            type="text"
            placeholder="e.g. HHS, DOE"
            value={agency}
            onChange={(e) => { setAgency(e.target.value); setPage(1); }}
            className="w-32 px-3 py-2 bg-black border border-gray-700 rounded focus:outline-none focus:border-gray-500"
          />
        </div>

        <div>
          <label className="block text-gray-500 text-xs mb-1">Fiscal Year</label>
          <select
            value={fiscalYear}
            onChange={(e) => { setFiscalYear(e.target.value); setPage(1); }}
            className="bg-black border border-gray-700 rounded px-3 py-2 focus:outline-none focus:border-gray-500"
          >
            <option value="">All Years</option>
            <option value="2024">FY 2024</option>
            <option value="2023">FY 2023</option>
            <option value="2022">FY 2022</option>
            <option value="2021">FY 2021</option>
            <option value="2020">FY 2020</option>
            <option value="2023,2024">FY 2023-2024</option>
          </select>
        </div>

        <div>
          <label className="block text-gray-500 text-xs mb-1">Min Amount</label>
          <input
            type="number"
            placeholder="$0"
            value={minAmount}
            onChange={(e) => { setMinAmount(e.target.value); setPage(1); }}
            className="w-28 px-3 py-2 bg-black border border-gray-700 rounded focus:outline-none focus:border-gray-500"
          />
        </div>

        <div>
          <label className="block text-gray-500 text-xs mb-1">Max Amount</label>
          <input
            type="number"
            placeholder="No limit"
            value={maxAmount}
            onChange={(e) => { setMaxAmount(e.target.value); setPage(1); }}
            className="w-28 px-3 py-2 bg-black border border-gray-700 rounded focus:outline-none focus:border-gray-500"
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
            <span className="text-gray-400">Fraud-Prone Industries</span>
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
          {loading ? 'Loading...' : error ? '' : `Showing ${grants.length.toLocaleString()} of ${totalCount.toLocaleString()} results`}
        </p>
        {stats.fraudProneCount > 0 && !loading && !error && (
          <p className="text-gray-500">
            {stats.fraudProneCount.toLocaleString()} in fraud-prone industries
          </p>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="border border-gray-800 p-8 text-center mb-4">
          <p className="text-gray-400">{error}</p>
          <button
            onClick={fetchGrants}
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
                  <th
                    className="text-left p-3 font-medium text-gray-400 cursor-pointer hover:text-white"
                    onClick={() => toggleSort('recipient_name')}
                  >
                    Recipient {sortBy === 'recipient_name' && (sortDir === 'desc' ? '↓' : '↑')}
                  </th>
                  <th className="text-left p-3 font-medium text-gray-400">Location</th>
                  <th
                    className="text-right p-3 font-medium text-gray-400 cursor-pointer hover:text-white"
                    onClick={() => toggleSort('award_amount')}
                  >
                    Amount {sortBy === 'award_amount' && (sortDir === 'desc' ? '↓' : '↑')}
                  </th>
                  <th className="text-left p-3 font-medium text-gray-400">Agency</th>
                  <th className="text-left p-3 font-medium text-gray-400">Program</th>
                  <th
                    className="text-left p-3 font-medium text-gray-400 cursor-pointer hover:text-white"
                    onClick={() => toggleSort('award_date')}
                  >
                    Date {sortBy === 'award_date' && (sortDir === 'desc' ? '↓' : '↑')}
                  </th>
                  <th className="text-left p-3 font-medium text-gray-400">Industry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-gray-500">
                      Loading federal grants...
                    </td>
                  </tr>
                ) : grants.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-gray-500">
                      No grants found matching your search criteria.
                    </td>
                  </tr>
                ) : (
                  grants.map((grant) => (
                    <tr key={grant.id} className="hover:bg-gray-900/50">
                      <td className="p-3">
                        <Link
                          href={`/federal-grants/${grant.award_id}`}
                          className="text-white hover:text-green-400"
                        >
                          {grant.recipient_name}
                        </Link>
                        {grant.is_fraud_prone_industry && (
                          <span className="ml-2 text-gray-500 text-xs">flagged</span>
                        )}
                      </td>
                      <td className="p-3 text-gray-400">
                        {grant.recipient_city ? `${grant.recipient_city}, ` : ''}{grant.recipient_state}
                      </td>
                      <td className="p-3 text-right font-mono text-green-500">
                        {formatMoney(grant.award_amount)}
                      </td>
                      <td className="p-3 text-gray-500 text-xs max-w-[150px] truncate">
                        {grant.awarding_agency || '-'}
                      </td>
                      <td className="p-3 text-gray-500 text-xs max-w-[200px] truncate">
                        {grant.cfda_title || grant.award_description || '-'}
                      </td>
                      <td className="p-3 text-gray-500 text-xs">
                        {formatDate(grant.award_date)}
                      </td>
                      <td className="p-3 text-gray-500 text-xs">
                        {grant.industry_category || '-'}
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

          {stats.totalAmount > 0 && (
            <div className="text-gray-500">
              Total in results: <span className="text-green-500 font-mono">{formatMoney(stats.totalAmount)}</span>
            </div>
          )}
        </div>
      )}

      {/* Info Section */}
      <div className="mt-8 pt-6 border-t border-gray-800">
        <p className="text-sm text-gray-500 mb-3">About Federal Grants</p>
        <div className="text-xs text-gray-600 space-y-2">
          <p>
            This database contains federal grant awards from USASpending.gov, covering direct payments,
            block grants, project grants, and other assistance programs administered by federal agencies.
          </p>
          <p>
            <span className="text-gray-400">CFDA numbers</span> identify specific federal assistance programs.
            Each program has defined eligibility criteria, application procedures, and reporting requirements.
          </p>
          <p className="text-gray-500 mt-4">
            Data sourced from USASpending.gov. Updated quarterly.
          </p>
        </div>
      </div>

      {/* Related Links */}
      <div className="mt-8 pt-6 border-t border-gray-800">
        <p className="text-sm text-gray-500 mb-3">Related Databases</p>
        <div className="flex gap-3">
          <Link
            href="/ppp"
            className="px-4 py-2 border border-gray-700 rounded text-sm text-gray-400 hover:text-white hover:border-gray-600"
          >
            PPP Loans
          </Link>
          <Link
            href="/sba"
            className="px-4 py-2 border border-gray-700 rounded text-sm text-gray-400 hover:text-white hover:border-gray-600"
          >
            SBA Loans
          </Link>
        </div>
      </div>
    </div>
  );
}
