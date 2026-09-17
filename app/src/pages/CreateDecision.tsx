import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import GroupWorkspace from '@/components/app/GroupWorkspace';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Field, Input, MoneyField, Select, Textarea } from '@/components/ui/field';
import { InlineError } from '@/components/ui/inline-error';
import { useAccount } from '@/contexts/AccountContext';
import { useCreateDecision } from '@/hooks/useBarazaData';
import { groupCurrency } from '@/lib/money';
import { rulesSentence } from '@/lib/voteCopy';
import { formatMoney } from '@/lib/money';
import { renderMarkdownLite } from '@/lib/markdownLite';
import { StatusChip } from '@/components/ui/status-chip';
import type { Community } from '@/lib/constants';

/**
 * §13.15 Propose a Spend.
 *
 * Title, what it is for, amount in the group's currency, days to vote, and the
 * rules in one sentence. Publishing is pending until the store accepts it;
 * then the member lands on the vote itself. No wallet, no token gate: a
 * member of the group may propose.
 */
export default function CreateDecision() {
  return (
    <GroupWorkspace
      title="Propose a Spend"
      subtitle="Members vote before any money leaves the group."
      gate={{ title: 'Sign in to propose', description: 'Log in to propose a spend for this group.' }}
      hideBanner
    >
      {({ community, isMember, membership }) => (
        <ProposeForm community={community} isMember={isMember} pending={membership.status === 'pending'} />
      )}
    </GroupWorkspace>
  );
}

/** 1 to 30 days: the backend window is at least 24 hours and at most 30 days. */
const DAY_OPTIONS = [1, 3, 7, 14, 30];

function ProposeForm({ community, isMember, pending }: { community: Community; isMember: boolean; pending: boolean }) {
  const navigate = useNavigate();
  const account = useAccount();
  const { create } = useCreateDecision();
  const currency = groupCurrency(community);
  const [title, setTitle] = useState('');
  const [purpose, setPurpose] = useState('');
  const [amount, setAmount] = useState('');
  const [days, setDays] = useState(String(community.votingPeriodDays ?? 7));
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isMember) {
    return (
      <EmptyState
        title="Join This Group to Propose"
        body="Only members can put a spend to the vote."
        primary={{ label: 'Join This Group', to: `/join/${community.id}` }}
        secondary={{ label: 'See Votes', to: `/dashboard/${community.id}/votes` }}
      />
    );
  }

  if (pending) {
    return (
      <EmptyState
        title="Your Membership Is Being Confirmed"
        body="You can propose a spend once your payment is confirmed."
        primary={{ label: 'See Status', to: `/join/${community.id}/status` }}
      />
    );
  }

  const amountNumber = Number(amount);
  const amountOk = amount.trim() !== '' && Number.isFinite(amountNumber) && amountNumber > 0;
  const daysNumber = Number(days);
  const daysOk = Number.isFinite(daysNumber) && daysNumber >= 1 && daysNumber <= 30;
  const valid = title.trim().length > 0 && purpose.trim().length > 0 && amountOk && daysOk;
  // What the group can send now, when the backend shares it; otherwise the pooled total.
  const availableMinor =
    typeof community.liquidVaultBalanceMinor === 'number'
      ? community.liquidVaultBalanceMinor
      : typeof community.fundBalance === 'number'
        ? Math.round(community.fundBalance * 100)
        : null;
  const requestedMinor = amountOk ? Math.round(amountNumber * 100) : 0;
  const exceedsAvailable = availableMinor !== null && requestedMinor > availableMinor;

  async function publish(event: React.FormEvent) {
    event.preventDefault();
    if (!valid || busy) return;
    setBusy(true);
    setError(null);
    try {
      const decision = await create({
        communityId: community.id,
        title: title.trim(),
        description: purpose.trim(),
        fundingAmount: amountNumber,
        proposedBy: account.displayName,
        proposer: account.accountId ?? account.displayName,
        quorumPct: community.quorumPct,
        durationDays: Number(days),
      });
      if (!decision) {
        setError('The proposal was not saved. Nothing was published; try again.');
        return;
      }
      navigate(`/dashboard/${community.id}/votes/${decision.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The proposal was not saved. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(event) => void publish(event)} className="space-y-5" noValidate>
      <div className="baraza-card space-y-5 p-5">
        <Field label="Title" htmlFor="propose-title" help="What you would tell the group in one line.">
          <Input
            id="propose-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Purchase shared equipment"
            maxLength={120}
            required
          />
        </Field>
        <Field
          label="What This Is For"
          htmlFor="propose-purpose"
          help={preview ? 'This is how members will read it.' : 'Plain text. Use a blank line between paragraphs, “- ” for a list, **bold** for emphasis.'}
        >
          <div className="mb-2 flex justify-end">
            <button
              type="button"
              onClick={() => setPreview((value) => !value)}
              aria-pressed={preview}
              className="min-h-12 rounded-full border border-border px-4 text-xs font-semibold text-muted-foreground hover:border-foreground/40 hover:text-foreground"
            >
              {preview ? 'Edit Text' : 'Preview'}
            </button>
          </div>
          {preview ? (
            <div className="min-h-[7.5rem] space-y-3 rounded-chrome border border-border bg-surface px-4 py-3 text-sm leading-6" data-testid="purpose-preview">
              {purpose.trim() ? renderMarkdownLite(purpose) : <p className="text-muted-foreground">Nothing written yet.</p>}
            </div>
          ) : (
            <Textarea
              id="propose-purpose"
              value={purpose}
              onChange={(event) => setPurpose(event.target.value)}
              placeholder="Why the group should spend this, and what members get."
              maxLength={2000}
              required
            />
          )}
        </Field>
        <Field
          label="Amount"
          htmlFor="propose-amount"
          help="Officers check this against what the group has available before anything is sent."
          error={amount.trim() !== '' && !amountOk ? 'Enter an amount above zero.' : undefined}
        >
          <MoneyField
            id="propose-amount"
            currency={currency}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="50,000"
            aria-invalid={amount.trim() !== '' && !amountOk}
            required
          />
        </Field>
        {exceedsAvailable && availableMinor !== null ? (
          <div className="flex flex-col gap-2 rounded-chrome border border-pending bg-pending/10 p-3 text-sm" role="status" data-testid="budget-guard">
            <StatusChip kind="pending" label="Above What Is Available" />
            <p className="text-muted-foreground">
              {formatMoney(requestedMinor, currency)} is more than the {formatMoney(availableMinor, currency)} the group can send today. If members approve, the send waits until dues collection covers it.
            </p>
          </div>
        ) : null}
        <Field label="Days to Vote" htmlFor="propose-days" help="At least one day, at most thirty.">
          <Select id="propose-days" value={days} onChange={(event) => setDays(event.target.value)}>
            {DAY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option === 1 ? '1 day' : `${option} days`}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <p className="text-sm text-muted-foreground">
        {rulesSentence({
          quorumPct: community.quorumPct,
          approvalThresholdPct: community.approvalThresholdPct,
          votingPeriodDays: Number(days),
        })}
      </p>

      {error ? <InlineError message={error} /> : null}

      <div className="flex flex-col gap-2 sm:flex-row-reverse">
        <Button type="submit" disabled={!valid || busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          {busy ? 'Publishing' : 'Publish Proposal'}
        </Button>
        <Button asChild variant="outline">
          <Link to={`/dashboard/${community.id}/votes`}>Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
