"use client";

import {
  useEffect,
  useState,
  useTransition,
  type FormEvent,
} from "react";
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

export default function LoginCard({ oauthError }: { oauthError?: boolean }) {
  const [view, setView] = useState<AuthState>({
    step: "enter",
    channel: "phone",
  });
  const [code, setCode] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const error =
    view.error ??
    (oauthError && view.step === "enter"
      ? "We couldn't finish with Google. Try a code instead."
      : undefined);

  function send(formData: FormData, channel: "phone" | "email") {
    startTransition(async () => {
      const next =
        channel === "phone"
          ? await sendPhoneOtp(view, formData)
          : await sendEmailOtp(view, formData);
      setView(next);
      if (next.step === "verify") {
        setCode("");
        setResendIn(RESEND_SECONDS);
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
      // On success these redirect server-side; only errors return state.
      const next =
        view.channel === "phone"
          ? await verifyPhoneOtp(view, formData)
          : await verifyEmailOtp(view, formData);
      setView(next);
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
    <div key={view.step} className="animate-fade-up">
      {view.step === "enter" ? (
        <>
          <h1 className="text-3xl font-bold tracking-tight text-[#1a1a1a]">
            Welcome to Baraza
          </h1>
          <p className="mt-2 text-sm text-black/60">
            Sign in to pick up where you left off.
          </p>

          {error && <ErrorNote>{error}</ErrorNote>}

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            {view.channel === "phone" ? (
              <label className="block">
                <span className="text-sm font-semibold text-[#1a1a1a]">
                  Phone number
                </span>
                <div className="mt-1.5 flex items-stretch overflow-hidden rounded-xl border border-black/15 bg-white focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/30">
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
                    placeholder="712 345 678"
                    className="w-full bg-transparent px-3 py-3 font-mono text-base text-[#1a1a1a] outline-none placeholder:text-black/30"
                  />
                </div>
                <span className="mt-1.5 block text-xs text-black/50">
                  We&apos;ll text you a code.
                </span>
              </label>
            ) : (
              <label className="block">
                <span className="text-sm font-semibold text-[#1a1a1a]">
                  Email
                </span>
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  autoFocus
                  placeholder="you@example.com"
                  className="mt-1.5 w-full rounded-xl border border-black/15 bg-white px-3 py-3 text-base text-[#1a1a1a] outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 placeholder:text-black/30"
                />
                <span className="mt-1.5 block text-xs text-black/50">
                  We&apos;ll email you a code.
                </span>
              </label>
            )}

            <PrimaryButton pending={isPending}>
              {isPending ? "Sending…" : "Send code"}
            </PrimaryButton>
          </form>

          <Divider />

          <GoogleButton />

          <button
            type="button"
            onClick={() =>
              switchChannel(view.channel === "phone" ? "email" : "phone")
            }
            className="mt-3 w-full text-center text-sm font-medium text-black/60 underline-offset-4 transition hover:text-orange-600 hover:underline"
          >
            {view.channel === "phone" ? "Use email instead" : "Use phone instead"}
          </button>

          <p className="mt-8 text-center text-xs text-black/45">
            New here? Just enter your number — we&apos;ll set you up.
          </p>
          <p className="mt-2 text-center text-xs text-black/40">
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

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <input type="hidden" name="contact" value={view.contact ?? ""} />
            <input type="hidden" name="code" value={code} />
            <OtpInput value={code} onChange={setCode} disabled={isPending} />

            <PrimaryButton pending={isPending} disabled={code.length < 6}>
              {isPending ? "Checking…" : "Verify"}
            </PrimaryButton>
          </form>

          <div className="mt-5 flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={back}
              className="font-medium text-black/60 transition hover:text-orange-600"
            >
              {view.channel === "phone" ? "Change number" : "Change email"}
            </button>
            <button
              type="button"
              onClick={resend}
              disabled={resendIn > 0 || isPending}
              className="font-medium text-black/60 transition enabled:hover:text-orange-600 disabled:text-black/35"
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
      className="w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500/40 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function Divider() {
  return (
    <div className="my-5 flex items-center gap-3 text-xs text-black/40">
      <span className="h-px flex-1 bg-black/10" />
      or continue with
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
