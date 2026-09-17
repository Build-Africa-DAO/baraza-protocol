import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { Loader2, Mail, Phone, X } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { GoogleIdentityButton } from '@/components/auth/GoogleIdentityButton';
import { Button } from '@/components/ui/button';
import { hasStoredAccountCountry } from '@/lib/accountLocale';
import { requestCode, signInWithGoogle, verifyCode } from '@/lib/auth/baraza';
import { getGoogleClientId } from '@/lib/auth/provider';
import { isValidEmail } from '@/lib/phoneAuth';
import { cn, toTitleCase } from '@/lib/utils';
import { digitsOnly, isCompletePrivyOtp } from '@/lib/privyAuth';
import type { AccountCountryCode } from '@/lib/accountLocale';

export type AuthIntent = 'signin' | 'signup';
export type AuthMethod = 'email' | 'phone';

/**
 * What the modal needs from a sign-in provider. The view below is the same
 * for Privy and for Baraza's own codes; only these calls differ. Each call
 * rejects with an `Error` whose message is already written for members.
 */
export interface AuthActions {
  phoneEnabled: boolean;
  sendCode: (input: { method: AuthMethod; destination: string; isSignUp: boolean }) => Promise<void>;
  verifyCode: (input: { method: AuthMethod; destination: string; code: string; isSignUp: boolean }) => Promise<void>;
  /** Our own "Continue with Google" button. */
  continueWithGoogle?: (isSignUp: boolean) => Promise<void>;
  googleLoading?: boolean;
  /** A provider-rendered Google control (Google Identity Services) instead of our button. */
  renderGoogle?: (input: { isSignUp: boolean; disabled: boolean; onError: (message: string) => void }) => ReactNode;
  formatError: (err: unknown) => string;
}

const DIAL_CODES: { code: string; label: string; country: AccountCountryCode }[] = [
  { code: '+254', label: 'KE +254', country: 'KE' },
  { code: '+250', label: 'RW +250', country: 'RW' },
  { code: '+255', label: 'TZ +255', country: 'TZ' },
  { code: '+256', label: 'UG +256', country: 'UG' },
  { code: '+251', label: 'ET +251', country: 'ET' },
  { code: '+234', label: 'NG +234', country: 'NG' },
  { code: '+233', label: 'GH +233', country: 'GH' },
  { code: '+27', label: 'ZA +27', country: 'ZA' },
  { code: '+44', label: 'GB +44', country: 'GB' },
  { code: '+1', label: 'US +1', country: 'US' },
];

function dialForCountry(country: AccountCountryCode): string {
  return DIAL_CODES.find((item) => item.country === country)?.code ?? '+254';
}

const INCOMPLETE_OTP_MESSAGE = 'Enter all 6 digits, including a 0 at the start if there is one.';

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function maskDestination(value: string, method: 'email' | 'phone'): string {
  if (method === 'email') {
    const [local, domain] = value.split('@');
    if (!domain) return value;
    return `${local.slice(0, 2)}•••@${domain}`;
  }
  if (value.length <= 6) return value;
  return `${value.slice(0, 5)}•••${value.slice(-3)}`;
}

export interface AuthModalProps {
  intent: AuthIntent;
  countryCode: AccountCountryCode;
  onIntentChange: (intent: AuthIntent) => void;
  onClose: () => void;
  /** Why the sheet opened on its own, e.g. an expired session. Shown above the form. */
  notice?: string;
}

export function AuthModalView({ actions, intent, countryCode, onIntentChange, onClose, notice }: AuthModalProps & { actions: AuthActions }) {
  const titleId = useId();
  const phoneEnabled = actions.phoneEnabled;
  const googleLoading = Boolean(actions.googleLoading);

  const [method, setMethod] = useState<AuthMethod>(phoneEnabled ? 'phone' : 'email');
  const [step, setStep] = useState<'identifier' | 'code'>('identifier');
  const [email, setEmail] = useState('');
  // Kenya first unless the person chose a country themselves; an inferred
  // locale must not put a chama member on US +1.
  const [dial, setDial] = useState(dialForCountry(hasStoredAccountCountry() ? countryCode : 'KE'));
  const [localNumber, setLocalNumber] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const verifyingRef = useRef(false);

  const e164 = `${dial}${localNumber.replace(/\s/g, '').replace(/^0+/, '')}`;
  const destination = method === 'email' ? email.trim() : e164;
  const isSignUp = intent === 'signup';

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    previouslyFocused.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    document.body.style.overflow = 'hidden';

    const focusables = () => Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) ?? [],
    ).filter((el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true');

    const first = focusables()[0];
    first?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) return;
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      if (event.shiftKey && document.activeElement === firstItem) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault();
        firstItem.focus();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      previouslyFocused.current?.focus();
    };
  }, [onClose]);

  async function sendOtp() {
    setError(null);

    if (method === 'email' && !isValidEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }
    if (method === 'phone' && !/^\+\d{10,15}$/.test(e164)) {
      setError('Enter a valid phone number.');
      return;
    }

    setBusy(true);
    try {
      await actions.sendCode({ method, destination, isSignUp });
      setStep('code');
      setCode('');
    } catch (err) {
      setError(actions.formatError(err));
    } finally {
      setBusy(false);
    }
  }

  async function continueWithGoogle() {
    if (!actions.continueWithGoogle) return;
    setError(null);
    setBusy(true);
    try {
      await actions.continueWithGoogle(isSignUp);
    } catch (err) {
      setError(actions.formatError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleVerify(event?: React.FormEvent, submittedCode?: string) {
    event?.preventDefault();
    if (verifyingRef.current) return;
    const digits = digitsOnly(submittedCode ?? code);
    if (!isCompletePrivyOtp(digits)) {
      setError(INCOMPLETE_OTP_MESSAGE);
      return;
    }

    verifyingRef.current = true;
    setBusy(true);
    setError(null);
    try {
      await actions.verifyCode({ method, destination, code: digits, isSignUp });
    } catch (err) {
      setError(actions.formatError(err));
    } finally {
      verifyingRef.current = false;
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center overflow-y-auto bg-background/80 p-0 backdrop-blur-md sm:items-center sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex w-full max-h-[100dvh] max-w-md flex-col overflow-y-auto rounded-t-2xl border border-border bg-background text-foreground shadow-[var(--shadow-deep)] sm:max-h-[min(42rem,calc(100dvh-3rem))] sm:rounded-2xl"
      >
        <div className="relative flex flex-col px-5 pb-[max(env(safe-area-inset-bottom),1.25rem)] pt-6 sm:px-8 sm:py-8">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="btn-icon absolute right-3 top-3 h-12 w-12"
          >
            <X className="h-4 w-4" />
          </button>

          <BrandLogo size="sm" lockup="protocol" showIcon={false} />
          <h2 id={titleId} className="mt-5 font-display text-2xl font-black tracking-tight">
            {isSignUp ? toTitleCase('Create your account') : toTitleCase('Sign in')}
          </h2>
          {notice ? (
            <p role="status" className="mt-3 rounded-chrome border border-pending bg-pending/10 px-3 py-2 text-sm text-foreground" data-testid="auth-notice">
              {notice}
            </p>
          ) : null}
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {isSignUp
              ? phoneEnabled
                ? 'Start a group or join one with your phone number or email.'
                : 'Start a group or join one with your email.'
              : phoneEnabled
                ? 'Sign in with the phone number or email you used before.'
                : 'Sign in with the email you used before.'}
          </p>

          {phoneEnabled && step === 'identifier' && (
            <div className="mt-6 grid grid-cols-2 gap-1 rounded-full border border-border bg-surface p-1">
              {(['phone', 'email'] as const).map((next) => (
                <button
                  key={next}
                  type="button"
                  onClick={() => { setMethod(next); setError(null); }}
                  className={cn(
                    'rounded-full px-3 py-2 text-xs font-bold transition-colors',
                    method === next
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {next === 'phone' ? (
                    <span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> Phone</span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> Email</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {step === 'identifier' ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void sendOtp();
              }}
              className="mt-6 space-y-4"
            >
              {method === 'email' ? (
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-foreground">
                    Email
                  </span>
                  <input
                    type="email"
                    autoComplete="email"
                    autoFocus
                    value={email}
                    onChange={(event) => { setEmail(event.target.value); setError(null); }}
                    placeholder="you@email.com"
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none ring-offset-background focus:border-foreground focus:ring-2 focus:ring-ring"
                  />
                </label>
              ) : (
                <div>
                  <span className="mb-2 block text-sm font-semibold text-foreground">
                    Phone number
                  </span>
                  <div className="flex overflow-hidden rounded-xl border border-border focus-within:border-foreground focus-within:ring-2 focus-within:ring-ring">
                    <select
                      value={dial}
                      onChange={(event) => setDial(event.target.value)}
                      aria-label="Country code"
                      className="border-r border-border bg-surface px-3 py-3 text-sm outline-none"
                    >
                      {DIAL_CODES.map((item) => (
                        <option key={item.code} value={item.code}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      autoFocus
                      aria-label="Phone number"
                      value={localNumber}
                      onChange={(event) => { setLocalNumber(event.target.value); setError(null); }}
                      placeholder="712 345 678"
                      className="min-w-0 flex-1 bg-background px-4 py-3 text-sm outline-none"
                    />
                  </div>
                </div>
              )}

              {error && <p className="text-xs text-destructive">{error}</p>}

              <Button type="submit" disabled={busy} fullWidth>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {busy ? 'Sending code…' : 'Send code'}
              </Button>
            </form>
          ) : (
            <form onSubmit={(event) => void handleVerify(event)} className="mt-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                We sent a 6-digit code to{' '}
                <span className="font-semibold text-foreground">{maskDestination(destination, method)}</span>
              </p>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-foreground">
                  Verification code
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  maxLength={6}
                  pattern="[0-9]{6}"
                  aria-label="Verification code"
                  value={code}
                  onChange={(event) => {
                    const next = digitsOnly(event.target.value);
                    setCode(next);
                    setError(null);
                    if (isCompletePrivyOtp(next) && !busy && !verifyingRef.current) {
                      void handleVerify(undefined, next);
                    }
                  }}
                  placeholder="000000"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-center font-mono text-2xl tracking-[0.35em] outline-none focus:border-foreground focus:ring-2 focus:ring-ring"
                />
              </label>

              {error && <p className="text-xs text-destructive">{error}</p>}

              <Button type="submit" disabled={busy || !isCompletePrivyOtp(code)} fullWidth>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {busy ? 'Checking…' : isSignUp ? 'Create account' : 'Sign in'}
              </Button>

              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => { setStep('identifier'); setCode(''); setError(null); }}
                  className="font-semibold text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                >
                  Use a different {method === 'email' ? 'email' : 'number'}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void sendOtp()}
                  className="font-semibold text-muted-foreground underline-offset-2 hover:text-foreground hover:underline disabled:opacity-50"
                >
                  Resend code
                </button>
              </div>
            </form>
          )}

          {actions.renderGoogle || actions.continueWithGoogle ? (
            <div className="mt-6">
              <div className="mb-4 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                or
                <span className="h-px flex-1 bg-border" />
              </div>
              {actions.renderGoogle ? (
                actions.renderGoogle({ isSignUp, disabled: busy, onError: (message) => setError(message) })
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  fullWidth
                  disabled={busy || googleLoading}
                  onClick={() => void continueWithGoogle()}
                >
                  {googleLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <GoogleMark className="h-4 w-4 shrink-0" />
                  )}
                  Continue with Google
                </Button>
              )}
            </div>
          ) : null}

          <p className="mt-5 text-center text-xs text-muted-foreground">
            {phoneEnabled ? 'Phone or email is enough.' : 'Your email is enough.'} You do not need a crypto wallet.
          </p>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            {isSignUp ? (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { onIntentChange('signin'); setStep('identifier'); setError(null); }}
                  className="font-bold text-foreground underline-offset-2 hover:underline"
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                New here?{' '}
                <button
                  type="button"
                  onClick={() => { onIntentChange('signup'); setStep('identifier'); setError(null); }}
                  className="font-bold text-foreground underline-offset-2 hover:underline"
                >
                  Create an account
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * The modal on Baraza's own sign-in (`lib/auth/baraza.ts`). Email codes only
 * until the backend adds an SMS channel; Google through Google Identity
 * Services when `VITE_GOOGLE_CLIENT_ID` is set.
 */
export function BarazaAuthModal(props: AuthModalProps) {
  const clientId = getGoogleClientId();
  const purposeOf = (isSignUp: boolean): 'signup' | 'signin' => (isSignUp ? 'signup' : 'signin');

  const onCredential = useCallback(
    async (credential: string, isSignUp: boolean) => {
      const step = await signInWithGoogle({ credential, isSignUp });
      if (!step.ok) throw new Error(step.message);
    },
    [],
  );

  const actions = useMemo<AuthActions>(
    () => ({
      phoneEnabled: false,
      sendCode: async ({ destination, isSignUp }) => {
        const step = await requestCode({ email: destination, purpose: purposeOf(isSignUp) });
        if (!step.ok) throw new Error(step.message);
      },
      verifyCode: async ({ destination, code, isSignUp }) => {
        const step = await verifyCode({ email: destination, code, purpose: purposeOf(isSignUp) });
        if (!step.ok) throw new Error(step.message);
      },
      renderGoogle: clientId
        ? ({ isSignUp, disabled, onError }) => (
            <GoogleIdentityButton
              clientId={clientId}
              isSignUp={isSignUp}
              disabled={disabled}
              onError={onError}
              onCredential={(credential) => {
                onCredential(credential, isSignUp).catch((err: unknown) => onError(err instanceof Error ? err.message : 'Google sign-in failed.'));
              }}
            />
          )
        : undefined,
      formatError: (err) => (err instanceof Error && err.message ? err.message : 'Something went wrong. Try again.'),
    }),
    [clientId, onCredential],
  );

  return <AuthModalView {...props} actions={actions} />;
}
