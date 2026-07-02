import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BriefcaseBusiness,
  CircleUserRound,
  Compass,
  Loader2,
  LogIn,
  LogOut,
  PlusCircle,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import Layout from '@/components/Layout';
import CommunityBanner from '@/components/CommunityBanner';
import { AskAkili } from '@/akili/AskAkili';
import { MemberBadges } from '@/components/MemberBadges';
import { DuesStreakChip } from '@/components/DuesStreakChip';
import { ReferralProgress } from '@/components/ReferralProgress';
import { useAccount } from '@/contexts/AccountContext';
import { useCommunities } from '@/hooks/useCommunities';
import { deriveBadges } from '@/lib/badges';
import { getBountyStatsForCommunity, getOpenBountiesForCommunity } from '@/lib/bounties';
import { dataStore } from '@/lib/dataStore';
import { fetchDuesStreak, type StreakResult } from '@/lib/duesStreak';
import { fetchMembershipsForWallet, listMembershipsForWallet } from '@/lib/memberships';
import { useSeo } from '@/lib/seo';
import { formatKSh } from '@/lib/utils';
import { ACCOUNT_COUNTRIES, formatAccountDate, type AccountCountryCode } from '@/lib/accountLocale';

export default function Profile() {
  useSeo({
    title: 'Your Baraza account',
    description: 'Your community memberships, account, and contribution history on Baraza.',
    path: '/profile',
    noIndex: true,
  });

  const account = useAccount();
  const { communities } = useCommunities();
  const address = account.accountId ?? '';

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
  const [badgeEvaluatedAt] = useState(() => Date.now());

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

  const badgeSummary = useMemo(() => {
    const joinedTimes = myMemberships
      .map((membership) => new Date(membership.record.joinedAt).getTime())
      .filter((time) => Number.isFinite(time));
    const earliestJoinedAt = joinedTimes.length > 0
      ? new Date(Math.min(...joinedTimes)).toISOString()
      : null;
    const ninetyDays = 90 * 24 * 60 * 60 * 1000;
    const foundedSurvivingCommunityCount = address
      ? communities.filter((community) => {
          if (community.createdBy !== address) return false;
          const createdAt = new Date(community.createdAt).getTime();
          return Number.isFinite(createdAt) && badgeEvaluatedAt - createdAt >= ninetyDays;
        }).length
      : 0;
    const proposalVoteCount = address ? dataStore.getVoteCountForWallet(address) : 0;

    return {
      badges: deriveBadges({
        activeMembershipCount: myMemberships.length,
        earliestJoinedAt,
        foundedSurvivingCommunityCount,
        proposalVoteCount,
      }),
      proposalVoteCount,
    };
  }, [address, badgeEvaluatedAt, communities, myMemberships]);

  const memberBounties = useMemo(
    () => myMemberships.flatMap(({ community }) =>
      getOpenBountiesForCommunity(community.id).map((bounty) => ({ bounty, community })),
    ),
    [myMemberships],
  );

  const countryControl = (
    <div>
      <label htmlFor="account-country" className="mb-2 block text-xs font-semibold">
        Account country
      </label>
      <select
        id="account-country"
        value={account.country.code}
        onChange={(event) => account.setCountry(event.target.value as AccountCountryCode)}
        className="w-full rounded-md border bg-background px-3 py-3 text-sm font-semibold outline-none focus:border-primary"
      >
        {ACCOUNT_COUNTRIES.map((country) => (
          <option key={country.code} value={country.code}>
            {country.name} - {country.currency}
          </option>
        ))}
      </select>
      <p className="mt-2 text-xs text-muted-foreground">
        Amounts are displayed in {account.country.currency}. Settlement providers confirm the final rate before payment.
      </p>
    </div>
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
    return (
      <Layout>
        <section className="py-16 md:py-20">
          <div className="mx-auto max-w-xl px-4">
            <div className="text-center">
              <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-md border border-primary/30 bg-primary/10 text-primary">
                <CircleUserRound className="h-7 w-7" />
              </div>
              <p className="text-sm font-bold text-primary">Privy account</p>
              <h1 className="mt-2 text-balance font-display text-3xl font-bold">Your Baraza account</h1>
              <p className="mx-auto mt-3 max-w-md text-pretty text-sm leading-6 text-muted-foreground">
                Log in to review memberships and decisions, or create an account with your phone number or email.
              </p>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={account.login}
                disabled={!account.configured}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-border bg-surface px-5 text-sm font-bold transition-colors hover:border-primary/45 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <LogIn className="h-4 w-4" />
                Log in
              </button>
              <button
                type="button"
                onClick={account.createAccount}
                disabled={!account.configured}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <UserPlus className="h-4 w-4" />
                Create account
              </button>
            </div>

            {!account.configured && (
              <p className="mt-3 rounded-md border border-primary/25 bg-primary/5 px-4 py-3 text-center text-xs text-muted-foreground">
                Account access is temporarily unavailable on this deployment.
              </p>
            )}

            <div className="mt-8 border-t border-border/60 pt-6">
              {countryControl}
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-10 md:py-14">
        <div className="container mx-auto px-4">
          <CommunityBanner className="mb-6 p-5 md:p-6">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
              <div className="flex items-center gap-4">
                <div className="grid h-16 w-16 shrink-0 place-items-center rounded-md border border-primary/25 bg-primary/10 text-primary">
                  <CircleUserRound className="h-8 w-8" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-primary">Privy account</p>
                  <h1 className="mt-1 truncate font-display text-2xl font-bold md:text-3xl">
                    {account.displayName}
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {account.country.name} · {account.country.currency}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void account.logout()}
                className="btn-ghost inline-flex items-center justify-center gap-2 text-sm"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          </CommunityBanner>

          <div className="grid gap-6 lg:grid-cols-[0.34fr_0.66fr]">
            <aside className="space-y-6">
              <div className="baraza-card p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-bold">Participation balance</h2>
                  <DuesStreakChip streakMonths={streak.consecutiveMonthsPaid} />
                </div>
                <p className="text-4xl font-black tabular-nums leading-none">{participationBalance}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Your current voting weight across active memberships.
                </p>
              </div>

              <div className="baraza-card p-5">
                <h2 className="mb-4 text-sm font-bold">Country and currency</h2>
                {countryControl}
              </div>

              <div className="baraza-card p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-bold">Badges</h2>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {badgeSummary.badges.earned.length} earned
                  </span>
                </div>
                <MemberBadges result={badgeSummary.badges} variant="compact" />
              </div>

              <div className="baraza-card p-5">
                <ReferralProgress />
              </div>
            </aside>

            <div className="space-y-6">
              <div className="baraza-card p-5">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <h2 className="text-sm font-bold">
                    Your memberships {myMemberships.length > 0 && `(${myMemberships.length})`}
                  </h2>
                  <Link to="/communities" className="text-sm font-semibold text-primary hover:underline">
                    Browse
                  </Link>
                </div>

                {myMemberships.length > 0 ? (
                  <div className="space-y-3">
                    {myMemberships.map(({ record, community }) => (
                      <Link
                        key={community.id}
                        to={`/dashboard/${community.id}`}
                        className="group flex items-center gap-4 rounded-md border p-4 transition-colors hover:border-primary/45"
                      >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border font-display text-base font-bold">
                          {community.image}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate font-display text-sm font-bold">{community.name}</p>
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase">
                              <ShieldCheck className="h-3 w-3" />
                              {record.status}
                            </span>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            <span className="capitalize">{community.type}</span>
                            <span>Joined {formatAccountDate(record.joinedAt, account.country.code)}</span>
                            <span>{formatKSh(community.membershipFee)}/mo</span>
                            <DuesStreakChip streakMonths={streak.perCommunity[community.id]} />
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 shrink-0" />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-md border border-dashed p-8 text-center">
                    <p className="font-display text-base font-semibold">No memberships yet</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Explore a community or launch one with your group.
                    </p>
                    <div className="mt-5 flex flex-col items-center justify-center gap-2 sm:flex-row">
                      <Link to="/communities" className="btn-warm inline-flex items-center gap-2 text-sm">
                        <Compass className="h-4 w-4" />
                        Explore communities
                      </Link>
                      <Link to="/create/purpose" className="btn-ghost inline-flex items-center gap-2 text-sm">
                        <PlusCircle className="h-4 w-4" />
                        Launch a community
                      </Link>
                    </div>
                    <div className="mt-4 flex items-center justify-center gap-2">
                      <AskAkili
                        prompt="Help me choose a community for a youth savings group of around 15 members"
                        label="Ask Akili"
                        variant="chip"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="baraza-card p-5">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-sm font-bold">
                    Bounty announcements {memberBounties.length > 0 && `(${memberBounties.length})`}
                  </h2>
                  <BriefcaseBusiness className="h-4 w-4 text-primary" />
                </div>

                {memberBounties.length > 0 ? (
                  <div className="space-y-3">
                    {memberBounties.slice(0, 4).map(({ bounty, community }) => {
                      const stats = getBountyStatsForCommunity(community.id);
                      return (
                        <Link
                          key={bounty.id}
                          to={`/bounties/${bounty.id}`}
                          className="group flex items-start gap-4 rounded-md border p-4 transition-colors hover:border-primary/45"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-display text-sm font-bold">{bounty.title}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {community.name} · {formatKSh(bounty.rewardKes)} · {bounty.submissions} submissions
                            </p>
                            <p className="mt-2 text-xs text-muted-foreground">
                              {stats.open} open bounties in this community.
                            </p>
                          </div>
                          <ArrowRight className="mt-1 h-4 w-4 shrink-0" />
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                    Join a community to see paid events and contributor work here.
                  </p>
                )}
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="baraza-card p-5">
                  <h2 className="mb-4 text-sm font-bold">Voting history</h2>
                  <p className="text-3xl font-black tabular-nums">{badgeSummary.proposalVoteCount}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Decisions you have voted on across your communities.
                  </p>
                </div>
                <div className="baraza-card p-5">
                  <h2 className="mb-4 text-sm font-bold">Account security</h2>
                  <p className="text-sm text-muted-foreground">
                    Privy secures sign-in and recovery through your verified phone number or email.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
