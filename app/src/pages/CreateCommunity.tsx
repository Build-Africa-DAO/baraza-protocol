import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Check, Loader2 } from 'lucide-react';
import Layout from '@/components/Layout';
import { AskAkili } from '@/akili/AskAkili';
import { SettingsSection } from '@/components/app/SettingsSection';
import { AmountBlock } from '@/components/ui/amount-block';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Field, Input, MoneyField, Select, Textarea } from '@/components/ui/field';
import { FilterChips } from '@/components/ui/filter-chips';
import { InlineError } from '@/components/ui/inline-error';
import { PageHeader } from '@/components/ui/page-header';
import { Stepper } from '@/components/ui/stepper';
import { useAccount } from '@/contexts/AccountContext';
import { createCommunityRecord } from '@/lib/communities';
import { DEFAULT_GOVERNANCE } from '@/lib/constants';
import { useSeo } from '@/lib/seo';
import { cn } from '@/lib/utils';
import { rulesSentence } from '@/lib/voteCopy';

/**
 * §13.10 Start a Group — one URL, three steps.
 *
 * 1. What kind of group (one choice). 2. Name, what you collect, who must
 * vote, in words. 3. Open it. There is no launch fee in this environment
 * because no endpoint quotes one, so step 3 says so and creates the record.
 * The group is only called "open" once the record exists. No payment
 * methods, chains, tiers, add-ons or checklists that cannot be true.
 */
const KINDS = [
  { value: 'savings', label: 'Chama', help: 'Members save together and decide as a group how the pot is used.' },
  { value: 'sacco', label: 'SACCO', help: 'A registered savings and credit cooperative. Lending stays off until the licence is verified.' },
  { value: 'cooperative', label: 'Cooperative', help: 'Members pool money for shared purchases, transport or bargaining.' },
  { value: 'welfare', label: 'Welfare', help: 'A fund members draw on for emergencies, funerals and medical costs.' },
  { value: 'investment', label: 'Investment', help: 'Members contribute to buy assets or back ventures together.' },
] as const;

type Kind = (typeof KINDS)[number]['value'];

const LEGACY_TYPE_MAP: Record<string, Kind> = {
  chama: 'savings',
  savings: 'savings',
  stokvel: 'savings',
  sacco: 'sacco',
  housing: 'sacco',
  cooperative: 'cooperative',
  welfare: 'welfare',
  investment: 'investment',
};

const QUORUM_OPTIONS = [50, 51, 60, 66, 75];
const THRESHOLD_OPTIONS = [51, 60, 66, 75];
const DAY_OPTIONS = [3, 7, 14, 30];
type FeeType = 'one_time' | 'recurring_monthly' | 'free';

const FEE_TYPES: { value: FeeType; label: string }[] = [
  { value: 'recurring_monthly', label: 'Monthly Dues' },
  { value: 'one_time', label: 'One-Time Fee' },
  { value: 'free', label: 'Free to Join' },
];

const FEE_TYPE_HELP: Record<FeeType, string> = {
  recurring_monthly: 'Members pay this amount every month. Dues reminders and streaks follow it.',
  one_time: 'Members pay once to join. Nothing is collected after that unless a vote decides otherwise.',
  free: 'Members pay nothing to join or each month.',
};

const STEPS = [{ label: 'Kind of Group' }, { label: 'Name and Rules' }, { label: 'Open' }];
const GATE = { title: 'Sign in to start a group', description: 'Create an account or log in before you set up a chama, SACCO or cooperative.' };

export default function CreateCommunity() {
  useSeo({
    title: 'Start a group',
    description: 'Choose the kind of group, name it, set what members pay and how they vote, and open it.',
    path: '/create',
  });
  const account = useAccount();
  const [searchParams] = useSearchParams();
  const requested = searchParams.get('type') ?? '';
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [kind, setKind] = useState<Kind | null>(LEGACY_TYPE_MAP[requested] ?? null);
  const [name, setName] = useState(() => (searchParams.get('name') ?? '').slice(0, 80));
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [feeType, setFeeType] = useState<FeeType>('recurring_monthly');
  const free = feeType === 'free';
  const [quorum, setQuorum] = useState(String(DEFAULT_GOVERNANCE.quorumPct));
  const [threshold, setThreshold] = useState(String(DEFAULT_GOVERNANCE.approvalThresholdPct));
  const [days, setDays] = useState(String(DEFAULT_GOVERNANCE.votingPeriodDays));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ id: string; name: string } | null>(null);

  const currency = account.country.currency;
  const amountNumber = Number(amount);
  const amountOk = free || (amount.trim() !== '' && Number.isFinite(amountNumber) && amountNumber > 0);
  const step2Valid = name.trim().length >= 3 && description.trim().length >= 10 && amountOk;
  const rules = rulesSentence({ quorumPct: Number(quorum), approvalThresholdPct: Number(threshold), votingPeriodDays: Number(days) });

  async function openGroup() {
    if (!kind || !step2Valid || busy) return;
    setBusy(true);
    setError(null);
    try {
      const community = await createCommunityRecord({
        name: name.trim(),
        type: kind,
        description: description.trim(),
        membershipFee: free ? 0 : amountNumber,
        activationFeeMinor: free ? 0 : Math.round(amountNumber * 100),
        feeType,
        carrierPassThrough: true,
        currency,
        quorumPct: Number(quorum),
        approvalThresholdPct: Number(threshold),
        votingPeriodDays: Number(days),
        createdBy: account.accountId ?? undefined,
        verificationTier: 'activation',
      });
      setCreated({ id: community.id, name: community.name });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The group was not created. Nothing was saved; try again.');
    } finally {
      setBusy(false);
    }
  }

  if (created) {
    return (
      <Layout gate={GATE}>
        <section className="py-8 md:py-12">
          <div className="mx-auto w-full max-w-5xl space-y-6 px-4 md:px-6">
            <Stepper steps={STEPS} current={3} />
            <EmptyState
              icon={Check}
              title="Your Group Is Open"
              body={`${created.name} exists on Baraza. It works once there are people in it, so invite your first members now.`}
              primary={{ label: 'Invite People', to: `/dashboard/${created.id}/people` }}
              secondary={{ label: 'Go to Group', to: `/dashboard/${created.id}` }}
            />
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout gate={GATE}>
      <section className="py-8 md:py-12">
        <div className="mx-auto w-full max-w-5xl space-y-6 px-4 md:px-6">
          <PageHeader
            title={step === 0 ? 'What Kind of Group?' : step === 1 ? 'Name Your Group' : 'Open This Group'}
            subtitle={`Step ${step + 1} of 3`}
            back={step === 0 ? { label: 'My Groups', to: '/home' } : undefined}
            centered
          />
          <Stepper steps={STEPS} current={step} />

          {step === 0 ? (
            <div className="space-y-5">
              <div className="grid gap-4 py-1 sm:grid-cols-2 lg:grid-cols-3" role="radiogroup" aria-label="Kind of group">
                {KINDS.map((option) => {
                  const selected = kind === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setKind(option.value)}
                      className={cn(
                        'baraza-card-3d flex min-h-24 items-start gap-3.5 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                        selected ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground',
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          'mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full transition-all duration-200',
                          selected
                            ? 'bg-primary-foreground text-primary shadow-sm'
                            : 'bg-black/5 text-transparent dark:bg-white/10 shadow-[inset_0_1px_2px_rgba(0,0,0,0.12)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]',
                        )}
                      >
                        {selected ? <Check className="h-3 w-3 stroke-[3]" /> : null}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={cn('block font-display text-base font-bold', selected ? 'text-primary-foreground' : 'text-foreground')}>
                          {option.label}
                        </span>
                        <span className={cn('mt-1 block text-sm leading-snug', selected ? 'text-primary-foreground/90' : 'text-muted-foreground')}>
                          {option.help}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                {kind === 'sacco' ? (
                  <p className="text-sm text-muted-foreground max-w-xl">
                    Regulated lending stays off until officers add the SACCO licence in Settings. Dues and votes work from day one.
                  </p>
                ) : null}
                <Button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={!kind}
                  className="sm:w-auto shrink-0 sm:ml-auto"
                >
                  Continue
                </Button>
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
              <div className="space-y-5">
                <section className="baraza-card space-y-5 p-5">
                  <Field label="Group Name" htmlFor="create-name" help="What members call it. At least three characters." error={name && name.trim().length < 3 ? 'Give the group a name of at least three characters.' : undefined}>
                    <Input id="create-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Milele Chama" maxLength={80} aria-invalid={Boolean(name && name.trim().length < 3)} />
                  </Field>
                  <Field
                    label="What This Group Does"
                    htmlFor="create-description"
                    help={
                      description.length > 0
                        ? 'One or two sentences members will see when they join. At least 10 characters.'
                        : 'One or two sentences members will see when they join.'
                    }
                  >
                    <Textarea
                      id="create-description"
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="Monthly savings for members' school fees and emergencies."
                      maxLength={500}
                      aria-invalid={Boolean(description && description.trim().length < 10)}
                    />
                  </Field>
                </section>

                <section className="baraza-card space-y-5 p-5">
                  <div className="text-center">
                    <h2 className="font-display text-base font-bold">What Members Pay</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{FEE_TYPE_HELP[feeType]}</p>
                  </div>
                  <FilterChips
                    options={FEE_TYPES.map((item) => ({ key: item.value, label: item.label }))}
                    value={feeType}
                    onChange={setFeeType}
                    aria-label="What members pay"
                  />
                  {!free ? (
                    <Field
                      label={feeType === 'one_time' ? 'One-Time Fee to Join' : 'What You Collect Each Month'}
                      htmlFor="create-amount"
                      help={`In ${currency}, the currency of your account country.`}
                      error={amount && !amountOk ? 'Enter an amount above zero.' : undefined}
                    >
                      <MoneyField id="create-amount" currency={currency} value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="500" aria-invalid={Boolean(amount && !amountOk)} />
                    </Field>
                  ) : null}
                </section>

                <section className="baraza-card space-y-5 p-5">
                  <div className="text-center">
                    <h2 className="font-display text-base font-bold">Who Must Vote</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{rules}</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field label="Must Vote" htmlFor="create-quorum">
                      <Select id="create-quorum" value={quorum} onChange={(event) => setQuorum(event.target.value)}>
                        {QUORUM_OPTIONS.map((value) => (
                          <option key={value} value={value}>
                            {value}% of members
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Must Agree" htmlFor="create-threshold">
                      <Select id="create-threshold" value={threshold} onChange={(event) => setThreshold(event.target.value)}>
                        {THRESHOLD_OPTIONS.map((value) => (
                          <option key={value} value={value}>
                            {value}% of votes
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Voting Lasts" htmlFor="create-days">
                      <Select id="create-days" value={days} onChange={(event) => setDays(event.target.value)}>
                        {DAY_OPTIONS.map((value) => (
                          <option key={value} value={value}>
                            {value} days
                          </option>
                        ))}
                      </Select>
                    </Field>
                  </div>
                  <AskAkili prompt={`Suggest quorum, approval threshold and monthly dues for a ${KINDS.find((k) => k.value === kind)?.label ?? 'group'} of about 20 members.`} label="Suggest a Setup" variant="chip" />
                </section>

                <div className="flex flex-col gap-2 sm:flex-row-reverse">
                  <Button type="button" onClick={() => setStep(2)} disabled={!step2Valid}>
                    Continue
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setStep(0)}>
                    Back
                  </Button>
                </div>
              </div>

              <aside className="hidden lg:block">
                <Summary kind={kind} name={name} free={free} oneTime={feeType === 'one_time'} amount={amountNumber} currency={currency} rules={rules} />
              </aside>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-5">
              <div className="grid gap-5 lg:grid-cols-2">
                <Summary kind={kind} name={name} free={free} oneTime={feeType === 'one_time'} amount={amountNumber} currency={currency} rules={rules} />
                <SettingsSection
                  title="Opening Fee"
                  rows={[{ label: 'To open this group', value: 'No launch fee in this environment', help: 'Baraza has not quoted an opening charge for this group, so nothing is charged to open it.' }]}
                />
              </div>
              {error ? <InlineError message={error} /> : null}
              <div className="flex flex-col gap-2 sm:flex-row-reverse">
                <Button type="button" onClick={() => void openGroup()} disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                  Create Group
                </Button>
                <Button type="button" variant="outline" onClick={() => setStep(1)} disabled={busy}>
                  Back
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                By opening a group you agree to keep its record honest for every member. Read{' '}
                <Link to="/help" className="font-semibold text-foreground underline-offset-4 hover:underline">
                  Help
                </Link>{' '}
                for how dues and votes work.
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </Layout>
  );
}

function Summary({ kind, name, free, oneTime = false, amount, currency, rules }: { kind: Kind | null; name: string; free: boolean; oneTime?: boolean; amount: number; currency: string; rules: string }) {
  const kindLabel = KINDS.find((k) => k.value === kind)?.label ?? 'Group';
  return (
    // Eugene (13 Sept 2026): the summary is the one card on this page that is
    // the person's own group, so it takes the brand orange fill to stand apart
    // from the form and fee cards. Every child colour is overridden to white
    // so AmountBlock's greys stay legible on orange.
    <section
      className="space-y-4 rounded-2xl border border-primary bg-primary p-5 text-primary-foreground shadow-card lg:sticky lg:top-4 [&_.text-foreground]:text-primary-foreground [&_.text-muted-foreground]:text-primary-foreground/80"
      aria-label="Summary"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground/80">{kindLabel}</p>
        <p className="mt-1 font-display text-lg font-bold">{name.trim() || 'Your group'}</p>
      </div>
      {free ? (
        <p className="text-sm">Free to join.</p>
      ) : (
        <AmountBlock label={oneTime ? 'To Join' : 'Each Month'} amountMajor={Number.isFinite(amount) && amount > 0 ? amount : null} currency={currency} size="md" unavailableLabel="Amount not set yet" />
      )}
      <p className="text-sm text-primary-foreground/80">{rules}</p>
    </section>
  );
}
