import { AlertTriangle, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getSecurityReviewLabel,
  type SecurityReview,
  type SecurityReviewLevel,
} from '@/lib/securityReview';

const levelClass: Record<SecurityReviewLevel, string> = {
  pass: 'border-confirmed/35 bg-confirmed/10 text-confirmed',
  watch: 'border-accent/40 bg-accent/10 text-accent',
  risk: 'border-destructive/40 bg-destructive/10 text-destructive',
};

const levelIcon = {
  pass: CheckCircle2,
  watch: ShieldCheck,
  risk: AlertTriangle,
};

interface AshaSecurityReviewProps {
  review: SecurityReview;
  compact?: boolean;
  className?: string;
}

export default function AshaSecurityReview({ review, compact = false, className }: AshaSecurityReviewProps) {
  const Icon = levelIcon[review.level];
  const visibleChecks = compact ? review.checks.slice(0, 3) : review.checks;

  return (
    <section className={cn('baraza-card p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
            <Sparkles className="h-3 w-3" />
            Akili AI security layer
          </div>
          <h2 className="font-display text-lg font-semibold">{compact ? 'Security review' : `Security review: ${review.subject}`}</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{review.summary}</p>
        </div>
        <div className={cn('flex shrink-0 flex-col items-center rounded-lg border px-3 py-2', levelClass[review.level])}>
          <Icon className="h-4 w-4" />
          <span className="mt-1 font-display text-lg font-bold leading-none">{review.score}</span>
          <span className="mt-1 text-[9px] font-bold uppercase tracking-wider">{getSecurityReviewLabel(review.level)}</span>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {visibleChecks.map((check) => (
          <div key={check.id} className="flex gap-2 rounded-lg border px-3 py-2">
            {check.passed ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-confirmed" />
            ) : (
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            )}
            <div>
              <p className="text-sm font-semibold">{check.label}</p>
              {!compact && <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{check.detail}</p>}
            </div>
          </div>
        ))}
      </div>

      {!compact && (
        <div className="mt-4 rounded-lg border border-dashed p-3">
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Next action</p>
          <ul className="mt-2 space-y-1.5">
            {review.nextSteps.map((step) => (
              <li key={step} className="text-sm leading-6 text-muted-foreground">
                {step}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
