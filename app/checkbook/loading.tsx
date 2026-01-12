import {
  TerminalStatsSkeleton,
  FilterSkeleton,
  TableSkeleton,
  LoadingToast,
} from '../components/LoadingSkeletons';

export default function CheckbookLoading() {
  return (
    <div className="animate-in fade-in duration-300 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <div className="h-8 w-48 bg-gray-800 animate-pulse rounded" />
        <div className="h-4 w-96 bg-gray-800/50 animate-pulse rounded mt-2" />
      </div>

      {/* Stats */}
      <div className="mb-6">
        <TerminalStatsSkeleton rows={5} />
      </div>

      {/* Filters */}
      <div className="mb-6">
        <FilterSkeleton count={6} />
      </div>

      {/* Table */}
      <TableSkeleton rows={10} cols={6} />

      <LoadingToast message="Loading checkbook data..." />
    </div>
  );
}
