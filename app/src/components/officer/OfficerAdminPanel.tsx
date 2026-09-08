import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Download, Loader2, Link2, Scale, Shield } from 'lucide-react';
import { useAccount } from '@/contexts/AccountContext';
import { useToast } from '@/hooks/use-toast';
import { sessionHeaders } from '@/lib/sessionHeaders';
import { tryWorkspaceMutate } from '@/lib/workspaceApi';
type DisputeType = 'PAYMENT_NOT_CREDITED' | 'WRONG_AMOUNT' | 'DUPLICATE_DEBIT' | 'OTHER';
type OfficerRole = 'founder' | 'admin' | 'treasurer' | 'member';

const DISPUTE_TYPES: { id: DisputeType; label: string }[] = [
  { id: 'PAYMENT_NOT_CREDITED', label: 'Payment not credited' },
  { id: 'WRONG_AMOUNT', label: 'Wrong amount' },
  { id: 'DUPLICATE_DEBIT', label: 'Duplicate debit' },
  { id: 'OTHER', label: 'Other' },
];

export function OfficerAdminPanel({ communityId }: { communityId: string }) {
  const account = useAccount();
  const { toast } = useToast();
  const [days, setDays] = useState('14');
  const [maxUses, setMaxUses] = useState('25');
  const [inviteUrl, setInviteUrl] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exporting, setExporting] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [disputeType, setDisputeType] = useState<DisputeType>('PAYMENT_NOT_CREDITED');
  const [reason, setReason] = useState('');
  const [amount, setAmount] = useState('');
  const [busyDispute, setBusyDispute] = useState(false);
  const [targetWallet, setTargetWallet] = useState('');
  const [officerRole, setOfficerRole] = useState<OfficerRole>('treasurer');
  const [busyRole, setBusyRole] = useState(false);

  async function createInvite() {
    const headers = await sessionHeaders(account.getAccessToken);
    const remote = await tryWorkspaceMutate(`/api/communities/${communityId}/invites`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ expiresInDays: Number(days) || 14, maxUses: Number(maxUses) || 25 }),
    });
    const remoteCode = typeof remote.data?.code === 'string' ? remote.data.code : null;
    const code = remoteCode ?? `inv_${communityId}_${crypto.randomUUID().replace(/-/g, '').slice(0, 10)}`;
    const expires = new Date(Date.now() + Number(days || 14) * 86400000).toISOString();
    const url = `${window.location.origin}/join/${communityId}?invite=${encodeURIComponent(code)}`;
    try {
      const raw = window.localStorage.getItem('baraza.invites.v1');
      const all = raw ? JSON.parse(raw) as Array<Record<string, unknown>> : [];
      all.unshift({ code, communityId, expiresAt: expires, maxUses: Number(maxUses) || 25, used: 0 });
      window.localStorage.setItem('baraza.invites.v1', JSON.stringify(all.slice(0, 50)));
    } catch {
      // Invite link still works without local persistence.
    }
    setInviteUrl(url);
  }

  async function exportStatement() {
    setExporting(true);
    try {
      const headers = await sessionHeaders(account.getAccessToken);
      const params = new URLSearchParams({ communityId, format: 'csv' });
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      const res = await fetch(`/api/communities/statement?${params.toString()}`, { headers });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        toast({ title: 'Statement export failed', description: data.message ?? 'Sign in as an officer and try again.', variant: 'destructive' });
        return;
      }
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      a.download = `baraza-statement-${communityId}.csv`;
      a.click();
      URL.revokeObjectURL(href);
    } finally {
      setExporting(false);
    }
  }

  async function lodgeDispute() {
    setBusyDispute(true);
    try {
      const headers = await sessionHeaders(account.getAccessToken);
      const res = await fetch('/api/payment-orders/dispute', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          orderId: orderId.trim(),
          communityId,
          disputeType,
          amountDisputedMinor: Math.round(Number(amount) * 100),
          reason,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        toast({ title: 'Dispute not filed', description: data.message ?? 'Check the payment reference and try again.', variant: 'destructive' });
        return;
      }
      toast({ title: 'Dispute filed', description: 'Officers can review MANUAL_REVIEW payments from this record.' });
      setOrderId('');
      setReason('');
    } finally {
      setBusyDispute(false);
    }
  }

  async function assignOfficer(action: 'ASSIGN' | 'REVOKE') {
    if (!targetWallet.trim()) return;
    setBusyRole(true);
    try {
      const headers = await sessionHeaders(account.getAccessToken);
      const res = await fetch('/api/communities/officers', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          communityId,
          targetWallet: targetWallet.trim(),
          newRole: officerRole,
          action,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      toast({
        title: res.ok ? (action === 'ASSIGN' ? 'Role assigned' : 'Role revoked') : 'Role change failed',
        description: data.message ?? (res.ok ? 'Leadership titles update in the member roster.' : 'Sign in as an officer and retry.'),
        variant: res.ok ? 'default' : 'destructive',
      });
    } finally {
      setBusyRole(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="baraza-card p-5">
        <div className="mb-3 flex items-center gap-2">
          <Link2 className="h-4 w-4" />
          <h3 className="font-display text-base font-semibold">Invite links</h3>
        </div>
        <p className="text-xs text-muted-foreground">Create a join link with expiry and a use cap. Members open the join page; the backend accept route is used when a server invite code exists.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold">
            Expires in days
            <input value={days} onChange={(e) => setDays(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none" />
          </label>
          <label className="text-xs font-semibold">
            Max uses
            <input value={maxUses} onChange={(e) => setMaxUses(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none" />
          </label>
        </div>
        <button type="button" onClick={() => void createInvite()} className="btn-wipe-outline mt-3 text-xs">Generate invite</button>
        {inviteUrl && (
          <button
            type="button"
            className="mt-3 flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs"
            onClick={() => void navigator.clipboard.writeText(inviteUrl)}
          >
            <Copy className="h-3.5 w-3.5" />
            {inviteUrl}
          </button>
        )}
      </div>

      <div className="baraza-card p-5">
        <div className="mb-3 flex items-center gap-2">
          <Download className="h-4 w-4" />
          <h3 className="font-display text-base font-semibold">Financial statement</h3>
        </div>
        <p className="text-xs text-muted-foreground">Export the double-entry ledger for a date range (CSV).</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded-lg border px-3 py-2 text-sm" />
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded-lg border px-3 py-2 text-sm" />
        </div>
        <button type="button" onClick={() => void exportStatement()} className="btn-wipe-outline mt-3 gap-2 text-xs">
          {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
          Export CSV
        </button>
      </div>

      <div className="baraza-card p-5">
        <div className="mb-3 flex items-center gap-2">
          <Scale className="h-4 w-4" />
          <h3 className="font-display text-base font-semibold">Payment disputes</h3>
        </div>
        <p className="text-xs text-muted-foreground">Lodge a dispute for a flagged payment (MANUAL_REVIEW) with a reason and amount.</p>
        <input value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="Payment reference / order id" className="mt-3 w-full rounded-lg border px-3 py-2 text-sm outline-none" />
        <select value={disputeType} onChange={(e) => setDisputeType(e.target.value as DisputeType)} className="mt-3 w-full rounded-lg border px-3 py-2 text-sm">
          {DISPUTE_TYPES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
        <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount disputed (KES)" className="mt-3 w-full rounded-lg border px-3 py-2 text-sm outline-none" />
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="What happened?" className="mt-3 min-h-20 w-full rounded-lg border px-3 py-2 text-sm outline-none" />
        <button type="button" disabled={busyDispute || reason.trim().length < 5} onClick={() => void lodgeDispute()} className="btn-wipe-outline mt-3 text-xs">
          {busyDispute && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          File dispute
        </button>
        <Link to={`/dashboard/${communityId}?tab=members`} className="mt-3 inline-flex text-xs font-semibold text-primary">Open member roster</Link>
      </div>

      <div className="baraza-card p-5">
        <div className="mb-3 flex items-center gap-2">
          <Shield className="h-4 w-4" />
          <h3 className="font-display text-base font-semibold">Leadership titles</h3>
        </div>
        <p className="text-xs text-muted-foreground">Assign or revoke officer roles. SACCO groups that require a proposal still need a vote.</p>
        <input
          value={targetWallet}
          onChange={(e) => setTargetWallet(e.target.value)}
          placeholder="Member wallet or account id"
          className="mt-3 w-full rounded-lg border px-3 py-2 text-sm outline-none"
        />
        <select value={officerRole} onChange={(e) => setOfficerRole(e.target.value as OfficerRole)} className="mt-3 w-full rounded-lg border px-3 py-2 text-sm">
          <option value="treasurer">Treasurer</option>
          <option value="admin">Admin</option>
          <option value="founder">Founder</option>
          <option value="member">Member</option>
        </select>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" disabled={busyRole || !targetWallet.trim()} onClick={() => void assignOfficer('ASSIGN')} className="btn-wipe-outline text-xs">
            {busyRole && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Assign
          </button>
          <button type="button" disabled={busyRole || !targetWallet.trim()} onClick={() => void assignOfficer('REVOKE')} className="btn-ghost text-xs">
            Revoke
          </button>
        </div>
      </div>
    </div>
  );
}
