import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Loader2, Sparkles, UserPlus, Users } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { InlineError } from '@/components/ui/inline-error';
import { StatusChip } from '@/components/ui/status-chip';
import { useAccount } from '@/contexts/AccountContext';
import { useToast } from '@/hooks/use-toast';
import { acceptInviteCode, resolveInviteCode, type ResolvedInvite } from '@/lib/inviteAccept';
import { useSeo } from '@/lib/seo';

/**
 * §13.20 Public Invite Deep Link Handler (/invite?code=...)
 * Enables seamless QR-code onboarding for creator collectives (e.g. Canva Creators Kenya).
 * Resolves community identity before sign-in, manages persistent auth handoffs,
 * collects creator onboarding survey responses, and atomically executes join.
 */
export default function InviteLanding() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const account = useAccount();
  const { toast } = useToast();

  const codeParam = (searchParams.get('code') || searchParams.get('invite') || '').trim();
  const [inputCode, setInputCode] = useState(() => {
    if (codeParam) return codeParam;
    if (typeof window !== 'undefined') {
      try {
        const stored = window.sessionStorage.getItem('baraza_pending_invite_code');
        if (stored && /^[a-zA-Z0-9_-]{6,32}$/.test(stored)) return stored;
      } catch {
        // Ignore
      }
    }
    return '';
  });
  const [activeCode, setActiveCode] = useState(() => inputCode);

  const [resolved, setResolved] = useState<ResolvedInvite | null>(null);
  const [loading, setLoading] = useState(() => Boolean(inputCode));
  const [resolvingError, setResolvingError] = useState<string | null>(null);

  // Acceptance & Survey state
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [showSurvey, setShowSurvey] = useState(false);
  const [surveyAnswers, setSurveyAnswers] = useState({
    craft: '',
    groupPurpose: '',
    poolingIntent: '',
  });

  useSeo({
    title: resolved ? `Join ${resolved.community.name} on Baraza` : 'Claim Your Invite — Baraza Protocol',
    description: resolved?.community.description || 'Enter your invite code to join a Baraza community.',
    path: '/invite',
  });

  // Resolve invite on code change
  useEffect(() => {
    if (!activeCode) return;

    let cancelled = false;

    resolveInviteCode(activeCode)
      .then((res) => {
        if (cancelled) return;
        if (res.ok && res.data) {
          setResolved(res.data);
          // Persist code in case sign-in redirects
          try {
            window.sessionStorage.setItem('baraza_pending_invite_code', activeCode);
          } catch {
            // Ignore sessionStorage unavailability
          }
        } else {
          setResolvingError(res.message || 'That invite could not be found or has expired.');
          setResolved(null);
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setResolvingError((err as Error).message || 'Unable to resolve invite.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeCode]);

  async function handleAccept(skipSurvey = false) {
    if (!activeCode || !resolved || accepting) return;
    setAccepting(true);
    setAcceptError(null);

    try {
      const res = await acceptInviteCode(activeCode, account.getAccessToken);
      if (!res.ok) {
        setAcceptError(res.message || 'Unable to claim invite. Please verify the code.');
        setAccepting(false);
        return;
      }

      // Persist onboarding survey answers for community organisers
      if (!skipSurvey && (surveyAnswers.craft || surveyAnswers.groupPurpose || surveyAnswers.poolingIntent)) {
        try {
          window.localStorage.setItem(
            `baraza_creator_survey_${resolved.community.id}`,
            JSON.stringify({ ...surveyAnswers, recordedAt: new Date().toISOString() }),
          );
        } catch {
          // Ignore
        }
      }

      // If already a member or successfully joined
      try {
        window.sessionStorage.removeItem('baraza_pending_invite_code');
      } catch {
        // Ignore
      }

      toast({
        title: res.alreadyMember ? 'Already a Member' : "You're In!",
        description: res.alreadyMember
          ? `You already have an active seat in ${resolved.community.name}.`
          : `Welcome to ${resolved.community.name}. Your vote and seat are active.`,
      });

      navigate(`/dashboard/${resolved.community.id}`);
    } catch (err: unknown) {
      setAcceptError((err as Error).message || 'Failed to accept invite.');
      setAccepting(false);
    }
  }

  function handleSignIn() {
    if (activeCode) {
      try {
        window.sessionStorage.setItem('baraza_pending_invite_code', activeCode);
      } catch {
        // Ignore
      }
    }
    account.login(`/invite?code=${encodeURIComponent(activeCode)}`);
  }

  return (
    <Layout>
      <div className="container mx-auto max-w-xl px-4 py-12 md:py-16">
        {loading ? (
          <div className="baraza-card flex flex-col items-center justify-center p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
            <p className="mt-4 text-sm font-medium text-muted-foreground">Checking your invite...</p>
          </div>
        ) : !activeCode || resolvingError ? (
          <div className="baraza-card space-y-6 p-6 sm:p-8">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UserPlus className="h-6 w-6" aria-hidden />
              </div>
              <h1 className="mt-4 font-display text-2xl font-bold tracking-tight">Claim Your Invite</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Enter the 12-character invite code from your card or link to access your community.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const trimmed = inputCode.trim();
                if (trimmed) {
                  setResolvingError(null);
                  setLoading(true);
                  setActiveCode(trimmed);
                }
              }}
              className="space-y-4"
            >
              <Field label="Invite Code" htmlFor="invite-code-input" help="Example: a1b2c3d4e5f6">
                <Input
                  id="invite-code-input"
                  placeholder="Enter 12-character code"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  className="font-mono text-center uppercase tracking-widest text-lg"
                  autoFocus
                />
              </Field>

              {resolvingError && <InlineError message={resolvingError} />}

              <Button type="submit" className="w-full" size="lg" disabled={inputCode.trim().length < 6}>
                Continue
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
              </Button>
            </form>
          </div>
        ) : resolved ? (
          <div className="space-y-6">
            {/* Branded Community Hero Card */}
            <div className="baraza-card overflow-hidden">
              {resolved.community.imageUrl ? (
                <div className="h-36 w-full bg-cover bg-center" style={{ backgroundImage: `url(${resolved.community.imageUrl})` }} />
              ) : (
                <div className="h-28 w-full bg-primary/10" />
              )}

              <div className="p-6 sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <StatusChip kind="info" icon={null} label="Official Invitation" />
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <Users className="h-4 w-4" aria-hidden />
                    {resolved.community.memberCount} {resolved.community.memberCount === 1 ? 'Member' : 'Members'}
                  </span>
                </div>

                <h1 className="mt-3 font-display text-2xl font-black tracking-tight sm:text-3xl">
                  {resolved.community.name}
                </h1>

                <p className="mt-2 text-sm text-muted-foreground sm:text-base leading-relaxed">
                  {resolved.community.description || 'Welcome to our collective governance and creative community on Baraza.'}
                </p>

                <div className="mt-4 rounded-lg bg-surface/60 border border-border p-3.5 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Invite Code Verified</span>
                  <span className="font-mono font-bold text-foreground">{resolved.invite.code}</span>
                </div>
              </div>
            </div>

            {/* Action / Survey Card */}
            <div className="baraza-card p-6 sm:p-8">
              {!account.authenticated ? (
                <div className="space-y-5 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Sparkles className="h-6 w-6" aria-hidden />
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-bold">Sign In to Claim Your Seat</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Sign in with your phone or email to activate your voting seat in {resolved.community.name}. No crypto wallet or fees required.
                    </p>
                  </div>
                  <Button onClick={handleSignIn} size="lg" className="w-full">
                    Sign In with Phone or Email
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                  </Button>
                </div>
              ) : showSurvey ? (
                <div className="space-y-5">
                  <div>
                    <h2 className="font-display text-xl font-bold">Creator Profile & Interests</h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Help your community leads understand what you make and how we can support you.
                    </p>
                  </div>

                  <Field label="What do you make or design?" htmlFor="survey-craft">
                    <Input
                      id="survey-craft"
                      placeholder="e.g. Brand identities, social graphics, templates, UI"
                      value={surveyAnswers.craft}
                      onChange={(e) => setSurveyAnswers({ ...surveyAnswers, craft: e.target.value })}
                    />
                  </Field>

                  <Field label="What does your creative group or studio do?" htmlFor="survey-group">
                    <Input
                      id="survey-group"
                      placeholder="e.g. Freelance collective, agency, student design club"
                      value={surveyAnswers.groupPurpose}
                      onChange={(e) => setSurveyAnswers({ ...surveyAnswers, groupPurpose: e.target.value })}
                    />
                  </Field>

                  <Field label="What would you pool money or resources for?" htmlFor="survey-pooling">
                    <Input
                      id="survey-pooling"
                      placeholder="e.g. Group software licenses, workshop space, project grants"
                      value={surveyAnswers.poolingIntent}
                      onChange={(e) => setSurveyAnswers({ ...surveyAnswers, poolingIntent: e.target.value })}
                    />
                  </Field>

                  {acceptError && <InlineError message={acceptError} />}

                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-end pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => void handleAccept(true)}
                      disabled={accepting}
                    >
                      Skip For Now
                    </Button>
                    <Button
                      type="button"
                      onClick={() => void handleAccept(false)}
                      disabled={accepting}
                    >
                      {accepting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden />}
                      Complete & Enter Community
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-5 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                    <CheckCircle2 className="h-6 w-6" aria-hidden />
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-bold">Ready to Join</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Signed in as <span className="font-semibold text-foreground">{account.displayName}</span>. Claim your seat to vote on proposals and participate.
                    </p>
                  </div>

                  {acceptError && <InlineError message={acceptError} />}

                  <div className="flex flex-col gap-2.5">
                    <Button
                      size="lg"
                      className="w-full"
                      onClick={() => {
                        // If creative collective or membership, offer optional creator questions
                        if (resolved.community.type === 'creative' || resolved.community.type === 'membership') {
                          setShowSurvey(true);
                        } else {
                          void handleAccept(true);
                        }
                      }}
                      disabled={accepting}
                    >
                      {accepting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                          Claiming Seat...
                        </>
                      ) : (
                        <>
                          Claim My Seat
                          <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </Layout>
  );
}
