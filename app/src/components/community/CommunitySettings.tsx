import { useState } from 'react';
import { Coins, ExternalLink, Info, Lock, Phone, Settings, ShieldCheck, Smartphone } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Community } from '@/lib/constants';
import { PAYBILL_ADDON_FEE_KES, USSD_ADDON_FEE_KES } from '@/lib/constants';
import { formatKSh, formatRailDate } from '@/lib/utils';
import { useChain } from '@/hooks/useChain';
import { useTreasuryApprovals } from '@/hooks/useTreasuryApprovals';
import { CHAINS } from '@/lib/chain';

interface Props {
  community: Community;
  isMember: boolean;
}

export default function CommunitySettings({ community, isMember }: Props) {
  const [copied, setCopied] = useState(false);
  const { chain, chainMeta } = useChain();
  const accountMeta = CHAINS[community.chain ?? chain] ?? chainMeta;
  const approvals = useTreasuryApprovals(community);

  const copyId = () => {
    navigator.clipboard.writeText(community.id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }).catch(() => {});
  };

  return (
    <div className="space-y-4">
      {/* Community identity */}
      <div className="baraza-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-display text-base font-semibold">Community identity</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ['Name', community.name],
            ['Type', community.type],
            ['Founded', formatRailDate(community.createdAt, chainMeta, { month: 'long', year: 'numeric' })],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-border/50 p-3">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
              <p className="mt-1 font-semibold capitalize">{value}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-lg border border-border/50 p-3">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Community ID</p>
          <div className="flex items-center justify-between gap-3">
            <p className="font-mono text-sm text-muted-foreground">{community.id}</p>
            <button
              type="button"
              onClick={copyId}
              className="shrink-0 rounded border border-border/60 px-2 py-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-all"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      </div>

      {/* Decision rules */}
      <div className="baraza-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <h3 className="font-display text-base font-semibold">How member decisions work</h3>
          <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-border/50 px-2 py-0.5 text-[10px] text-muted-foreground">
            <Lock className="h-2.5 w-2.5" />
            Locked rules
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Members needed', `${community.quorumPct ?? 51}%`, 'Minimum participation'],
            ['Yes votes needed', `${community.approvalThresholdPct ?? 66}%`, 'Approval level'],
            ['Time to vote', `${community.votingPeriodDays ?? 7} days`, 'Member review window'],
          ].map(([label, value, note]) => (
            <div key={label} className="rounded-lg border border-border/50 p-3">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
              <p className="mt-1 font-semibold capitalize">{value}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground/70">{note}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Info className="h-3 w-3 shrink-0" />
          These rules are locked after community creation. Members must approve a proposal to change them.
        </p>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Withdrawal safety</p>
            <h3 className="mt-1 font-display text-xl font-semibold">Who can approve group withdrawals</h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              {approvals?.requiredApprovals ?? 2} named officers must agree before an eligible withdrawal can move forward.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
            <Lock className="h-3 w-3" /> Withdrawals paused
          </span>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {approvals?.approvers.map((approver) => (
            <div key={approver.role} className="rounded-xl border border-border/60 p-4">
              <p className="font-semibold">{approver.role}</p>
              <p className="mt-1 text-xs text-muted-foreground">{approver.status === 'ready' ? 'Ready to review' : 'Invitation pending'}</p>
            </div>
          ))}
        </div>
        <Link to={`/dashboard/${community.id}/treasury`} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
          View withdrawal approvals <ExternalLink className="h-3.5 w-3.5" />
        </Link>
        <details className="mt-5 rounded-lg bg-muted/35 p-4 text-sm">
          <summary className="cursor-pointer font-semibold">Account setup and troubleshooting</summary>
          <p className="mt-3 text-muted-foreground">Administrators can use the {accountMeta.label} account details when checking setup. Members do not need this information for normal group decisions.</p>
        </details>
      </div>

      {/* Membership */}
      <div className="baraza-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="font-display text-base font-semibold">Membership</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ['Monthly contribution', formatKSh(community.membershipFee), 'Per active member'],
            ['Total members', community.memberCount.toString(), 'Active membership records'],
            ['Your status', isMember ? 'Active member' : 'Not a member', isMember ? 'Account verified' : 'Join to activate'],
          ].map(([label, value, note]) => (
            <div key={label} className="rounded-lg border border-border/50 p-3">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
              <p className="mt-1 font-semibold">{value}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground/70">{note}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Payment channels */}
      <div className="baraza-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-display text-base font-semibold">Payment channels</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {/* Paybill */}
          <div className={`rounded-lg border p-4 ${community.paybillNumber ? 'border-primary/30 bg-primary/5' : 'border-border/50'}`}>
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <div className={`grid h-7 w-7 place-items-center rounded-md ${community.paybillNumber ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  <Phone className="h-3.5 w-3.5" />
                </div>
                <p className="text-sm font-semibold">M-Pesa Paybill</p>
              </div>
              {community.paybillNumber ? (
                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">Active</span>
              ) : (
                <span className="rounded-full border border-border/50 px-2 py-0.5 text-[10px] text-muted-foreground">Not set</span>
              )}
            </div>
            {community.paybillNumber ? (
              <p className="font-mono text-base font-bold">{community.paybillNumber}</p>
            ) : (
              <>
                <p className="text-[11px] text-muted-foreground leading-5 mb-3">
                  Dedicated Paybill so members pay dues without sharing personal numbers.
                </p>
                <Link
                  to="/create"
                  className="inline-flex items-center gap-1 rounded border border-primary/40 bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary"
                >
                  Add for {formatKSh(PAYBILL_ADDON_FEE_KES)}
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </>
            )}
          </div>

          {/* USSD */}
          <div className={`rounded-lg border p-4 ${community.ussdShortcode ? 'border-primary/30 bg-primary/5' : 'border-border/50'}`}>
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <div className={`grid h-7 w-7 place-items-center rounded-md ${community.ussdShortcode ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  <Smartphone className="h-3.5 w-3.5" />
                </div>
                <p className="text-sm font-semibold">USSD shortcode</p>
              </div>
              {community.ussdShortcode ? (
                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">Active</span>
              ) : (
                <span className="rounded-full border border-border/50 px-2 py-0.5 text-[10px] text-muted-foreground">Not set</span>
              )}
            </div>
            {community.ussdShortcode ? (
              <p className="font-mono text-base font-bold">{community.ussdShortcode}</p>
            ) : (
              <>
                <p className="text-[11px] text-muted-foreground leading-5 mb-3">
                  *XXX# shortcode so feature-phone members can pay and vote without a smartphone.
                </p>
                <Link
                  to="/create"
                  className="inline-flex items-center gap-1 rounded border border-primary/40 bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary"
                >
                  Add for {formatKSh(USSD_ADDON_FEE_KES)}
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Admin actions */}
      <div className="baraza-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-display text-base font-semibold">Admin actions</h3>
          <span className="ml-auto text-[10px] uppercase tracking-widest text-muted-foreground">Admin only</span>
        </div>
        <div className="grid gap-2">
          {[
            { label: 'Transfer admin rights', note: 'Nominate a new admin account with two-step approval', disabled: true },
            { label: 'Update decision rules', note: 'Change participation, approval, or voting time through a member proposal', disabled: true },
            { label: 'Create community reward', note: 'Optional member recognition programme. Coming soon.', disabled: true, icon: Coins },
            { label: 'Manage group account', note: 'Review withdrawal approvers, requests, and payment history', disabled: false, href: `/dashboard/${community.id}/treasury` },
            { label: 'Export member list', note: 'Download a list of active members', disabled: true },
          ].map((action) => {
            const ActionIcon = action.icon;
            return (
            <div
              key={action.label}
              className="flex items-center justify-between rounded-lg border border-border/50 p-3"
            >
              <div className="flex min-w-0 items-start gap-2">
                {ActionIcon && <ActionIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />}
                <div>
                  <p className="text-sm font-semibold">{action.label}</p>
                  <p className="text-[11px] text-muted-foreground">{action.note}</p>
                </div>
              </div>
              {action.disabled ? (
                <span className="shrink-0 rounded border border-border/50 px-2 py-1 text-[10px] text-muted-foreground">
                  {action.label === 'Create community reward' ? 'Coming soon' : 'Locked'}
                </span>
              ) : (
                <Link
                  to={action.href!}
                  className="shrink-0 inline-flex items-center gap-1 rounded border border-primary/40 bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary"
                >
                  Open
                  <ExternalLink className="h-3 w-3" />
                </Link>
              )}
            </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
