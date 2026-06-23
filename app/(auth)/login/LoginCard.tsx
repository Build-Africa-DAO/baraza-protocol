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

  // Motion 2 (incoming half) — slide the OTP form in when we reach the code step.
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

  // Error copy lives here (client-side) so the auth logic in actions.ts stays
  // untouched. Plain direction — never the word "Error".
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
        // Motion 2 (outgoing half) — slide the phone form out, then swap.
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
      {view.step === "enter" ? (
        <>
          <h1 className="text-3xl font-bold tracking-tight text-[#1a1a1a]">
            Welcome to Baraza
          </h1>
          <p className="mt-2 text-sm text-black/60">
            Continue to your community.
          </p>

          {error && <ErrorNote>{error}</ErrorNote>}

          {/* Google — first, fastest, most-tapped */}
          <div className="mt-6">
            <GoogleButton />
            <p className="mt-2 text-center text-xs text-black/45">
              Most people use Google — it&apos;s the fastest.
            </p>
          </div>

          <Divider>
            {view.channel === "phone" ? "or use your phone" : "or use your email"}
          </Divider>

          <form
            onSubmit={onSubmit}
            className="phone-form enter-form space-y-3"
          >
            {view.channel === "phone" ? (
              <div className="flex items-stretch overflow-hidden rounded-xl border border-black/15 bg-white focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/30">
                <span className="flex items-center gap-1 border-r border-black/10 bg-black/[0.03] px-3 font-mono text-sm text-black/70">
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
                  className="min-h-12 w-full bg-transparent px-3 py-3 font-mono text-base text-[#1a1a1a] outline-none placeholder:text-black/30"
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
                className="min-h-12 w-full rounded-xl border border-black/15 bg-white px-3 py-3 text-base text-[#1a1a1a] outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 placeholder:text-black/30"
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
            className="mx-auto mt-6 block text-sm text-black/50 underline-offset-4 transition hover:text-orange-600 hover:underline"
          >
            {view.channel === "phone" ? "Use email instead" : "Use phone instead"}
          </button>

          <p className="mt-8 text-center text-xs text-black/40">
            By continuing you agree to our terms and privacy policy.
          </p>
        </>
      ) : (
        <>
          <h1 className="text-3xl font-bold tracking-tight text-[#1a1a1a]">
            Enter the code
          </h1>
          <p className="mt-2 text-sm text-black/60">
            We sent it to{" "}
            <span className="font-mono text-black/80">
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
              className="min-h-12 font-medium text-black/60 transition hover:text-orange-600"
            >
              {view.channel === "phone" ? "Change number" : "Change email"}
            </button>
            <button
              type="button"
              onClick={resend}
              disabled={resendIn > 0 || isPending}
              className="min-h-12 font-medium text-black/60 transition enabled:hover:text-orange-600 disabled:text-black/35"
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
      className="min-h-12 w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500/40 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function Divider({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-5 flex items-center gap-3 text-xs text-black/40">
      <span className="h-px flex-1 bg-black/10" />
      {children}
      <span className="h-px flex-1 bg-black/10" />
    </div>
  );
}

function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2.5 text-sm text-red-700"
    >
      {children}
    </p>
  );
}
