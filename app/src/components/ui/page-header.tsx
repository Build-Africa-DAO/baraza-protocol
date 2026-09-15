import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { cn, toTitleCase } from '@/lib/utils';

/**
 * Every product page starts the same way (§13.5): optional Back, a Title Case
 * title, one sentence, and on desktop an optional primary on the right. On
 * phones the primary belongs at the bottom of the page, so `action` is hidden
 * below `md`; the page renders its own full-width button there.
 */
export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  back?: { label: string; to: string };
  action?: ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, back, action, className }: PageHeaderProps) {
  return (
    <header className={cn('mb-6', className)}>
      {back ? (
        <Link
          to={back.to}
          className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {toTitleCase(back.label)}
        </Link>
      ) : null}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-black tracking-tight md:text-3xl">{toTitleCase(title)}</h1>
          {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
        {action ? <div className="hidden shrink-0 md:block">{action}</div> : null}
      </div>
    </header>
  );
}

export default PageHeader;
