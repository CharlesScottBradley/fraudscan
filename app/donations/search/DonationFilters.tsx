'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

interface FilterParams {
  q?: string;
  recipient?: string;
  contributor?: string;
  employer?: string;
  minAmount?: string;
  maxAmount?: string;
  year?: string;
  party?: string;
  contributorType?: string;
  recipientType?: string;
}

interface DonationFiltersProps {
  currentParams: FilterParams;
  years: number[];
}

const CONTRIBUTOR_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'Individual', label: 'Individual' },
  { value: 'Political Committee/Fund', label: 'PAC/Committee' },
  { value: 'Lobbyist', label: 'Lobbyist' },
  { value: 'Party Unit', label: 'Party Unit' },
  { value: 'Candidate Committee', label: 'Candidate Committee' },
  { value: 'Self', label: 'Self' },
  { value: 'Other', label: 'Other' },
];

const RECIPIENT_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'PCC', label: 'Candidate (PCC)' },
  { value: 'PTU', label: 'Party Unit (PTU)' },
  { value: 'PCF', label: 'Committee/Fund (PCF)' },
];

const AMOUNT_PRESETS = [
  { value: '', label: 'Any amount' },
  { value: '1000', label: '$1,000+' },
  { value: '5000', label: '$5,000+' },
  { value: '10000', label: '$10,000+' },
  { value: '50000', label: '$50,000+' },
  { value: '100000', label: '$100,000+' },
];

export function DonationFilters({ currentParams, years }: DonationFiltersProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(true);

  // Local state for text inputs (to avoid updating URL on every keystroke)
  const [searchText, setSearchText] = useState(currentParams.q || '');
  const [recipientText, setRecipientText] = useState(currentParams.recipient || '');
  const [contributorText, setContributorText] = useState(currentParams.contributor || '');
  const [employerText, setEmployerText] = useState(currentParams.employer || '');

  const updateFilters = useCallback((updates: Partial<FilterParams>) => {
    const newParams = new URLSearchParams();

    // Merge current params with updates
    const merged = { ...currentParams, ...updates };

    // Only add non-empty values
    Object.entries(merged).forEach(([key, value]) => {
      if (value && value !== 'all') {
        newParams.set(key, value);
      }
    });

    // Reset page when filters change
    newParams.delete('page');

    router.push(`/donations/search?${newParams.toString()}`);
  }, [currentParams, router]);

  const handleSearch = () => {
    updateFilters({
      q: searchText || undefined,
      recipient: recipientText || undefined,
      contributor: contributorText || undefined,
      employer: employerText || undefined,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="border border-gray-800 mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-950"
      >
        <span className="font-medium">Filters</span>
        <span className="text-gray-500">{isExpanded ? '−' : '+'}</span>
      </button>

      {isExpanded && (
        <div className="p-4 border-t border-gray-800 space-y-4">
          {/* Search row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1">Search all</label>
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Search names..."
                className="w-full bg-gray-900 border border-gray-700 px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Recipient name</label>
              <input
                type="text"
                value={recipientText}
                onChange={(e) => setRecipientText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="e.g. Walz, DFL..."
                className="w-full bg-gray-900 border border-gray-700 px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Contributor name</label>
              <input
                type="text"
                value={contributorText}
                onChange={(e) => setContributorText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="e.g. Smith, Target..."
                className="w-full bg-gray-900 border border-gray-700 px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Employer</label>
              <input
                type="text"
                value={employerText}
                onChange={(e) => setEmployerText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="e.g. 3M, Target..."
                className="w-full bg-gray-900 border border-gray-700 px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
              />
            </div>
          </div>

          {/* Dropdowns row */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1">Year</label>
              <select
                value={currentParams.year || 'all'}
                onChange={(e) => updateFilters({ year: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
              >
                <option value="all">All years</option>
                {years.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-1">Party</label>
              <select
                value={currentParams.party || ''}
                onChange={(e) => updateFilters({ party: e.target.value || undefined })}
                className="w-full bg-gray-900 border border-gray-700 px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
              >
                <option value="">All parties</option>
                <option value="dfl">DFL (Democrat)</option>
                <option value="gop">GOP (Republican)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-1">Minimum amount</label>
              <select
                value={currentParams.minAmount || ''}
                onChange={(e) => updateFilters({ minAmount: e.target.value || undefined })}
                className="w-full bg-gray-900 border border-gray-700 px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
              >
                {AMOUNT_PRESETS.map((preset) => (
                  <option key={preset.value} value={preset.value}>{preset.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-1">Contributor type</label>
              <select
                value={currentParams.contributorType || 'all'}
                onChange={(e) => updateFilters({ contributorType: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
              >
                {CONTRIBUTOR_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-1">Recipient type</label>
              <select
                value={currentParams.recipientType || 'all'}
                onChange={(e) => updateFilters({ recipientType: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
              >
                {RECIPIENT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Search button */}
          <div className="flex justify-end">
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
