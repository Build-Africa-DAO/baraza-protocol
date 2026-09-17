import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Layout from '@/components/Layout';
import { StatusScreen } from '@/components/StatusPage';
import { IdentityStrip } from '@/components/app/IdentityStrip';
import { StatusChip } from '@/components/ui/status-chip';
import { SaccoComplianceBadge } from '@/components/SaccoComplianceBadge';
import { TreasuryCircuitBreakerBanner } from '@/components/TreasuryCircuitBreakerBanner';
import { GroupSidebarNav } from '@/components/app/GroupSidebarNav';
import { useCommunity } from '@/hooks/useCommunities';
import { useGroupMembership, type GroupMembership } from '@/hooks/useGroupMembership';
import { useChain } from '@/hooks/useChain';
import { useAccount } from '@/contexts/AccountContext';
import { useSeo } from '@/lib/seo';
import { CHAINS, type ChainMeta } from '@/lib/chain';
import type { Community } from '@/lib/constants';

export interface GroupWorkspaceContext {
  community: Community;
  membership: GroupMembership;
  isMember: boolean;
  isOfficer: boolean;
  /** Treasury circuit breaker — outbound money is locked while true. */
  frozen: boolean;
  chainMeta: ChainMeta;
}

interface GroupWorkspaceProps {
  /** Page heading under the group name. Omit on Group Home. */
  title?: string;
  subtitle?: string;
  /** SEO path override; defaults to the current group route. */
  seoPath?: string;
  /** Sign-in required to see anything. */
  gate?: boolean | { title?: string; description?: string };
  /**
   * Officer-only page. Members get a read-only variant if `memberFallback` is
   * given, otherwise a 403. Never trust this alone for anything destructive —
   * the server re-checks.
   */
  requireOfficer?: boolean;
  /** Hide the big group banner (pages that lead with their own hero). */
  hideBanner?: boolean;
  /**
   * Suppress the banner's Join CTA. Group Home renders its own next-action card,
   * and two identical primary buttons on one screen is a design smell (§13.2).
   */
  hideJoinCta?: boolean;
  children: (ctx: GroupWorkspaceContext) => React.ReactNode;
}

/**
 * Shared chrome for every `/dashboard/:id/*` screen.
 *
 * Group Home, Pay, Votes, People, Money and Settings all sit inside this so the
 * header, membership chip, circuit-breaker banner and the signed-out sidebar are
 * defined once. It also owns the §10 state set — loading, not-found, server
 * error, forbidden — so individual pages only handle their own empty states.
 */
export default function GroupWorkspace({
  title,
  subtitle,
  seoPath,
  gate,
  requireOfficer = false,
  hideBanner = false,
  hideJoinCta = false,
  children,
}: GroupWorkspaceProps) {
  const { id } = useParams<{ id: string }>();
  const account = useAccount();
  const { chain } = useChain();
  const { community, isLoading, error, reload } = useCommunity(id);
  const membership = useGroupMembership(id);

  useSeo({
    title: community ? (title ? `${title} — ${community.name}` : `${community.name}`) : undefined,
    description: 'Group funds, decisions, members and dues for a Baraza group.',
    path: seoPath ?? (id ? `/dashboard/${id}` : '/dashboard'),
    noIndex: true,
  });

  if (isLoading) {
    return (
      <Layout gate={gate}>
        <section className="py-8 md:py-12">
          <div className="container mx-auto space-y-6 px-4">
            <div className="baraza-card animate-pulse p-5 md:p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <div className="h-14 w-14 flex-shrink-0 rounded-xl bg-muted" />
                <div className="flex-1 space-y-3">
                  <div className="h-3 w-24 rounded bg-muted" />
                  <div className="h-7 w-64 rounded bg-muted" />
                  <div className="h-3 w-full max-w-md rounded bg-muted" />
                </div>
              </div>
            </div>
            <div className="baraza-card animate-pulse space-y-3 p-5">
              <div className="h-3 w-32 rounded bg-muted" />
              <div className="h-8 w-48 rounded bg-muted" />
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  if (!community) {
    if (error) return <StatusScreen kind="server" gate={gate} onRetry={() => void reload()} />;
    return <StatusScreen kind="community" gate={gate} />;
  }

  if (requireOfficer && !membership.isOfficer) {
    return (
      <StatusScreen
        kind="forbidden"
        gate={gate}
        title="Officers Only"
        description="This page is for the people who approve and send this group's money. Ask an officer if you need something from it."
        primary={{ label: 'Go to Group', to: `/dashboard/${community.id}`, icon: 'arrow-left' }}
      />
    );
  }

  const chainMeta = CHAINS[community.chain ?? chain];
  const frozen = Boolean(community.isPayoutFrozen || community.communityStatus === 'paused');
  const ctx: GroupWorkspaceContext = {
    community,
    membership,
    isMember: membership.isMember,
    isOfficer: membership.isOfficer,
    frozen,
    chainMeta,
  };

  const inAppShell = account.authenticated;

  return (
    <Layout gate={gate}>
      <section className="relative overflow-x-clip py-8 md:py-12">
        <div className="container relative z-10 mx-auto px-4">
          <Link
            to={account.authenticated ? '/home' : '/groups'}
            className="mb-6 inline-flex items-center gap-2 text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            {account.authenticated ? 'My Groups' : 'All Groups'}
          </Link>

          {/* §13.12 identity strip: who this is, what kind of group, and how the
              viewer relates to it. No photo, no dues, no founding date — those
              live in Settings. */}
          {!hideBanner && (
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <IdentityStrip
                name={community.name}
                initials={community.image}
                type={formatType(community.type)}
                chip={<MembershipChip membership={membership} />}
                extra={<SaccoComplianceBadge type={community.type} status={community.saccoLicenseStatus} />}
              />
              {!membership.isMember && !membership.isLoading && !hideJoinCta && (
                <Link to={`/join/${community.id}`} className="btn-wipe hidden shrink-0 md:inline-flex">
                  Join This Group
                </Link>
              )}
            </div>
          )}

          <TreasuryCircuitBreakerBanner frozen={frozen} />

          {membership.isMember && membership.source !== 'api' && (
            <div className="baraza-row mb-6 rounded-lg p-3 text-xs text-muted-foreground">
              Showing a locally cached membership. Officer tools stay hidden until Baraza confirms your role.
            </div>
          )}

          {/* §13.8: a visitor reads the group and always has one way in, in thumb
              reach, above the visitor nav. Desktop keeps the sidebar CTA. */}
          {!membership.isMember && !membership.isLoading && (
            <div className="fixed inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-30 pl-4 pr-[4.25rem] md:hidden">
              <Link
                to={`/join/${community.id}`}
                className="btn-wipe w-full justify-center shadow-[var(--shadow-deep)]"
              >
                Join This Group
              </Link>
            </div>
          )}

          <div className="flex gap-6">
            {!inAppShell && (
              <aside className="hidden w-52 flex-shrink-0 lg:block">
                <div className="baraza-card sticky top-24 rounded-xl p-3">
                  <GroupSidebarNav communityId={community.id} isMember={membership.isMember} isOfficer={membership.isOfficer} />
                </div>
              </aside>
            )}

            <main className="min-w-0 flex-1">
              {title && (
                <header className="mb-5">
                  <h2 className="font-display text-2xl font-bold">{title}</h2>
                  {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
                </header>
              )}
              {children(ctx)}
            </main>
          </div>
        </div>
      </section>
    </Layout>
  );
}

const TYPE_LABELS: Record<string, string> = {
  savings: 'Savings chama',
  sacco: 'SACCO',
  cooperative: 'Cooperative',
  welfare: 'Welfare group',
  investment: 'Investment club',
  housing: 'Housing SACCO',
  professional: 'Professional network',
};

function formatType(type: string): string {
  return TYPE_LABELS[type] ?? type.replace(/[-_]/g, ' ').replace(/^./, (c) => c.toUpperCase());
}

/** The viewer's relationship to the group, as a status chip (§13.12). */
export function MembershipChip({ membership }: { membership: GroupMembership }) {
  if (membership.isLoading) return null;
  if (!membership.isMember) return <StatusChip kind="info" icon={null} label="Visitor" />;
  if (membership.isOfficer) return <StatusChip kind="confirmed" label="Officer" />;
  if (membership.status === 'pending') return <StatusChip kind="pending" label="Pending" />;
  if (membership.status === 'suspended' || membership.status === 'revoked') return <StatusChip kind="hold" label="On Hold" />;
  return <StatusChip kind="confirmed" label="Active" />;
}
