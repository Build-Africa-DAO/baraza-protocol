import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Compass,
  Home,
  LogIn,
  RefreshCw,
  ShieldOff,
  Trophy,
  type LucideIcon,
} from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { DotPattern } from '@/components/ui/dot-pattern';
import {
  STATUS_COPY,
  type StatusActionIcon,
  type StatusActionSpec,
  type StatusKind,
} from '@/lib/statusPages';
import { useSeo } from '@/lib/seo';
import { toTitleCase } from '@/lib/utils';

const ICONS: Record<StatusActionIcon, LucideIcon> = {
  home: Home,
  compass: Compass,
  refresh: RefreshCw,
  login: LogIn,
  shield: ShieldOff,
  trophy: Trophy,
  'arrow-left': ArrowLeft,
};

const KIND_ICON: Record<StatusKind, LucideIcon> = {
  'not-found': Compass,
  community: Compass,
  bounty: Trophy,
  proposal: ShieldOff,
  unauthorized: LogIn,
  forbidden: ShieldOff,
  server: RefreshCw,
  offline: RefreshCw,
};

export interface StatusAction extends StatusActionSpec {
  onClick?: () => void;
}

export interface StatusPageProps {
  kind: StatusKind;
  title?: string;
  description?: string;
  details?: ReactNode;
  primary?: StatusAction | null;
  secondary?: StatusAction | null;
  onRetry?: () => void;
}

function resolveAction(
  spec: StatusActionSpec | undefined,
  override: StatusAction | null | undefined,
  retry?: () => void,
): StatusAction | null {
  if (override === null) return null;
  const label = override?.label ?? spec?.label;
  if (!label) return null;
  const action: StatusAction = {
    label,
    to: override?.to ?? spec?.to,
    icon: override?.icon ?? spec?.icon,
    onClick: override?.onClick ?? (label === 'Try Again' ? retry : undefined),
  };
  if (!action.to && !action.onClick) return null;
  return action;
}

function ActionButton({ action, variant }: { action: StatusAction; variant: 'default' | 'outline' }) {
  const Icon = action.icon ? ICONS[action.icon] : undefined;
  const body = (
    <>
      {Icon ? <Icon className="h-4 w-4" /> : null}
      {action.label}
    </>
  );

  if (action.to && !action.onClick) {
    return (
      <Button asChild variant={variant}>
        <Link to={action.to}>{body}</Link>
      </Button>
    );
  }

  return (
    <Button type="button" variant={variant} onClick={action.onClick}>
      {body}
    </Button>
  );
}

export default function StatusPage({
  kind,
  title,
  description,
  details,
  primary,
  secondary,
  onRetry,
}: StatusPageProps) {
  const copy = STATUS_COPY[kind];
  const heading = toTitleCase(title ?? copy.title);
  const lead = description ?? copy.description;
  const primaryAction = resolveAction(copy.primary, primary, onRetry);
  const secondaryAction = resolveAction(copy.secondary, secondary, onRetry);
  const KindIcon = KIND_ICON[kind];
  const alert = kind === 'server' || kind === 'offline';

  useSeo({
    title: copy.seoTitle,
    description: lead,
    noIndex: true,
  });

  return (
    <section
      className="relative flex min-h-[calc(100dvh-8rem)] items-center justify-center overflow-hidden py-20"
      role={alert ? 'alert' : undefined}
    >
      <DotPattern
        className="fill-foreground/[0.14] [mask-image:radial-gradient(ellipse_at_center,black,transparent_72%)]"
        width={22}
        height={22}
        cr={0.9}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <span className="select-none font-display text-[min(48vw,16rem)] font-black leading-none tracking-tighter text-foreground/[0.045]">
          {copy.code}
        </span>
      </div>

      <div className="relative z-10 mx-auto max-w-xl px-4 text-center">
        <div className="rise mx-auto mb-6 grid h-12 w-12 place-items-center rounded-2xl border border-border bg-card/80 text-primary shadow-[var(--shadow-card)]">
          <KindIcon className="h-5 w-5" />
        </div>
        <p className="rise rise-1 font-mono text-xs font-semibold uppercase tracking-[0.28em] text-primary">
          {copy.code}
        </p>
        <h1 className="rise rise-2 mt-3 text-balance font-display text-3xl font-bold md:text-4xl">
          {heading}
        </h1>
        <p className="rise rise-3 mx-auto mt-4 max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">
          {lead}
        </p>
        {details ? <div className="rise rise-3 mt-4 text-sm text-muted-foreground">{details}</div> : null}

        {(primaryAction || secondaryAction) && (
          <div className="rise rise-4 mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {primaryAction ? <ActionButton action={primaryAction} variant="default" /> : null}
            {secondaryAction ? <ActionButton action={secondaryAction} variant="outline" /> : null}
          </div>
        )}
      </div>
    </section>
  );
}

type LayoutGate = boolean | { title?: string; description?: string };

export function StatusScreen({
  gate,
  ...page
}: StatusPageProps & { gate?: LayoutGate }) {
  return (
    <Layout gate={gate}>
      <StatusPage {...page} />
    </Layout>
  );
}
