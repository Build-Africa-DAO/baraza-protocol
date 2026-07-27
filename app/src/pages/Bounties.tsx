import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BriefcaseBusiness, Building2, CalendarDays, CheckCircle2, Clock, Columns3, LayoutGrid, List, PlusCircle, Search, Send, SlidersHorizontal, Trophy } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import Layout from '@/components/Layout';
import { useAccount } from '@/contexts/AccountContext';
import {
  createBountyRecordAsync,
  listBounties,
  listBountiesAsync,
  listBountySubmissionsAsync,
  submitBountyWorkAsync,
  updateBountyStatus,
  type BountySubmission,
  type BountyStatus,
} from '@/lib/bounties';
import { useCommunities } from '@/hooks/useCommunities';
import { formatKSh, cn } from '@/lib/utils';
import { useSeo } from '@/lib/seo';
import { bountyCreateAccessMessage, getBountyCreateAccess } from '@/lib/access';
import { useChain } from '@/hooks/useChain';
import { getActiveMembership } from '@/lib/memberships';
import { dataStore } from '@/lib/dataStore';
import { inferStage } from '@/lib/proposalStatus';

const STATUS_OPTIONS: { value: BountyStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All bounties' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'in_review', label: 'Under review' },
  { value: 'awarded', label: 'Awaiting payout' },
  { value: 'paid', label: 'Paid' },
];

const statusLabel: Record<BountyStatus, string> = {
  open: 'Open',
  in_progress: 'In progress',
  in_review: 'Under review',
  awarded: 'Awaiting payout',
  paid: 'Paid',
};

const statusClass: Record<BountyStatus, string> = {
  open: 'border-confirmed/40 bg-confirmed/10 text-confirmed',
  in_progress: 'border-primary/40 bg-primary/10 text-primary',
  in_review: 'border-accent/40 bg-accent/10 text-accent',
  awarded: 'border-secondary/40 bg-secondary/10 text-secondary',
  paid: 'border-confirmed/50 bg-confirmed/15 text-confirmed',
};

const BOARD_COLUMNS: BountyStatus[] = ['open', 'in_progress', 'in_review', 'awarded', 'paid'];
type ViewMode = 'board' | 'grid' | 'list';

const SECTION_COPY: Record<BountyStatus, { heading: string; detail: string }> = {
  open: {
    heading: 'Open bounties',
    detail: 'Paid work ready for members and contributors to pick up.',
  },
  in_progress: {
    heading: 'In progress',
    detail: 'Assigned work that is being prepared for community review.',
  },
  in_review: {
    heading: 'Under review',
    detail: 'Submitted work waiting for both the bounty creator and a community admin.',
  },
  awarded: {
    heading: 'Awaiting payout',
    detail: 'Creator and admin approved. The community multisig can now release payment.',
  },
  paid: {
    heading: 'Paid',
    detail: 'Stablecoin payouts confirmed on the public ledger.',
  },
};

function daysLeft(deadline: string) {
  const end = new Date(`${deadline}T23:59:59`).getTime();
  const days = Math.ceil((end - Date.now()) / 86400000);
  if (days < 0) return 'Closed';
  if (days === 0) return 'Due today';
  return `${days}d left`;
}

export default function Bounties() {
  useSeo({
    title: 'Bounty board',
    description: 'Find paid tasks, event work, integrations, and contributor opportunities across Baraza communities.',
    path: '/bounties',
  });

  const { communities } = useCommunities();
  const { chain } = useChain();
  const account = useAccount();
  const { publicKey, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<BountyStatus | 'all'>('all');
  const [communityFilter, setCommunityFilter] = useState('all');
  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [bounties, setBounties] = useState(() => listBounties());
  const [draggedBountyId, setDraggedBountyId] = useState<string | null>(null);
  const [dropStatus, setDropStatus] = useState<BountyStatus | null>(null);
  const [submissionCounts, setSubmissionCounts] = useState<Record<string, number>>({});
  const [showPostForm, setShowPostForm] = useState(false);
  const [submitFor, setSubmitFor] = useState<string | null>(null);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [newBounty, setNewBounty] = useState({
    communityId: '',
    title: '',
    category: 'General',
    rewardKes: '',
    deadline: '',
    summary: '',
    skills: '',
    approvalProposalId: '',
  });
  const [submission, setSubmission] = useState({
    contributor: '',
    workUrl: '',
    note: '',
  });
  const refreshBounties = async () => {
    const nextBounties = await listBountiesAsync();
    setBounties(nextBounties);
    const entries = await Promise.all(
      nextBounties.map(async (bounty): Promise<[string, BountySubmission[]]> => [
        bounty.id,
        await listBountySubmissionsAsync(bounty.id),
      ]),
    );
    setSubmissionCounts(Object.fromEntries(entries.map(([id, submissions]) => [id, submissions.length])));
  };

  useEffect(() => {
    void refreshBounties().catch((err) => {
      setFormMessage(err instanceof Error ? err.message : 'Could not load bounties.');
    });
  }, []);

  const communityById = useMemo(
    () => new Map(communities.map((community) => [community.id, community])),
    [communities],
  );
  const walletAddress = publicKey?.toBase58() ?? null;
  const selectedCommunity = communityById.get(newBounty.communityId);
  const passedProposals = useMemo(() => {
    if (!newBounty.communityId) return [];
    return dataStore.getDecisionsForCommunity(newBounty.communityId).filter((proposal) => {
      const stage = inferStage(proposal.status);
      return stage === 'succeeded' || stage === 'queued' || stage === 'executed';
    });
  }, [newBounty.communityId]);
  const approvedProposalId = passedProposals.some((proposal) => proposal.id === newBounty.approvalProposalId)
    ? newBounty.approvalProposalId
    : null;
  const selectedBountyAccess = useMemo(
    () => getBountyCreateAccess(newBounty.communityId || null, walletAddress, {
      communityAdminId: selectedCommunity?.createdBy,
      approvedProposalId,
    }),
    [approvedProposalId, newBounty.communityId, selectedCommunity?.createdBy, walletAddress],
  );
  const memberCommunities = useMemo(() => {
    if (!walletAddress) return [];
    return communities.filter((community) => {
      const isCommunityAdmin = community.createdBy === walletAddress;
      return (community.chain ?? 'solana') === chain
        && (isCommunityAdmin || !!getActiveMembership(community.id, walletAddress));
    });
  }, [chain, communities, walletAddress]);

  const filtered = bounties.filter((bounty) => {
    const community = communityById.get(bounty.communityId);
    const haystack = `${bounty.title} ${bounty.category} ${bounty.summary} ${bounty.skills.join(' ')} ${community?.name ?? ''}`.toLowerCase();
    const matchesSearch = haystack.includes(search.toLowerCase());
    const matchesStatus = status === 'all' || bounty.status === status;
    const matchesCommunity = communityFilter === 'all' || bounty.communityId === communityFilter;
    return matchesSearch && matchesStatus && matchesCommunity;
  });

  const activeChainBounties = bounties;

  const visibleColumns = BOARD_COLUMNS
    .map((columnStatus) => ({
      status: columnStatus,
      bounties: filtered.filter((bounty) => bounty.status === columnStatus),
    }))
    .filter((column) => status === 'all' || column.status === status || column.bounties.length > 0);

  const resultSections = (status === 'all' ? BOARD_COLUMNS : [status])
    .map((sectionStatus) => ({
      status: sectionStatus,
      bounties: filtered.filter((bounty) => bounty.status === sectionStatus),
    }))
    .filter((section) => section.bounties.length > 0);

  const openRewardPool = activeChainBounties
    .filter((bounty) => bounty.status === 'open')
    .reduce((sum, bounty) => sum + bounty.rewardKes, 0);
  const workflowTickerItems = useMemo(() => communities
    .map((community) => {
      const communityBounties = bounties.filter((bounty) => bounty.communityId === community.id);
      return {
        id: community.id,
        name: community.name,
        open: communityBounties.filter((bounty) => bounty.status === 'open').length,
        review: communityBounties.filter((bounty) => bounty.status === 'in_review').length,
        payout: communityBounties.filter((bounty) => bounty.status === 'awarded').length,
      };
    })
    .filter((item) => item.open + item.review + item.payout > 0), [bounties, communities]);

  const handlePostBountyClick = () => {
    if (!connected || !publicKey) {
      setVisible(true);
      return;
    }
    if (memberCommunities.length === 0) {
      setShowPostForm(false);
      setFormMessage('Join a community first. Only active members can post bounties.');
      return;
    }
    setShowPostForm((value) => !value);
    setFormMessage(null);
  };

  const handleCreateBounty = async () => {
    const community = communityById.get(newBounty.communityId);
    const access = selectedBountyAccess;
    if (!access.allowed) {
      setFormMessage(bountyCreateAccessMessage(access.reason));
      return;
    }
    try {
      await createBountyRecordAsync({
        communityId: newBounty.communityId,
        postedBy: community?.name ?? 'Baraza community',
        createdBy: walletAddress ?? account.accountId ?? undefined,
        approvalProposalId: access.isAdmin ? undefined : approvedProposalId ?? undefined,
        title: newBounty.title,
        category: newBounty.category,
        rewardKes: Number(newBounty.rewardKes),
        deadline: newBounty.deadline,
        summary: newBounty.summary,
        skills: newBounty.skills.split(','),
      });
      setNewBounty({
        communityId: '',
        title: '',
        category: 'General',
        rewardKes: '',
        deadline: '',
        summary: '',
        skills: '',
        approvalProposalId: '',
      });
      setShowPostForm(false);
      setFormMessage('Bounty posted to Baraza.');
      await refreshBounties();
    } catch (err) {
      setFormMessage(err instanceof Error ? err.message : 'Could not post bounty.');
    }
  };

  const handleSubmitWork = async (bountyId: string) => {
    try {
      await submitBountyWorkAsync({
        bountyId,
        contributor: submission.contributor,
        contributorWallet: walletAddress ?? account.walletAddress ?? undefined,
        workUrl: submission.workUrl,
        note: submission.note,
      });
      setSubmission({ contributor: '', workUrl: '', note: '' });
      setSubmitFor(null);
      setFormMessage('Submission recorded in Baraza.');
      await refreshBounties();
    } catch (err) {
      setFormMessage(err instanceof Error ? err.message : 'Could not submit work.');
    }
  };

  const handleDropBounty = (nextStatus: BountyStatus, bountyId?: string) => {
    const movedBountyId = bountyId || draggedBountyId;
    if (!movedBountyId) return;

    const current = bounties.find((bounty) => bounty.id === movedBountyId);
    setDraggedBountyId(null);
    setDropStatus(null);

    if (!current || current.status === nextStatus) return;

    if (nextStatus === 'awarded' || nextStatus === 'paid') {
      setFormMessage('Approve a submitted delivery to create a multisig payout. Paid is set only after settlement confirmation.');
      return;
    }

    const updated = updateBountyStatus(current.id, nextStatus, current.assignee);
    if (!updated) {
      setFormMessage('Could not move that bounty.');
      return;
    }

    setBounties(listBounties());
    setSubmitFor(null);
    setFormMessage(`${updated.title} moved to ${statusLabel[nextStatus]}.`);
  };

  return (
    <Layout>
      <section className="relative pt-24 pb-10 sm:pt-28">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mb-8 overflow-hidden rounded-lg border border-border/70 bg-card shadow-[var(--shadow-card)]">
            <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
              <div>
                <h1 className="font-display text-3xl font-black leading-tight">Bounty board</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Paid community work, dual review, and payout status in one shared workflow.
                </p>
                <p className="mt-2 text-xs font-semibold text-foreground">
                  {activeChainBounties.filter((bounty) => bounty.status === 'open').length} open · {formatKSh(openRewardPool)} available · {account.country.currency}
                </p>
              </div>
              <button
                type="button"
                onClick={handlePostBountyClick}
                className="btn-warm inline-flex w-full items-center justify-center gap-2 text-sm sm:w-auto"
              >
                <PlusCircle className="h-4 w-4" />
                Post bounty
              </button>
            </div>
            {workflowTickerItems.length > 0 && (
              <div className="bounty-ticker border-t border-border/70 bg-surface/45" aria-label="Community bounty activity">
                <div className="bounty-ticker-track">
                  {[...workflowTickerItems, ...workflowTickerItems].map((item, index) => (
                    <Link
                      key={`${item.id}-${index}`}
                      to={`/dashboard/${item.id}`}
                      className="inline-flex shrink-0 items-center gap-3 border-r border-border/70 px-5 py-3 text-xs transition-colors hover:bg-primary/10"
                      aria-hidden={index >= workflowTickerItems.length}
                      tabIndex={index >= workflowTickerItems.length ? -1 : 0}
                    >
                      <Building2 className="h-3.5 w-3.5 text-primary" />
                      <span className="font-bold text-foreground">{item.name}</span>
                      <span className="text-muted-foreground">{item.open} open</span>
                      <span className="text-muted-foreground">{item.review} review</span>
                      <span className="text-muted-foreground">{item.payout} payout</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {showPostForm && (
            <div className="baraza-card mb-6 p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold">Community</label>
                  <select
                    value={newBounty.communityId}
                    onChange={(event) => {
                      setNewBounty((current) => ({
                        ...current,
                        communityId: event.target.value,
                        approvalProposalId: '',
                      }));
                      setFormMessage(null);
                    }}
                    className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none"
                  >
                    <option value="">Select community</option>
                    {memberCommunities.map((community) => (
                      <option key={community.id} value={community.id}>{community.name}</option>
                    ))}
                  </select>
                  {memberCommunities.length === 0 && (
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Join a community before posting a bounty.
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold">Authorization</label>
                  {selectedBountyAccess.isAdmin ? (
                    <div className="flex min-h-11 items-center rounded-lg border border-confirmed/35 bg-confirmed/10 px-3 text-sm text-confirmed">
                      Community admin verified
                    </div>
                  ) : (
                    <select
                      value={newBounty.approvalProposalId}
                      onChange={(event) => {
                        setNewBounty((current) => ({ ...current, approvalProposalId: event.target.value }));
                        setFormMessage(null);
                      }}
                      disabled={!newBounty.communityId || passedProposals.length === 0}
                      className="min-h-11 w-full rounded-lg border px-3 py-2.5 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="">Select a passed proposal</option>
                      {passedProposals.map((proposal) => (
                        <option key={proposal.id} value={proposal.id}>{proposal.title}</option>
                      ))}
                    </select>
                  )}
                  {!selectedBountyAccess.isAdmin && newBounty.communityId && passedProposals.length === 0 && (
                    <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                      No passed proposal is available.{' '}
                      <Link to={`/dashboard/${newBounty.communityId}/decisions/create`} className="font-semibold text-primary hover:underline">
                        Submit a proposal
                      </Link>
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold">Title</label>
                  <input
                    value={newBounty.title}
                    onChange={(event) => setNewBounty((current) => ({ ...current, title: event.target.value }))}
                    className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none"
                    placeholder="e.g. Website landing page"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold">Category</label>
                  <input
                    value={newBounty.category}
                    onChange={(event) => setNewBounty((current) => ({ ...current, category: event.target.value }))}
                    className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none"
                    placeholder="Design, Dev, Events"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold">Reward ({account.country.currency})</label>
                  <input
                    value={newBounty.rewardKes}
                    onChange={(event) => setNewBounty((current) => ({ ...current, rewardKes: event.target.value }))}
                    type="number"
                    min="1"
                    className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none"
                    placeholder="25000"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold">Deadline</label>
                  <input
                    value={newBounty.deadline}
                    onChange={(event) => setNewBounty((current) => ({ ...current, deadline: event.target.value }))}
                    type="date"
                    className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold">Skills</label>
                  <input
                    value={newBounty.skills}
                    onChange={(event) => setNewBounty((current) => ({ ...current, skills: event.target.value }))}
                    className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none"
                    placeholder="React, Design, Research"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-2 block text-xs font-semibold">Brief</label>
                  <textarea
                    value={newBounty.summary}
                    onChange={(event) => setNewBounty((current) => ({ ...current, summary: event.target.value }))}
                    className="min-h-24 w-full rounded-lg border px-3 py-2.5 text-sm outline-none"
                    placeholder="Describe the work, deliverables, and review expectations."
                  />
                </div>
              </div>
              <div className="mt-4 rounded-lg border px-4 py-3 text-sm">
                {selectedBountyAccess.allowed ? (
                  <span>
                    {selectedBountyAccess.isAdmin
                      ? 'Community admin verified. This bounty can be published directly.'
                      : 'Passed proposal verified. Its ID will be attached to the bounty record.'}
                  </span>
                ) : (
                  <span>{bountyCreateAccessMessage(selectedBountyAccess.reason)}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => void handleCreateBounty()}
                disabled={!selectedBountyAccess.allowed}
                className="btn-primary mt-4 gap-2 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                <PlusCircle className="h-4 w-4" />
                Publish bounty
              </button>
            </div>
          )}

          {formMessage && (
            <div className="mb-6 rounded-lg border px-4 py-3 text-sm">
              {formMessage}
            </div>
          )}

          <div className="mb-6 grid gap-3 lg:grid-cols-[1fr_auto_auto_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search skills, communities, tasks..."
                className="w-full rounded-xl border bg-card px-4 py-3 pl-10 text-sm outline-none"
                aria-label="Search bounties"
              />
            </div>

            <div className="relative">
              <Building2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" />
              <select
                value={communityFilter}
                onChange={(event) => setCommunityFilter(event.target.value)}
                className="min-w-44 appearance-none rounded-xl border bg-card py-3 pl-10 pr-8 text-sm outline-none"
                aria-label="Filter bounties by community"
              >
                <option value="all">All communities</option>
                {communities.map((community) => (
                  <option key={community.id} value={community.id}>{community.name}</option>
                ))}
              </select>
            </div>

            <div className="relative">
              <SlidersHorizontal className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" />
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as BountyStatus | 'all')}
                className="min-w-40 appearance-none rounded-xl border bg-card py-3 pl-10 pr-8 text-sm outline-none"
                aria-label="Filter bounties by status"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div className="flex rounded-xl border bg-card p-1" aria-label="Bounty board view">
              {([
                ['board', Columns3, 'Board'],
                ['grid', LayoutGrid, 'Grid'],
                ['list', List, 'List'],
              ] as const).map(([mode, Icon, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-colors',
                    viewMode === mode
                      ? 'bg-primary/15 text-primary'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                  aria-pressed={viewMode === mode}
                  title={`${label} view`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {filtered.length > 0 && (
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-display text-xl font-bold">
                  {status === 'all' ? 'Workflow lanes' : SECTION_COPY[status].heading}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {status === 'all'
                    ? 'Track work from open task through creator and admin review to confirmed payout.'
                    : SECTION_COPY[status].detail}
                </p>
              </div>
              <span className="rounded-full border px-3 py-1 text-xs font-semibold text-muted-foreground">
                {filtered.length} {filtered.length === 1 ? 'bounty' : 'bounties'}
              </span>
            </div>
          )}

          {viewMode === 'board' && filtered.length > 0 && (
            <div className="overflow-x-auto pb-4">
              <div className="flex min-w-max gap-3">
                {visibleColumns.map((column) => {
                  const colBorderColor = {
                    open: 'border-t-confirmed',
                    in_progress: 'border-t-primary',
                    in_review: 'border-t-accent',
                    awarded: 'border-t-confirmed',
                    paid: 'border-t-confirmed',
                  }[column.status];

                  return (
                    <section
                      key={column.status}
                      onDragOver={(event) => {
                        event.preventDefault();
                        setDropStatus(column.status);
                      }}
                      onDragLeave={(event) => {
                        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                          setDropStatus(null);
                        }
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        handleDropBounty(column.status, event.dataTransfer.getData('text/plain'));
                      }}
                      className={cn(
                        'flex w-[min(18rem,80vw)] flex-col rounded-xl border-t-2 border border-border/60 bg-card/70 transition-colors',
                        colBorderColor,
                        dropStatus === column.status && draggedBountyId && 'border-primary/60 bg-primary/5',
                      )}
                    >
                      {/* Sticky column header */}
                      <div className="sticky top-0 z-10 flex items-center gap-2 rounded-t-[10px] border-b border-border/50 bg-card/95 px-3 py-2.5 backdrop-blur">
                        <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider', statusClass[column.status])}>
                          {statusLabel[column.status]}
                        </span>
                        <span className="ml-auto rounded-full bg-surface px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                          {column.bounties.length}
                        </span>
                      </div>

                      {/* Cards */}
                      <div className="flex flex-col gap-2.5 p-2.5">
                        {column.bounties.length === 0 ? (
                          <div className="rounded-lg border border-dashed border-border/40 p-6 text-center">
                            <p className="text-[11px] text-muted-foreground/60">
                              {column.status === 'awarded'
                                ? 'Work appears here after creator and admin approval.'
                                : `No ${statusLabel[column.status].toLowerCase()} bounties`}
                            </p>
                          </div>
                        ) : column.bounties.map((bounty) => {
                          const community = communityById.get(bounty.communityId);
                          const canSubmit = bounty.status === 'open' || bounty.status === 'in_progress';
                          return (
                            <article
                              key={bounty.id}
                              draggable
                              onDragStart={(event) => {
                                event.dataTransfer.effectAllowed = 'move';
                                event.dataTransfer.setData('text/plain', bounty.id);
                                setDraggedBountyId(bounty.id);
                              }}
                              onDragEnd={() => {
                                setDraggedBountyId(null);
                                setDropStatus(null);
                              }}
                              className={cn(
                                'cursor-grab rounded-lg border border-border/50 bg-background/60 p-3 transition-colors hover:border-primary/30 hover:bg-background/80 active:cursor-grabbing',
                                draggedBountyId === bounty.id && 'opacity-55 ring-2 ring-primary/35',
                              )}
                            >
                              {/* Badge row */}
                              <div className="mb-2 flex flex-wrap items-center gap-1.5">
                                <span className={cn('rounded-full border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider', statusClass[bounty.status])}>
                                  {statusLabel[bounty.status]}
                                </span>
                                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/70">
                                  {bounty.category}
                                </span>
                                <span className="ml-auto text-xs font-bold text-accent">{formatKSh(bounty.rewardKes)}</span>
                              </div>

                              {/* Title */}
                              <Link
                                to={`/bounties/${bounty.id}`}
                                className="block text-sm font-bold leading-snug text-foreground transition-colors hover:text-primary"
                              >
                                {bounty.title}
                              </Link>

                              {/* Summary */}
                              <p className="mt-1.5 line-clamp-2 text-[11px] leading-5 text-muted-foreground">
                                {bounty.summary}
                              </p>

                              {/* Skills */}
                              {bounty.skills.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {bounty.skills.slice(0, 3).map((skill) => (
                                    <span key={skill} className="rounded-full border border-border/50 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Meta footer */}
                              <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-border/40 pt-2.5 text-[11px] text-muted-foreground">
                                <Link to={`/dashboard/${bounty.communityId}`} className="truncate hover:text-primary">
                                  {community?.name ?? bounty.postedBy}
                                </Link>
                                <span className="shrink-0">{daysLeft(bounty.deadline)}</span>
                              </div>

                              {/* Status-specific CTA */}
                              <div className="mt-2">
                                {bounty.status === 'open' && (
                                  <Link
                                    to={`/bounties/${bounty.id}`}
                                    className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-confirmed/40 bg-confirmed/10 px-2 py-1.5 text-xs font-bold text-confirmed transition-colors hover:bg-confirmed/15"
                                  >
                                    Apply <ArrowRight className="h-3 w-3" />
                                  </Link>
                                )}
                                {bounty.status === 'in_progress' && (
                                  <button
                                    type="button"
                                    onClick={() => { setSubmitFor(submitFor === bounty.id ? null : bounty.id); setFormMessage(null); }}
                                    className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-2 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary/15"
                                  >
                                    <Send className="h-3 w-3" /> Send work update
                                  </button>
                                )}
                                {bounty.status === 'in_review' && (
                                  <Link to={`/dashboard/${bounty.communityId}`} className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-accent/30 bg-accent/5 px-2 py-1.5 text-xs font-semibold text-accent hover:bg-accent/10">
                                    <Clock className="h-3 w-3" /> Review in dashboard · {submissionCounts[bounty.id] ?? bounty.submissions}
                                  </Link>
                                )}
                                {(bounty.status === 'paid' || bounty.status === 'awarded') && (
                                  <span className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-confirmed/30 bg-confirmed/5 px-2 py-1.5 text-xs font-semibold text-confirmed">
                                    <CheckCircle2 className="h-3 w-3" /> {statusLabel[bounty.status]}
                                  </span>
                                )}
                              </div>

                              {/* Inline submit form for in-progress */}
                              {canSubmit && submitFor === bounty.id && (
                                <div className="mt-3 grid gap-2 rounded-lg border border-border/50 bg-surface/40 p-2.5">
                                  <input
                                    value={submission.contributor}
                                    onChange={(e) => setSubmission((c) => ({ ...c, contributor: e.target.value }))}
                                    className="rounded-md border border-border/50 bg-background/60 px-2.5 py-1.5 text-xs outline-none focus:border-primary/50"
                                    placeholder="Your name"
                                  />
                                  <input
                                    value={submission.workUrl}
                                    onChange={(e) => setSubmission((c) => ({ ...c, workUrl: e.target.value }))}
                                    className="rounded-md border border-border/50 bg-background/60 px-2.5 py-1.5 text-xs outline-none focus:border-primary/50"
                                    placeholder="Link to work"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => void handleSubmitWork(bounty.id)}
                                    className="flex items-center justify-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-2 py-1.5 text-xs font-bold text-primary"
                                  >
                                    <Send className="h-3 w-3" /> Submit
                                  </button>
                                </div>
                              )}
                            </article>
                          );
                        })}
                      </div>
                    </section>
                  );
                })}
              </div>
            </div>
          )}

          {viewMode === 'list' && filtered.length > 0 && (
            <div className="space-y-5">
              {resultSections.map((section) => (
                <section key={section.status} className="overflow-hidden rounded-xl border bg-card">
                  <div className="flex flex-col gap-1 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-display text-base font-bold">{SECTION_COPY[section.status].heading}</h3>
                      <p className="text-xs text-muted-foreground">{SECTION_COPY[section.status].detail}</p>
                    </div>
                    <span className={cn('w-fit rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider', statusClass[section.status])}>
                      {section.bounties.length} {section.bounties.length === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                  <div className="hidden grid-cols-[1.3fr_0.8fr_0.5fr_0.55fr_0.65fr] gap-4 border-b px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground md:grid">
                    <span>Bounty</span>
                    <span>Group</span>
                    <span>Status</span>
                    <span>Deadline</span>
                    <span className="text-right">Reward</span>
                  </div>
                  <div className="divide-y">
                    {section.bounties.map((bounty) => {
                      const community = communityById.get(bounty.communityId);
                      return (
                        <article key={bounty.id} className="grid gap-3 px-4 py-4 md:grid-cols-[1.3fr_0.8fr_0.5fr_0.55fr_0.65fr] md:items-center md:gap-4">
                          <div className="min-w-0">
                            <Link to={`/bounties/${bounty.id}`} className="font-display text-sm font-bold hover:text-primary">
                              {bounty.title}
                            </Link>
                            <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{bounty.summary}</p>
                          </div>
                          <span className="text-xs text-muted-foreground">{community?.name ?? bounty.postedBy}</span>
                          <span className={cn('w-fit rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider', statusClass[bounty.status])}>
                            {statusLabel[bounty.status]}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {daysLeft(bounty.deadline)}
                          </span>
                          <div className="flex items-center justify-between gap-3 md:justify-end">
                            <span className="font-display text-sm font-bold text-accent">{formatKSh(bounty.rewardKes)}</span>
                            <Link to={`/bounties/${bounty.id}`} className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline">
                              Open
                              <ArrowRight className="h-3 w-3" />
                            </Link>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}

          {viewMode === 'grid' && (
          <div className="space-y-6">
            {resultSections.map((section) => (
              <section key={section.status}>
                <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-display text-base font-bold">{SECTION_COPY[section.status].heading}</h3>
                    <p className="text-xs text-muted-foreground">{SECTION_COPY[section.status].detail}</p>
                  </div>
                  <span className={cn('w-fit rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider', statusClass[section.status])}>
                    {section.bounties.length} {section.bounties.length === 1 ? 'item' : 'items'}
                  </span>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
            {section.bounties.map((bounty) => {
              const community = communityById.get(bounty.communityId);
              const canSendWorkUpdate = bounty.status === 'open' || bounty.status === 'in_progress';
              return (
                <article key={bounty.id} className="baraza-card p-5">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider', statusClass[bounty.status])}>
                          {statusLabel[bounty.status]}
                        </span>
                        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{bounty.category}</span>
                      </div>
                      <Link
                        to={`/bounties/${bounty.id}`}
                        className="font-display text-xl font-bold transition-colors hover:text-primary"
                      >
                        {bounty.title}
                      </Link>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{bounty.summary}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-display text-xl font-bold text-accent">{formatKSh(bounty.rewardKes)}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">{bounty.submissions} submissions</p>
                    </div>
                  </div>

                  <div className="mb-4 flex flex-wrap gap-2">
                    {bounty.skills.map((skill) => (
                      <span key={skill} className="rounded-full border px-2 py-1 text-[11px] text-muted-foreground">{skill}</span>
                    ))}
                  </div>

                  <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <BriefcaseBusiness className="h-3.5 w-3.5" />
                        {community?.name ?? bounty.postedBy}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {daysLeft(bounty.deadline)}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Link to={`/bounties/${bounty.id}`} className="btn-ghost justify-center gap-2 px-3 py-2 text-xs font-bold">
                        Open bounty
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                      <Link to={`/dashboard/${bounty.communityId}`} className="btn-ghost justify-center gap-2 px-3 py-2 text-xs font-bold">
                        Open group
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                      {canSendWorkUpdate ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSubmitFor(submitFor === bounty.id ? null : bounty.id);
                            setFormMessage(null);
                          }}
                          className="btn-primary justify-center gap-2 px-3 py-2 text-xs font-bold"
                        >
                          Send work update
                          <Send className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <span className="inline-flex items-center justify-center rounded-lg border border-confirmed/30 bg-confirmed/5 px-3 py-2 text-xs font-bold text-confirmed">
                          {statusLabel[bounty.status]}
                        </span>
                      )}
                    </div>
                  </div>

                  {canSendWorkUpdate && submitFor === bounty.id && (
                    <div className="mt-4 grid gap-3 border-t pt-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <input
                          value={submission.contributor}
                          onChange={(event) => setSubmission((current) => ({ ...current, contributor: event.target.value }))}
                          className="rounded-lg border px-3 py-2.5 text-sm outline-none"
                          placeholder="Contributor name"
                        />
                        <input
                          value={submission.workUrl}
                          onChange={(event) => setSubmission((current) => ({ ...current, workUrl: event.target.value }))}
                          className="rounded-lg border px-3 py-2.5 text-sm outline-none"
                          placeholder="Work URL"
                        />
                      </div>
                      <textarea
                        value={submission.note}
                        onChange={(event) => setSubmission((current) => ({ ...current, note: event.target.value }))}
                        className="min-h-20 rounded-lg border px-3 py-2.5 text-sm outline-none"
                        placeholder="Add a note for reviewers"
                      />
                      <button
                        type="button"
                        onClick={() => void handleSubmitWork(bounty.id)}
                        className="btn-warm w-fit gap-2 px-4 py-2 text-sm"
                      >
                        <Send className="h-4 w-4" />
                        Record submission
                      </button>
                      {(submissionCounts[bounty.id] ?? 0) > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {submissionCounts[bounty.id]} Baraza submission records stored for review.
                        </p>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
                </div>
              </section>
            ))}
          </div>
          )}

          {filtered.length === 0 && (
            <div className="baraza-card mt-8 p-10 text-center">
              <Trophy className="mx-auto mb-3 h-8 w-8" />
              <p className="font-display text-base font-semibold">No bounties match that filter</p>
              <p className="mt-2 text-sm text-muted-foreground">Try another skill, community, or status.</p>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
