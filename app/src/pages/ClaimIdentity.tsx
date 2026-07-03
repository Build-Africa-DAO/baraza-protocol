/**
 * /claim — bidirectional identity claim flow (Phase 9, wallet side).
 *
 * Step 1 — phone entry. Wallet-connected member enters the phone number
 *   they want to link. POST /api/identity/initiate-claim → server SMSes a
 *   6-digit code, returns expiresAt.
 *
 * Step 2 — code entry. Member enters the SMS code. POST
 *   /api/identity/verify-claim → server links phone_hash ↔ wallet_address
 *   in identity_links table.
 *
 * Council ruling 2026-06-19: phone_hash is canonical. This page is the
 * wallet-initiated arm of the bidirectional flow. USSD-initiated arm
 * (member dials *384*5# → code on screen → enter here) shares the same
 * verify endpoint.
 *
 * Member-voice gap carried (MVG-003): copy for the success state hasn't
 * been queried against obs-corpus-220 — same gap as MVG-001/002. The
 * placeholder copy is intentionally sober until the corpus is consulted.
 */

import { useState, type FormEvent } from 'react';
import { Loader2, Phone, ShieldCheck, KeyRound, CheckCircle2 } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import Layout from '@/components/Layout';
import CommunityBanner from '@/components/CommunityBanner';
import { useSeo } from '@/lib/seo';
import { truncateAddress } from '@/lib/utils';
import { buildWalletProofHeaders } from '@/lib/walletProof';

const PHONE_PATTERN = /^\+\d{8,15}$/;
const CODE_PATTERN = /^\d{6}$/;

type Step = 'phone' | 'code' | 'done';

export default function ClaimIdentity() {
  useSeo({
    title: 'Link your phone — Baraza',
    description: 'Link your Baraza wallet to the phone you use for USSD and dues payments.',
    path: '/claim',
    noIndex: true,
  });

  const walletContext = useWallet();
  const { publicKey, connected } = walletContext;
  const { setVisible } = useWalletModal();

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  const wallet = publicKey?.toBase58() ?? '';

  if (!connected || !publicKey) {
    return (
      <Layout>
        <section className="py-20">
          <div className="mx-auto max-w-md px-4 text-center">
            <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <h1 className="font-display text-2xl font-bold">Connect a wallet first</h1>
            <p className="mt-3 text-sm">
              You're linking a phone number to a Baraza wallet. Connect the wallet you want
              the phone to point at.
            </p>
            <button
              onClick={() => setVisible(true)}
              className="btn-warm mt-6 inline-flex items-center gap-2 text-sm"
            >
              Connect wallet
            </button>
          </div>
        </section>
      </Layout>
    );
  }

  async function handlePhoneSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = phone.trim();
    if (!PHONE_PATTERN.test(trimmed)) {
      setError('Enter a phone number in international format, e.g. +254712345678.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/identity/initiate-claim', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(await buildWalletProofHeaders(walletContext, 'identity-claim')),
        },
        body: JSON.stringify({ phoneNumber: trimmed, walletAddress: wallet }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(typeof body.message === 'string' ? body.message : 'Could not start the claim. Try again in a moment.');
        return;
      }
      const data = (await res.json()) as { ok: boolean; expiresAt: string };
      setExpiresAt(data.expiresAt);
      setStep('code');
    } catch {
      setError('Network problem. Try again.');
    } finally {
      setBusy(false);
    }
  }

  async function handleCodeSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = code.trim();
    if (!CODE_PATTERN.test(trimmed)) {
      setError('Enter the 6-digit code from the SMS.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/identity/verify-claim', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(await buildWalletProofHeaders(walletContext, 'identity-claim')),
        },
        body: JSON.stringify({
          code: trimmed,
          phoneNumber: phone.trim(),
          walletAddress: wallet,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const reason = typeof body.reason === 'string' ? body.reason : undefined;
        const msg =
          reason === 'expired' ? 'Code expired. Start again with a new code.'
            : reason === 'too_many_attempts' ? 'Too many attempts. Start a new claim.'
            : reason === 'invalid_code' ? 'Code does not match. Check the SMS and retry.'
            : reason === 'wallet_mismatch' ? 'This claim was started from a different wallet.'
            : reason === 'already_consumed' ? 'This claim was already completed.'
            : 'Could not verify. Try again.';
        setError(msg);
        return;
      }
      setStep('done');
    } catch {
      setError('Network problem. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Layout>
      <section className="py-10 md:py-14">
        <div className="container mx-auto px-4">
          <CommunityBanner className="mb-6 p-5 md:p-6">
            <div className="flex items-center gap-5">
              <div className="grid h-16 w-16 place-items-center rounded-lg border">
                <Phone className="h-7 w-7" />
              </div>
              <div>
                <p className="font-mono text-xs uppercase tracking-widest">Identity link</p>
                <h1 className="mt-2 font-display font-mono text-2xl font-bold md:text-3xl">
                  Link your phone
                </h1>
                <p className="mt-1 text-sm">
                  Wallet {truncateAddress(wallet)} will point at the phone you verify.
                </p>
              </div>
            </div>
          </CommunityBanner>

          <div className="mx-auto max-w-md">
            {step === 'phone' && (
              <form onSubmit={handlePhoneSubmit} className="baraza-card space-y-4 p-6">
                <div>
                  <label htmlFor="phone" className="mb-2 block text-xs font-semibold uppercase tracking-widest">
                    Phone number
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value); setError(null); }}
                    placeholder="+254712345678"
                    className="w-full rounded-lg border px-3 py-2.5 font-mono text-sm outline-none"
                    autoComplete="tel"
                    spellCheck={false}
                    disabled={busy}
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    International format, including country code. Used for the SMS we send you.
                  </p>
                </div>

                {error && (
                  <p role="alert" className="text-xs text-destructive">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={busy || !phone.trim()}
                  className="btn-primary w-full justify-center gap-2 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                  Send code
                </button>

                <p className="text-[11px] text-muted-foreground">
                  Already started the claim from USSD? Skip the SMS step.
                  <button
                    type="button"
                    onClick={() => { setError(null); setStep('code'); }}
                    className="ml-1 underline hover:no-underline"
                    disabled={busy}
                  >
                    Enter your code.
                  </button>
                </p>
              </form>
            )}

            {step === 'code' && (
              <form onSubmit={handleCodeSubmit} className="baraza-card space-y-4 p-6">
                <div>
                  <label htmlFor="code" className="mb-2 block text-xs font-semibold uppercase tracking-widest">
                    6-digit code
                  </label>
                  <input
                    id="code"
                    type="text"
                    inputMode="numeric"
                    pattern="\d{6}"
                    maxLength={6}
                    value={code}
                    onChange={(e) => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(null); }}
                    placeholder="000000"
                    className="w-full rounded-lg border px-3 py-2.5 text-center font-mono text-2xl tracking-[0.5em] outline-none"
                    autoComplete="one-time-code"
                    spellCheck={false}
                    disabled={busy}
                  />
                  {expiresAt && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Code expires {new Date(expiresAt).toLocaleTimeString()}.
                    </p>
                  )}
                </div>

                {error && (
                  <p role="alert" className="text-xs text-destructive">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={busy || code.length !== 6}
                  className="btn-primary w-full justify-center gap-2 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                  Verify and link
                </button>

                <button
                  type="button"
                  onClick={() => { setStep('phone'); setCode(''); setError(null); }}
                  className="text-xs text-muted-foreground underline hover:no-underline"
                  disabled={busy}
                >
                  Use a different phone number
                </button>
              </form>
            )}

            {step === 'done' && (
              <div className="baraza-card p-6 text-center">
                <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full border">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h2 className="font-display text-xl font-bold">Linked.</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your wallet and phone now point at the same Baraza membership. Dues paid
                  from either side will appear in one place.
                </p>
                <a
                  href="/profile"
                  className="btn-ghost mt-4 inline-flex items-center gap-2 px-3 py-2 text-xs"
                >
                  Back to profile
                </a>
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}
