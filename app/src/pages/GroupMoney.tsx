import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowDownLeft, ArrowUpRight, Download, Loader2, Repeat } from 'lucide-react';
import GroupWorkspace from '@/components/app/GroupWorkspace';
import { ListRow } from '@/components/app/ListRow';
import { AmountBlock } from '@/components/ui/amount-block';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Field, MoneyField, PhoneField } from '@/components/ui/field';
import { InlineError } from '@/components/ui/inline-error';
import { Sheet } from '@/components/ui/sheet';
import { SkeletonList } from '@/components/ui/skeletons';
import { StatusChip } from '@/components/ui/status-chip';
import { Stepper } from '@/components/ui/stepper';
import { useAccount } from '@/contexts/AccountContext';
import { useDecisions } from '@/hooks/useBarazaData';
import { useToast } from '@/hooks/use-toast';
import { formatAccountDate } from '@/lib/accountLocale';
import { formatMajor, formatMoney, groupCurrency } from '@/lib/money';
import { partsNeeded, requestPayoutQuote, sendPayout, TELCO_MAX_SINGLE_TX_MAJOR, type PayoutStep } from '@/lib/payouts';
import { toE164 } from '@/lib/phone';
import { proposalBucket } from '@/lib/proposalStatus';
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
  const { all } = useDecisions(community.id);
  const waiting = all.filter((decision) => proposalBucket(decision) === 'passed');
  const currency = groupCurrency(community);
  const hasBalance = typeof community.fundBalance === 'number';

  return (
    <div className="space-y-5">
      <section className="baraza-card p-5 md:p-6" aria-label="Balances">
        <div className="grid gap-4 sm:grid-cols-3">
          <AmountBlock label="Total" amountMajor={hasBalance ? community.fundBalance : null} currency={currency} />
          {/* The statement is one pooled figure today; reserved and available
              stay honest until the server splits them. */}
          <AmountBlock label="Reserved" amountMajor={null} currency={currency} size="md" />
          <AmountBlock label="Available" amountMajor={null} currency={currency} size="md" />
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

function ExportStatement({ communityId }: { communityId: string }) {
  const account = useAccount();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    try {
      const headers = await sessionHeaders(account.getAccessToken);
      const res = await fetch(`/api/communities/statement?communityId=${encodeURIComponent(communityId)}&format=csv`, { headers });
      if (!res.ok) {
        toast({ title: 'Export not available', description: 'Sign in as an officer to download the statement.', variant: 'destructive' });
        return;
      }
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = href;
      anchor.download = `baraza-statement-${communityId}.csv`;
      anchor.click();
      URL.revokeObjectURL(href);
    } catch {
      toast({ title: 'Export failed', description: 'We could not reach Baraza. Check your connection and try again.', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={() => void run()} disabled={busy}>
      {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Download className="h-4 w-4" aria-hidden />}
      Export Statement
    </Button>
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
      const headers = await sessionHeaders(account.getAccessToken);
      const res = await fetch('/api/governance/execute', {
        method: 'POST',
        headers,
        body: JSON.stringify({ proposalId: decision.id, executorWallet: account.accountId, communityId }),
      });
      const body = (await res.json().catch(() => ({}))) as { message?: string; error?: string; circuitBreaker?: boolean };
      if (!res.ok) {
        setError(
          body.circuitBreaker
            ? 'Sends are on hold while the treasury is reconciled. See Settings.'
            : body.message ?? body.error ?? 'Baraza did not approve this send. Nothing was released.',
        );
        return;
      }
      setConfirming(null);
      toast({ title: 'Send Approved', description: 'The money can now be sent to a phone.' });
    } catch {
      setError('We could not reach Baraza. Nothing was released.');
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

const SEND_STEPS = [{ label: 'Queued' }, { label: 'Sent to Provider' }, { label: 'Received' }];

function SendToPhone({ community, currency, frozen, startOpen }: { community: Community; currency: string; frozen: boolean; startOpen: boolean }) {
  const account = useAccount();
  const [open, setOpen] = useState(startOpen);
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [quoteMissing, setQuoteMissing] = useState(false);
  const [step, setStep] = useState<PayoutStep | null>(null);
  const [reference, setReference] = useState<string | null>(null);
  const [receivedMinor, setReceivedMinor] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const e164 = toE164(phone, 'KE');
  const amountMajor = Number(amount);
  const amountMinor = Number.isFinite(amountMajor) && amountMajor > 0 ? Math.round(amountMajor * 100) : 0;
  const parts = partsNeeded(amountMinor, currency);
  const canSend = !frozen && !busy && e164 !== null && amountMinor > 0 && step === null;

  function reset() {
    setStep(null);
    setReference(null);
    setReceivedMinor(null);
    setError(null);
    setQuoteMissing(false);
  }

  async function send() {
    if (!canSend || !e164) return;
    setBusy(true);
    setError(null);
    setQuoteMissing(false);
    try {
      const quote = await requestPayoutQuote({ communityId: community.id, amountMinor, currency, phone: e164 });
      if (!quote) {
        // No endpoint quotes a send in the group's currency yet. Saying so is
        // the honest state; inventing a rate on the client is not.
        setQuoteMissing(true);
        return;
      }
      setStep('queued');
      const headers = await sessionHeaders(account.getAccessToken);
      setStep('provider');
      const result = await sendPayout({
        communityId: community.id,
        proposalId: `payout-${community.id}-${Date.now()}`,
        phone: e164,
        quote,
        headers,
      });
      if (!result.ok) {
        setStep('failed');
        setError(result.onHold ? 'Sends are on hold while the treasury is reconciled. See Settings.' : result.error ?? 'The provider did not complete this send.');
        return;
      }
      setReference(result.reference ?? null);
      setReceivedMinor(result.receivedMinor ?? null);
      setStep('received');
    } finally {
      setBusy(false);
    }
  }

  const stepIndex = step === 'queued' ? 0 : step === 'provider' ? 1 : step === 'received' ? 3 : step === 'failed' ? 1 : 0;

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
          step === 'received' || step === 'failed' ? (
            <Button type="button" onClick={() => { setOpen(false); reset(); }}>
              Done
            </Button>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={() => { setOpen(false); reset(); }} disabled={busy}>
                Cancel
              </Button>
              <Button type="button" onClick={() => void send()} disabled={!canSend}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                {parts > 1 ? 'Send in Parts' : 'Send Now'}
              </Button>
            </>
          )
        }
      >
        <div className="space-y-4">
          {step === null ? (
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
          ) : (
            <>
              <Stepper steps={SEND_STEPS} current={stepIndex} failed={step === 'failed'} orientation="vertical" />
              {step === 'received' ? (
                <div className="space-y-2 text-sm">
                  <StatusChip kind="confirmed" label="Received" size="md" />
                  <p className="text-muted-foreground">
                    {receivedMinor !== null ? `${formatMoney(receivedMinor, currency)} received.` : 'The provider confirmed receipt.'}
                    {reference ? ` Reference ${reference}.` : ''}
                  </p>
                </div>
              ) : null}
              {error ? <InlineError message={error} /> : null}
            </>
          )}
        </div>
      </Sheet>
    </>
  );
}
