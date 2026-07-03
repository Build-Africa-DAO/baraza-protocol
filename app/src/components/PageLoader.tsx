import { BrandLogo } from '@/components/BrandLogo';

interface PageLoaderProps {
  label?: string;
}

/**
 * Shared loading surface for route-level Suspense fallbacks AND in-page data loads.
 * Keeps the visual weight consistent across first-load (JS chunk fetch) and
 * subsequent data fetches.
 */
export default function PageLoader({ label = 'Loading' }: PageLoaderProps) {
  return (
    <div
      className="flex min-h-[60vh] items-center justify-center px-4"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 -m-3 animate-pulse rounded-full bg-primary/15 blur-xl" aria-hidden />
          <div className="relative">
            <BrandLogo size="md" />
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" aria-hidden />
          {label}
        </div>
      </div>
    </div>
  );
}
