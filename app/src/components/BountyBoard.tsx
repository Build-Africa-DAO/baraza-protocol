import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, BriefcaseBusiness, CalendarDays, CheckCircle2,
  CircleDot, Clock, Columns3, ExternalLink, LayoutList, Lock,
  Megaphone, Send, ThumbsDown, ThumbsUp, Trophy, UserPlus,
  Wallet, Zap,
} from 'lucide-react';
import {
  getBountiesForCommunity, getBountiesForCommunityAsync,
  listBountySubmissions, submitBountyWork,
  updateBountyStatus, updateSubmissionStatus,
  type Bounty, type BountyStatus, type BountySubmission,
} from '@/lib/bounties';
import { formatKSh, cn } from '@/lib/utils';

interface BountyBoardProps {
  communityId: string;
  communityName?: string;
  compact?: boolean;
}

const STATUS_CONFIG: Record<BountyStatus, {
  label: string;
  columnLabel: string;
  emptyText: string;
  badgeClass: string;
  icon: React.ElementType;
}> = {
  open:        { label: 'Open',        columnLabel: 'To Do',       emptyText: 'No open tasks yet',                icon: CircleDot,    badgeClass: 'border-confirmed/40 bg-confirmed/10 text-confirmed' },
  in_progress: { label: 'In progress', columnLabel: 'In Progress', emptyText: 'Work in progress appears here',    icon: Zap,          badgeClass: 'border-primary/40 bg-primary/10 text-primary' },
  in_review:   { label: 'Under review', columnLabel: 'Under Review', emptyText: 'Submissions awaiting review',      icon: Clock,        badgeClass: 'border-accent/40 bg-accent/10 text-accent' },
  awarded:     { label: 'Awarded',     columnLabel: 'Done',        emptyText: 'Approved work lands here',         icon: CheckCircle2, badgeClass: 'border-secondary/40 bg-secondary/10 text-secondary' },
  paid:        { label: 'Approved',    columnLabel: 'Approved',    emptyText: 'Approved bounties land here',      icon: CheckCircle2, badgeClass: 'border-confirmed/50 bg-confirmed/15 text-confirmed' },
};

const KANBAN_COLUMNS: BountyStatus[] = ['open', 'in_progress', 'in_review', 'awarded', 'paid'];

function daysLeft(deadline: string) {
  const days = Math.ceil((new Date(`${deadline}T23:59:59`).getTime() - Date.now()) / 86400000);
  if (days < 0) return 'Closed';
  if (days === 0) return 'Due today';
  return `${days}d left`;
}

const INTEREST_KEY = 'baraza.bounty.interest.v1';

function readInterest(): Set<string> {
  try {
    const raw = localStorage.getItem(INTEREST_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch { return new Set(); }
}

function toggleInterest(bountyId: string): boolean {
  const set = readInterest();
  if (set.has(bountyId)) {
    set.delete(bountyId);
  } else {
    set.add(bountyId);
  }
  localStorage.setItem(INTEREST_KEY, JSON.stringify([...set]));
  return set.has(bountyId);
}

// ─── Compact card (board columns) ─────────────────────────────────────────────

function CompactCard({
  bounty,
  interested,
  onToggleInterest,
  onAdvanceStatus,
}: {
  bounty: Bounty;
  interested: boolean;
  onToggleInterest: (id: string) => void;
  onAdvanceStatus: (id: string, status: BountyStatus, assignee?: string) => void;
}) {
  const cfg = STATUS_CONFIG[bounty.status];
  const StatusIcon = cfg.icon;

  return (
    <article className="rounded-xl border border-border/70 bg-card/70 p-3.5 transition-colors hover:border-primary/40">
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider', cfg.badgeClass)}>
          <StatusIcon className="h-2.5 w-2.5" />
          {cfg.label}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{bounty.category}</span>
        {bounty.roleGated && (
          <span className="inline-flex items-center gap-1 rounded-full border border-border/60 px-2 py-0.5 text-[10px] text-muted-foreground">
            <Lock className="h-2.5 w-2.5" /> Members only
          </span>
        )}
      </div>

      <Link to={`/bounties/${bounty.id}`} className="block text-sm font-bold leading-snug text-foreground transition-colors hover:text-primary">
        {bounty.title}
      </Link>

      {bounty.assignee && (
        <p className="mt-1 text-[11px] text-muted-foreground">Assigned to {bounty.assignee}</p>
      )}

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 rounded-full border border-border/60 px-2 py-1 text-[11px] text-muted-foreground">
          <CalendarDays className="h-3 w-3" />
          {daysLeft(bounty.deadline)}
        </span>
        <span className="font-bold text-sm text-accent">{formatKSh(bounty.rewardKes)}</span>
      </div>

      <div className="mt-2.5 flex gap-2">
        {bounty.status === 'open' && (
          <button
            type="button"
            onClick={() => onToggleInterest(bounty.id)}
            className={cn(
              'flex-1 rounded-lg border px-2 py-1.5 text-xs font-bold transition-all',
              interested
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border/60 bg-surface/60 text-muted-foreground hover:border-primary/50 hover:text-foreground',
            )}
          >
            {interested ? 'Interested' : "I'm interested"}
          </button>
        )}

        {bounty.status === 'in_progress' && (
          <button
            type="button"
            onClick={() => onAdvanceStatus(bounty.id, 'in_review')}
            className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-border/60 bg-surface/60 px-2 py-1.5 text-xs font-bold text-muted-foreground hover:border-accent/50 hover:text-accent transition-all"
          >
            <Send className="h-3 w-3" /> Submit
          </button>
        )}

        {bounty.status === 'in_review' && (
          <ReviewActions bounty={bounty} onAdvanceStatus={onAdvanceStatus} compact />
        )}

        {bounty.status === 'awarded' && (
          <button
            type="button"
            onClick={() => onAdvanceStatus(bounty.id, 'paid')}
            className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-secondary/40 bg-secondary/10 px-2 py-1.5 text-xs font-bold text-secondary hover:bg-secondary/20 transition-all"
          >
            <Wallet className="h-3 w-3" /> Approve
          </button>
        )}

        {bounty.status === 'paid' && (
          <button
            type="button"
            onClick={() => onAdvanceStatus(bounty.id, 'in_review')}
            className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-confirmed/30 bg-confirmed/5 px-2 py-1.5 text-[11px] font-semibold text-confirmed hover:border-accent/50 hover:text-accent transition-all"
          >
            <CheckCircle2 className="h-3 w-3" /> Reopen review
          </button>
        )}
      </div>
    </article>
  );
}

// ─── Review actions (shared between compact + full) ────────────────────────────

function ReviewActions({
  bounty,
  onAdvanceStatus,
  compact = false,
}: {
  bounty: Bounty;
  onAdvanceStatus: (id: string, status: BountyStatus, assignee?: string) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const submissions = open ? listBountySubmissions(bounty.id) : [];

  return (
    <div className={cn('flex flex-col gap-2', compact ? 'flex-1' : 'w-full')}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex items-center justify-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-bold transition-all',
          open
            ? 'border-accent bg-accent/10 text-accent'
            : 'border-border/60 bg-surface/60 text-muted-foreground hover:border-accent/50 hover:text-foreground',
          !compact && 'w-full py-2',
        )}
      >
        <Clock className="h-3 w-3" />
        Review ({bounty.submissions})
      </button>

      {open && (
        <div className="grid gap-2 rounded-xl border border-border/60 bg-surface/40 p-3">
          {submissions.length === 0 ? (
            <p className="text-center text-[11px] text-muted-foreground">No submissions recorded yet.</p>
          ) : (
            submissions.map((sub) => (
              <SubmissionRow
                key={sub.id}
                sub={sub}
                onApprove={() => {
                  updateSubmissionStatus(sub.id, 'approved');
                  onAdvanceStatus(bounty.id, 'awarded', sub.contributor);
                  setOpen(false);
                }}
                onRevise={() => {
                  updateSubmissionStatus(sub.id, 'rejected');
                  onAdvanceStatus(bounty.id, 'in_progress');
                  setOpen(false);
                }}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function SubmissionRow({
  sub,
  onApprove,
  onRevise,
}: {
  sub: BountySubmission;
  onApprove: () => void;
  onRevise: () => void;
}) {
  return (
    <div className="rounded-lg border border-border/50 bg-background/50 p-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-foreground">{sub.contributor}</p>
          <a
            href={sub.workUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-primary underline-offset-2 hover:underline"
          >
            View work <ExternalLink className="h-2.5 w-2.5" />
          </a>
          {sub.note && <p className="mt-1 text-[11px] text-muted-foreground">{sub.note}</p>}
        </div>

        {(!sub.status || sub.status === 'pending') ? (
          <div className="flex shrink-0 gap-1.5">
            <button
              type="button"
              onClick={onApprove}
              className="flex items-center gap-1 rounded-lg border border-confirmed/40 bg-confirmed/10 px-2 py-1 text-[11px] font-bold text-confirmed"
            >
              <ThumbsUp className="h-3 w-3" /> Approve
            </button>
            <button
              type="button"
              onClick={onRevise}
              className="flex items-center gap-1 rounded-lg border border-border/60 bg-surface/60 px-2 py-1 text-[11px] font-bold text-muted-foreground hover:border-primary/50"
            >
              <ThumbsDown className="h-3 w-3" /> Revise
            </button>
          </div>
        ) : (
          <span className={cn(
            'shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
            sub.status === 'approved'
              ? 'border-confirmed/40 bg-confirmed/10 text-confirmed'
              : 'border-border/60 bg-surface/60 text-muted-foreground',
          )}>
            {sub.status === 'approved' ? 'Approved' : 'Revision'}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Full card (list view) ─────────────────────────────────────────────────────

function FullCard({
  bounty,
  interested,
  onToggleInterest,
  onAdvanceStatus,
}: {
  bounty: Bounty;
  interested: boolean;
  onToggleInterest: (id: string) => void;
  onAdvanceStatus: (id: string, status: BountyStatus, assignee?: string) => void;
}) {
  const cfg = STATUS_CONFIG[bounty.status];
  const StatusIcon = cfg.icon;
  const [showSubmit, setShowSubmit] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [workForm, setWorkForm] = useState({ contributor: '', workUrl: '', note: '' });
  const [assigneeName, setAssigneeName] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  const handleSubmitWork = () => {
    try {
      submitBountyWork({ bountyId: bounty.id, ...workForm });
      onAdvanceStatus(bounty.id, 'in_review', workForm.contributor.trim());
      setWorkForm({ contributor: '', workUrl: '', note: '' });
      setShowSubmit(false);
      setMsg('Work submitted for review.');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Submission failed.');
    }
  };

  const handleAssign = () => {
    const name = assigneeName.trim();
    if (!name) { setMsg('Enter a name to assign.'); return; }
    onAdvanceStatus(bounty.id, 'in_progress', name);
    setAssigneeName('');
    setShowAssign(false);
  };

  return (
    <article className="rounded-xl border border-border/70 bg-card/70 p-4 transition-colors hover:border-primary/40">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider', cfg.badgeClass)}>
              <StatusIcon className="h-2.5 w-2.5" /> {cfg.label}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{bounty.category}</span>
            {bounty.roleGated && (
              <span className="inline-flex items-center gap-1 rounded-full border border-border/60 px-2 py-0.5 text-[10px] text-muted-foreground">
                <Lock className="h-2.5 w-2.5" /> Members only
              </span>
            )}
          </div>
          <h4 className="font-display text-sm font-bold text-foreground leading-snug">{bounty.title}</h4>
          <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{bounty.summary}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-display text-base font-bold text-accent">{formatKSh(bounty.rewardKes)}</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            {bounty.submissions} {bounty.submissions === 1 ? 'applicant' : 'applicants'}
          </p>
        </div>
      </div>

      {bounty.assignee && (
        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-1 text-[11px] text-foreground/80">
          <UserPlus className="h-3 w-3 text-primary" /> {bounty.assignee}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
        <span className="inline-flex items-center gap-1 rounded-full border border-border/60 px-2 py-1 text-muted-foreground">
          <CalendarDays className="h-3 w-3" /> {daysLeft(bounty.deadline)}
        </span>
        {bounty.skills.slice(0, 3).map((skill) => (
          <span key={skill} className="rounded-full border border-border/50 px-2 py-1 text-muted-foreground">{skill}</span>
        ))}
      </div>

      {/* Status actions */}
      <div className="mt-3 flex flex-wrap gap-2">
        {bounty.status === 'open' && (
          <>
            <button
              type="button"
              onClick={() => onToggleInterest(bounty.id)}
              className={cn(
                'rounded-lg border px-3 py-2 text-xs font-bold transition-all',
                interested ? 'border-primary bg-primary/10 text-primary' : 'border-border/60 bg-surface/60 text-muted-foreground hover:border-primary/50 hover:text-foreground',
              )}
            >
              {interested ? 'Interested' : "I'm interested"}
            </button>
            <button
              type="button"
              onClick={() => { setShowAssign((v) => !v); setMsg(null); }}
              className="flex items-center gap-1 rounded-lg border border-border/60 bg-surface/60 px-3 py-2 text-xs font-bold text-muted-foreground hover:border-primary/50 hover:text-foreground transition-all"
            >
              <UserPlus className="h-3 w-3" /> Assign
            </button>
            <Link to={`/bounties/${bounty.id}`} className="flex items-center gap-1 rounded-lg border border-border/60 bg-surface/60 px-3 py-2 text-xs font-bold text-muted-foreground hover:border-primary/50 hover:text-foreground transition-all">
              Details <ArrowRight className="h-3 w-3" />
            </Link>
          </>
        )}

        {bounty.status === 'in_progress' && (
          <button
            type="button"
            onClick={() => { setShowSubmit((v) => !v); setMsg(null); }}
            className={cn(
              'flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition-all',
              showSubmit ? 'border-primary bg-primary/10 text-primary' : 'border-border/60 bg-surface/60 text-muted-foreground hover:border-primary/50 hover:text-foreground',
            )}
          >
            <Send className="h-3 w-3" /> Submit work
          </button>
        )}

        {bounty.status === 'in_review' && (
          <ReviewActions bounty={bounty} onAdvanceStatus={onAdvanceStatus} />
        )}

        {bounty.status === 'awarded' && (
          <button
            type="button"
            onClick={() => onAdvanceStatus(bounty.id, 'paid')}
            className="flex items-center gap-1.5 rounded-lg border border-secondary/40 bg-secondary/10 px-3 py-2 text-xs font-bold text-secondary hover:bg-secondary/20 transition-all"
          >
            <Wallet className="h-3 w-3" /> Mark approved
          </button>
        )}

        {bounty.status === 'paid' && (
          <>
            <span className="flex items-center gap-1.5 rounded-lg border border-confirmed/30 bg-confirmed/5 px-3 py-2 text-[11px] font-semibold text-confirmed">
              <CheckCircle2 className="h-3 w-3" /> Approved
            </span>
            <button
              type="button"
              onClick={() => onAdvanceStatus(bounty.id, 'in_review')}
              className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-surface/60 px-3 py-2 text-xs font-bold text-muted-foreground hover:border-accent/50 hover:text-accent transition-all"
            >
              <Clock className="h-3 w-3" /> Reopen for review
            </button>
          </>
        )}
      </div>

      {/* Assign form */}
      {showAssign && (
        <div className="mt-2 flex gap-2">
          <input
            value={assigneeName}
            onChange={(e) => setAssigneeName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAssign()}
            placeholder="Assignee name or address"
            className="flex-1 rounded-lg border border-border/60 bg-surface/60 px-3 py-1.5 text-xs outline-none focus:border-primary/50"
          />
          <button type="button" onClick={handleAssign} className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
            Start
          </button>
        </div>
      )}

      {/* Submit work form */}
      {showSubmit && (
        <div className="mt-2 grid gap-2 rounded-xl border border-border/60 bg-surface/40 p-3">
          <input value={workForm.contributor} onChange={(e) => setWorkForm((f) => ({ ...f, contributor: e.target.value }))} placeholder="Your name" className="rounded-lg border border-border/60 bg-background/60 px-3 py-1.5 text-xs outline-none focus:border-primary/50" />
          <input value={workForm.workUrl} onChange={(e) => setWorkForm((f) => ({ ...f, workUrl: e.target.value }))} placeholder="Link to your work" className="rounded-lg border border-border/60 bg-background/60 px-3 py-1.5 text-xs outline-none focus:border-primary/50" />
          <textarea value={workForm.note} onChange={(e) => setWorkForm((f) => ({ ...f, note: e.target.value }))} placeholder="Note to reviewer (optional)" rows={2} className="rounded-lg border border-border/60 bg-background/60 px-3 py-1.5 text-xs leading-5 outline-none focus:border-primary/50 resize-none" />
          <button type="button" onClick={handleSubmitWork} className="flex items-center justify-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
            <Send className="h-3 w-3" /> Submit for review
          </button>
        </div>
      )}

      {msg && <p className="mt-2 text-[11px] text-muted-foreground">{msg}</p>}
    </article>
  );
}

// ─── Kanban column ─────────────────────────────────────────────────────────────

function KanbanColumn({
  status, bounties, interested, onToggleInterest, onAdvanceStatus,
}: {
  status: BountyStatus;
  bounties: Bounty[];
  interested: Set<string>;
  onToggleInterest: (id: string) => void;
  onAdvanceStatus: (id: string, status: BountyStatus, assignee?: string) => void;
}) {
  const cfg = STATUS_CONFIG[status];
  const ColIcon = cfg.icon;

  return (
    <div className="flex min-w-[220px] flex-1 flex-col gap-2">
      <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-surface/60 px-3 py-2">
        <ColIcon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-bold text-foreground">{cfg.columnLabel}</span>
        <span className="ml-auto rounded-full bg-surface px-2 py-0.5 text-[10px] font-bold text-muted-foreground">{bounties.length}</span>
      </div>

      <div className="flex flex-col gap-2">
        {bounties.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/40 p-6 text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full border border-border/50 bg-surface/60">
              <ColIcon className="h-5 w-5 text-muted-foreground/50" />
            </div>
            <p className="text-[11px] text-muted-foreground/60">{cfg.emptyText}</p>
          </div>
        ) : bounties.map((bounty) => (
          <CompactCard
            key={bounty.id}
            bounty={bounty}
            interested={interested.has(bounty.id)}
            onToggleInterest={onToggleInterest}
            onAdvanceStatus={onAdvanceStatus}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main BountyBoard ─────────────────────────────────────────────────────────

type ViewMode = 'list' | 'board';

export default function BountyBoard({ communityId, communityName = 'this community', compact = false }: BountyBoardProps) {
  const [bounties, setBounties] = useState(() => getBountiesForCommunity(communityId));
  const [view, setView] = useState<ViewMode>('board');
  const [interested, setInterested] = useState<Set<string>>(readInterest);

  useEffect(() => {
    let cancelled = false;
    getBountiesForCommunityAsync(communityId)
      .then((next) => { if (!cancelled) setBounties(next); })
      .catch(() => { if (!cancelled) setBounties(getBountiesForCommunity(communityId)); });
    return () => { cancelled = true; };
  }, [communityId]);

  const handleToggleInterest = (id: string) => {
    toggleInterest(id);
    setInterested(readInterest());
  };

  const handleAdvanceStatus = (id: string, status: BountyStatus, assignee?: string) => {
    updateBountyStatus(id, status, assignee);
    setBounties(getBountiesForCommunity(communityId));
    void getBountiesForCommunityAsync(communityId).then(setBounties).catch(() => {});
  };

  const openCount = bounties.filter((b) => b.status === 'open').length;
  const rewardPool = bounties.filter((b) => b.status === 'open').reduce((sum, b) => sum + b.rewardKes, 0);
  const shown = compact ? bounties.slice(0, 2) : bounties;
  const byStatus = KANBAN_COLUMNS.reduce<Record<BountyStatus, Bounty[]>>((acc, s) => {
    acc[s] = bounties.filter((b) => b.status === s);
    return acc;
  }, {} as Record<BountyStatus, Bounty[]>);

  if (bounties.length === 0) {
    return (
      <div className="baraza-card p-6 text-center">
        <BriefcaseBusiness className="mx-auto mb-3 h-7 w-7" />
        <p className="font-display text-base font-semibold">No bounties yet</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Bounty announcements will appear here when {communityName} posts paid work.
        </p>
      </div>
    );
  }

  return (
    <section className="baraza-card p-5">
      {/* Header */}
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
            <Megaphone className="h-3.5 w-3.5 text-primary" />
            Bounty board
          </div>
          <h3 className="font-display text-lg font-semibold">Paid work from {communityName}</h3>
          <p className="mt-1 text-sm text-muted-foreground">Open tasks, events, integrations, and contributor opportunities.</p>
        </div>

        <div className="flex items-start gap-3">
          <div className="grid grid-cols-2 gap-2 text-right">
            <div className="rounded-lg border p-3">
              <p className="font-display text-xl font-bold">{openCount}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Open</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="font-display text-xl font-bold text-accent">{formatKSh(rewardPool)}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Rewards</p>
            </div>
          </div>

          {!compact && (
            <div className="flex rounded-lg border border-border/60 p-0.5">
              {([['list', LayoutList, 'List'], ['board', Columns3, 'Board']] as const).map(([v, Icon, label]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-all',
                    view === v ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground',
                  )}
                  title={`${label} view`}
                >
                  <Icon className="h-3.5 w-3.5" /> {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Board view */}
      {!compact && view === 'board' && (
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-3 min-w-max">
            {KANBAN_COLUMNS.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                bounties={byStatus[status]}
                interested={interested}
                onToggleInterest={handleToggleInterest}
                onAdvanceStatus={handleAdvanceStatus}
              />
            ))}
          </div>
        </div>
      )}

      {/* List view */}
      {(compact || view === 'list') && (
        <div className={cn('grid gap-3', !compact && 'lg:grid-cols-2')}>
          {shown.map((bounty) => (
            <FullCard
              key={bounty.id}
              bounty={bounty}
              interested={interested.has(bounty.id)}
              onToggleInterest={handleToggleInterest}
              onAdvanceStatus={handleAdvanceStatus}
            />
          ))}
        </div>
      )}

      {compact && bounties.length > shown.length && (
        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <Trophy className="h-3.5 w-3.5 text-secondary" />
          {bounties.length - shown.length} more bounties in the Bounties tab.
        </div>
      )}
    </section>
  );
}
