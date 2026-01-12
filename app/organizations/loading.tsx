import {
  TerminalStatsSkeleton,
  FilterSkeleton,
  TableSkeleton,
  LoadingToast,
} from '../components/LoadingSkeletons';

export default function OrganizationsLoading() {
  return (
    <div className="animate-in fade-in duration-300 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <div className="h-8 w-44 bg-gray-800 animate-pulse rounded" />
        <div className="h-4 w-72 bg-gray-800/50 animate-pulse rounded mt-2" />
      </div>

      {/* Stats */}
      <div className="mb-6">
        <TerminalStatsSkeleton rows={4} />
      </div>

      {/* Filters */}
      <div className="mb-6">
        <FilterSkeleton count={5} />
      </div>

      {/* Table */}
      <TableSkeleton rows={10} cols={6} />

      <LoadingToast message="Loading organizations..." />
    </div>
  );
}
