import { useLocation } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { StatusScreen } from '@/components/StatusPage';
import { AskAkili } from '@/akili/AskAkili';
import { Link } from 'react-router-dom';
import { useAccount } from '@/contexts/AccountContext';

/**
 * Branded 404. Says what happened in English and Kiswahili, shows the path that
 * failed so a member can read it back to support, and offers four ways out:
 * home, browse, the status page, and Akili with the situation prefilled.
 */
export default function NotFound() {
  const location = useLocation();
  const account = useAccount();
  const path = `${location.pathname}${location.search}`;
  const homeTo = account.authenticated ? '/home' : '/';

  return (
    <StatusScreen
      kind="not-found"
      title="Page Not Found. Ukurasa Haupatikani."
      description="This link may have moved or never existed. Nothing in your groups has changed."
      primary={{ label: 'Back to Home', to: homeTo, icon: 'home' }}
      secondary={{ label: 'Browse Groups', to: '/groups', icon: 'compass' }}
      details={
        <div className="space-y-4 text-sm">
          <p className="text-muted-foreground">
            You asked for{' '}
            <code className="rounded-md bg-surface px-1.5 py-0.5 font-mono text-xs text-foreground" data-testid="not-found-path">
              {path}
            </code>
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Link
              to="/status"
              className="inline-flex min-h-12 items-center gap-1.5 rounded-full border border-border px-4 text-sm font-semibold text-muted-foreground hover:border-foreground/40 hover:text-foreground"
            >
              <Activity className="h-4 w-4" aria-hidden />
              Check Protocol Status
            </Link>
            <AskAkili variant="chip" label="Ask Akili for Directions" prompt={`I got lost trying to find this page: ${path}. Where should I go?`} />
          </div>
        </div>
      }
    />
  );
}
