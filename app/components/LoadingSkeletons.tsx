/**
 * Reusable loading skeleton components matching terminal aesthetic
 */

export function TerminalStatsSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="font-mono text-sm">
      <div className="h-4 w-40 bg-gray-800 animate-pulse rounded mb-2" />
      <div className="mt-2 space-y-1">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center">
            <span className="text-gray-700">{i === rows - 1 ? '└─' : '├─'}</span>
            <div
              className="h-4 bg-gray-800/60 animate-pulse rounded ml-1"
              style={{ width: `${120 + Math.random() * 80}px` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TableSkeleton({
  rows = 5,
  cols = 5,
  showHeader = true
}: {
  rows?: number;
  cols?: number;
  showHeader?: boolean;
}) {
  return (
    <div className="border border-gray-800 overflow-hidden">
      {showHeader && (
        <div className="h-10 bg-gray-900/80 border-b border-gray-800 flex items-center px-4 gap-4">
          {Array.from({ length: cols }).map((_, i) => (
            <div key={i} className="h-3 w-20 bg-gray-800 animate-pulse rounded" />
          ))}
        </div>
      )}
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="h-12 border-b border-gray-800 flex items-center px-4 gap-4">
          {Array.from({ length: cols }).map((_, col) => (
            <div
              key={col}
              className="h-4 bg-gray-800/40 animate-pulse rounded"
              style={{ width: `${60 + col * 10}px` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function MapSkeleton({ height = 400 }: { height?: number }) {
  return (
    <div
      className="bg-gray-900 border border-gray-800 flex items-center justify-center"
      style={{ height }}
    >
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="text-gray-600 text-sm font-mono mt-3">Loading map data...</p>
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="border border-gray-800 p-4 space-y-3">
      <div className="h-4 w-24 bg-gray-800 animate-pulse rounded" />
      <div className="h-6 w-32 bg-gray-800/70 animate-pulse rounded" />
    </div>
  );
}

export function CardGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function SectionSkeleton({
  titleWidth = 200,
  children
}: {
  titleWidth?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-8">
      <div
        className="h-6 bg-gray-800 animate-pulse rounded mb-4"
        style={{ width: titleWidth }}
      />
      {children}
    </div>
  );
}

export function LoadingSpinner({
  size = 'md'
}: {
  size?: 'sm' | 'md' | 'lg'
}) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-2',
    lg: 'h-8 w-8 border-2',
  };

  return (
    <div
      className={`${sizeClasses[size]} border-gray-700 border-t-green-500 rounded-full animate-spin`}
    />
  );
}

export function LoadingToast({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 border border-gray-700 px-4 py-2 rounded-lg shadow-lg z-50">
      <div className="flex items-center gap-2">
        <LoadingSpinner size="sm" />
        <span className="text-gray-400 text-sm font-mono">{message}</span>
      </div>
    </div>
  );
}

export function FilterSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="flex flex-wrap gap-4 p-4 border border-gray-800 bg-gray-900/50">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-10 w-32 bg-gray-800 animate-pulse rounded" />
      ))}
    </div>
  );
}

export function PageLoadingSkeleton() {
  return (
    <div className="animate-in fade-in duration-300 space-y-6">
      {/* Header */}
      <div>
        <div className="h-4 w-24 bg-gray-800 animate-pulse rounded" />
        <div className="h-8 w-64 bg-gray-800 animate-pulse rounded mt-2" />
        <div className="h-4 w-96 bg-gray-800/50 animate-pulse rounded mt-2" />
      </div>

      {/* Stats */}
      <TerminalStatsSkeleton rows={4} />

      {/* Content */}
      <TableSkeleton rows={5} cols={5} />
    </div>
  );
}
