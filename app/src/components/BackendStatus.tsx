import { Database, FlaskConical } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/communities';

/**
 * Dev-only floating pill that surfaces whether the app is reading from
 * Supabase (live) or localStorage + mock seed (local). Hidden in production
 * and on mobile (mobile bottom nav owns the bottom edge).
 */
export default function BackendStatus() {
  if (!import.meta.env.DEV) return null;

  const live = isSupabaseConfigured();
  const Icon = live ? Database : FlaskConical;
  const label = live ? 'Supabase live' : 'Local mock';

  return (
    <div
      role="status"
      aria-label={`Backend mode: ${label}`}
      className={
        'fixed bottom-3 left-3 z-40 hidden md:inline-flex items-center gap-1.5 ' +
        'rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ' +
        'backdrop-blur ' +
        (live
          ? 'border-confirmed/40 bg-confirmed/12 text-confirmed'
          : 'border-accent/40 bg-accent/12 text-accent')
      }
    >
      <Icon className="h-3 w-3" aria-hidden />
      {label}
    </div>
  );
}
