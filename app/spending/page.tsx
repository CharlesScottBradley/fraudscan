import { Suspense } from 'react';
import SpendingExplorer from './SpendingExplorer';

export const metadata = {
  title: 'Spending Explorer | SomaliScan',
  description: 'Explore government spending across federal, state, and local sources',
};

export default function SpendingPage() {
  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Spending Explorer</h1>
        <p className="text-gray-400 mt-1">
          Search government spending across federal, state, and local sources.
        </p>
      </div>

      <Suspense fallback={<SpendingLoading />}>
        <SpendingExplorer />
      </Suspense>
    </div>
  );
}

function SpendingLoading() {
  return (
    <div className="space-y-6">
      {/* Filter skeleton */}
      <div className="flex flex-wrap gap-4 p-4 border border-gray-800 bg-gray-900/50">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-10 w-32 bg-gray-800 animate-pulse rounded" />
        ))}
      </div>

      {/* Terminal stats skeleton */}
      <div className="font-mono text-sm">
        <div className="h-4 w-40 bg-gray-800 animate-pulse rounded mb-2" />
        <div className="space-y-1 ml-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-4 w-64 bg-gray-800/50 animate-pulse rounded" />
          ))}
        </div>
      </div>

      {/* Table skeleton */}
      <div className="border border-gray-800 overflow-hidden">
        <div className="h-12 bg-gray-900 border-b border-gray-800" />
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-14 border-b border-gray-800 flex items-center px-4">
            <div className="h-4 w-full bg-gray-800 animate-pulse rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
