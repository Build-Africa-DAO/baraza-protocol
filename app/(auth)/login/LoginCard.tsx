"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRouter } from "next/navigation";
import {
  sendEmailOtp,
  sendPhoneOtp,
  verifyEmailOtp,
  verifyPhoneOtp,
  type AuthState,
} from "@/app/lib/auth/actions";
import { maskContact } from "@/app/lib/auth/phone";
import GoogleButton from "./GoogleButton";
import OtpInput from "./OtpInput";

const RESEND_SECONDS = 30;

const prefersReduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function LoginCard({ oauthError }: { oauthError?: boolean }) {
  const [view, setView] = useState<AuthState>({
    step: "enter",
    channel: "phone",
  });
  const [code, setCode] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const [isPending, startTransition] = useTransition();
  const panelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Motion 1 — entrance stagger (once, on mount).
  useGSAP(
    () => {
      if (prefersReduced()) return;
      gsap.from(".auth-panel > *", {
        y: 20,
        opacity: 0,
        stagger: 0.07,
        duration: 0.35,
        ease: "power2.out",
      });
    },
    { scope: panelRef },
  );

  // Motion 2 (incoming half) — slide the OTP form in at the code step.
  useGSAP(
    () => {
      if (view.step !== "verify" || prefersReduced()) return;
      gsap.from(".otp-form", {
        x: 30,
        opacity: 0,
        duration: 0.3,
        ease: "power2.out",
      });
    },
    { scope: panelRef, dependencies: [view.step] },
  );

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  // Error copy lives here (client-side) — plain direction, never "Error".
  const error: string | undefined = view.error
    ? view.step === "verify"
      ? "That code didn't work. Try again or resend."
      : view.channel === "phone"
        ? "Check your number and try again."
        : "Check your email and try again."
    : oauthError && view.step === "enter"
      ? "Couldn't continue with Google. Try your phone instead."
      : undefined;

  function send(formData: FormData, channel: "phone" | "email") {
    startTransition(async () => {
      const next =
        channel === "phone"
          ? await sendPhoneOtp(view, formData)
          : await sendEmailOtp(view, formData);

      if (next.step === "verify") {
        const finish = () => {
          setView(next);
          setCode("");
          setResendIn(RESEND_SECONDS);
        };
        if (prefersReduced()) {
          finish();
        } else {
          gsap.to(".phone-form", {
            x: -30,
            opacity: 0,
            duration: 0.25,
            ease: "power2.in",
            onComplete: finish,
          });
        }
      } else {
        setView(next);
      }
    });
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (view.step === "enter") {
      send(formData, view.channel);
      return;
    }

    startTransition(async () => {
      const next =
        view.channel === "phone"
          ? await verifyPhoneOtp(view, formData)
          : await verifyEmailOtp(view, formData);

      if (next.success) {
        // Motion 4 — fade the panel up and out, then go to the dashboard.
        const go = () => router.push("/dashboard");
        if (prefersReduced()) {
          go();
        } else {
          gsap.to(".auth-panel", {
            y: -10,
            opacity: 0,
            duration: 0.3,
            ease: "power2.in",
            onComplete: go,
          });
        }
        return;
      }

      setView(next);
      if (next.error) {
        setCode("");
        // Motion 5 — shake the code boxes on a wrong code.
        if (!prefersReduced()) {
          gsap.fromTo(
            ".otp-inputs",
            { x: -8 },
            {
              x: 8,
              repeat: 3,
              yoyo: true,
              duration: 0.08,
              ease: "none",
              onComplete: () => gsap.set(".otp-inputs", { x: 0 }),
            },
          );
        }
      }
    });
  }

  function resend() {
    if (resendIn > 0 || !view.contact || isPending) return;
    const formData = new FormData();
    formData.set(view.channel === "phone" ? "phone" : "email", view.contact);
    send(formData, view.channel);
  }

  function switchChannel(channel: "phone" | "email") {
    setView({ step: "enter", channel });
    setCode("");
  }

  function back() {
    setView({ step: "enter", channel: view.channel });
    setCode("");
  }

  return (
    <div ref={panelRef} className="auth-panel">
      {/* Mobile mark (brand panel is desktop-only) */}
      <RingMark className="mb-6 h-10 w-10 md:hidden" />

      {view.step === "enter" ? (
        <>
          <h1 className="font-display text-3xl font-bold tracking-[-0.02em] text-baraza-white">
            Welcome to Baraza
          </h1>
          <p className="mt-2 text-sm text-baraza-muted">
            Continue to your community.
          </p>

          {error && <ErrorNote>{error}</ErrorNote>}

          {/* Google — first, fastest, most-tapped */}
          <div className="mt-6">
            <GoogleButton />
            <p className="mt-2 text-center text-xs text-baraza-muted">
              Most people use Google — it&apos;s the fastest.
            </p>
          </div>

          <Divider>
            {view.channel === "phone" ? "or use your phone" : "or use your email"}
          </Divider>

          <form onSubmit={onSubmit} className="phone-form enter-form space-y-3">
            {view.channel === "phone" ? (
              <div className="flex items-stretch overflow-hidden rounded-xl border border-baraza-border bg-baraza-surface focus-within:border-baraza-lime focus-within:ring-2 focus-within:ring-baraza-lime/30">
                <span className="flex items-center gap-1 border-r border-baraza-border bg-black/20 px-3 font-mono text-sm text-baraza-muted">
                  🇰🇪 +254
                </span>
                <input
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  required
                  autoFocus
                  aria-label="Phone number"
                  placeholder="712 345 678"
                  className="min-h-12 w-full bg-transparent px-3 py-3 font-mono text-base text-baraza-white outline-none placeholder:text-baraza-muted/60"
                />
              </div>
            ) : (
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                autoFocus
                aria-label="Email"
                placeholder="you@example.com"
                className="min-h-12 w-full rounded-xl border border-baraza-border bg-baraza-surface px-3 py-3 text-base text-baraza-white outline-none transition focus:border-baraza-lime focus:ring-2 focus:ring-baraza-lime/30 placeholder:text-baraza-muted/60"
              />
            )}

            <PrimaryButton pending={isPending}>
              {isPending ? "Sending…" : "Send code →"}
            </PrimaryButton>
          </form>

          <button
            type="button"
            onClick={() =>
              switchChannel(view.channel === "phone" ? "email" : "phone")
            }
            className="mx-auto mt-6 block min-h-12 text-sm text-baraza-muted underline-offset-4 transition hover:text-baraza-teal hover:underline"
          >
            {view.channel === "phone" ? "Use email instead" : "Use phone instead"}
          </button>

          <p className="mt-6 text-center text-xs text-baraza-muted/80">
            By continuing you agree to our terms and privacy policy.
          </p>
        </>
      ) : (
        <>
          <h1 className="font-display text-3xl font-bold tracking-[-0.02em] text-baraza-white">
            Enter the code
          </h1>
          <p className="mt-2 text-sm text-baraza-muted">
            We sent it to{" "}
            <span className="font-mono text-baraza-white">
              {maskContact(view.contact ?? "")}
            </span>
            .
          </p>

          {error && <ErrorNote>{error}</ErrorNote>}

          <form onSubmit={onSubmit} className="otp-form mt-6 space-y-4">
            <input type="hidden" name="contact" value={view.contact ?? ""} />
            <input type="hidden" name="code" value={code} />
            <div className="otp-inputs">
              <OtpInput value={code} onChange={setCode} disabled={isPending} />
            </div>

            <PrimaryButton pending={isPending} disabled={code.length < 6}>
              {isPending ? "Checking…" : "Verify"}
            </PrimaryButton>
          </form>

          <div className="mt-5 flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={back}
              className="min-h-12 font-medium text-baraza-muted transition hover:text-baraza-teal"
            >
              {view.channel === "phone" ? "Change number" : "Change email"}
            </button>
            <button
              type="button"
              onClick={resend}
              disabled={resendIn > 0 || isPending}
              className="min-h-12 font-medium text-baraza-muted transition enabled:hover:text-baraza-teal disabled:text-baraza-muted/50"
            >
              {resendIn > 0
                ? `Resend in 0:${String(resendIn).padStart(2, "0")}`
                : "Resend code"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function RingMark({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <span className={`relative inline-grid place-items-center ${className}`}>
      <span className="absolute inset-0 rounded-full border-2 border-baraza-lime/30" />
      <span className="absolute inset-[6px] rounded-full border-2 border-baraza-teal/50" />
      <span className="absolute inset-[12px] rounded-full bg-baraza-lime" />
    </span>
  );
}

function PrimaryButton({
  children,
  pending,
  disabled,
}: {
  children: React.ReactNode;
  pending?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="min-h-12 w-full rounded-xl bg-baraza-lime px-4 py-3 text-sm font-semibold text-baraza-black transition hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-baraza-lime/50 focus:ring-offset-2 focus:ring-offset-baraza-black active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function Divider({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-5 flex items-center gap-3 text-xs text-baraza-muted">
      <span className="h-px flex-1 bg-baraza-border" />
      {children}
      <span className="h-px flex-1 bg-baraza-border" />
    </div>
  );
}

function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      className="mt-4 rounded-xl border border-baraza-error/30 bg-baraza-error/10 px-3 py-2.5 text-sm text-baraza-error"
    >
      {children}
    </p>
  );
}
