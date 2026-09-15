import { useState } from 'react';
import { Copy, Loader2, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { InlineError } from '@/components/ui/inline-error';
import { Sheet } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api';

/**
 * §13.17 invite sheet — the one place an officer gets a link to share.
 *
 * The plain join link always works: anyone can open `/join/:id`. A limited
 * invite (expiry, use cap) needs `POST /api/communities/:id/invites`, which
 * is not deployed yet; when it answers without a code the sheet says so and
 * never mints a local one (audit G79).
 */
export interface InviteSheetProps {
  open: boolean;
  onClose: () => void;
  communityId: string;
  communityName: string;
}

export function InviteSheet({ open, onClose, communityId, communityName }: InviteSheetProps) {
  const { toast } = useToast();
  const joinUrl = `${window.location.origin}/join/${communityId}`;
  const [days, setDays] = useState('14');
  const [maxUses, setMaxUses] = useState('25');
  const [limitedUrl, setLimitedUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: 'Link Copied' });
    } catch {
      toast({ title: 'Could Not Copy', description: 'Select the link and copy it by hand.', variant: 'destructive' });
    }
  }

  async function share(url: string) {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({ title: `Join ${communityName} on Baraza`, url });
        return;
      } catch {
        /* the person closed the share sheet; fall through to copy */
      }
    }
    await copy(url);
  }

  async function createLimited() {
    setBusy(true);
    setError(null);
    try {
      // The backend's own `inviteUrl` points at a host and path this app does
      // not serve, so only the code is used and the link is built here.
      const result = await apiFetch<{ code?: string }>(`/api/communities/${communityId}/invites`, {
        method: 'POST',
        body: { expiresInDays: Number(days) || 14, maxUses: Number(maxUses) || 25 },
      });
      const code = result.ok && typeof result.data?.code === 'string' ? result.data.code : null;
      if (!code) {
        setError(
          !result.ok && result.error.kind === 'forbidden'
            ? 'Only founders, admins and secretaries can issue limited links. The plain join link above works.'
            : !result.ok && (result.error.kind === 'not_found' || result.error.kind === 'validation' || result.error.kind === 'misconfigured')
              ? 'Limited links are not available on this deployment yet. The plain join link above works.'
              : `${!result.ok ? result.error.message : 'Baraza did not issue a limited invite.'} The plain join link above still works.`,
        );
        return;
      }
      setLimitedUrl(`${joinUrl}?invite=${encodeURIComponent(code)}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Invite People"
      description="Anyone with the link can ask to join. They pay dues and become a member once the payment is confirmed."
      footer={
        <Button type="button" variant="outline" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="space-y-6">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Join Link</h3>
          <p className="break-all rounded-md border border-border bg-surface px-3 py-2 font-mono text-xs">{joinUrl}</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="button" onClick={() => void share(joinUrl)}>
              <Share2 className="h-4 w-4" aria-hidden />
              Share
            </Button>
            <Button type="button" variant="outline" onClick={() => void copy(joinUrl)}>
              <Copy className="h-4 w-4" aria-hidden />
              Copy Link
            </Button>
          </div>
        </section>

        <section className="space-y-3 border-t border-border pt-5">
          <div>
            <h3 className="text-sm font-semibold">Limited Link</h3>
            <p className="mt-1 text-xs text-muted-foreground">Stops working after the expiry or the use limit, whichever comes first.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Expires In (Days)" htmlFor="invite-days">
              <Input id="invite-days" inputMode="numeric" value={days} onChange={(event) => setDays(event.target.value)} />
            </Field>
            <Field label="Maximum Uses" htmlFor="invite-uses">
              <Input id="invite-uses" inputMode="numeric" value={maxUses} onChange={(event) => setMaxUses(event.target.value)} />
            </Field>
          </div>
          {limitedUrl ? (
            <>
              <p className="break-all rounded-md border border-border bg-surface px-3 py-2 font-mono text-xs">{limitedUrl}</p>
              <Button type="button" variant="outline" onClick={() => void copy(limitedUrl)}>
                <Copy className="h-4 w-4" aria-hidden />
                Copy Limited Link
              </Button>
            </>
          ) : (
            <Button type="button" variant="outline" onClick={() => void createLimited()} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              Create Limited Link
            </Button>
          )}
          {error ? <InlineError message={error} /> : null}
        </section>
      </div>
    </Sheet>
  );
}

export default InviteSheet;
