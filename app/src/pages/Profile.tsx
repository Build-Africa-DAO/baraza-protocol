import { type ChangeEvent, type FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  AtSign,
  BriefcaseBusiness,
  Camera,
  Check,
  Compass,
  Globe2,
  HeartHandshake,
  Loader2,
  Pencil,
  PlusCircle,
  Settings,
  ShieldCheck,
  Vote,
  X,
} from 'lucide-react';
import Layout from '@/components/Layout';
import { AskAkili } from '@/akili/AskAkili';
import { DuesStreakChip } from '@/components/DuesStreakChip';
import { useAccount } from '@/contexts/AccountContext';
import { useCommunities } from '@/hooks/useCommunities';
import { getBountyStatsForCommunity, getOpenBountiesForCommunity } from '@/lib/bounties';
import { dataStore } from '@/lib/dataStore';
import { fetchDuesStreak, type StreakResult } from '@/lib/duesStreak';
import { fetchMembershipsForWallet, listMembershipsForWallet } from '@/lib/memberships';
import { useSeo } from '@/lib/seo';
import { formatKSh } from '@/lib/utils';
import { formatAccountDate } from '@/lib/accountLocale';
import { prepareProfilePhoto, type MemberProfile } from '@/lib/memberProfile';
import { filterProposalsToReview, getProposalDeadline } from '@/lib/memberActions';
import { useToast } from '@/hooks/use-toast';

const profileFieldClass = 'min-h-12 w-full rounded-md border bg-background px-3 py-2 text-base outline-none transition-colors placeholder:text-muted-foreground focus:border-primary';

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'B';
}

export default function Profile() {
  useSeo({
    title: 'Your Baraza account',
    description: 'Your community memberships, account, and contribution history on Baraza.',
    path: '/profile',
    noIndex: true,
  });

  const account = useAccount();
  const { toast } = useToast();
  const { communities } = useCommunities();
  const address = account.accountId ?? '';
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isPreparingPhoto, setIsPreparingPhoto] = useState(false);
  const [profileDraft, setProfileDraft] = useState<MemberProfile>(account.profile);

  useEffect(() => {
    if (!isEditingProfile) setProfileDraft(account.profile);
  }, [account.profile, isEditingProfile]);

  const updateDraft = (field: keyof MemberProfile, value: string) => {
    setProfileDraft((current) => ({ ...current, [field]: value }));
  };

  const handlePhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setIsPreparingPhoto(true);
    try {
      updateDraft('avatarUrl', await prepareProfilePhoto(file));
    } catch (error) {
      toast({
        title: 'Photo not added',
        description: error instanceof Error ? error.message : 'Choose another image and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsPreparingPhoto(false);
    }
  };

  const saveProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profileDraft.displayName.trim()) {
      toast({ title: 'Add your name', description: 'Your profile needs a name members can recognize.', variant: 'destructive' });
      return;
    }

    try {
      account.updateProfile(profileDraft);
      setIsEditingProfile(false);
      toast({ title: 'Profile updated', description: 'Your name and profile details are now visible in Baraza.' });
    } catch {
      toast({ title: 'Profile not saved', description: 'Your browser could not save these changes. Try a smaller photo.', variant: 'destructive' });
    }
  };

  type MembershipPair = {
    record: ReturnType<typeof listMembershipsForWallet>[number];
    community: (typeof communities)[number];
  };

  const initialMemberships = useMemo<MembershipPair[]>(() => {
    if (!address) return [];
    return listMembershipsForWallet(address)
      .map((record) => {
        const community = communities.find((item) => item.id === record.communityId);
        return community ? { record, community } : null;
      })
      .filter((entry): entry is MembershipPair => entry !== null);
    // This only seeds the first authenticated render; the effect below refreshes it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [myMemberships, setMyMemberships] = useState<MembershipPair[]>(initialMemberships);
  const [streak, setStreak] = useState<StreakResult>({
    consecutiveMonthsPaid: 0,
    lastPaidAt: null,
    perCommunity: {},
  });

  useEffect(() => {
    if (!address) return;
    const toPairs = (records: ReturnType<typeof listMembershipsForWallet>) => records
      .map((record) => {
        const community = communities.find((item) => item.id === record.communityId);
        return community ? { record, community } : null;
      })
      .filter((entry): entry is MembershipPair => entry !== null);

    setMyMemberships(toPairs(listMembershipsForWallet(address)));
    fetchMembershipsForWallet(address)
      .then((records) => setMyMemberships(toPairs(records)))
      .catch(() => undefined);
  }, [address, communities]);

  useEffect(() => {
    if (!address) return;
    let cancelled = false;
    fetchDuesStreak(address)
      .then((result) => {
        if (!cancelled) setStreak(result);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [address]);

  const participationBalance = useMemo(
    () => myMemberships.reduce((sum, membership) => sum + membership.record.brzaBalance, 0),
    [myMemberships],
  );

  const proposalVoteCount = address ? dataStore.getVoteCountForWallet(address) : 0;

  const proposalsToReview = useMemo(() => myMemberships
    .flatMap(({ community }) => filterProposalsToReview(
      dataStore.getDecisionsForCommunity(community.id),
      address,
    ).map((decision) => ({ decision, community })))
    .sort((a, b) => new Date(a.decision.endsAt).getTime() - new Date(b.decision.endsAt).getTime()),
  [address, myMemberships]);

  const memberBounties = useMemo(
    () => myMemberships.flatMap(({ community }) =>
      getOpenBountiesForCommunity(community.id).map((bounty) => ({ bounty, community })),
    ),
    [myMemberships],
  );

  if (!account.ready) {
    return (
      <Layout>
        <section className="py-20">
          <div className="mx-auto flex max-w-md items-center justify-center gap-2 px-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading your account
          </div>
        </section>
      </Layout>
    );
  }

  if (!account.authenticated) {
    return <Navigate to="/login" replace />;
  }

  const hasPublicProfile = Boolean(
    account.profile.avatarUrl
    && account.profile.bio
    && (account.profile.websiteUrl || account.profile.xUrl || account.profile.instagramUrl),
  );

  return (
    <Layout>
      <section className="py-8 md:py-12">
        <div className="container mx-auto max-w-6xl px-4">
          <header className="mb-7 border-b border-border pb-7">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
              <div className="flex min-w-0 items-start gap-4">
                {account.profile.avatarUrl ? (
                  <img src={account.profile.avatarUrl} alt={`${account.displayName}'s profile`} className="h-20 w-20 shrink-0 rounded-md border object-cover" />
                ) : (
                  <div className="grid h-20 w-20 shrink-0 place-items-center rounded-md border bg-primary/10 font-display text-2xl font-bold text-primary">
                    {getInitials(account.displayName)}
                  </div>
                )}
                <div className="min-w-0 pt-1">
                  <h1 className="break-words font-display text-2xl font-bold md:text-3xl">{account.displayName}</h1>
                  {account.verifiedContact && <p className="mt-1 truncate text-sm text-muted-foreground">{account.verifiedContact}</p>}
                  {account.profile.bio && <p className="mt-3 max-w-2xl text-sm leading-6 text-foreground/90">{account.profile.bio}</p>}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {account.profile.websiteUrl && (
                      <a href={account.profile.websiteUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-md border px-3 text-sm font-semibold hover:border-primary/45"><Globe2 className="h-4 w-4" /> Website</a>
                    )}
                    {account.profile.xUrl && (
                      <a href={account.profile.xUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-md border px-3 text-sm font-semibold hover:border-primary/45"><AtSign className="h-4 w-4" /> X</a>
                    )}
                    {account.profile.instagramUrl && (
                      <a href={account.profile.instagramUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-md border px-3 text-sm font-semibold hover:border-primary/45"><Camera className="h-4 w-4" /> Instagram</a>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 md:justify-end">
                <button type="button" onClick={() => setIsEditingProfile((current) => !current)} className="btn-warm inline-flex min-h-11 flex-1 items-center justify-center gap-2 text-sm sm:flex-none">
                  {isEditingProfile ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                  {isEditingProfile ? 'Close editor' : 'Edit public profile'}
                </button>
                <Link to="/profile/invites" className="btn-ghost inline-flex min-h-11 flex-1 items-center justify-center gap-2 text-sm sm:flex-none"><HeartHandshake className="h-4 w-4" /> Invites</Link>
                <Link to="/profile/settings" className="btn-ghost inline-flex min-h-11 flex-1 items-center justify-center gap-2 text-sm sm:flex-none"><Settings className="h-4 w-4" /> Settings</Link>
              </div>
            </div>
          </header>

          {!hasPublicProfile && !isEditingProfile && (
            <div className="mb-7 flex flex-col gap-4 rounded-md border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div><p className="text-sm font-bold">Finish your public profile</p><p className="mt-1 text-sm text-muted-foreground">Add a photo, short bio, and at least one social link so members can recognize you.</p></div>
              </div>
              <button type="button" onClick={() => setIsEditingProfile(true)} className="min-h-11 shrink-0 rounded-md border px-4 text-sm font-bold hover:border-primary/45">Set up profile</button>
            </div>
          )}

          {isEditingProfile && (
            <form onSubmit={saveProfile} className="mb-7 border-y border-border bg-card/55 py-6 md:rounded-md md:border md:p-6" aria-labelledby="profile-editor-title">
              <div className="flex flex-col gap-6 px-4 md:px-0 lg:flex-row lg:items-start">
                <div className="flex shrink-0 items-center gap-4 lg:w-48 lg:flex-col lg:items-start">
                  {profileDraft.avatarUrl ? <img src={profileDraft.avatarUrl} alt="Profile preview" className="h-24 w-24 rounded-md border object-cover" /> : <div className="grid h-24 w-24 place-items-center rounded-md border bg-primary/10 font-display text-2xl font-bold text-primary">{getInitials(profileDraft.displayName)}</div>}
                  <div className="flex flex-col gap-2">
                    <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border px-3 text-sm font-semibold hover:border-primary/45">
                      {isPreparingPhoto ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}{isPreparingPhoto ? 'Preparing...' : 'Choose photo'}
                      <input type="file" accept="image/*" className="sr-only" onChange={(event) => void handlePhoto(event)} disabled={isPreparingPhoto} />
                    </label>
                    {profileDraft.avatarUrl && <button type="button" onClick={() => updateDraft('avatarUrl', '')} className="min-h-10 text-left text-sm text-muted-foreground hover:text-foreground">Remove photo</button>}
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-5"><h2 id="profile-editor-title" className="font-display text-xl font-bold">Edit public profile</h2><p className="mt-1 text-sm text-muted-foreground">These details help other community members know who they are working with.</p></div>
                  <div className="grid gap-5 md:grid-cols-2">
                    <label className="block md:col-span-2"><span className="mb-2 block text-sm font-semibold">Profile name</span><input value={profileDraft.displayName} onChange={(event) => updateDraft('displayName', event.target.value)} maxLength={60} autoComplete="name" className={profileFieldClass} placeholder="Example: Aziz Motomoto" /></label>
                    <label className="block md:col-span-2"><span className="mb-2 block text-sm font-semibold">Bio</span><textarea value={profileDraft.bio} onChange={(event) => updateDraft('bio', event.target.value)} maxLength={280} rows={4} className={`${profileFieldClass} resize-y`} placeholder="Example: I organize youth savings groups and build community finance tools." /><span className="mt-1 block text-right text-xs text-muted-foreground">{profileDraft.bio.length}/280</span></label>
                  </div>

                  <div className="my-6 border-t border-border pt-5"><h3 className="text-sm font-bold">Connect social profiles</h3><p className="mt-1 text-sm text-muted-foreground">Add links members can use to verify and contact you.</p></div>
                  <div className="grid gap-5 md:grid-cols-2">
                    <label className="block"><span className="mb-2 flex items-center gap-2 text-sm font-semibold"><Globe2 className="h-4 w-4" /> Website</span><input value={profileDraft.websiteUrl} onChange={(event) => updateDraft('websiteUrl', event.target.value)} inputMode="url" autoComplete="url" className={profileFieldClass} placeholder="Example: buildadao.io" /></label>
                    <label className="block"><span className="mb-2 flex items-center gap-2 text-sm font-semibold"><AtSign className="h-4 w-4" /> X</span><input value={profileDraft.xUrl} onChange={(event) => updateDraft('xUrl', event.target.value)} inputMode="url" className={profileFieldClass} placeholder="Example: x.com/yourname" /></label>
                    <label className="block md:col-span-2"><span className="mb-2 flex items-center gap-2 text-sm font-semibold"><Camera className="h-4 w-4" /> Instagram</span><input value={profileDraft.instagramUrl} onChange={(event) => updateDraft('instagramUrl', event.target.value)} inputMode="url" className={profileFieldClass} placeholder="Example: instagram.com/yourname" /></label>
                  </div>
                  <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button type="button" onClick={() => { setProfileDraft(account.profile); setIsEditingProfile(false); }} className="btn-ghost min-h-11 justify-center">Cancel</button>
                    <button type="submit" disabled={isPreparingPhoto} className="btn-warm min-h-11 justify-center gap-2 disabled:opacity-50"><Check className="h-4 w-4" /> Save profile</button>
                  </div>
                </div>
              </div>
            </form>
          )}

          <div className="mb-7 grid grid-cols-2 border-y border-border md:grid-cols-4">
            <div className="p-4"><p className="text-xs text-muted-foreground">Memberships</p><p className="mt-1 text-xl font-bold tabular-nums">{myMemberships.length}</p></div>
            <div className="border-l border-border p-4"><p className="text-xs text-muted-foreground">Voting weight</p><p className="mt-1 text-xl font-bold tabular-nums">{participationBalance}</p></div>
            <div className="border-t border-border p-4 md:border-l md:border-t-0"><p className="text-xs text-muted-foreground">Dues streak</p><div className="mt-2"><DuesStreakChip streakMonths={streak.consecutiveMonthsPaid} /></div></div>
            <div className="border-l border-t border-border p-4 md:border-t-0"><p className="text-xs text-muted-foreground">Votes cast</p><p className="mt-1 text-xl font-bold tabular-nums">{proposalVoteCount}</p></div>
          </div>

          <section className="baraza-card mb-7 p-5 md:p-6" aria-labelledby="votes-needed-title">
            <div className="mb-5 flex items-center justify-between gap-3"><div><h2 id="votes-needed-title" className="font-display text-lg font-bold">Decisions needing your vote</h2><p className="mt-1 text-sm text-muted-foreground">Open proposals from communities you belong to.</p></div><Vote className="h-5 w-5 text-primary" /></div>
            {proposalsToReview.length > 0 ? (
              <div className="divide-y divide-border rounded-md border">
                {proposalsToReview.slice(0, 5).map(({ decision, community }) => {
                  const deadline = getProposalDeadline(decision.endsAt);
                  return <Link key={decision.id} to={`/dashboard/${community.id}/decisions/${decision.id}`} className="flex flex-col gap-3 p-4 transition-colors hover:bg-surface sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="font-display text-sm font-bold">{decision.title}</p><p className="mt-1 text-xs text-muted-foreground">{community.name} · {decision.votesFor + decision.votesAgainst + (decision.votesAbstain ?? 0)} votes cast</p></div><div className="flex shrink-0 items-center gap-3"><span className={deadline.urgent ? 'rounded-full bg-primary/15 px-2.5 py-1 text-xs font-bold text-primary' : 'text-xs font-semibold text-muted-foreground'}>{deadline.label}</span><span className="inline-flex items-center gap-1 text-sm font-bold text-primary">Review <ArrowRight className="h-4 w-4" /></span></div></Link>;
                })}
              </div>
            ) : myMemberships.length > 0 ? (
              <div className="rounded-md border border-dashed p-6 text-center"><Check className="mx-auto h-5 w-5 text-primary" /><p className="mt-2 text-sm font-bold">You are caught up</p><p className="mt-1 text-sm text-muted-foreground">No community decisions are waiting for your vote.</p></div>
            ) : (
              <div className="rounded-md border border-dashed p-6 text-center"><p className="text-sm font-bold">Join a community to receive proposals</p><p className="mt-1 text-sm text-muted-foreground">New votes will appear here with their closing date and urgency.</p><Link to="/communities" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-md border px-4 text-sm font-bold hover:border-primary/45"><Compass className="h-4 w-4" /> Explore communities</Link></div>
            )}
          </section>

          <div className="grid gap-7 lg:grid-cols-2">
            <section className="baraza-card p-5" aria-labelledby="memberships-title">
              <div className="mb-5 flex items-center justify-between"><h2 id="memberships-title" className="font-display text-base font-bold">Your memberships</h2><Link to="/communities" className="text-sm font-bold text-primary hover:underline">Browse</Link></div>
              {myMemberships.length > 0 ? <div className="divide-y divide-border rounded-md border">{myMemberships.map(({ record, community }) => <Link key={community.id} to={`/dashboard/${community.id}`} className="flex items-center gap-3 p-4 hover:bg-surface"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-md border font-display text-sm font-bold">{community.image}</div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="truncate text-sm font-bold">{community.name}</p><ShieldCheck className="h-3.5 w-3.5 text-primary" /></div><p className="mt-1 text-xs text-muted-foreground">Joined {formatAccountDate(record.joinedAt, account.country.code)} · {formatKSh(community.membershipFee)}/mo</p></div><ArrowRight className="h-4 w-4" /></Link>)}</div> : <div className="rounded-md border border-dashed p-6 text-center"><p className="text-sm font-bold">No memberships yet</p><p className="mt-1 text-sm text-muted-foreground">Explore a community or launch one with your group.</p><div className="mt-4 flex flex-col justify-center gap-2 sm:flex-row"><Link to="/communities" className="btn-warm justify-center gap-2"><Compass className="h-4 w-4" /> Explore</Link><Link to="/create/purpose" className="btn-ghost justify-center gap-2"><PlusCircle className="h-4 w-4" /> Launch</Link></div><div className="mt-4"><AskAkili prompt="Help me choose a community for a youth savings group of around 15 members" label="Ask Akili" variant="chip" /></div></div>}
            </section>

            <section className="baraza-card p-5" aria-labelledby="bounties-title">
              <div className="mb-5 flex items-center justify-between"><h2 id="bounties-title" className="font-display text-base font-bold">Paid work from your communities</h2><BriefcaseBusiness className="h-5 w-5 text-primary" /></div>
              {memberBounties.length > 0 ? <div className="divide-y divide-border rounded-md border">{memberBounties.slice(0, 4).map(({ bounty, community }) => { const stats = getBountyStatsForCommunity(community.id); return <Link key={bounty.id} to={`/bounties/${bounty.id}`} className="flex items-start gap-3 p-4 hover:bg-surface"><div className="min-w-0 flex-1"><p className="text-sm font-bold">{bounty.title}</p><p className="mt-1 text-xs text-muted-foreground">{community.name} · {formatKSh(bounty.rewardKes)} · {stats.open} open</p></div><ArrowRight className="mt-1 h-4 w-4" /></Link>; })}</div> : <div className="rounded-md border border-dashed p-6 text-center"><p className="text-sm font-bold">No community work yet</p><p className="mt-1 text-sm text-muted-foreground">Bounties from communities you join will appear here.</p><Link to="/bounties" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-md border px-4 text-sm font-bold hover:border-primary/45"><BriefcaseBusiness className="h-4 w-4" /> Browse bounties</Link></div>}
            </section>
          </div>
        </div>
      </section>
    </Layout>
  );
}
