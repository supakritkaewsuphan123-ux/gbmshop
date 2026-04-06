// Spinner
export function Spinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className={`${sizes[size]} ${className}`}>
      <svg className="animate-spin text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );
}

// Full page loader
export function PageLoader() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <Spinner size="lg" />
      <p className="text-gray-400 text-sm animate-pulse">กำลังโหลด...</p>
    </div>
  );
}

// Skeleton line
export function SkeletonLine({ className = '' }) {
  return <div className={`shimmer rounded-lg bg-surface-hover ${className}`} />;
}

// Product card skeleton
export function ProductCardSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      <div className="shimmer h-[220px]" />
      <div className="p-4 space-y-3">
        <SkeletonLine className="h-4 w-3/4" />
        <SkeletonLine className="h-3 w-1/2" />
        <div className="flex justify-between items-center mt-4">
          <SkeletonLine className="h-6 w-24" />
          <SkeletonLine className="h-8 w-16 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// Table row skeleton
export function TableRowSkeleton({ cols = 5 }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <SkeletonLine className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}
