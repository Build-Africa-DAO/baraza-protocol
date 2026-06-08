import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BriefcaseBusiness,
  Compass,
  Link2,
  Loader2,
  PlusCircle,
  RefreshCw,
  ReceiptText,
  ShieldCheck,
  Trash2,
  UserRound,
  Wallet,
} from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import Layout from "@/components/Layout";
import { formatRailAmountFromKes, formatRailDate, truncateAddress } from "@/lib/utils";
import CommunityBanner from "@/components/CommunityBanner";
import { fetchMembershipsForWallet, listMembershipsForWallet } from "@/lib/memberships";
import { fetchTotalBrzaBalance } from "@/hooks/useBrzaBalance";
import { useCommunities } from "@/hooks/useCommunities";
import { CHAINS } from "@/lib/chain";
import { useSeo } from "@/lib/seo";
import { useChain } from "@/hooks/useChain";
import { getBountyStatsForCommunity, getOpenBountiesForCommunity } from "@/lib/bounties";
import {
  confirmStellarTransaction,
  fetchStellarBalances,
  getStellarConfig,
  isValidStellarPublicKey,
  type StellarBalance,
} from "@/lib/stellar";
import {
  clearLinkedStellarAccount,
  getLinkedStellarAccount,
  saveLinkedStellarAccount,
} from "@/lib/stellarAccounts";
import {
  listStellarSettlements,
  recordStellarSettlement,
  type StellarSettlementRecord,
} from "@/lib/stellarSettlements";

export default function Profile() {
  const { chainMeta } = useChain();
  useSeo({
    title: "Your Baraza profile",
    description: "Your community memberships, account, and contribution history on Baraza.",
    path: "/profile",
    noIndex: true,
  });
  const { publicKey, connected, wallet } = useWallet();
  const { setVisible } = useWalletModal();
  const { communities } = useCommunities();
  const stellarConfig = useMemo(() => getStellarConfig(), []);
  const [stellarAccount, setStellarAccount] = useState<string | null>(null);
  const [stellarInput, setStellarInput] = useState("");
  const [totalBrza, setTotalBrza] = useState<number | null>(null);
  const [stellarBalances, setStellarBalances] = useState<StellarBalance[]>([]);
  const [stellarMessage, setStellarMessage] = useState<string | null>(null);
  const [isLoadingStellar, setIsLoadingStellar] = useState(false);
  const [stellarTxHash, setStellarTxHash] = useState("");
  const [settlementMessage, setSettlementMessage] = useState<string | null>(null);
  const [isCheckingSettlement, setIsCheckingSettlement] = useState(false);
  const [stellarSettlements, setStellarSettlements] = useState<StellarSettlementRecord[]>([]);

  // Address is only needed below the early-return, but `useMemo` MUST be called
  // unconditionally on every render - so compute it here (defaulting to "")
  // and skip the lookup when no wallet is connected.
  const address = publicKey?.toBase58() ?? "";

  const [myMemberships, setMyMemberships] = useState<
    Array<{ record: ReturnType<typeof listMembershipsForWallet>[number]; community: typeof communities[number] }>
  >([]);

  useEffect(() => {
    if (!address) { setMyMemberships([]); return; }
    // Optimistic sync read
    const syncRecords = listMembershipsForWallet(address);
    setMyMemberships(
      syncRecords
        .map((r) => { const c = communities.find((c) => c.id === r.communityId); return c ? { record: r, community: c } : null; })
        .filter((e): e is NonNullable<typeof e> => e !== null),
    );
    // Then async Supabase read for fresh voting_weight
    fetchMembershipsForWallet(address).then((records) => {
      setMyMemberships(
        records
          .map((r) => { const c = communities.find((c) => c.id === r.communityId); return c ? { record: r, community: c } : null; })
          .filter((e): e is NonNullable<typeof e> => e !== null),
      );
    }).catch(() => undefined);
  }, [address, communities]);

  useEffect(() => {
    if (!address) { setTotalBrza(null); return; }
    fetchTotalBrzaBalance(address).then(setTotalBrza).catch(() => setTotalBrza(null));
  }, [address]);

  const memberBounties = useMemo(
    () => myMemberships.flatMap(({ community }) =>
      getOpenBountiesForCommunity(community.id).map((bounty) => ({ bounty, community })),
    ),
    [myMemberships],
  );

  useEffect(() => {
    if (!address) return;
    const linked = getLinkedStellarAccount(address);
    setStellarAccount(linked);
    setStellarInput(linked ?? "");
    setStellarBalances([]);
    setStellarMessage(null);
    setSettlementMessage(null);
    setStellarSettlements(listStellarSettlements(address));
  }, [address]);

  const refreshStellarBalances = async (account = stellarAccount) => {
    if (!account) return;
    if (!stellarConfig.enabled) {
      setStellarMessage("Set VITE_STELLAR_NETWORK or VITE_STELLAR_HORIZON_URL to enable live Stellar balance checks.");
      return;
    }

    setIsLoadingStellar(true);
    setStellarMessage(null);
    try {
      const balances = await fetchStellarBalances(account, stellarConfig);
      setStellarBalances(balances);
    } catch (err) {
      setStellarBalances([]);
      setStellarMessage(err instanceof Error ? err.message : "Could not load Stellar balances.");
    } finally {
      setIsLoadingStellar(false);
    }
  };

  const handleSaveStellar = () => {
    if (!address) return;
    if (!isValidStellarPublicKey(stellarInput.trim())) {
      setStellarMessage("Enter a valid Stellar public key.");
      return;
    }
    const saved = saveLinkedStellarAccount(address, stellarInput);
    setStellarAccount(saved);
    setStellarInput(saved);
    setStellarBalances([]);
    setStellarMessage("Stellar account linked.");
    void refreshStellarBalances(saved);
  };

  const handleClearStellar = () => {
    if (!address) return;
    clearLinkedStellarAccount(address);
    setStellarAccount(null);
    setStellarInput("");
    setStellarBalances([]);
    setStellarMessage(null);
    setSettlementMessage(null);
  };

  const handleVerifySettlement = async () => {
    if (!address || !stellarAccount) return;
    const txHash = stellarTxHash.trim().toLowerCase();
    if (!/^[a-f0-9]{64}$/.test(txHash)) {
      setSettlementMessage("Enter a valid 64-character Stellar transaction hash.");
      return;
    }
    if (!stellarConfig.enabled) {
      setSettlementMessage("Set Stellar Horizon env vars to verify transactions.");
      return;
    }

    setIsCheckingSettlement(true);
    setSettlementMessage(null);
    try {
      const confirmation = await confirmStellarTransaction(txHash, stellarConfig);
      const record = recordStellarSettlement({
        ownerWallet: address,
        stellarAccount,
        txHash,
        confirmation,
      });
      setStellarSettlements(listStellarSettlements(address));
      setSettlementMessage(
        record.status === 'CONFIRMED'
          ? `Settlement confirmed in ledger ${record.ledger}.`
          : record.status === 'FAILED'
            ? "Transaction was found but did not succeed."
            : "Transaction was not found on this Stellar network.",
      );
      if (record.status === 'CONFIRMED') setStellarTxHash("");
    } catch (err) {
      setSettlementMessage(err instanceof Error ? err.message : "Could not verify Stellar transaction.");
    } finally {
      setIsCheckingSettlement(false);
    }
  };

  if (!connected || !publicKey) {
    return (
      <Layout>
        <section className="py-20">
          <div className="mx-auto max-w-md px-4 text-center">
            <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl">
              <Wallet className="h-7 w-7" />
            </div>
            <h1 className="font-display text-2xl font-bold">{chainMeta.accountCta}</h1>
            <p className="mt-3 text-sm">
              Your profile shows your memberships, voting history, and credentials across every DAO you join.
            </p>
            <button onClick={() => setVisible(true)} className="btn-warm mt-6 inline-flex items-center gap-2 text-sm">
              Connect {chainMeta.label}
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
                    {wallet ? `Connected via ${wallet.adapter.name}` : "Account connected"}
                  </p>
                </div>
              </div>
            </div>
          </CommunityBanner>

          <div className="grid gap-6 lg:grid-cols-[0.34fr_0.66fr]">
            <aside className="space-y-6">
              {/* RAZA balance summary */}
              <div className="baraza-card p-5">
                <h2 className="mb-3 font-mono text-xs uppercase tracking-widest">RAZA balance</h2>
                <div className="flex items-end gap-2">
                  <span className="font-display text-4xl font-black tabular-nums leading-none">
                    {totalBrza === null ? '—' : totalBrza}
                  </span>
                  <span className="mb-1 text-sm font-semibold text-muted-foreground">RAZA</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Voting weight across all active memberships. Increases with governance participation.
                </p>
              </div>

              <div className="baraza-card p-5">
                <h2 className="mb-4 font-mono text-xs uppercase tracking-widest">
                  Linked accounts
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
                  Linking a second account lets you sign from multiple devices.{" "}
                  <span>Not yet available.</span>
                </p>
              </div>

              <div className="baraza-card p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="font-mono text-xs uppercase tracking-widest">
                    Stellar settlement
                  </h2>
                  <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                    <span
                      aria-hidden
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: CHAINS.stellar.badgeBg }}
                    />
                    {stellarConfig.network}
                  </span>
                </div>

                <label htmlFor="stellar-account" className="mb-2 block text-xs font-semibold">
                  Stellar public key
                </label>
                <div className="flex rounded-lg border focus-within:border-current">
                  <span className="grid w-10 place-items-center border-r">
                    <Link2 className="h-4 w-4" />
                  </span>
                  <input
                    id="stellar-account"
                    value={stellarInput}
                    onChange={(e) => {
                      setStellarInput(e.target.value);
                      setStellarMessage(null);
                    }}
                    className="min-w-0 flex-1 px-3 py-2.5 font-mono text-xs outline-none"
                    placeholder="G..."
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleSaveStellar}
                    disabled={!stellarInput.trim()}
                    className="btn-primary gap-2 px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Link2 className="h-3.5 w-3.5" />
                    Link
                  </button>
                  <button
                    type="button"
                    onClick={() => void refreshStellarBalances()}
                    disabled={!stellarAccount || isLoadingStellar}
                    className="btn-ghost gap-2 px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isLoadingStellar ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                    Refresh
                  </button>
                  {stellarAccount && (
                    <button
                      type="button"
                      onClick={handleClearStellar}
                      className="btn-ghost gap-2 px-3 py-2 text-xs"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  )}
                </div>

                {stellarMessage && (
                  <p className="mt-3 text-xs leading-5">
                    {stellarMessage}
                  </p>
                )}

                {stellarBalances.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {stellarBalances.slice(0, 3).map((balance) => (
                      <div key={`${balance.type}:${balance.assetCode}:${balance.assetIssuer ?? 'native'}`} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-xs">
                        <span className="font-semibold">{balance.assetCode}</span>
                        <span className="font-mono">{balance.balance}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="baraza-card p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="font-mono text-xs uppercase tracking-widest">
                    Stellar tx check
                  </h2>
                  <ReceiptText className="h-4 w-4" />
                </div>

                <label htmlFor="stellar-tx" className="mb-2 block text-xs font-semibold">
                  Transaction hash
                </label>
                <input
                  id="stellar-tx"
                  value={stellarTxHash}
                  onChange={(e) => {
                    setStellarTxHash(e.target.value);
                    setSettlementMessage(null);
                  }}
                  className="w-full rounded-lg border px-3 py-2.5 font-mono text-xs outline-none"
                  placeholder="64-character hash"
                  autoComplete="off"
                  spellCheck={false}
                />

                <button
                  type="button"
                  onClick={() => void handleVerifySettlement()}
                  disabled={!stellarAccount || !stellarTxHash.trim() || isCheckingSettlement}
                  className="btn-primary mt-3 w-full justify-center gap-2 px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isCheckingSettlement ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ReceiptText className="h-3.5 w-3.5" />}
                  Verify settlement
                </button>

                {!stellarAccount && (
                  <p className="mt-3 text-xs leading-5">
                    Link a Stellar account before recording settlements.
                  </p>
                )}
                {settlementMessage && (
                  <p className="mt-3 text-xs leading-5">
                    {settlementMessage}
                  </p>
                )}

                {stellarSettlements.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {stellarSettlements.slice(0, 3).map((record) => (
                      <div key={record.settlementId} className="rounded-lg border px-3 py-2 text-xs">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-semibold">{record.status}</span>
                          <span className="font-mono">{record.assetCode}</span>
                        </div>
                        <p className="mt-1 break-all font-mono text-[10px]">
                          {record.txHash}
                        </p>
                        <p className="mt-1 text-[10px]">
                          {record.ledger ? `Ledger ${record.ledger}` : "No ledger confirmation"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="baraza-card p-5">
                <h2 className="mb-4 font-mono text-xs uppercase tracking-widest">
                  Active roles
                </h2>
                <p className="text-sm">
                  No group roles yet. Join a DAO or launch one to receive your first role.
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
                    {myMemberships.map(({ record, community }) => (
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
                              <span>Joined {formatRailDate(record.joinedAt, chainMeta, { month: 'short', year: 'numeric' })}</span>
                              <span>{formatRailAmountFromKes(community.membershipFee, chainMeta)}/mo</span>
                              <span className="font-semibold text-primary">
                                {record.razaBalance} RAZA
                              </span>
                            </div>
                          </div>
                          <ArrowRight className="h-4 w-4 shrink-0" />
                        </Link>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed p-8 text-center">
                    <p className="font-display text-base font-semibold">
                      Not a member of any DAO yet
                    </p>
                    <p className="mt-2 text-sm">
                      Join a DAO to receive your membership credential and vote on proposals.
                    </p>
                    <div className="mt-5 flex flex-col items-center justify-center gap-2 sm:flex-row">
                      <Link to="/communities" className="btn-warm inline-flex items-center gap-2 text-sm">
                        <Compass className="h-4 w-4" />
                        Browse DAOs
                      </Link>
                      <Link to="/create" className="btn-ghost inline-flex items-center gap-2 text-sm">
                        <PlusCircle className="h-4 w-4" />
                        Launch a DAO
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
                          to={`/bounties/${bounty.id}`}
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
                              {community.name} - {formatRailAmountFromKes(bounty.rewardKes, chainMeta)} - {bounty.submissions} submissions
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
                    No votes yet. Once you join a group and vote on a proposal, your record appears here.
                  </p>
                </div>

                <div className="baraza-card p-5">
                  <h2 className="mb-4 font-mono text-xs uppercase tracking-widest">
                    Membership credentials
                  </h2>
                  <p className="text-sm">
                    Your membership credentials appear here once you join a group.
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
