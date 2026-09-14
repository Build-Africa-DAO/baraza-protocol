import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * Loading shapes that match the atoms they stand in for, so a page does not
 * jump when data lands. Use the one that mirrors the final layout.
 */

export function SkeletonHeader({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-2', className)} aria-hidden>
      <Skeleton className="h-7 w-56" />
      <Skeleton className="h-4 w-80 max-w-full" />
    </div>
  );
}

export function SkeletonAmount({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-2', className)} aria-hidden>
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-9 w-40" />
    </div>
  );
}

export function SkeletonRow({ className }: { className?: string }) {
  return (
    <div className={cn('flex min-h-14 items-center gap-3 rounded-lg border border-border px-4 py-3', className)} aria-hidden>
      <Skeleton className="h-9 w-9 shrink-0 rounded-md" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  );
}

export function SkeletonCard({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('baraza-card space-y-3 p-5', className)} aria-hidden>
      <Skeleton className="h-4 w-32" />
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className={cn('h-3', index % 2 ? 'w-3/4' : 'w-full')} />
      ))}
    </div>
  );
}

export function SkeletonList({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)} role="status" aria-label="Loading">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonRow key={index} />
      ))}
    </div>
  );
}
