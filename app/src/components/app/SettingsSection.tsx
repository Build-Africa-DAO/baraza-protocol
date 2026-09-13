import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * A titled block of label / value / action rows (§13.19, §13.20). Officers
 * and members share the same section; rows marked `officerOnly` are simply
 * not rendered for members, so there is never a "Locked" chip for something
 * a member could not do anyway.
 */
export interface SettingsRow {
  label: string;
  value?: ReactNode;
  /** A Button or link on the right. */
  action?: ReactNode;
  /** Sentence-case helper under the value. */
  help?: string;
  officerOnly?: boolean;
}

export interface SettingsSectionProps {
  title: string;
  description?: string;
  rows?: SettingsRow[];
  /** Whether the viewer may see officer-only rows. */
  isOfficer?: boolean;
  /** Free-form content instead of, or after, the rows. */
  children?: ReactNode;
  id?: string;
  className?: string;
}

export function SettingsSection({ title, description, rows, isOfficer = false, children, id, className }: SettingsSectionProps) {
  const visible = (rows ?? []).filter((row) => !row.officerOnly || isOfficer);
  return (
    <section id={id} aria-labelledby={id ? `${id}-title` : undefined} className={cn('baraza-card scroll-mt-24 p-5', className)}>
      <header className="mb-3">
        <h2 id={id ? `${id}-title` : undefined} className="font-display text-base font-bold">
          {title}
        </h2>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </header>
      {visible.length > 0 ? (
        <dl className="divide-y divide-border">
          {visible.map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-4 py-3">
              <div className="min-w-0">
                <dt className="text-sm text-muted-foreground">{row.label}</dt>
                {row.value !== undefined ? <dd className="mt-0.5 text-sm font-semibold text-foreground">{row.value}</dd> : null}
                {row.help ? <dd className="mt-0.5 text-xs text-muted-foreground">{row.help}</dd> : null}
              </div>
              {row.action ? <div className="shrink-0">{row.action}</div> : null}
            </div>
          ))}
        </dl>
      ) : null}
      {children}
    </section>
  );
}

export default SettingsSection;
