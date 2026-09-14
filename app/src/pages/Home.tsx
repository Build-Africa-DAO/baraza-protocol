import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import { GroupRow } from '@/components/app/GroupRow';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Field, Input } from '@/components/ui/field';
import { InlineError } from '@/components/ui/inline-error';
import { PageHeader } from '@/components/ui/page-header';
import { Sheet } from '@/components/ui/sheet';
import { SkeletonList } from '@/components/ui/skeletons';
import { useAccount } from '@/contexts/AccountContext';
import { useMyMemberships } from '@/hooks/useMyMemberships';
import { acceptInviteCode, extractInviteCode } from '@/lib/inviteAccept';
import { parseJoinTarget } from '@/lib/postAuth';
import { useSeo } from '@/lib/seo';

/**
 * §13.9 My Groups — the signed-in hub. Rows with my standing and what needs
 * me, one way in with an invite, one way to start a group. People with one
 * active group never see this page; PostAuthRedirect sends them to it.
 */
export default function Home() {
  useSeo({
    title: 'Your groups',
    description: 'Open a group you belong to, join with an invite, or start a new one on Baraza.',
    path: '/home',
    noIndex: true,
  });
  const { memberships, isLoading, error } = useMyMemberships();
  // `/home?join=1` (the sidebar's sub-page) opens the invite sheet; closing it
  // drops the param so Back does not reopen it.
  const [searchParams, setSearchParams] = useSearchParams();
  const inviteOpen = searchParams.get('join') === '1';
  const setInviteOpen = (open: boolean) => {
    const params = new URLSearchParams(searchParams);
    if (open) params.set('join', '1');
    else params.delete('join');
    setSearchParams(params, { replace: !open });
  };
  const hasGroups = memberships.length > 0;

  return (
    <Layout gate={{ title: 'Sign in to see your groups', description: 'Log in to open the groups you belong to, join with an invite, or start a new one.' }}>
      <section className="py-8 md:py-12">
        <div className="mx-auto w-full max-w-5xl space-y-6 px-4 md:px-6">
          <PageHeader
            title={hasGroups ? 'Your Groups' : 'Start With a Group'}
            subtitle={hasGroups ? 'Open a group to see dues, votes and money.' : 'Join with an invite from a member, or start a chama, SACCO or cooperative.'}
            action={
              hasGroups ? (
                <Button variant="outline" onClick={() => setInviteOpen(true)}>
                  Join With an Invite
                </Button>
              ) : undefined
            }
          />

          {error ? <InlineError message={error} /> : null}

          {isLoading ? (
            <SkeletonList count={2} />
          ) : hasGroups ? (
            <>
              <ul className="space-y-2">
                {memberships.map((pair) => (
                  <li key={pair.community.id}>
                    <GroupRow pair={pair} />
                  </li>
                ))}
              </ul>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button variant="outline" onClick={() => setInviteOpen(true)} className="sm:hidden">
                  Join With an Invite
                </Button>
                <Button asChild variant="outline">
                  <Link to="/create">Start a Group</Link>
                </Button>
              </div>
            </>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <InviteForm />
              <EmptyState
                title="Start a Group"
                body="Set up a chama in minutes. Members join with a phone number and pay into a shared record."
                primary={{ label: 'Start a Group', to: '/create' }}
                secondary={{ label: 'Browse Groups', to: '/groups' }}
              />
            </div>
          )}

          <Sheet open={inviteOpen} onClose={() => setInviteOpen(false)} title="Join With an Invite" description="Paste the link a member sent you, or the group id.">
            <InviteForm bare />
          </Sheet>
        </div>
      </section>
    </Layout>
  );
}

function InviteForm({ bare = false }: { bare?: boolean }) {
  const account = useAccount();
  const navigate = useNavigate();
  const [invite, setInvite] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const code = extractInviteCode(invite);
    if (code) {
      if (!account.authenticated) {
        account.login();
        return;
      }
      setBusy(true);
      const accepted = await acceptInviteCode(code, account.getAccessToken);
      setBusy(false);
      if (accepted.ok && accepted.communityId) {
        navigate(accepted.alreadyMember ? `/dashboard/${accepted.communityId}` : `/join/${accepted.communityId}`);
        return;
      }
      if (accepted.status === 401) {
        account.login();
        return;
      }
    }
    const target = parseJoinTarget(invite);
    if (!target) {
      setError('Paste an invite link, an invite code, or a group id.');
      return;
    }
    const query = code && code !== target ? `?invite=${encodeURIComponent(code)}` : '';
    navigate(`/join/${target}${query}`);
  }

  const body = (
    <form onSubmit={(event) => void submit(event)} className="space-y-4" noValidate>
      {!bare ? (
        <div>
          <h2 className="font-display text-base font-bold">Join With an Invite</h2>
          <p className="mt-1 text-sm text-muted-foreground">Paste the link a member sent you, or the group id.</p>
        </div>
      ) : null}
      <Field label="Invite Link or Group Id" htmlFor={bare ? 'invite-link-sheet' : 'invite-link'} error={error ?? undefined}>
        <Input
          id={bare ? 'invite-link-sheet' : 'invite-link'}
          value={invite}
          onChange={(event) => {
            setInvite(event.target.value);
            setError(null);
          }}
          placeholder="https://barazaprotocol.com/join/…"
          aria-invalid={Boolean(error)}
        />
      </Field>
      <Button type="submit" disabled={busy || invite.trim() === ''} fullWidth={bare} className={bare ? undefined : 'w-full sm:w-auto'}>
        {busy ? 'Checking Invite' : 'Continue to Join'}
      </Button>
    </form>
  );
  return bare ? body : <div className="baraza-card p-5">{body}</div>;
}
