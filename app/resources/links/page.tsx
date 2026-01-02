'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import dataSourceLinks from '../../data/dataSourceLinks.json';

const CATEGORY_COLORS: Record<string, string> = {
  fiscal: 'text-green-400 border-green-800 bg-green-900/20',
  data: 'text-blue-400 border-blue-800 bg-blue-900/20',
  business: 'text-purple-400 border-purple-800 bg-purple-900/20',
  childcare: 'text-pink-400 border-pink-800 bg-pink-900/20',
  healthcare: 'text-red-400 border-red-800 bg-red-900/20',
  political: 'text-orange-400 border-orange-800 bg-orange-900/20',
  foia: 'text-gray-400 border-gray-700 bg-gray-900/20',
  grants: 'text-teal-400 border-teal-800 bg-teal-900/20',
  loans: 'text-indigo-400 border-indigo-800 bg-indigo-900/20',
  contracts: 'text-amber-400 border-amber-800 bg-amber-900/20',
  enforcement: 'text-red-400 border-red-800 bg-red-900/20',
  oversight: 'text-slate-400 border-slate-700 bg-slate-900/20',
  welfare: 'text-emerald-400 border-emerald-800 bg-emerald-900/20',
  housing: 'text-cyan-400 border-cyan-800 bg-cyan-900/20',
};

const STATES_LIST = Object.entries(dataSourceLinks.states).map(([code, data]) => ({
  code,
  name: (data as { name: string }).name,
})).sort((a, b) => a.name.localeCompare(b.name));

const ALL_CATEGORIES = Object.entries(dataSourceLinks.categories).map(([key, data]) => ({
  key,
  label: (data as { label: string }).label,
}));

type StateData = {
  name: string;
  links: Array<{
    name: string;
    url: string;
    category: string;
    description: string;
  }>;
};

type FederalLink = {
  name: string;
  url: string;
  apiUrl?: string;
  description: string;
  category: string;
  hasApi: boolean;
};

export default function DataSourceLinksPage() {
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedStates, setExpandedStates] = useState<Set<string>>(new Set());

  // Filter federal links
  const filteredFederalLinks = useMemo(() => {
    return (dataSourceLinks.federal as FederalLink[]).filter(link => {
      const matchesCategory = !selectedCategory || link.category === selectedCategory;
      const matchesSearch = !searchQuery ||
        link.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        link.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Filter states
  const filteredStates = useMemo(() => {
    if (selectedState) {
      const stateData = (dataSourceLinks.states as Record<string, StateData>)[selectedState];
      if (!stateData) return [];
      return [{
        code: selectedState,
        name: stateData.name,
        links: stateData.links.filter(link => {
          const matchesCategory = !selectedCategory || link.category === selectedCategory;
          const matchesSearch = !searchQuery ||
            link.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            link.description.toLowerCase().includes(searchQuery.toLowerCase());
          return matchesCategory && matchesSearch;
        }),
      }];
    }

    // Show all states with matching links
    return STATES_LIST.map(state => {
      const stateData = (dataSourceLinks.states as Record<string, StateData>)[state.code];
      return {
        code: state.code,
        name: state.name,
        links: stateData.links.filter(link => {
          const matchesCategory = !selectedCategory || link.category === selectedCategory;
          const matchesSearch = !searchQuery ||
            link.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            link.description.toLowerCase().includes(searchQuery.toLowerCase());
          return matchesCategory && matchesSearch;
        }),
      };
    }).filter(state => state.links.length > 0);
  }, [selectedState, selectedCategory, searchQuery]);

  const toggleState = (code: string) => {
    setExpandedStates(prev => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedStates(new Set(filteredStates.map(s => s.code)));
  };

  const collapseAll = () => {
    setExpandedStates(new Set());
  };

  const getCategoryLabel = (category: string) => {
    const cat = dataSourceLinks.categories[category as keyof typeof dataSourceLinks.categories];
    return cat ? cat.label : category;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <Link href="/" className="text-gray-500 hover:text-white text-sm mb-6 inline-block">
        Back to Map
      </Link>

      <h1 className="text-2xl font-bold mb-2">Data Source Links</h1>
      <p className="text-gray-400 mb-6">
        Comprehensive directory of federal and state government data sources - fiscal transparency portals,
        business registries, childcare licensing, campaign finance, and more.
      </p>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Search</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search sources..."
            className="w-64 bg-black border border-gray-700 rounded p-2.5 text-white focus:border-gray-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">State</label>
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="w-48 bg-black border border-gray-700 rounded p-2.5 text-white focus:border-gray-500 focus:outline-none"
          >
            <option value="">All States</option>
            {STATES_LIST.map(s => (
              <option key={s.code} value={s.code}>{s.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-48 bg-black border border-gray-700 rounded p-2.5 text-white focus:border-gray-500 focus:outline-none"
          >
            <option value="">All Categories</option>
            {ALL_CATEGORIES.map(c => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Federal Sources */}
      <section className="mb-12">
        <h2 className="text-lg font-semibold mb-4 text-gray-300 border-b border-gray-800 pb-2">
          Federal Data Sources
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFederalLinks.map((link, idx) => (
            <a
              key={idx}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block border border-gray-800 rounded p-4 hover:border-gray-600 transition-colors group"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-medium text-white group-hover:text-green-400 transition-colors">
                  {link.name}
                </h3>
                {link.hasApi && (
                  <span className="text-xs px-2 py-0.5 bg-green-900/30 text-green-400 rounded">API</span>
                )}
              </div>
              <p className="text-sm text-gray-400 mb-2">{link.description}</p>
              <span className={`text-xs px-2 py-0.5 rounded border ${CATEGORY_COLORS[link.category] || 'text-gray-400 border-gray-700'}`}>
                {getCategoryLabel(link.category)}
              </span>
            </a>
          ))}
        </div>
        {filteredFederalLinks.length === 0 && (
          <p className="text-gray-500 text-sm py-4">No federal sources match your filters.</p>
        )}
      </section>

      {/* State Sources */}
      <section>
        <div className="flex items-center justify-between mb-4 border-b border-gray-800 pb-2">
          <h2 className="text-lg font-semibold text-gray-300">
            State Data Sources {selectedState && `- ${(dataSourceLinks.states as Record<string, StateData>)[selectedState]?.name}`}
          </h2>
          {!selectedState && filteredStates.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={expandAll}
                className="text-xs text-gray-500 hover:text-gray-300 px-2 py-1 border border-gray-700 rounded hover:border-gray-600"
              >
                Expand All
              </button>
              <button
                onClick={collapseAll}
                className="text-xs text-gray-500 hover:text-gray-300 px-2 py-1 border border-gray-700 rounded hover:border-gray-600"
              >
                Collapse All
              </button>
            </div>
          )}
        </div>

        {filteredStates.length === 0 ? (
          <p className="text-gray-500 text-sm py-4">No state sources match your filters.</p>
        ) : selectedState ? (
          // Single state view - show all links directly
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStates[0]?.links.map((link, idx) => (
              <a
                key={idx}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block border border-gray-800 rounded p-4 hover:border-gray-600 transition-colors group"
              >
                <h3 className="font-medium text-white group-hover:text-green-400 transition-colors mb-1">
                  {link.name}
                </h3>
                <p className="text-sm text-gray-400 mb-2">{link.description}</p>
                <span className={`text-xs px-2 py-0.5 rounded border ${CATEGORY_COLORS[link.category] || 'text-gray-400 border-gray-700'}`}>
                  {getCategoryLabel(link.category)}
                </span>
              </a>
            ))}
          </div>
        ) : (
          // All states view - accordion style
          <div className="space-y-2">
            {filteredStates.map(state => {
              const isExpanded = expandedStates.has(state.code);
              return (
                <div key={state.code} className="border border-gray-800 rounded">
                  <button
                    onClick={() => toggleState(state.code)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-900/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500 font-mono text-sm w-8">{state.code}</span>
                      <span className="font-medium text-white">{state.name}</span>
                      <span className="text-sm text-gray-500">({state.links.length} links)</span>
                    </div>
                    <span className="text-gray-500 text-lg">{isExpanded ? '-' : '+'}</span>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-gray-800 p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {state.links.map((link, idx) => (
                          <a
                            key={idx}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-start gap-3 p-3 border border-gray-800 rounded hover:border-gray-600 transition-colors group"
                          >
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-white group-hover:text-green-400 transition-colors text-sm truncate">
                                {link.name}
                              </h4>
                              <p className="text-xs text-gray-500 truncate">{link.description}</p>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded border whitespace-nowrap ${CATEGORY_COLORS[link.category] || 'text-gray-400 border-gray-700'}`}>
                              {getCategoryLabel(link.category)}
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Stats Footer */}
      <div className="mt-12 pt-6 border-t border-gray-800">
        <div className="flex flex-wrap gap-6 text-sm text-gray-500">
          <div>
            <span className="text-gray-400">{dataSourceLinks.federal.length}</span> Federal Sources
          </div>
          <div>
            <span className="text-gray-400">{Object.keys(dataSourceLinks.states).length}</span> States & Territories
          </div>
          <div>
            <span className="text-gray-400">
              {Object.values(dataSourceLinks.states).reduce((acc, state) => acc + (state as StateData).links.length, 0)}
            </span> State Links
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-4">
          Links may change over time. If you find a broken link, please report it via our corrections page.
        </p>
      </div>
    </div>
  );
}
