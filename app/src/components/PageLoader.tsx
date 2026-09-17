import { toTitleCase } from '@/lib/utils';

interface PageLoaderProps {
  label?: string;
}

/**
 * Route-level Suspense fallback and in-page loading surface. It draws the
 * outline of the page that is about to arrive (a header block, a row of
 * amounts, three card outlines) at the same widths the real screens use, so
 * the content lands in place instead of shifting the layout (CLS). The shells
 * around it stay mounted, so the top bar and nav never flash.
 */
export default function PageLoader({ label = 'Loading' }: PageLoaderProps) {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-6 md:py-12" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{toTitleCase(label)}</span>
      <div className="animate-pulse space-y-6" aria-hidden>
        <div className="space-y-3">
          <div className="h-3 w-24 rounded bg-muted" />
          <div className="h-8 w-64 max-w-full rounded bg-muted" />
          <div className="h-3 w-full max-w-md rounded bg-muted" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <div key={index} className="rounded-chrome border border-border p-5">
              <div className="h-3 w-20 rounded bg-muted" />
              <div className="mt-3 h-7 w-32 rounded bg-muted" />
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {[0, 1, 2].map((index) => (
            <div key={index} className="flex items-center gap-3 rounded-chrome border border-border p-4">
              <div className="h-10 w-10 shrink-0 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-2/3 rounded bg-muted" />
                <div className="h-3 w-1/3 rounded bg-muted" />
              </div>
              <div className="h-6 w-16 rounded-full bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
