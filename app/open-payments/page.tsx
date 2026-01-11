'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ToshiAdBanner from '../components/ToshiAdBanner';

interface OpenPaymentRecord {
  id: number;
  record_id: number;
  program_year: number;
  covered_recipient_type: string | null;
  covered_recipient_npi: string | null;
  recipient_first_name: string | null;
  recipient_last_name: string | null;
  recipient_city: string | null;
  recipient_state: string | null;
  recipient_specialty: string | null;
  total_amount: number;
  date_of_payment: string | null;
  nature_of_payment: string | null;
  form_of_payment: string | null;
  manufacturer_name: string | null;
  manufacturer_state: string | null;
  product_name: string | null;
  product_category: string | null;
  teaching_hospital_name: string | null;
}

interface SearchResponse {
  payments: OpenPaymentRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  stats: {
    totalPayments: number;
    totalAmount: number;
    avgPayment: number;
    topNatures: { nature: string; count: number; amount: number }[];
    topManufacturers: { name: string; count: number; amount: number }[];
    topStates: { state: string; count: number; amount: number }[];
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

const PAYMENT_TYPES = [
  'Food and Beverage',
  'Travel and Lodging',
  'Consulting Fee',
  'Compensation for services other than consulting',
  'Honoraria',
  'Gift',
  'Entertainment',
  'Education',
  'Research',
  'Charitable Contribution',
  'Royalty or License',
  'Current or prospective ownership or investment interest',
  'Space rental or facility fees',
];

const PROGRAM_YEARS = [2024, 2023, 2022, 2021, 2020, 2019, 2018];

function formatCurrency(amount: number | null): string {
  if (!amount) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatNumber(num: number | null): string {
  if (!num) return '-';
  return num.toLocaleString();
}

export default function OpenPaymentsPage() {
  const [payments, setPayments] = useState<OpenPaymentRecord[]>([]);
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
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedNature, setSelectedNature] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [sortBy, setSortBy] = useState('total_amount');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Stats
  const [stats, setStats] = useState({
    totalPayments: 0,
    totalAmount: 0,
    avgPayment: 0,
    topNatures: [] as { nature: string; count: number; amount: number }[],
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
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, selectedState, selectedYear, selectedNature, manufacturer, minAmount, maxAmount, page, pageSize, sortBy, sortDir]);

  const fetchData = async () => {
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
      if (selectedYear) params.set('year', selectedYear);
      if (selectedNature) params.set('nature', selectedNature);
      if (manufacturer) params.set('manufacturer', manufacturer);
      if (minAmount) params.set('minAmount', minAmount);
      if (maxAmount) params.set('maxAmount', maxAmount);

      const res = await fetch(`/api/open-payments?${params}`);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data: SearchResponse = await res.json();

      if (!data || !data.payments) {
        throw new Error('Invalid response format');
      }

      setPayments(data.payments);
      setTotalCount(data.total || 0);
      setTotalPages(data.totalPages || 0);
      setStats(data.stats || { totalPayments: 0, totalAmount: 0, avgPayment: 0, topNatures: [] });
    } catch (err) {
      console.error('Failed to fetch Open Payments data:', err);
      setError('Failed to load payment data. Please try again.');
      setPayments([]);
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
    setSelectedYear('');
    setSelectedNature('');
    setManufacturer('');
    setMinAmount('');
    setMaxAmount('');
    setPage(1);
  };

  const hasFilters = searchTerm || selectedState || selectedYear || selectedNature || manufacturer || minAmount || maxAmount;

  return (
    <div>
      {/* Terminal-style stats header */}
      <div className="font-mono text-sm mb-6">
        <p className="text-gray-500">OPEN_PAYMENTS_DATABASE</p>
        <div className="mt-2 text-gray-400">
          <p><span className="text-gray-600">├─</span> total_payments <span className="text-white ml-4">{formatNumber(stats.totalPayments)}</span></p>
          <p><span className="text-gray-600">├─</span> total_amount <span className="text-green-500 ml-4">{formatCurrency(stats.totalAmount)}</span></p>
          <p><span className="text-gray-600">├─</span> avg_payment <span className="text-white ml-4">{formatCurrency(stats.avgPayment)}</span></p>
          <p><span className="text-gray-600">├─</span> data_source <span className="text-white ml-4">CMS Open Payments</span></p>
          <p><span className="text-gray-600">└─</span> years <span className="text-blue-400 ml-4">2023-2024</span></p>
        </div>
      </div>

      {/* Toshi Sponsor Banner */}
      <ToshiAdBanner className="mb-8" />

      {/* Search Input */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by recipient name, manufacturer, or hospital..."
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
          <label className="block text-gray-500 text-xs mb-1">Program Year</label>
          <select
            value={selectedYear}
            onChange={(e) => { setSelectedYear(e.target.value); setPage(1); }}
            className="bg-black border border-gray-700 rounded px-3 py-2 focus:outline-none focus:border-gray-500"
          >
            <option value="">All Years</option>
            {PROGRAM_YEARS.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-gray-500 text-xs mb-1">Payment Type</label>
          <select
            value={selectedNature}
            onChange={(e) => { setSelectedNature(e.target.value); setPage(1); }}
            className="bg-black border border-gray-700 rounded px-3 py-2 focus:outline-none focus:border-gray-500"
          >
            <option value="">All Types</option>
            {PAYMENT_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
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
            placeholder="$∞"
            value={maxAmount}
            onChange={(e) => { setMaxAmount(e.target.value); setPage(1); }}
            className="w-28 px-3 py-2 bg-black border border-gray-700 rounded focus:outline-none focus:border-gray-500"
          />
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
          {loading ? 'Loading...' : error ? '' : `Showing ${payments.length.toLocaleString()} of ${totalCount.toLocaleString()} payments`}
        </p>
      </div>

      {/* Error State */}
      {error && (
        <div className="border border-gray-800 p-8 text-center mb-4">
          <p className="text-gray-400">{error}</p>
          <button
            onClick={fetchData}
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
                    onClick={() => toggleSort('recipient_last_name')}
                  >
                    Recipient {sortBy === 'recipient_last_name' && (sortDir === 'desc' ? '↓' : '↑')}
                  </th>
                  <th className="text-left p-3 font-medium text-gray-400">Specialty</th>
                  <th
                    className="text-left p-3 font-medium text-gray-400 cursor-pointer hover:text-white"
                    onClick={() => toggleSort('manufacturer_name')}
                  >
                    Manufacturer {sortBy === 'manufacturer_name' && (sortDir === 'desc' ? '↓' : '↑')}
                  </th>
                  <th className="text-left p-3 font-medium text-gray-400">Payment Type</th>
                  <th
                    className="text-right p-3 font-medium text-gray-400 cursor-pointer hover:text-white"
                    onClick={() => toggleSort('total_amount')}
                  >
                    Amount {sortBy === 'total_amount' && (sortDir === 'desc' ? '↓' : '↑')}
                  </th>
                  <th
                    className="text-center p-3 font-medium text-gray-400 cursor-pointer hover:text-white"
                    onClick={() => toggleSort('date_of_payment')}
                  >
                    Date {sortBy === 'date_of_payment' && (sortDir === 'desc' ? '↓' : '↑')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-gray-500">
                      Loading payment data...
                    </td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-gray-500">
                      No payments found matching your search criteria.
                    </td>
                  </tr>
                ) : (
                  payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-900/50">
                      <td className="p-3">
                        <span className="text-white">
                          {payment.recipient_first_name} {payment.recipient_last_name}
                        </span>
                        {payment.recipient_city && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            {payment.recipient_city}, {payment.recipient_state}
                          </div>
                        )}
                        {payment.teaching_hospital_name && (
                          <div className="text-xs text-blue-400 mt-0.5">
                            {payment.teaching_hospital_name}
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-gray-400 text-xs max-w-xs">
                        {payment.recipient_specialty?.split('|')[0] || '-'}
                      </td>
                      <td className="p-3">
                        <span className="text-gray-300">{payment.manufacturer_name || '-'}</span>
                        {payment.product_name && (
                          <div className="text-xs text-gray-500 mt-0.5">{payment.product_name}</div>
                        )}
                      </td>
                      <td className="p-3 text-gray-400 text-xs">
                        {payment.nature_of_payment || '-'}
                      </td>
                      <td className="p-3 text-right font-mono">
                        <span className={payment.total_amount >= 10000 ? 'text-green-400' : payment.total_amount >= 1000 ? 'text-yellow-400' : 'text-white'}>
                          {formatCurrency(payment.total_amount)}
                        </span>
                      </td>
                      <td className="p-3 text-center text-gray-500 text-xs">
                        {payment.date_of_payment ? new Date(payment.date_of_payment).toLocaleDateString() : '-'}
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
        </div>
      )}

      {/* Quick Links */}
      <div className="mt-8 pt-6 border-t border-gray-800">
        <p className="text-sm text-gray-500 mb-3">Quick Links</p>
        <div className="flex gap-3">
          <Link
            href="/open-payments/physicians"
            className="px-4 py-2 border border-gray-700 rounded text-sm text-gray-400 hover:text-white hover:border-gray-600"
          >
            Top Recipients
          </Link>
          <Link
            href="/open-payments/manufacturers"
            className="px-4 py-2 border border-gray-700 rounded text-sm text-gray-400 hover:text-white hover:border-gray-600"
          >
            Top Manufacturers
          </Link>
          <Link
            href="/h1b"
            className="px-4 py-2 border border-gray-700 rounded text-sm text-gray-400 hover:text-white hover:border-gray-600"
          >
            H-1B Data
          </Link>
        </div>
      </div>

      {/* Data Notes */}
      <div className="mt-8 pt-6 border-t border-gray-800 text-xs text-gray-600">
        <p>Data source: CMS Open Payments (openpaymentsdata.cms.gov)</p>
        <p className="mt-1">General payments from drug and device manufacturers to physicians and teaching hospitals.</p>
        <p className="mt-1">This data does not include payments made for research activities.</p>
      </div>
    </div>
  );
}
