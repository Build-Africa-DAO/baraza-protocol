import { BrandLogo } from '@/components/BrandLogo';

interface PageLoaderProps {
  label?: string;
}

const BOARD_COLUMNS = ['Open', 'In progress', 'Under review', 'Awaiting payout'];

function LoadingBar({ className }: { className: string }) {
  return (
    <span
      className={`block rounded bg-muted/70 motion-safe:animate-pulse motion-reduce:animate-none ${className}`}
      aria-hidden="true"
    />
  );
}

export default function PageLoader({ label }: PageLoaderProps) {
  const isBountyRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/bounties');
  const statusLabel = label ?? (isBountyRoute ? 'Preparing the bounty board' : 'Preparing your Baraza workspace');

  return (
    <div className="min-h-screen bg-background text-foreground" role="status" aria-live="polite">
      <div className="border-b border-border/70 bg-background/95">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <BrandLogo size="sm" />
          <div className="flex items-center gap-2" aria-hidden="true">
            <LoadingBar className="hidden h-8 w-16 sm:block" />
            <LoadingBar className="h-8 w-24" />
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 pb-16 pt-10 md:pt-14">
        <div className="mb-8 flex flex-col gap-6 border-b border-border/70 pb-7 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            <p className="mb-2 text-xs font-semibold text-primary">
              {isBountyRoute ? 'Contributor workflow' : 'Baraza'}
            </p>
            <LoadingBar className="h-9 w-52 max-w-full md:w-72" />
            <div className="mt-4 space-y-2">
              <LoadingBar className="h-3 w-full max-w-md" />
              <LoadingBar className="h-3 w-3/4 max-w-sm" />
            </div>
          </div>
          <LoadingBar className="h-11 w-full md:w-36" />
        </div>

        <p className="mb-4 text-sm font-medium text-muted-foreground">{statusLabel}</p>

        {isBountyRoute ? (
          <div className="overflow-x-hidden">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {BOARD_COLUMNS.map((column, index) => (
                <section key={column} className="min-h-52 border border-border/70 bg-card/35 p-4">
                  <div className="mb-5 flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">{column}</span>
                    <LoadingBar className="h-5 w-7" />
                  </div>
                  <div
                    className="space-y-3 motion-safe:animate-pulse motion-reduce:animate-none"
                    style={{ animationDelay: `${index * 90}ms` }}
                    aria-hidden="true"
                  >
                    <div className="border border-border/60 bg-background/50 p-3">
                      <LoadingBar className="h-3 w-16" />
                      <LoadingBar className="mt-3 h-4 w-4/5" />
                      <LoadingBar className="mt-2 h-3 w-full" />
                      <LoadingBar className="mt-1.5 h-3 w-2/3" />
                    </div>
                  </div>
                </section>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3" aria-hidden="true">
            {[0, 1, 2].map((item) => (
              <div key={item} className="min-h-40 border border-border/70 bg-card/35 p-5">
                <LoadingBar className="h-5 w-1/2" />
                <LoadingBar className="mt-5 h-3 w-full" />
                <LoadingBar className="mt-2 h-3 w-3/4" />
              </div>
            ))}
          </div>
        )}
      </main>
      <span className="sr-only">{statusLabel}</span>
    </div>
  );
}
