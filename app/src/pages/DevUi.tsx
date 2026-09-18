import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Inbox, Vote } from 'lucide-react';
import Layout from '@/components/Layout';
import { IdentityStrip } from '@/components/app/IdentityStrip';
import { InitialsTile, ListRow } from '@/components/app/ListRow';
import { ReceiptCard } from '@/components/app/ReceiptCard';
import { SettingsSection } from '@/components/app/SettingsSection';
import { AmountBlock } from '@/components/ui/amount-block';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Field, Input, MoneyField, PhoneField, Select, Switch, Textarea } from '@/components/ui/field';
import { FilterChips } from '@/components/ui/filter-chips';
import { InlineError } from '@/components/ui/inline-error';
import { PageHeader } from '@/components/ui/page-header';
import { Sheet } from '@/components/ui/sheet';
import { SkeletonAmount, SkeletonHeader, SkeletonList } from '@/components/ui/skeletons';
import { StatusChip, type StatusKind } from '@/components/ui/status-chip';
import { Stepper } from '@/components/ui/stepper';
import { useToast } from '@/hooks/use-toast';
import { useSeo } from '@/lib/seo';

/**
 * Dev-only fixture page (`/dev/ui`). Every primitive in every state, with no
 * seeded data, so the team can check both themes and both breakpoints before
 * a screen is rebuilt on top of them. Production redirects home.
 */

const STATUS_KINDS: StatusKind[] = ['pending', 'confirmed', 'failed', 'hold', 'stale', 'info'];
const STATUS_LABELS: Record<StatusKind, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  failed: 'Failed',
  hold: 'On Hold',
  stale: 'Last Updated 2h Ago',
  info: 'Savings Chama',
};

const JOIN_STEPS = [
  { label: 'See Group' },
  { label: 'Pay' },
  { label: 'Confirming', description: 'Waiting for the provider.' },
  { label: "You're In" },
];

type VoteFilter = 'needs-you' | 'open' | 'passed' | 'sent' | 'did-not-pass';
const VOTE_FILTERS = [
  { key: 'needs-you' as const, label: 'Needs You', count: 2 },
  { key: 'open' as const, label: 'Open', count: 3 },
  { key: 'passed' as const, label: 'Passed', count: 1 },
  { key: 'sent' as const, label: 'Sent', count: 4 },
  { key: 'did-not-pass' as const, label: 'Did Not Pass', count: 0 },
];

function ToastFixture() {
  const { toast } = useToast();
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" onClick={() => toast({ title: 'Profile Photo Updated', description: 'Your new avatar is updated across the app.' })}>
        Show Toast
      </Button>
      <Button variant="outline" onClick={() => toast({ title: 'Push Not Enabled', description: 'This browser blocked notifications.', variant: 'destructive' })}>
        Show Destructive Toast
      </Button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="font-display text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

export default function DevUi() {
  useSeo({ title: 'UI fixtures', description: 'Development only.', noIndex: true });
  const [filter, setFilter] = useState<VoteFilter>('needs-you');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sms, setSms] = useState(true);
  const [push, setPush] = useState(false);

  if (!import.meta.env.DEV) return <Navigate to="/" replace />;

  return (
    <Layout>
      <div className="container mx-auto max-w-4xl space-y-12 px-4 py-10">
        <PageHeader
          title="UI fixtures"
          subtitle="Every primitive in every state. Development only."
          back={{ label: 'My Groups', to: '/home' }}
          action={<Button>Desktop Primary</Button>}
        />

        <Section title="Toasts">
          <ToastFixture />
        </Section>

        <Section title="Buttons">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Pay With M-Pesa</Button>
            <Button variant="outline">Back</Button>
            <Button variant="destructive">Log Out</Button>
            <Button variant="link">Why This Amount?</Button>
            <Button variant="icon" size="icon" aria-label="Close">
              ×
            </Button>
            <Button size="sm" variant="outline">
              Small Secondary
            </Button>
            <Button size="lg">Large Primary</Button>
            <Button disabled>Check Your Phone</Button>
          </div>
          <Button fullWidth className="sm:hidden">
            Full Width on Phones
          </Button>
        </Section>

        <Section title="Status chips">
          <div className="flex flex-wrap gap-2">
            {STATUS_KINDS.map((kind) => (
              <StatusChip key={kind} kind={kind} label={STATUS_LABELS[kind]} />
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {STATUS_KINDS.map((kind) => (
              <StatusChip key={kind} kind={kind} label={STATUS_LABELS[kind]} size="md" />
            ))}
          </div>
        </Section>

        <Section title="Amounts">
          <div className="baraza-card grid gap-4 p-5 sm:grid-cols-3">
            <AmountBlock label="Total" amountMinor={124850000} currency="KES" note="As of 12 Sep, 14:05." />
            <AmountBlock label="Reserved" amountMinor={null} size="md" />
            <AmountBlock label="Available" amountMinor={38500} currency="KES" size="md" />
          </div>
          <div className="baraza-card p-5">
            <AmountBlock label="Amount Due" amountMajor={500} currency="UGX" note="For September." />
          </div>
        </Section>

        <Section title="Identity strip">
          <div className="baraza-card p-5">
            <IdentityStrip
              name="Kibera Youth Collective"
              initials="KY"
              type="Savings chama"
              chip={<StatusChip kind="confirmed" label="Active" />}
              extra={<StatusChip kind="pending" label="Licence Pending" />}
            />
          </div>
          <div className="baraza-card p-4">
            <IdentityStrip name="Amani K." initials="AK" type="Treasurer" size="md" />
          </div>
        </Section>

        <Section title="List rows">
          <div className="space-y-2">
            <ListRow
              title="Purchase Shared Boda-Boda"
              meta="KES 85,000 · 3 days left"
              leading={<Vote className="h-5 w-5 text-muted-foreground" aria-hidden />}
              trailing={<StatusChip kind="pending" label="Open" />}
              to="/dev/ui"
            />
            <ListRow
              title="Mama Mboga Association"
              meta="Pay dues"
              leading={<InitialsTile initials="MM" />}
              trailing={<StatusChip kind="confirmed" label="Active" />}
              to="/dev/ui"
            />
            <ListRow
              title="Wanjiku M. paid dues"
              meta="12 Sep 2026"
              trailing={<span className="font-display text-sm font-bold tabular-nums">KES 500</span>}
            />
          </div>
        </Section>

        <Section title="Stepper">
          <div className="baraza-card p-5">
            <Stepper steps={JOIN_STEPS} current={2} />
          </div>
          <div className="baraza-card p-5">
            <Stepper steps={JOIN_STEPS} current={2} failed />
          </div>
          <div className="baraza-card p-5">
            <Stepper steps={JOIN_STEPS} current={4} />
          </div>
        </Section>

        <Section title="Filter chips">
          <FilterChips options={VOTE_FILTERS} value={filter} onChange={setFilter} aria-label="Vote filters" />
        </Section>

        <Section title="Empty, error, loading">
          <EmptyState
            icon={Inbox}
            title="No Votes Need You"
            body="When a member proposes a spend, it will appear here for you to support or object."
            primary={{ label: 'Propose a Spend', to: '/dev/ui' }}
            secondary={{ label: 'Go Home', to: '/dev/ui' }}
          />
          <InlineError
            title="We could not load the trail"
            message="Check your connection. Nothing you did has been lost."
            onRetry={() => undefined}
          />
          <InlineError message="M-Pesa is not available in this environment yet. Nothing has been charged." />
          <div className="baraza-card space-y-4 p-5">
            <SkeletonHeader />
            <SkeletonAmount />
            <SkeletonList count={2} />
          </div>
        </Section>

        <Section title="Fields">
          <div className="baraza-card grid gap-5 p-5 sm:grid-cols-2">
            <Field label="Group Name" htmlFor="f-name" help="Members see this on every receipt.">
              <Input id="f-name" placeholder="Milele Chama" />
            </Field>
            <Field label="M-Pesa Phone Number" htmlFor="f-phone" error="Enter a Kenyan mobile number, for example 712 345 678.">
              <PhoneField id="f-phone" placeholder="7XX XXX XXX" aria-invalid />
            </Field>
            <Field label="What You Collect" htmlFor="f-money">
              <MoneyField id="f-money" currency="KES" placeholder="500" />
            </Field>
            <Field label="Days to Vote" htmlFor="f-days">
              <Select id="f-days" defaultValue="7">
                <option value="3">3 days</option>
                <option value="7">7 days</option>
                <option value="14">14 days</option>
              </Select>
            </Field>
            <Field label="What This Is For" htmlFor="f-desc" optional className="sm:col-span-2">
              <Textarea id="f-desc" placeholder="Two motorcycles for members who need transport." />
            </Field>
            <div className="flex items-center justify-between gap-4 sm:col-span-2">
              <label htmlFor="f-sms" className="text-sm font-semibold">
                SMS
              </label>
              <Switch id="f-sms" checked={sms} onCheckedChange={setSms} aria-label="SMS notifications" />
            </div>
            <div className="flex items-center justify-between gap-4 sm:col-span-2">
              <label htmlFor="f-push" className="text-sm font-semibold">
                Push
              </label>
              <Switch id="f-push" checked={push} onCheckedChange={setPush} aria-label="Push notifications" />
            </div>
          </div>
        </Section>

        <Section title="Settings section">
          <SettingsSection
            id="rules"
            title="Rules"
            description="Locked once members join. A vote is needed to change them."
            isOfficer
            rows={[
              { label: 'Quorum', value: 'Half of members must vote' },
              { label: 'Threshold', value: 'Two thirds must agree' },
              { label: 'Voting lasts', value: '7 days' },
              { label: 'Paybill', value: 'Not Set', help: 'Safaricom assigns this.', officerOnly: true },
              {
                label: 'Statement',
                action: (
                  <Button size="sm" variant="outline">
                    Download CSV
                  </Button>
                ),
                officerOnly: true,
              },
            ]}
          />
        </Section>

        <Section title="Receipt">
          <div className="grid gap-4 md:grid-cols-3">
            <ReceiptCard
              amountMinor={50000}
              currency="KES"
              reference="QHX7K2M9PL"
              date="12 Sep 2026, 14:05"
              status="confirmed"
              disputeHref="/dev/ui"
              homeHref="/dev/ui"
            />
            <ReceiptCard
              amountMinor={50000}
              currency="KES"
              reference="QHX7K2M9PL"
              date="12 Sep 2026, 14:05"
              status="pending"
              note="Waiting for the provider to confirm. Do not pay again."
              homeHref="/dev/ui"
            />
            <ReceiptCard
              amountMinor={50000}
              currency="KES"
              reference="QHX7K2M9PL"
              date="12 Sep 2026, 14:05"
              status="failed"
              note="The provider rejected the request. Nothing was charged."
              onRetry={() => undefined}
              homeHref="/dev/ui"
            />
          </div>
        </Section>

        <Section title="Sheet">
          <Button variant="outline" onClick={() => setSheetOpen(true)}>
            Open Invite Sheet
          </Button>
          <Sheet
            open={sheetOpen}
            onClose={() => setSheetOpen(false)}
            title="Invite People"
            description="Anyone with this link can ask to join."
            footer={
              <>
                <Button variant="outline" onClick={() => setSheetOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setSheetOpen(false)}>Create Link</Button>
              </>
            }
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Expires In (Days)" htmlFor="s-days">
                <Input id="s-days" inputMode="numeric" defaultValue="14" />
              </Field>
              <Field label="Maximum Uses" htmlFor="s-uses">
                <Input id="s-uses" inputMode="numeric" defaultValue="25" />
              </Field>
            </div>
          </Sheet>
        </Section>
      </div>
    </Layout>
  );
}
