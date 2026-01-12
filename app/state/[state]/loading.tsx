import {
  TerminalStatsSkeleton,
  MapSkeleton,
  TableSkeleton,
  CardGridSkeleton,
  LoadingToast,
} from '../../components/LoadingSkeletons';

export default function StateLoading() {
  return (
    <div className="animate-in fade-in duration-300">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-4 w-24 bg-gray-800 animate-pulse rounded" />
          <div className="h-8 w-48 bg-gray-800 animate-pulse rounded mt-2" />
        </div>
      </div>

      {/* Terminal stats skeleton */}
      <div className="mb-10">
        <TerminalStatsSkeleton rows={4} />
      </div>

      {/* Spending section skeleton */}
      <div className="mb-8">
        <div className="h-6 w-64 bg-gray-800 animate-pulse rounded mb-4" />
        <div className="border border-gray-800 p-4">
          <CardGridSkeleton count={4} />
        </div>
      </div>

      {/* Map placeholder */}
      <div className="mb-8">
        <div className="h-6 w-32 bg-gray-800 animate-pulse rounded mb-4" />
        <MapSkeleton height={400} />
      </div>

      {/* Table skeleton */}
      <div className="mb-8">
        <div className="h-6 w-40 bg-gray-800 animate-pulse rounded mb-4" />
        <TableSkeleton rows={5} cols={5} />
      </div>

      <LoadingToast message="Fetching state data..." />
    </div>
  );
}
