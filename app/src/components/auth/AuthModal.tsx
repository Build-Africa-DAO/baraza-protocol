import { useEffect, useId, useRef, useState } from 'react';
import { Loader2, Mail, Phone, X } from 'lucide-react';
import { useLoginWithEmail, useLoginWithOAuth, useLoginWithSms } from '@privy-io/react-auth';
import { BrandLogo } from '@/components/BrandLogo';
import { isPrivyPhoneAuthEnabled } from '@/lib/wallet/mpc';
import { isValidEmail } from '@/lib/phoneAuth';
import { cn, toTitleCase } from '@/lib/utils';
import { digitsOnly, formatPrivyAuthError, isCompletePrivyOtp } from '@/lib/privyAuth';
import type { AccountCountryCode } from '@/lib/accountLocale';

export type AuthIntent = 'signin' | 'signup';

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

interface AuthModalProps {
  intent: AuthIntent;
  countryCode: AccountCountryCode;
  onIntentChange: (intent: AuthIntent) => void;
  onClose: () => void;
}

export default function AuthModal({ intent, countryCode, onIntentChange, onClose }: AuthModalProps) {
  const titleId = useId();
  const phoneEnabled = isPrivyPhoneAuthEnabled();
  const { sendCode: sendEmailCode, loginWithCode: loginWithEmailCode } = useLoginWithEmail();
  const { sendCode: sendSmsCode, loginWithCode: loginWithSmsCode } = useLoginWithSms();
  const { initOAuth, loading: googleLoading } = useLoginWithOAuth();

  const [method, setMethod] = useState<'email' | 'phone'>(phoneEnabled ? 'phone' : 'email');
  const [step, setStep] = useState<'identifier' | 'code'>('identifier');
  const [email, setEmail] = useState('');
  const [dial, setDial] = useState(dialForCountry(countryCode));
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
      if (method === 'email') {
        await sendEmailCode({ email: email.trim(), disableSignup: !isSignUp });
      } else {
        await sendSmsCode({ phoneNumber: e164, disableSignup: !isSignUp });
      }
      setStep('code');
      setCode('');
    } catch (err) {
      setError(formatPrivyAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  async function continueWithGoogle() {
    setError(null);
    setBusy(true);
    try {
      await initOAuth({ provider: 'google', disableSignup: !isSignUp });
    } catch (err) {
      setError(formatPrivyAuthError(err));
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
      if (method === 'email') {
        await loginWithEmailCode({ code: digits });
      } else {
        await loginWithSmsCode({ code: digits });
      }
    } catch (err) {
      setError(formatPrivyAuthError(err));
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
        className="relative grid w-full max-h-[100dvh] max-w-[72rem] overflow-y-auto rounded-t-2xl border border-border bg-background text-foreground shadow-[var(--shadow-deep)] sm:max-h-[min(42rem,calc(100dvh-3rem))] sm:rounded-2xl md:grid-cols-2"
      >
        <div className="relative hidden overflow-hidden md:block md:min-h-full">
          <img
            src="/audience/group.jpg"
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/20" />
          <div className="relative flex h-full flex-col justify-end p-12 text-white">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Baraza</p>
            <p className="mt-2 max-w-md font-display text-3xl font-black leading-tight sm:text-4xl">
              Run the chama where every member can see the money.
            </p>
            <p className="mt-3 max-w-md text-sm leading-6 text-white/80 sm:text-base">
              Phone or email is enough to join a group.
            </p>
          </div>
        </div>

        <div className="relative flex flex-col justify-center px-5 py-8 sm:px-10 md:px-14 md:py-16">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="btn-icon absolute right-3 top-3 h-9 w-9"
          >
            <X className="h-4 w-4" />
          </button>

          <BrandLogo size="sm" lockup="protocol" showIcon={false} />
          <h2 id={titleId} className="mt-5 font-display text-3xl font-black tracking-tight">
            {isSignUp ? toTitleCase('Create your account') : toTitleCase('Welcome back')}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {isSignUp
              ? 'Start a group or join one with your phone number or email.'
              : 'Sign in with the phone number or email you used before.'}
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
                  <span className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
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
                  <span className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
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

              <button type="submit" disabled={busy} className="btn-wipe h-11 w-full gap-2 text-sm">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {busy ? 'Sending code…' : 'Send code'}
              </button>
            </form>
          ) : (
            <form onSubmit={(event) => void handleVerify(event)} className="mt-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                We sent a 6-digit code to{' '}
                <span className="font-semibold text-foreground">{maskDestination(destination, method)}</span>
              </p>
              <label className="block">
                <span className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
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

              <button type="submit" disabled={busy || !isCompletePrivyOtp(code)} className="btn-wipe h-11 w-full gap-2 text-sm">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {busy ? 'Checking…' : isSignUp ? 'Create account' : 'Sign in'}
              </button>

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

          <div className="mt-6">
            <div className="mb-4 flex items-center gap-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              or
              <span className="h-px flex-1 bg-border" />
            </div>
            <button
              type="button"
              disabled={busy || googleLoading}
              onClick={() => void continueWithGoogle()}
              className="btn-wipe-outline h-11 w-full gap-2.5 text-sm"
            >
              {googleLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <GoogleMark className="h-4 w-4 shrink-0" />
              )}
              Continue with Google
            </button>
          </div>

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
