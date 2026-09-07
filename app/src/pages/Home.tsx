import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Compass, PlusCircle, ShieldCheck } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { useAccount } from '@/contexts/AccountContext';
import { useMyMemberships } from '@/hooks/useMyMemberships';
import { formatAccountDate } from '@/lib/accountLocale';
import { parseJoinTarget } from '@/lib/postAuth';
import { useSeo } from '@/lib/seo';
import { formatKSh } from '@/lib/utils';

export default function Home() {
  useSeo({
    title: 'Your groups',
    description: 'Open a group you belong to, join with an invite, or launch a new chama on Baraza.',
    path: '/home',
    noIndex: true,
  });

  const account = useAccount();
  const navigate = useNavigate();
  const { memberships, isLoading } = useMyMemberships();
  const [invite, setInvite] = useState('');
  const [inviteError, setInviteError] = useState<string | null>(null);

  const handleJoin = (event: FormEvent) => {
    event.preventDefault();
    const target = parseJoinTarget(invite);
    if (!target) {
      setInviteError('Paste an invite link or group id.');
      return;
    }
    setInviteError(null);
    navigate(`/join/${target}`);
  };

  return (
    <Layout gate={{ title: 'Sign in to see your groups', description: 'Log in to open the groups you belong to, join with an invite, or launch a new one.' }}>
      <section className="py-10 md:py-14">
        <div className="container mx-auto px-4">
          <div className="mb-8 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Your workspace</p>
            <h1 className="mt-2 font-display text-3xl font-bold md:text-4xl">
              {memberships.length > 0 ? 'Your groups' : 'Start with a group'}
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {memberships.length > 0
                ? 'Open a group to see dues, votes, and payouts.'
                : 'Join with an invite from a member, or launch a chama, SACCO, or cooperative.'}
            </p>
          </div>

          {isLoading ? (
            <div className="grid gap-3 md:grid-cols-2">
              {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="baraza-card h-28 animate-pulse bg-muted/60" />
              ))}
            </div>
          ) : memberships.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2">
              {memberships.map(({ record, community }) => (
                <Link
                  key={community.id}
                  to={`/dashboard/${community.id}`}
                  className="baraza-card group flex items-center gap-4 p-4 transition-colors hover:border-primary/45"
                >
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-md border font-display text-base font-bold">
                    {community.image}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-display text-sm font-bold">{community.name}</p>
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase">
                        <ShieldCheck className="h-3 w-3" />
                        {record.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Joined {formatAccountDate(record.joinedAt, account.country.code)}
                      {' · '}
                      {formatKSh(community.membershipFee)}/mo
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              <form onSubmit={handleJoin} className="baraza-card p-6">
                <h2 className="font-display text-lg font-bold">Join with an invite</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Paste the link a member sent you, or enter the group id.
                </p>
                <label htmlFor="invite-link" className="mt-5 mb-2 block text-xs font-semibold">
                  Invite link or group id
                </label>
                <input
                  id="invite-link"
                  value={invite}
                  onChange={(event) => {
                    setInvite(event.target.value);
                    setInviteError(null);
                  }}
                  placeholder="https://barazaprotocol.com/join/…"
                  className="w-full rounded-md border bg-background px-3 py-3 text-sm outline-none focus:border-primary"
                />
                {inviteError && <p className="mt-2 text-xs text-destructive">{inviteError}</p>}
                <Button type="submit" className="mt-4 w-full sm:w-auto">
                  Continue to join
                </Button>
              </form>

              <div className="baraza-card flex flex-col justify-between p-6">
                <div>
                  <h2 className="font-display text-lg font-bold">Launch a group</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Start a chama in minutes. Members join with a phone number and pay into a shared record.
                  </p>
                </div>
                <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                  <Button asChild>
                    <Link to="/create/purpose">
                      <PlusCircle className="h-4 w-4" />
                      Launch a group
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/communities">
                      <Compass className="h-4 w-4" />
                      Browse groups
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {memberships.length > 0 && (
            <div className="mt-8 flex flex-col gap-2 sm:flex-row">
              <Button asChild>
                <Link to="/create/purpose">
                  <PlusCircle className="h-4 w-4" />
                  Launch a group
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/communities">
                  <Compass className="h-4 w-4" />
                  Browse
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
