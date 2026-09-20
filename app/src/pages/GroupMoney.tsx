import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowDownLeft, ArrowUpRight, Download, Loader2, Repeat } from 'lucide-react';
import GroupWorkspace from '@/components/app/GroupWorkspace';
import { ListRow } from '@/components/app/ListRow';
import { AmountBlock } from '@/components/ui/amount-block';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Field, MoneyField, PhoneField } from '@/components/ui/field';
import { FilterChips } from '@/components/ui/filter-chips';
import { InlineError } from '@/components/ui/inline-error';
import { Sheet } from '@/components/ui/sheet';
import { SkeletonList } from '@/components/ui/skeletons';
import { StatusChip } from '@/components/ui/status-chip';
import { Stepper } from '@/components/ui/stepper';
import { useAccount } from '@/contexts/AccountContext';
import { useProposals } from '@/hooks/useProposals';
import { useToast } from '@/hooks/use-toast';
import { formatAccountDate } from '@/lib/accountLocale';
import { formatMajor, formatMoney, groupCurrency } from '@/lib/money';
import { PAYOUT_STEPS, partsNeeded, payoutStatusLabel, payoutStepIndex, requestPayoutQuote, sendPayout, TELCO_MAX_SINGLE_TX_MAJOR, tranchePlan, type PayoutStatus } from '@/lib/payouts';
import { toE164 } from '@/lib/phone';
import { proposalBucket } from '@/lib/proposalStatus';
import { apiFetch, errorField, submitGuard } from '@/lib/api';
import { sessionHeaders } from '@/lib/sessionHeaders';
import { fetchStatement, type StatementRow } from '@/lib/statement';
import type { Community } from '@/lib/constants';
import type { Decision } from '@/lib/dataStore';

/**
 * §13.18 Money — one URL for members and officers.
 *
 * Everyone: three balances and the trail, read from the same statement the
 * CSV export serves. Officers: the queue of passed votes waiting to be sent,
 * a confirm sheet before approving, and a Send to Phone sheet in the group's
 * currency. No stablecoin fields, no made-up exchange rate, no ledger jargon.
 */
export default function GroupMoney() {
  return (
    <GroupWorkspace
      title="Money"
      subtitle="What this group holds, and what has moved."
      gate={{ title: 'Sign in to see the money', description: 'Log in to view this group’s balances and record.' }}
      hideBanner
    >
      {({ community, isOfficer, frozen }) => <MoneyPanel community={community} isOfficer={isOfficer} frozen={frozen} />}
    </GroupWorkspace>
  );
}

function MoneyPanel({ community, isOfficer, frozen }: { community: Community; isOfficer: boolean; frozen: boolean }) {
  const [searchParams] = useSearchParams();
  const { all } = useProposals(community.id);
  const waiting = all.filter((decision) => proposalBucket(decision) === 'passed');
  const currency = groupCurrency(community);
  const hasBalance = typeof community.fundBalance === 'number';

  return (
    <div className="space-y-5">
      <section className="baraza-card p-5 md:p-6 text-center" aria-label="Balances">
        <div className="grid gap-4 text-center sm:grid-cols-3">
          <AmountBlock className="text-center" label="Total" amountMajor={hasBalance ? community.fundBalance : null} currency={currency} />
          <AmountBlock className="text-center" label="Reserved" amountMinor={community.encumberedBalanceMinor ?? null} currency={currency} size="md" />
          <AmountBlock className="text-center" label="Available" amountMinor={community.liquidVaultBalanceMinor ?? null} currency={currency} size="md" />
        </div>
      </section>

      {isOfficer ? (
        <>
          <WaitingToSend communityId={community.id} currency={currency} waiting={waiting} frozen={frozen} />
          <SendToPhone community={community} currency={currency} frozen={frozen} startOpen={searchParams.get('send') === '1'} />
        </>
      ) : null}

      <Trail communityId={community.id} isOfficer={isOfficer} />
    </div>
  );
}

// ── Trail ────────────────────────────────────────────────────────────────────

function Trail({ communityId, isOfficer }: { communityId: string; isOfficer: boolean }) {
  const account = useAccount();
  const [rows, setRows] = useState<StatementRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const headers = await sessionHeaders(account.getAccessToken);
    const result = await fetchStatement(communityId, headers, { limit: 50 });
    if (result.ok) {
      setRows(result.rows);
    } else {
      setRows(null);
      setError(result.message);
    }
    setLoading(false);
  }, [account.getAccessToken, communityId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section aria-labelledby="money-trail">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 id="money-trail" className="font-display text-base font-bold">
          Trail
        </h2>
        {isOfficer ? <ExportStatement communityId={communityId} /> : null}
      </div>

      {loading ? (
        <SkeletonList count={3} />
      ) : error ? (
        <InlineError message={error} onRetry={() => void load()} />
      ) : !rows || rows.length === 0 ? (
        <EmptyState title="No Movements Yet" body="Contributions and releases appear here once the first one settles." />
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li key={row.id}>
              <ListRow
                title={row.label}
                meta={`${formatAccountDate(row.at, undefined, { day: 'numeric', month: 'short', year: 'numeric' })} · ref ${row.reference}`}
                leading={
                  row.kind === 'in' ? (
                    <ArrowDownLeft className="h-5 w-5 text-muted-foreground" aria-hidden />
                  ) : row.kind === 'out' ? (
                    <ArrowUpRight className="h-5 w-5 text-muted-foreground" aria-hidden />
                  ) : (
                    <Repeat className="h-5 w-5 text-muted-foreground" aria-hidden />
                  )
                }
                trailing={
                  <span className="font-display text-sm font-bold tabular-nums">
                    {row.kind === 'out' ? '-' : ''}
                    {formatMoney(row.amountMinor, row.currency)}
                  </span>
                }
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

type StatementRange = 'all' | 'month' | 'quarter' | 'year';

const RANGE_OPTIONS: { key: StatementRange; label: string }[] = [
  { key: 'all', label: 'All Time' },
  { key: 'month', label: 'This Month' },
  { key: 'quarter', label: 'Last Quarter' },
  { key: 'year', label: 'This Year' },
];

/** Start and end dates (YYYY-MM-DD) for a statement range, in the browser's local calendar. */
export function statementRangeDates(range: StatementRange, now: Date = new Date()): { startDate?: string; endDate?: string } {
  const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const endDate = iso(now);
  if (range === 'month') return { startDate: iso(new Date(now.getFullYear(), now.getMonth(), 1)), endDate };
  if (range === 'year') return { startDate: iso(new Date(now.getFullYear(), 0, 1)), endDate };
  if (range === 'quarter') {
    const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    const previousStart = new Date(quarterStart.getFullYear(), quarterStart.getMonth() - 3, 1);
    const previousEnd = new Date(quarterStart.getFullYear(), quarterStart.getMonth(), 0);
    return { startDate: iso(previousStart), endDate: iso(previousEnd) };
  }
  return {};
}

function ExportStatement({ communityId }: { communityId: string }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [range, setRange] = useState<StatementRange>('all');

  async function run() {
    setBusy(true);
    try {
      const params = new URLSearchParams({ communityId, format: 'csv' });
      const dates = statementRangeDates(range);
      if (dates.startDate) params.set('startDate', dates.startDate);
      if (dates.endDate) params.set('endDate', dates.endDate);
      const result = await apiFetch(`/api/communities/statement?${params.toString()}`, { parse: 'none' });
      if (!result.ok) {
        toast({
          title: 'Export not available',
          description: result.error.kind === 'auth' || result.error.kind === 'forbidden' ? 'Sign in as an officer to download the statement.' : result.error.message,
          variant: 'destructive',
        });
        return;
      }
      const blob = await result.response.blob();
      const href = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = href;
      anchor.download = `baraza-statement-${communityId}${range === 'all' ? '' : `-${range}`}.csv`;
      anchor.click();
      URL.revokeObjectURL(href);
    } catch {
      toast({ title: 'Export failed', description: 'We could not reach Baraza. Check your connection and try again.', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <FilterChips options={RANGE_OPTIONS} value={range} onChange={setRange} aria-label="Statement range" />
    <Button type="button" variant="outline" size="sm" onClick={() => void run()} disabled={busy}>
      {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Download className="h-4 w-4" aria-hidden />}
      Export Statement
    </Button>
    </div>
  );
}

// ── Officer: approve ─────────────────────────────────────────────────────────

function WaitingToSend({
  communityId,
  currency,
  waiting,
  frozen,
}: {
  communityId: string;
  currency: string;
  waiting: Decision[];
  frozen: boolean;
}) {
  const account = useAccount();
  const { toast } = useToast();
  const [confirming, setConfirming] = useState<Decision | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function approve(decision: Decision) {
    setBusy(true);
    setError(null);
    try {
      const result = await submitGuard.run(`execute:${decision.id}`, () =>
        apiFetch('/api/governance/execute', {
          method: 'POST',
          body: { proposalId: decision.id, executorWallet: account.accountId, communityId },
        }),
      );
      if (!result) return; // a second tap while the first is in flight
      if (!result.ok) {
        setError(
          errorField<boolean>(result.error, 'circuitBreaker')
            ? 'Sends are on hold while the treasury is reconciled. See Settings.'
            : result.error.code === 'regulatory_compliance_violation'
              ? 'This SACCO must verify its licence before money can be sent. See Settings.'
              : result.error.code === 'already_executed'
                ? 'This send was already approved.'
                : result.error.code === 'invalid_status'
                  ? 'Only a passed vote can be sent.'
                  : result.error.message,
        );
        return;
      }
      setConfirming(null);
      toast({ title: 'Send Approved', description: 'The money can now be sent to a phone.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="baraza-card p-5 md:p-6" aria-labelledby="money-waiting">
      <h2 id="money-waiting" className="font-display text-base font-bold">
        Waiting to Send
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">Votes that passed and still hold money.</p>

      {waiting.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">Nothing is waiting to be sent.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {waiting.map((decision) => (
            <li key={decision.id}>
              <ListRow
                title={decision.title}
                meta={`${formatMajor(decision.fundingAmount, currency)} · passed ${formatAccountDate(decision.endsAt, undefined, { day: 'numeric', month: 'short' })}`}
                trailing={
                  frozen ? (
                    <StatusChip kind="hold" label="On Hold" />
                  ) : (
                    <Button type="button" size="sm" onClick={() => setConfirming(decision)}>
                      Approve Send
                    </Button>
                  )
                }
              />
            </li>
          ))}
        </ul>
      )}
      {frozen ? <p className="mt-3 text-sm text-muted-foreground">Sends are on hold while the treasury is reconciled. See Settings.</p> : null}

      <Sheet
        open={confirming !== null}
        onClose={() => {
          if (!busy) {
            setConfirming(null);
            setError(null);
          }
        }}
        title="Approve This Send?"
        description="Approving records your decision on the group record. The money moves when it is sent to a phone."
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setConfirming(null)} disabled={busy}>
              Cancel
            </Button>
            <Button type="button" onClick={() => confirming && void approve(confirming)} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              Approve Send
            </Button>
          </>
        }
      >
        {confirming ? (
          <div className="space-y-4">
            <AmountBlock label={confirming.title} amountMajor={confirming.fundingAmount} currency={currency} />
            <p className="text-sm text-muted-foreground">
              {confirming.votesFor} members supported and {confirming.votesAgainst} objected.
            </p>
            {error ? <InlineError message={error} /> : null}
          </div>
        ) : null}
      </Sheet>
    </section>
  );
}

// ── Officer: send ────────────────────────────────────────────────────────────

function SendToPhone({ community, currency, frozen, startOpen }: { community: Community; currency: string; frozen: boolean; startOpen: boolean }) {
  const [open, setOpen] = useState(startOpen);
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [quoteMissing, setQuoteMissing] = useState(false);
  const [status, setStatus] = useState<PayoutStatus | null>(null);
  const [plan, setPlan] = useState<number[] | null>(null);
  const [partsDone, setPartsDone] = useState(0);
  const [references, setReferences] = useState<string[]>([]);
  const [sentMinor, setSentMinor] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const e164 = toE164(phone, 'KE');
  const amountMajor = Number(amount);
  const amountMinor = Number.isFinite(amountMajor) && amountMajor > 0 ? Math.round(amountMajor * 100) : 0;
  const parts = partsNeeded(amountMinor, currency);
  const canSend = !frozen && !busy && e164 !== null && amountMinor > 0 && status === null;

  function reset() {
    setStatus(null);
    setPlan(null);
    setPartsDone(0);
    setReferences([]);
    setSentMinor(0);
    setError(null);
    setQuoteMissing(false);
  }

  /** Send every part of a plan in order with deterministic ids, stopping at the first failure. */
  async function sendPlan(nextPlan: number[], phoneE164: string) {
    const batchId = `payout-${community.id}-${Date.now().toString(36)}`;
    setPlan(nextPlan);
    setPartsDone(0);
    setStatus('OFFRAMP_INITIATED');
    for (let index = 0; index < nextPlan.length; index += 1) {
      const partMinor = nextPlan[index];
      const quote = await requestPayoutQuote({ communityId: community.id, amountMinor: partMinor, currency, phone: phoneE164 });
      if (!quote) {
        setStatus(null);
        setPlan(null);
        setQuoteMissing(true);
        return;
      }
      const result = await submitGuard.run(`payout:${batchId}:${index}`, () =>
        sendPayout({
          communityId: community.id,
          proposalId: nextPlan.length > 1 ? `${batchId}-tranche-${index + 1}` : batchId,
          phone: phoneE164,
          quote,
        }),
      );
      if (!result) return;
      if (!result.ok) {
        if (result.ceiling && nextPlan.length === 1) {
          // The server's ceiling is the truth; re-plan with its numbers and let the officer confirm.
          setStatus(null);
          setPlan(tranchePlan(amountMinor, currency, result.ceiling.maxAllowedMinor));
          setError(null);
          return;
        }
        setStatus('FAILED');
        setError(result.onHold ? 'Sends are on hold while the treasury is reconciled. See Settings.' : result.error ?? 'The provider did not accept this send.');
        return;
      }
      setStatus(result.status);
      setPartsDone(index + 1);
      if (result.reference) setReferences((prev) => [...prev, result.reference as string]);
      setSentMinor((prev) => prev + (result.fiatMinor ?? partMinor));
    }
  }

  async function send() {
    if (!canSend || !e164) return;
    setBusy(true);
    setError(null);
    setQuoteMissing(false);
    try {
      // Above the telco ceiling the officer sees the split first and confirms it.
      const nextPlan = plan ?? tranchePlan(amountMinor, currency);
      if (nextPlan.length > 1 && plan === null) {
        setPlan(nextPlan);
        return;
      }
      await sendPlan(nextPlan, e164);
    } finally {
      setBusy(false);
    }
  }

  const stepIndex = status ? payoutStepIndex(status) : 0;
  const finished = status === 'PROVIDER_PENDING_VERIFICATION' && plan !== null && partsDone === plan.length;
  const showingPlan = status === null && plan !== null && plan.length > 1;

  return (
    <>
      <div className="flex justify-end">
        <Button type="button" variant="outline" onClick={() => setOpen(true)} disabled={frozen}>
          {frozen ? 'On Hold — See Settings' : 'Send to Phone'}
        </Button>
      </div>

      <Sheet
        open={open}
        onClose={() => {
          if (!busy) {
            setOpen(false);
            reset();
          }
        }}
        title="Send to Phone"
        description="Money leaves the group only for a vote that passed and was approved."
        footer={
          finished || status === 'FAILED' || status === 'REVERSAL_DETECTED' ? (
            <Button type="button" onClick={() => { setOpen(false); reset(); }}>
              Done
            </Button>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={() => { if (showingPlan) { setPlan(null); } else { setOpen(false); reset(); } }} disabled={busy}>
                {showingPlan ? 'Back' : 'Cancel'}
              </Button>
              <Button type="button" onClick={() => void send()} disabled={!canSend}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                {showingPlan ? `Send ${plan.length} Parts` : parts > 1 ? 'Review the Split' : 'Send Now'}
              </Button>
            </>
          )
        }
      >
        <div className="space-y-4">
          {status === null && !showingPlan ? (
            <>
              <Field
                label="Recipient Phone"
                htmlFor="send-phone"
                help="The M-Pesa number that receives the money."
                error={phone.trim() && !e164 ? 'Enter a valid Kenyan mobile number.' : undefined}
              >
                <PhoneField id="send-phone" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="7XX XXX XXX" aria-invalid={Boolean(phone.trim() && !e164)} />
              </Field>
              <Field
                label="Amount"
                htmlFor="send-amount"
                help={
                  parts > 1
                    ? `Above ${formatMajor(TELCO_MAX_SINGLE_TX_MAJOR, 'KES')} per transaction, so this goes out in ${parts} parts.`
                    : 'Sent by M-Pesa. Other ways to send appear here when Baraza supports them.'
                }
              >
                <MoneyField id="send-amount" currency={currency} value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="50,000" />
              </Field>
              {quoteMissing ? (
                <InlineError
                  title="Sending is not available here yet"
                  message="Baraza has not quoted this send in the group's currency, so nothing was sent and nothing left the group. This needs the payout quote on the backend."
                />
              ) : null}
            </>
          ) : null}

          {showingPlan ? (
            <div className="space-y-3">
              <p className="text-sm">
                {formatMoney(amountMinor, currency)} is above the telco ceiling of {formatMajor(TELCO_MAX_SINGLE_TX_MAJOR, 'KES')} per transaction.
                Baraza will send it to {e164} in {plan.length} parts, one after the other. Each part is recorded separately.
              </p>
              <ol className="baraza-row divide-y divide-border rounded-2xl text-sm">
                {plan.map((partMinor, index) => (
                  <li key={index} className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-muted-foreground">Part {index + 1} of {plan.length}</span>
                    <span className="tabular-nums font-semibold">{formatMoney(partMinor, currency)}</span>
                  </li>
                ))}
              </ol>
              {error ? <InlineError message={error} /> : null}
            </div>
          ) : null}

          {status !== null ? (
            <>
              <Stepper steps={[...PAYOUT_STEPS]} current={stepIndex} failed={status === 'FAILED' || status === 'REVERSAL_DETECTED'} orientation="vertical" />
              <div className="space-y-2 text-sm">
                <StatusChip kind={status === 'FAILED' || status === 'REVERSAL_DETECTED' ? 'failed' : 'pending'} label={payoutStatusLabel(status)} size="md" />
                {plan && plan.length > 1 ? (
                  <p className="text-muted-foreground">{partsDone} of {plan.length} parts sent.</p>
                ) : null}
                {finished ? (
                  <p className="text-muted-foreground">
                    {formatMoney(sentMinor, currency)} is with the provider. Receipt on the phone is confirmed by the provider, not by this page; the group record updates when it lands.
                    {references.length ? ` Reference${references.length > 1 ? 's' : ''} ${references.join(', ')}.` : ''}
                  </p>
                ) : null}
              </div>
              {error ? <InlineError message={error} /> : null}
            </>
          ) : null}
        </div>
      </Sheet>
    </>
  );
}
