'use client';

import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { useGlobalSearch } from './GlobalSearchProvider';
import { useDebounce } from '../hooks/useDebounce';

// Entity type configuration with search page URLs
const ENTITY_CONFIG: Record<string, { label: string; icon: string; searchUrl: (q: string) => string }> = {
  organizations: {
    label: 'Organizations',
    icon: '🏢',
    searchUrl: (q) => `/organizations?search=${encodeURIComponent(q)}`
  },
  ppp_loans: {
    label: 'PPP Loans',
    icon: '💵',
    searchUrl: (q) => `/ppp?search=${encodeURIComponent(q)}`
  },
  federal_grants: {
    label: 'Federal Grants',
    icon: '🎁',
    searchUrl: (q) => `/federal-grants?search=${encodeURIComponent(q)}`
  },
  cases: {
    label: 'Fraud Cases',
    icon: '⚖️',
    searchUrl: (q) => `/cases?search=${encodeURIComponent(q)}`
  },
  politicians: {
    label: 'Politicians',
    icon: '🏛️',
    searchUrl: (q) => `/politicians?search=${encodeURIComponent(q)}`
  },
  providers: {
    label: 'Childcare Providers',
    icon: '👶',
    searchUrl: (q) => `/providers?search=${encodeURIComponent(q)}`
  },
  sba_loans: {
    label: 'SBA Loans',
    icon: '🏦',
    searchUrl: (q) => `/sba?search=${encodeURIComponent(q)}`
  },
  snap_retailers: {
    label: 'SNAP Retailers',
    icon: '🏪',
    searchUrl: (q) => `/snap-retailers?search=${encodeURIComponent(q)}`
  },
  h1b_employers: {
    label: 'H1B Employers',
    icon: '💼',
    searchUrl: (q) => `/h1b?search=${encodeURIComponent(q)}`
  },
  open_payments: {
    label: 'Open Payments',
    icon: '🏥',
    searchUrl: (q) => `/open-payments?search=${encodeURIComponent(q)}`
  },
  nursing_homes: {
    label: 'Nursing Homes',
    icon: '🏠',
    searchUrl: (q) => `/nursing-homes?search=${encodeURIComponent(q)}`
  },
  contributions: {
    label: 'Donations',
    icon: '💝',
    searchUrl: (q) => `/donations/search?q=${encodeURIComponent(q)}`
  },
  budgets: {
    label: 'Budgets',
    icon: '📊',
    searchUrl: (q) => `/budgets?search=${encodeURIComponent(q)}`
  },
};

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  url: string;
  entityType: string;
}

interface SearchResponse {
  results: Record<string, SearchResult[]>;
  counts: Record<string, number>;
  query: string;
  timing: number;
}

export default function GlobalSearch() {
  const { isOpen, close } = useGlobalSearch();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const [searchData, setSearchData] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch results when debounced query changes
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setSearchData(null);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);

    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`, {
      signal: controller.signal
    })
      .then(res => res.json())
      .then((data: SearchResponse) => {
        setSearchData(data);
        setIsLoading(false);
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          console.error('Search error:', err);
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [debouncedQuery]);

  const handleSelect = useCallback((url: string) => {
    close();
    router.push(url);
    setQuery('');
    setSearchData(null);
  }, [close, router]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setSearchData(null);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        close();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close]);

  if (!isOpen) return null;

  const hasResults = searchData && Object.keys(searchData.results).length > 0;
  const totalCount = searchData ? Object.values(searchData.counts).reduce((a, b) => a + b, 0) : 0;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={close}
      />

      {/* Modal */}
      <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-full max-w-2xl px-4">
        <Command
          className="bg-black border border-gray-800 rounded-lg shadow-2xl overflow-hidden"
          shouldFilter={false}
          loop
        >
          {/* Search Input */}
          <div className="flex items-center border-b border-gray-800 px-4">
            <svg
              className="w-5 h-5 text-gray-500 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder="Search organizations, loans, cases, politicians..."
              className="w-full px-3 py-4 bg-transparent text-white placeholder:text-gray-500 outline-none text-base"
              autoFocus
            />
            {isLoading && (
              <div className="shrink-0">
                <svg className="animate-spin h-5 w-5 text-gray-500" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
            )}
          </div>

          {/* Results */}
          <Command.List className="max-h-[60vh] overflow-y-auto">
            {query.length < 2 && (
              <div className="py-14 text-center text-gray-500">
                <p className="text-sm">Type at least 2 characters to search</p>
                <p className="text-xs mt-2 text-gray-600">
                  Search across organizations, PPP loans, cases, and more...
                </p>
              </div>
            )}

            {query.length >= 2 && !isLoading && !hasResults && (
              <Command.Empty className="py-14 text-center text-gray-500">
                <p>No results found for &quot;{query}&quot;</p>
                <p className="text-xs mt-2 text-gray-600">Try a different search term</p>
              </Command.Empty>
            )}

            {hasResults && searchData && (
              <div className="p-2">
                {Object.entries(ENTITY_CONFIG).map(([type, config]) => {
                  const results = searchData.results[type];
                  const count = searchData.counts[type] || 0;

                  if (!results || results.length === 0) return null;

                  const searchPageUrl = config.searchUrl(debouncedQuery);

                  return (
                    <Command.Group
                      key={type}
                      heading={
                        <button
                          onClick={() => handleSelect(searchPageUrl)}
                          className="w-full flex items-center justify-between px-2 py-2 text-xs text-gray-500 uppercase tracking-wide hover:text-gray-300 hover:bg-gray-900/50 rounded transition-colors group"
                        >
                          <span className="flex items-center gap-2">
                            <span>{config.icon}</span>
                            <span>{config.label}</span>
                            <span className="text-gray-600 normal-case">
                              ({count.toLocaleString()})
                            </span>
                          </span>
                          <span className="flex items-center gap-1 text-gray-600 normal-case group-hover:text-gray-400">
                            <span>View all</span>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </span>
                        </button>
                      }
                    >
                      {results.map((result) => (
                        <Command.Item
                          key={`${type}-${result.id}`}
                          value={`${type}-${result.id}`}
                          onSelect={() => handleSelect(result.url)}
                          className="px-3 py-3 flex flex-col cursor-pointer rounded-md mx-1 hover:bg-gray-900 data-[selected=true]:bg-gray-900 transition-colors"
                        >
                          <span className="text-white font-medium truncate">
                            {result.title}
                          </span>
                          {result.subtitle && (
                            <span className="text-gray-500 text-sm truncate mt-0.5">
                              {result.subtitle}
                            </span>
                          )}
                        </Command.Item>
                      ))}
                    </Command.Group>
                  );
                })}
              </div>
            )}
          </Command.List>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-gray-800 flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-900 rounded text-gray-400 font-mono">↑↓</kbd>
                <span>Navigate</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-900 rounded text-gray-400 font-mono">↵</kbd>
                <span>Open</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-900 rounded text-gray-400 font-mono">Esc</kbd>
                <span>Close</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              {searchData?.timing && (
                <span className="text-gray-700">{searchData.timing}ms</span>
              )}
              {totalCount > 0 && (
                <span>{totalCount.toLocaleString()} results</span>
              )}
            </div>
          </div>
        </Command>
      </div>
    </div>
  );
}
