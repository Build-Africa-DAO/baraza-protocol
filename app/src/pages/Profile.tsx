import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BriefcaseBusiness, Compass, PlusCircle, ShieldCheck, UserRound, Wallet } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import Layout from "@/components/Layout";
import { formatKSh, truncateAddress } from "@/lib/utils";
import CommunityBanner from "@/components/CommunityBanner";
import { listMembershipsForWallet } from "@/lib/memberships";
import { useCommunities } from "@/hooks/useCommunities";
import { CHAINS } from "@/lib/chain";
import { useSeo } from "@/lib/seo";
import { getBountyStatsForCommunity, getOpenBountiesForCommunity } from "@/lib/bounties";

export default function Profile() {
  useSeo({
    title: "Your Baraza profile",
    description: "Your community memberships, wallet, and contribution history on Baraza.",
    path: "/profile",
    noIndex: true,
  });
  const { publicKey, connected, wallet } = useWallet();
  const { setVisible } = useWalletModal();
  const { communities } = useCommunities();

  // Address is only needed below the early-return, but `useMemo` MUST be called
  // unconditionally on every render — so compute it here (defaulting to "")
  // and skip the lookup when no wallet is connected.
  const address = publicKey?.toBase58() ?? "";

  const myMemberships = useMemo(() => {
    if (!address) return [];
    const records = listMembershipsForWallet(address);
    return records
      .map((record) => {
        const community = communities.find((c) => c.id === record.communityId);
        if (!community) return null;
        return { record, community };
      })
      .filter((entry): entry is { record: ReturnType<typeof listMembershipsForWallet>[number]; community: typeof communities[number] } => entry !== null);
  }, [address, communities]);

  const memberBounties = useMemo(() => {
    return myMemberships.flatMap(({ community }) =>
      getOpenBountiesForCommunity(community.id).map((bounty) => ({ bounty, community })),
    );
  }, [myMemberships]);

  if (!connected || !publicKey) {
    return (
      <Layout>
        <section className="py-20">
          <div className="mx-auto max-w-md px-4 text-center">
            <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl">
              <Wallet className="h-7 w-7" />
            </div>
            <h1 className="font-display text-2xl font-bold">Connect your wallet</h1>
            <p className="mt-3 text-sm">
              Your profile shows your memberships, voting history, and credentials across every Community DAO you join.
            </p>
            <button onClick={() => setVisible(true)} className="btn-warm mt-6 inline-flex items-center gap-2 text-sm">
              Connect wallet
            </button>
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
              <div className="flex items-center gap-5">
                <div className="grid h-20 w-20 place-items-center rounded-lg border">
                  <UserRound className="h-9 w-9" />
                </div>
                <div>
                  <p className="font-mono text-xs uppercase tracking-widest">Your profile</p>
                  <h1 className="mt-2 font-display font-mono text-2xl font-bold md:text-3xl">
                    {truncateAddress(address)}
                  </h1>
                  <p className="mt-1 text-sm">
                    {wallet ? `Connected via ${wallet.adapter.name}` : "Wallet connected"}
                  </p>
                </div>
              </div>
            </div>
          </CommunityBanner>

          <div className="grid gap-6 lg:grid-cols-[0.34fr_0.66fr]">
            <aside className="space-y-6">
              <div className="baraza-card p-5">
                <h2 className="mb-4 font-mono text-xs uppercase tracking-widest">
                  Linked wallets
                </h2>
                <div className="rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 font-mono text-xs">
                      <Wallet className="h-4 w-4" />
                      {truncateAddress(address)}
                    </span>
                    <span className="rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                      Primary
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-xs">
                  Linking a second wallet lets you sign from multiple devices.{" "}
                  <span>Coming soon.</span>
                </p>
              </div>

              <div className="baraza-card p-5">
                <h2 className="mb-4 font-mono text-xs uppercase tracking-widest">
                  Active roles
                </h2>
                <p className="text-sm">
                  No DAO roles yet. Join a DAO or launch one to receive your first role.
                </p>
              </div>
            </aside>

            <main className="space-y-6">
              <div className="baraza-card p-5">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="font-mono text-xs uppercase tracking-widest">
                    Your memberships {myMemberships.length > 0 && `(${myMemberships.length})`}
                  </h2>
                  <Link to="/communities" className="text-sm hover:underline">
                    Browse DAOs
                  </Link>
                </div>

                {myMemberships.length > 0 ? (
                  <div className="space-y-3">
                    {myMemberships.map(({ record, community }) => {
                      const chainMeta = CHAINS[community.chain ?? 'solana'];
                      return (
                        <Link
                          key={community.id}
                          to={`/dashboard/${community.id}`}
                          className="group flex items-center gap-4 rounded-lg border p-4"
                        >
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border font-display text-base font-bold">
                            {community.image}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate font-display text-sm font-bold">
                                {community.name}
                              </p>
                              <span className="inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                                <ShieldCheck className="h-3 w-3" />
                                {record.status}
                              </span>
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                              <span className="capitalize">{community.type}</span>
                              <span className="inline-flex items-center gap-1">
                                <span
                                  aria-hidden
                                  className="h-1.5 w-1.5 rounded-full"
                                  style={{ background: chainMeta.badgeBg }}
                                />
                                {chainMeta.label}
                              </span>
                              <span>Joined {new Date(record.joinedAt).toLocaleDateString('en-KE', { month: 'short', year: 'numeric' })}</span>
                              <span>{formatKSh(community.membershipFee)}/mo</span>
                            </div>
                          </div>
                          <ArrowRight className="h-4 w-4 shrink-0" />
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed p-8 text-center">
                    <p className="font-display text-base font-semibold">
                      Not a member of any DAO yet
                    </p>
                    <p className="mt-2 text-sm">
                      Join a Community DAO to receive your membership credential and vote on proposals.
                    </p>
                    <div className="mt-5 flex flex-col items-center justify-center gap-2 sm:flex-row">
                      <Link to="/communities" className="btn-warm inline-flex items-center gap-2 text-sm">
                        <Compass className="h-4 w-4" />
                        Browse Community DAOs
                      </Link>
                      <Link to="/create" className="btn-ghost inline-flex items-center gap-2 text-sm">
                        <PlusCircle className="h-4 w-4" />
                        Launch a Community DAO
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <div className="baraza-card p-5">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="font-mono text-xs uppercase tracking-widest">
                    Bounty announcements {memberBounties.length > 0 && `(${memberBounties.length})`}
                  </h2>
                  <BriefcaseBusiness className="h-4 w-4 text-secondary" />
                </div>

                {memberBounties.length > 0 ? (
                  <div className="space-y-3">
                    {memberBounties.slice(0, 4).map(({ bounty, community }) => {
                      const stats = getBountyStatsForCommunity(community.id);
                      return (
                        <Link
                          key={bounty.id}
                          to={`/dashboard/${community.id}`}
                          className="group flex items-start gap-4 rounded-lg border p-4 transition-colors hover:border-secondary/40"
                        >
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border bg-secondary/10">
                            <BriefcaseBusiness className="h-4 w-4 text-secondary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-display text-sm font-bold">{bounty.title}</p>
                              <span className="rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                                {bounty.category}
                              </span>
                            </div>
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
                  <div className="rounded-lg border border-dashed p-6 text-center">
                    <p className="font-display text-base font-semibold">No bounty announcements yet</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Join a community to see paid events, integrations, and contributor tasks here.
                    </p>
                  </div>
                )}
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="baraza-card p-5">
                  <h2 className="mb-4 font-mono text-xs uppercase tracking-widest">
                    Voting history
                  </h2>
                  <p className="text-sm">
                    No votes yet. Once you join a DAO and vote on a proposal, your record appears here.
                  </p>
                </div>

                <div className="baraza-card p-5">
                  <h2 className="mb-4 font-mono text-xs uppercase tracking-widest">
                    Membership credentials
                  </h2>
                  <p className="text-sm">
                    Your membership credentials appear here once you join a DAO.
                  </p>
                </div>
              </div>
            </main>
          </div>
        </div>
      </section>
    </Layout>
  );
}
