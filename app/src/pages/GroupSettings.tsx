import { useEffect, useState } from 'react';
import { Copy, Download, Loader2 } from 'lucide-react';
import GroupWorkspace from '@/components/app/GroupWorkspace';
import { InitialsTile, ListRow } from '@/components/app/ListRow';
import { SettingsSection } from '@/components/app/SettingsSection';
import { Button } from '@/components/ui/button';
import { Field, Input, MoneyField, Select, Textarea } from '@/components/ui/field';
import { InlineError } from '@/components/ui/inline-error';
import { Sheet } from '@/components/ui/sheet';
import { StatusChip } from '@/components/ui/status-chip';
import { SaccoComplianceBadge, type SaccoLicenseUiStatus } from '@/components/SaccoComplianceBadge';
import { useAccount } from '@/contexts/AccountContext';
import { useMembers } from '@/hooks/useBarazaData';
import { useToast } from '@/hooks/use-toast';
import { COMMUNITY_TYPES, DEFAULT_GOVERNANCE, type Community } from '@/lib/constants';
import { formatMajor, groupCurrency } from '@/lib/money';
import { apiFetch } from '@/lib/api';
import { useCommunityImage, useUserAvatar } from '@/lib/imageUpload';
import { rulesSentence } from '@/lib/voteCopy';
import type { Member } from '@/lib/dataStore';

/**
 * §13.19 Group Settings.
 *
 * Sections in a fixed order. Members read Identity, Rules and Dues and can
 * file a dispute; officers also see Paybill and USSD, Officers, the SACCO
 * licence (regulated types only) and Statements. Rows a member could never
 * act on are not shown to them at all — no "Locked" chips for things that
 * were never theirs.
 */
export default function GroupSettings() {
  return (
    <GroupWorkspace
      title="Group Settings"
      subtitle="Group rules, account links and controls."
      gate={{ title: 'Sign in to see settings', description: 'Log in to view this group’s rules.' }}
      hideBanner
    >
      {({ community, isMember, isOfficer }) => <SettingsPanel community={community} isMember={isMember} isOfficer={isOfficer} />}
    </GroupWorkspace>
  );
}

const REGULATED_TYPES = new Set(['sacco', 'cooperative', 'housing']);

function typeLabel(type: string): string {
  return COMMUNITY_TYPES.find((item) => item.value === type)?.label ?? type;
}

function initialsOf(name: string): string {
  const letters = name.replace(/[^a-z0-9 ]/gi, ' ').trim().split(/\s+/).filter(Boolean);
  const initials = letters.slice(0, 2).map((part) => part[0] ?? '').join('').toUpperCase();
  return initials || 'GP';
}

function SettingsPanel({ community, isMember, isOfficer }: { community: Community; isMember: boolean; isOfficer: boolean }) {
  const { toast } = useToast();
  const currency = groupCurrency(community);
  const { image, setImage, removeImage } = useCommunityImage(community.id, community.image);

  async function copyId() {
    try {
      await navigator.clipboard.writeText(community.id);
      toast({ title: 'Group Id Copied' });
    } catch {
      toast({ title: 'Could Not Copy', variant: 'destructive' });
    }
  }

  return (
    <div className="space-y-5">
      {!isOfficer ? (
        <p className="text-sm text-muted-foreground">
          These are the group's rules. Changing them, inviting people and exporting statements are officer actions.
        </p>
      ) : null}

      <SettingsSection
        id="identity"
        title="Group Identity"
        rows={[
          {
            label: 'Group Logo',
            value: (
              <div className="flex items-center gap-3">
                <InitialsTile
                  initials={image ?? community.image ?? initialsOf(community.name)}
                  image={image ?? community.image}
                  size="md"
                  editable={isOfficer}
                  onImageChange={(newLogo) => {
                    setImage(newLogo);
                    toast({ title: 'Group Logo Updated', description: 'The new logo is active across the app.' });
                  }}
                />
                <div>
                  <span className="text-xs text-muted-foreground block">
                    {isOfficer ? 'Click logo or camera icon to upload a new image.' : 'Group logo'}
                  </span>
                  {isOfficer && (image || community.image) ? (
                    <button
                      type="button"
                      onClick={() => {
                        removeImage();
                        toast({ title: 'Logo Removed', description: 'Reverted to default group initials.' });
                      }}
                      className="text-xs font-semibold text-destructive hover:underline mt-0.5"
                    >
                      Remove custom logo
                    </button>
                  ) : null}
                </div>
              </div>
            ),
          },
          { label: 'Name', value: community.name },
          { label: 'Type', value: typeLabel(community.type) },
          {
            label: 'Group Id',
            value: <span className="font-mono">{community.id}</span>,
            action: (
              <Button type="button" variant="outline" size="sm" onClick={() => void copyId()}>
                <Copy className="h-4 w-4" aria-hidden />
                Copy Id
              </Button>
            ),
          },
        ]}
      />

      <SettingsSection
        id="rules"
        title="Rules"
        description={rulesSentence({
          quorumPct: community.quorumPct,
          approvalThresholdPct: community.approvalThresholdPct,
          votingPeriodDays: community.votingPeriodDays,
        })}
        rows={[
          { label: 'Quorum', value: `${community.quorumPct ?? DEFAULT_GOVERNANCE.quorumPct}% of members must vote` },
          { label: 'Threshold', value: `${community.approvalThresholdPct ?? DEFAULT_GOVERNANCE.approvalThresholdPct}% of votes must agree` },
          { label: 'Voting lasts', value: `${community.votingPeriodDays ?? DEFAULT_GOVERNANCE.votingPeriodDays} days` },
          { label: 'Changing the rules', value: <StatusChip kind="hold" label="Locked" />, help: 'Rules are locked once members join. A vote is needed to change them.' },
        ]}
      />

      <SettingsSection
        id="dues"
        title="Dues"
        rows={[
          {
            label: 'Monthly dues',
            value: community.membershipFee > 0 ? formatMajor(community.membershipFee, currency) : 'Free to Join',
            help: community.membershipFee > 0 ? 'Per active member. Paid by M-Pesa from the Pay screen.' : 'This group charges nothing to join.',
          },
          { label: 'Members', value: String(community.memberCount) },
        ]}
      />

      {isOfficer ? (
        <SettingsSection
          id="paybill"
          title="Paybill and USSD"
          description="Safaricom assigns these. They appear here once issued; nothing is made up in the meantime."
          isOfficer
          rows={[
            { label: 'M-Pesa Paybill', value: community.paybillNumber ? <span className="font-mono">{community.paybillNumber}</span> : <StatusChip kind="stale" label="Not Set" />, officerOnly: true },
            { label: 'USSD shortcode', value: community.ussdShortcode ? <span className="font-mono">{community.ussdShortcode}</span> : <StatusChip kind="stale" label="Not Set" />, officerOnly: true },
          ]}
        />
      ) : null}

      {isOfficer ? <OfficersSection community={community} /> : null}

      {REGULATED_TYPES.has(community.type) ? <LicenseSection community={community} canSubmit={isOfficer} /> : null}

      {isOfficer ? <StatementsSection communityId={community.id} /> : null}

      {isMember ? <DisputesSection communityId={community.id} currency={currency} /> : null}
    </div>
  );
}

// ── Officers ─────────────────────────────────────────────────────────────────

const OFFICER_ROLES = [
  { value: 'treasurer', label: 'Treasurer' },
  { value: 'admin', label: 'Admin' },
] as const;

type OfficerRole = (typeof OFFICER_ROLES)[number]['value'];

function OfficersSection({ community }: { community: Community }) {
  const { toast } = useToast();
  const members = useMembers(community.id);
  const officers = members.filter((m) => m.role === 'founder' || m.role === 'admin');
  const candidates = members.filter((m) => m.role === 'member' && m.status === 'active');
  const [adding, setAdding] = useState(false);
  const [target, setTarget] = useState('');
  const [role, setRole] = useState<OfficerRole>('treasurer');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function mutate(targetWallet: string, newRole: string, action: 'ASSIGN' | 'REVOKE'): Promise<boolean> {
    setBusy(targetWallet);
    setError(null);
    try {
      const result = await apiFetch('/api/communities/officers', {
        method: 'POST',
        body: { communityId: community.id, targetWallet, newRole, action },
      });
      if (!result.ok) {
        setError(
          result.error.code === 'conflict'
            ? 'A group must keep at least one admin. Add another admin before removing this one.'
            : result.error.code === 'governance_policy_violation'
              ? 'This SACCO is set to proposal-only governance, so officer roles cannot be changed here.'
              : result.error.message,
        );
        return false;
      }
      toast({ title: action === 'ASSIGN' ? 'Officer Added' : 'Officer Removed', description: 'The roster updates once Baraza confirms.' });
      return true;
    } finally {
      setBusy(null);
    }
  }

  return (
    <SettingsSection
      id="officers"
      title="Officers"
      description="Officers approve sends and manage settings. Adding one needs no vote unless the group's rules say so."
      isOfficer
    >
      {officers.length === 0 ? (
        <p className="text-sm text-muted-foreground">The officer list is not available yet. Baraza does not share the roster with the app; you can still add an officer by their account id below.</p>
      ) : (
        <ul className="space-y-2">
          {officers.map((officer) => (
            <OfficerRow key={officer.id} officer={officer} busy={busy === officer.walletKey} onRemove={() => void mutate(officer.walletKey, 'member', 'REVOKE')} />
          ))}
        </ul>
      )}
      {error && !adding ? <InlineError className="mt-3" message={error} /> : null}
      <div className="mt-4">
        <Button type="button" variant="outline" onClick={() => setAdding(true)}>
          Add Officer
        </Button>
      </div>

      <Sheet
        open={adding}
        onClose={() => setAdding(false)}
        title="Add Officer"
        description="Pick a member and the role they take on."
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!target.trim() || busy !== null}
              onClick={() => {
                void mutate(target.trim(), role, 'ASSIGN').then((ok) => {
                  if (ok) {
                    setAdding(false);
                    setTarget('');
                  }
                });
              }}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              Add Officer
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {candidates.length > 0 ? (
            <Field label="Member" htmlFor="officer-member">
              <Select id="officer-member" value={target} onChange={(event) => setTarget(event.target.value)}>
                <option value="">Choose a member</option>
                {candidates.map((member) => (
                  <option key={member.id} value={member.walletKey}>
                    {member.name}
                  </option>
                ))}
              </Select>
            </Field>
          ) : (
            <Field label="Member Account Id" htmlFor="officer-member" help="The member list has not synced, so paste the person's Baraza account id.">
              <Input id="officer-member" value={target} onChange={(event) => setTarget(event.target.value)} placeholder="Account id" />
            </Field>
          )}
          <Field label="Role" htmlFor="officer-role">
            <Select id="officer-role" value={role} onChange={(event) => setRole(event.target.value as OfficerRole)}>
              {OFFICER_ROLES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Select>
          </Field>
          {error ? <InlineError message={error} /> : null}
        </div>
      </Sheet>
    </SettingsSection>
  );
}

function OfficerRow({ officer, busy, onRemove }: { officer: Member; busy: boolean; onRemove: () => void }) {
  const account = useAccount();
  const { avatarUrl } = useUserAvatar();
  const isSelf = account.displayName.toLowerCase() === officer.name.toLowerCase();
  const initials = officer.name.split(/\s+/).map((p) => p[0] ?? '').join('').slice(0, 2).toUpperCase();
  return (
    <li>
      <ListRow
        title={officer.name}
        meta={officer.role === 'founder' ? 'Founder' : 'Officer'}
        leading={<InitialsTile initials={initials} image={isSelf ? avatarUrl : null} />}
        trailing={
          officer.role === 'founder' ? (
            <StatusChip kind="info" icon={null} label="Founder" />
          ) : (
            <Button type="button" variant="outline" size="sm" onClick={onRemove} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              Remove Officer
            </Button>
          )
        }
      />
    </li>
  );
}

// ── SACCO licence ────────────────────────────────────────────────────────────

const LICENSE_RE = /^(CS\/[0-9]{1,7}|SASRA\/(DT|NWDT)\/[0-9]{2,5}\/[0-9]{2,4})$/i;

interface ComplianceStatus {
  status?: SaccoLicenseUiStatus;
  licenseNumber?: string | null;
  expiresAt?: string | null;
}

function LicenseSection({ community, canSubmit }: { community: Community; canSubmit: boolean }) {
  const account = useAccount();
  const { toast } = useToast();
  const [status, setStatus] = useState<ComplianceStatus | null>(null);
  const [licenseNumber, setLicenseNumber] = useState('');
  const [certificateUrl, setCertificateUrl] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    void apiFetch<ComplianceStatus>(`/api/compliance/status?communityId=${encodeURIComponent(community.id)}`, { auth: 'omit' }).then((result) => {
      if (result.ok && !cancelled) setStatus(result.data);
    });
    return () => {
      cancelled = true;
    };
  }, [community.id]);

  const licenseOk = LICENSE_RE.test(licenseNumber.trim());
  const urlOk = certificateUrl.trim().startsWith('https://');
  const expiryOk = !expiresAt || new Date(expiresAt).getTime() > now;
  const verified = (status?.status ?? community.saccoLicenseStatus) === 'VERIFIED';
  const valid = licenseOk && urlOk && expiryOk;

  async function submit() {
    if (!valid) return;
    setBusy(true);
    setError(null);
    try {
      const result = await apiFetch('/api/compliance/sacco-license-submit', {
        method: 'POST',
        body: {
          communityId: community.id,
          licenseNumber: licenseNumber.trim(),
          certificateUrl: certificateUrl.trim(),
          documentType: 'cooperative_registration',
          expiresAt: expiresAt || undefined,
          wallet: account.accountId,
        },
      });
      if (!result.ok) {
        setError(
          result.error.kind === 'conflict'
            ? 'A licence for this group is already under review or verified.'
            : result.error.message,
        );
        return;
      }
      toast({ title: 'Submitted for Review', description: 'Review by the regulator can take several days.' });
      setStatus((prev) => ({ ...prev, status: 'PENDING_REVIEW', licenseNumber: licenseNumber.trim() }));
    } catch {
      setError('We could not reach Baraza. Nothing was sent.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SettingsSection
      id="license"
      title="SACCO Licence"
      description={
        verified
          ? 'This SACCO is verified. Regulated lending can be switched on by officers.'
          : 'Regulated lending and capital mobilisation stay off until the statutory licence is verified. Dues, voting and sends are unaffected.'
      }
    >
      <div className="mb-4">
        <SaccoComplianceBadge
          type={community.type}
          status={status?.status ?? community.saccoLicenseStatus}
          licenseNumber={status?.licenseNumber ?? undefined}
          expiresAt={status?.expiresAt ?? undefined}
        />
      </div>
      {!canSubmit ? (
        <p className="text-sm text-muted-foreground">Only officers can submit a licence for review.</p>
      ) : (
        <div className="space-y-4">
          <Field
            label="Registration or SASRA Number"
            htmlFor="license-number"
            help="For example CS/12345 or SASRA/DT/102/2021."
            error={licenseNumber && !licenseOk ? 'Use the CS/… or SASRA/DT… format.' : undefined}
          >
            <Input id="license-number" value={licenseNumber} onChange={(event) => setLicenseNumber(event.target.value)} aria-invalid={Boolean(licenseNumber && !licenseOk)} />
          </Field>
          <Field
            label="Certificate Link"
            htmlFor="license-url"
            help="A public https link to the PDF or image. Uploading a file from here is not available yet."
            error={certificateUrl && !urlOk ? 'The link must start with https://.' : undefined}
          >
            <Input id="license-url" type="url" value={certificateUrl} onChange={(event) => setCertificateUrl(event.target.value)} placeholder="https://" aria-invalid={Boolean(certificateUrl && !urlOk)} />
          </Field>
          <Field label="Expiry Date" htmlFor="license-expiry" optional error={!expiryOk ? 'The expiry must be in the future.' : undefined}>
            <Input id="license-expiry" type="date" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} aria-invalid={!expiryOk} />
          </Field>
          {error ? <InlineError message={error} /> : null}
          <Button type="button" onClick={() => void submit()} disabled={!valid || busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            Submit for Review
          </Button>
        </div>
      )}
    </SettingsSection>
  );
}

// ── Statements ───────────────────────────────────────────────────────────────

function StatementsSection({ communityId }: { communityId: string }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function download() {
    setBusy(true);
    setError(null);
    try {
      const params = new URLSearchParams({ communityId, format: 'csv' });
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      const result = await apiFetch(`/api/communities/statement?${params.toString()}`, { parse: 'none' });
      if (!result.ok) {
        setError(result.error.kind === 'auth' || result.error.kind === 'forbidden' ? 'Sign in as an officer to download the statement.' : result.error.message);
        return;
      }
      const blob = await result.response.blob();
      const href = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = href;
      anchor.download = `baraza-statement-${communityId}.csv`;
      anchor.click();
      URL.revokeObjectURL(href);
    } catch {
      setError('We could not reach Baraza. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SettingsSection id="statements" title="Statements" description="Every contribution and release, as a CSV for any date range." isOfficer>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="From" htmlFor="statement-from" optional>
          <Input id="statement-from" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
        </Field>
        <Field label="To" htmlFor="statement-to" optional>
          <Input id="statement-to" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
        </Field>
      </div>
      {error ? <InlineError className="mt-3" message={error} /> : null}
      <Button type="button" variant="outline" className="mt-4" onClick={() => void download()} disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Download className="h-4 w-4" aria-hidden />}
        Download CSV
      </Button>
    </SettingsSection>
  );
}

// ── Disputes ─────────────────────────────────────────────────────────────────

const DISPUTE_TYPES = [
  { value: 'PAYMENT_NOT_CREDITED', label: 'I paid but it is not counted' },
  { value: 'WRONG_AMOUNT', label: 'The amount is wrong' },
  { value: 'DUPLICATE_DEBIT', label: 'I was charged twice' },
  { value: 'OTHER', label: 'Something else' },
] as const;

type DisputeType = (typeof DISPUTE_TYPES)[number]['value'];

function DisputesSection({ communityId, currency }: { communityId: string; currency: string }) {
  const { toast } = useToast();
  const [orderId, setOrderId] = useState('');
  const [type, setType] = useState<DisputeType>('PAYMENT_NOT_CREDITED');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amountMinor = Math.round(Number(amount) * 100);
  const valid = orderId.trim().length > 0 && Number.isFinite(amountMinor) && amountMinor > 0 && reason.trim().length >= 5;

  async function file() {
    if (!valid) return;
    setBusy(true);
    setError(null);
    try {
      const result = await apiFetch('/api/payment-orders/dispute', {
        method: 'POST',
        body: { orderId: orderId.trim(), communityId, disputeType: type, amountDisputedMinor: amountMinor, reason: reason.trim() },
      });
      if (!result.ok) {
        setError(
          result.error.code === 'statute_of_limitations_exceeded'
            ? 'Payments can only be disputed within 14 days. This one is older, so email hello@barazaprotocol.com instead.'
            : result.error.kind === 'conflict'
              ? 'This payment already has an open dispute.'
              : result.error.kind === 'not_found'
                ? 'We could not find a payment with that reference in this group.'
                : result.error.message,
        );
        return;
      }
      toast({ title: 'Dispute Filed', description: 'An officer reviews it. You will hear back by SMS or email.' });
      setOrderId('');
      setAmount('');
      setReason('');
    } catch {
      setError('We could not reach Baraza. Nothing was filed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SettingsSection
      id="disputes"
      title="Disputes"
      description="If a payment was not counted, was the wrong amount, or was charged twice, file it here within 14 days. The reference is on your receipt."
    >
      <div className="space-y-4">
        <Field label="Payment Reference" htmlFor="dispute-order" help="From the receipt or your M-Pesa message.">
          <Input id="dispute-order" value={orderId} onChange={(event) => setOrderId(event.target.value)} placeholder="QHX7K2M9PL" />
        </Field>
        <Field label="What Happened" htmlFor="dispute-type">
          <Select id="dispute-type" value={type} onChange={(event) => setType(event.target.value as DisputeType)}>
            {DISPUTE_TYPES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Amount in Question" htmlFor="dispute-amount">
          <MoneyField id="dispute-amount" currency={currency} value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="500" />
        </Field>
        <Field label="Details" htmlFor="dispute-reason" help="A sentence or two. At least five characters.">
          <Textarea id="dispute-reason" value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} />
        </Field>
        {error ? <InlineError message={error} /> : null}
        <Button type="button" onClick={() => void file()} disabled={!valid || busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          File Dispute
        </Button>
      </div>
    </SettingsSection>
  );
}
