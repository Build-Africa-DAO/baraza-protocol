import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Compass, PlusCircle, ShieldCheck, UserRound, Wallet } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import Layout from "@/components/Layout";
import { formatKSh, truncateAddress } from "@/lib/utils";
import CommunityBanner from "@/components/CommunityBanner";
import { listMembershipsForWallet } from "@/lib/memberships";
import { useCommunities } from "@/hooks/useCommunities";
import { CHAINS } from "@/lib/chain";

export default function Profile() {
  const { publicKey, connected, wallet } = useWallet();
  const { setVisible } = useWalletModal();

  if (!connected || !publicKey) {
    return (
      <Layout>
        <section className="py-20">
          <div className="mx-auto max-w-md px-4 text-center">
            <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Wallet className="h-7 w-7" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">Connect your wallet</h1>
            <p className="mt-3 text-sm text-muted-foreground">
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

  const address = publicKey.toBase58();
  const { communities } = useCommunities();

  const myMemberships = useMemo(() => {
    const records = listMembershipsForWallet(address);
    return records
      .map((record) => {
        const community = communities.find((c) => c.id === record.communityId);
        if (!community) return null;
        return { record, community };
      })
      .filter((entry): entry is { record: ReturnType<typeof listMembershipsForWallet>[number]; community: typeof communities[number] } => entry !== null);
  }, [address, communities]);

  return (
    <Layout>
      <section className="py-10 md:py-14">
        <div className="container mx-auto px-4">
          <CommunityBanner className="mb-6 p-5 md:p-6">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
              <div className="flex items-center gap-5">
                <div className="grid h-20 w-20 place-items-center rounded-lg border border-border bg-surface text-primary">
                  <UserRound className="h-9 w-9" />
                </div>
                <div>
                  <p className="font-mono text-xs uppercase tracking-widest text-primary">Your profile</p>
                  <h1 className="mt-2 font-display font-mono text-2xl font-bold text-foreground md:text-3xl">
                    {truncateAddress(address)}
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {wallet ? `Connected via ${wallet.adapter.name}` : "Wallet connected"}
                  </p>
                </div>
              </div>
            </div>
          </CommunityBanner>

          <div className="grid gap-6 lg:grid-cols-[0.34fr_0.66fr]">
            <aside className="space-y-6">
              <div className="baraza-card p-5">
                <h2 className="mb-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  Linked wallets
                </h2>
                <div className="rounded-lg border border-border bg-background/45 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 font-mono text-xs text-foreground">
                      <Wallet className="h-4 w-4 text-primary" />
                      {truncateAddress(address)}
                    </span>
                    <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                      Primary
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Linking a second wallet lets you sign from multiple devices.{" "}
                  <span className="text-muted-foreground/70">Coming soon.</span>
                </p>
              </div>

              <div className="baraza-card p-5">
                <h2 className="mb-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  Active roles
                </h2>
                <p className="text-sm text-muted-foreground">
                  No DAO roles yet. Join a DAO or create one to receive your first role.
                </p>
              </div>
            </aside>

            <main className="space-y-6">
              <div className="baraza-card p-5">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                    Your memberships {myMemberships.length > 0 && `(${myMemberships.length})`}
                  </h2>
                  <Link to="/communities" className="text-sm text-primary hover:underline">
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
                          className="group flex items-center gap-4 rounded-lg border border-border bg-background/45 p-4 transition-colors hover:border-primary/40 hover:bg-surface"
                        >
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/15 font-display text-base font-bold text-primary">
                            {community.image}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate font-display text-sm font-bold text-foreground">
                                {community.name}
                              </p>
                              <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-confirmed/30 bg-confirmed/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-confirmed">
                                <ShieldCheck className="h-3 w-3" />
                                {record.status}
                              </span>
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
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
                              <span className="text-accent">{formatKSh(community.membershipFee)}/mo</span>
                            </div>
                          </div>
                          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border bg-background/30 p-8 text-center">
                    <p className="font-display text-base font-semibold text-foreground">
                      Not a member of any DAO yet
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Join a Community DAO to receive your membership credential and vote on proposals.
                    </p>
                    <div className="mt-5 flex flex-col items-center justify-center gap-2 sm:flex-row">
                      <Link to="/communities" className="btn-warm inline-flex items-center gap-2 text-sm">
                        <Compass className="h-4 w-4" />
                        Browse Community DAOs
                      </Link>
                      <Link to="/create" className="btn-ghost inline-flex items-center gap-2 text-sm">
                        <PlusCircle className="h-4 w-4" />
                        Create a Community DAO
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="baraza-card p-5">
                  <h2 className="mb-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                    Voting history
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    No votes yet. Once you join a DAO and vote on a proposal, your record appears here.
                  </p>
                </div>

                <div className="baraza-card p-5">
                  <h2 className="mb-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                    Membership credentials
                  </h2>
                  <p className="text-sm text-muted-foreground">
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
