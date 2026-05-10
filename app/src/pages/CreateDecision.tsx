import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Vote, ArrowLeft, CheckCircle2, Info, Loader2 } from 'lucide-react';
import Layout from '@/components/Layout';
import { MOCK_COMMUNITIES } from '@/lib/constants';
import { formatKSh } from '@/lib/utils';
import { useWalletGuard } from '@/hooks/useWalletGuard';

const CreateDecision: React.FC = () => {
  const navigate = useNavigate();
  const { communityId } = useParams<{ communityId: string }>();
  const { requireWallet, isReady } = useWalletGuard({ action: 'propose decisions' });
  const [isCreated, setIsCreated] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    fundingAmount: '',
    duration: '7',
  });
  const [isPending, setIsPending] = useState(false);

  const community = MOCK_COMMUNITIES.find((c) => c.id === communityId) || MOCK_COMMUNITIES[0];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const isValid = !!(form.title.trim() && form.description.trim() && form.fundingAmount);
  const overBudget = Number(form.fundingAmount) > community.fundBalance;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || overBudget) return;
    await requireWallet(async () => {
      setIsPending(true);
      setIsPending(false);
      setIsCreated(true);
    });
  };

  if (isCreated) {
    return (
      <Layout>
        <section className="py-20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md mx-auto text-center"
            >
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-3">
                Decision Proposed!
              </h2>
              <p className="text-sm text-muted-foreground mb-2">
                "{form.title}" is now open for voting.
              </p>
              <p className="text-xs text-muted-foreground mb-8">
                Community members have {form.duration} days to vote.
              </p>
              <button
                onClick={() => navigate(`/dashboard/${community.id}`)}
                className="btn-primary text-sm"
              >
                Back to Dashboard
              </button>
            </motion.div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-10 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-lg mx-auto">
            {/* Back */}
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to {community.name}
            </button>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                  <Vote className="w-5 h-5 text-primary" />
                </div>
                <h1 className="font-display text-2xl font-bold text-foreground">Propose a Decision</h1>
              </div>
              <p className="text-sm text-muted-foreground mb-8">
                Submit a proposal for the community to vote on. Include how much funding is needed from the community fund.
              </p>
            </motion.div>

            {/* Fund info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="baraza-card p-4 mb-6 flex items-center gap-3 bg-surface"
            >
              <Info className="w-5 h-5 text-primary flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Available Community Fund</p>
                <p className="text-sm font-bold text-accent">{formatKSh(community.fundBalance)}</p>
              </div>
            </motion.div>

            {/* Form */}
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-2">
                  Decision Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g., Purchase Shared Equipment"
                  className="w-full bg-surface rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 border border-border transition-all"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe the decision, why it's needed, and how funds will be used..."
                  rows={5}
                  className="w-full bg-surface rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 border border-border transition-all resize-none"
                />
              </div>

              {/* Funding amount */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-2">
                  Funding Amount (KSh)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">KSh</span>
                  <input
                    type="number"
                    name="fundingAmount"
                    value={form.fundingAmount}
                    onChange={handleChange}
                    placeholder="50000"
                    min="0"
                    className="w-full bg-surface rounded-xl pl-14 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 border border-border transition-all"
                  />
                </div>
                {overBudget && (
                  <p className="text-xs text-destructive mt-1.5">
                    This exceeds the available community fund of {formatKSh(community.fundBalance)}
                  </p>
                )}
              </div>

              {/* Voting period */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-2">
                  Voting Period
                </label>
                <select
                  name="duration"
                  value={form.duration}
                  onChange={handleChange}
                  className="w-full bg-surface rounded-xl px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40 border border-border cursor-pointer appearance-none"
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
                  <p className="text-xs text-muted-foreground">
                    Connect your wallet to propose a decision
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
                    'Submit Decision for Voting'
                  )}
                </button>
              )}
            </motion.form>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default CreateDecision;
