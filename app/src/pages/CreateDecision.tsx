import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Vote, ArrowLeft, Info, Loader2, ShieldCheck } from 'lucide-react';
import Layout from '@/components/Layout';
import { formatKSh } from '@/lib/utils';
import { useWalletGuard } from '@/hooks/useWalletGuard';
import { useToast } from '@/hooks/use-toast';
import { useCommunity } from '@/hooks/useCommunities';
import CommunityBanner from '@/components/CommunityBanner';
import { DEFAULT_GOVERNANCE } from '@/lib/constants';
import { useSeo } from '@/lib/seo';

const CreateDecision: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { requireWallet, isReady } = useWalletGuard({ action: 'submit governance proposals' });
  const { toast } = useToast();
  const [form, setForm] = useState({
    title: '',
    description: '',
    fundingAmount: '',
    duration: '7',
  });
  const [isPending, setIsPending] = useState(false);

  const { community, isLoading, error } = useCommunity(id);

  useSeo({
    title: community ? `New proposal — ${community.name}` : "New proposal",
    description: "Submit a governance proposal for funding, rule changes, or treasury releases.",
    path: id ? `/dashboard/${id}/decisions/create` : undefined,
    noIndex: true,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const isValid = !!(form.title.trim() && form.description.trim() && form.fundingAmount);

  if (isLoading) {
    return (
      <Layout>
        <section className="py-10 md:py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-lg mx-auto space-y-5">
              {/* Back button skeleton */}
              <div className="h-4 w-24 rounded bg-muted animate-pulse" />
              {/* Banner skeleton */}
              <div className="baraza-card animate-pulse p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-muted" />
                  <div className="h-6 w-48 rounded bg-muted" />
                </div>
                <div className="h-3 w-full rounded bg-muted" />
                <div className="h-3 w-2/3 rounded bg-muted" />
              </div>
              {/* Info bar skeleton */}
              <div className="baraza-card animate-pulse p-4 flex items-center gap-3">
                <div className="h-5 w-5 rounded bg-muted flex-shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-2.5 w-32 rounded bg-muted" />
                  <div className="h-4 w-24 rounded bg-muted" />
                </div>
              </div>
              {/* Governance rules skeleton */}
              <div className="rounded-lg border p-4 animate-pulse space-y-2">
                <div className="h-3 w-32 rounded bg-muted" />
                <div className="h-3 w-full rounded bg-muted" />
              </div>
              {/* Form field skeletons */}
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2 animate-pulse">
                  <div className="h-3 w-28 rounded bg-muted" />
                  <div className="h-11 w-full rounded-xl bg-muted" />
                </div>
              ))}
              {/* Submit button skeleton */}
              <div className="h-12 w-full rounded-xl bg-muted animate-pulse" />
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  if (!community) {
    return (
      <Layout>
        <section className="py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-display text-2xl font-bold mb-3">
              Community not found
            </h1>
            <p className="text-sm mb-6">
              {error?.message ?? 'This proposal cannot be created because the community is not available in the current data.'}
            </p>
            <Link to="/communities" className="btn-primary text-sm inline-flex">
              View Communities
            </Link>
          </div>
        </section>
      </Layout>
    );
  }

  const overBudget = Number(form.fundingAmount) > community.fundBalance;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || overBudget) return;
    await requireWallet(async () => {
      setIsPending(true);
      try {
        toast({
          title: 'Proposal submission — coming soon',
          description: 'Voting opens once the on-chain governance program ships. Thanks for trying it early.',
        });
      } finally {
        setIsPending(false);
      }
    });
  };

  return (
    <Layout>
      <section className="py-10 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-lg mx-auto">
            {/* Back */}
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-sm mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to {community.name}
            </button>

            <CommunityBanner className="mb-6 p-5">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center">
                  <Vote className="w-5 h-5" />
                </div>
                <h1 className="font-display text-2xl font-bold">Submit a Governance Proposal</h1>
              </div>
              <p className="text-sm mb-8">
                Submit a proposal for the community DAO to vote on. Include how much funding is needed from the treasury.
              </p>
            </div>
            </CommunityBanner>

            {/* Fund info */}
            <div className="baraza-card p-4 mb-4 flex items-center gap-3">
              <Info className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="text-xs">Available DAO Treasury</p>
                <p className="text-sm font-bold">{formatKSh(community.fundBalance)}</p>
              </div>
            </div>

            {/* Governance rules */}
            <div className="mb-6 rounded-lg border p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest">
                <ShieldCheck className="h-3.5 w-3.5" />
                Governance rules
              </div>
              <p className="mt-2 text-xs leading-5">
                This DAO requires{" "}
                <strong>{community.quorumPct ?? DEFAULT_GOVERNANCE.quorumPct}% quorum</strong>{" "}
                and{" "}
                <strong>
                  {community.approvalThresholdPct ?? DEFAULT_GOVERNANCE.approvalThresholdPct}% approval
                </strong>
                . Voting closes automatically when the period ends.
              </p>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold mb-2">
                  Proposal Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g., Purchase Shared Equipment"
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none border"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe the decision, why it's needed, and how funds will be used..."
                  rows={5}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none border resize-none"
                />
              </div>

              {/* Funding amount */}
              <div>
                <label className="block text-xs font-semibold mb-2">
                  Funding Amount (KSh)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium">KSh</span>
                  <input
                    type="number"
                    name="fundingAmount"
                    value={form.fundingAmount}
                    onChange={handleChange}
                    placeholder="50000"
                    min="0"
                    className="w-full rounded-xl pl-14 pr-4 py-3 text-sm outline-none border"
                  />
                </div>
                {overBudget && (
                  <p className="text-xs mt-1.5">
                    This exceeds the available DAO treasury of {formatKSh(community.fundBalance)}
                  </p>
                )}
              </div>

              {/* Voting period */}
              <div>
                <label className="block text-xs font-semibold mb-2">
                  Voting Period
                </label>
                <select
                  name="duration"
                  value={form.duration}
                  onChange={handleChange}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none border cursor-pointer appearance-none"
                >
                  <option value="3">3 days</option>
                  <option value="7">7 days</option>
                  <option value="14">14 days</option>
                  <option value="30">30 days</option>
                </select>
              </div>

              {/* Submit */}
              {!isReady ? (
                <div className="baraza-card p-4 text-center">
                  <p className="text-xs">
                    Connect your wallet to submit a governance proposal
                  </p>
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={!isValid || isPending || overBudget}
                  className="w-full btn-primary text-sm py-3.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Proposal for Vote'
                  )}
                </button>
              )}
            </form>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default CreateDecision;
