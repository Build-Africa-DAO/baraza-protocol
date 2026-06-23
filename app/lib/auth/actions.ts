"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";
import { toE164 } from "@/app/lib/auth/phone";

/**
 * Shared state for the login form, driven by `useActionState`.
 * `step` decides which screen the card shows; `contact` is the normalized
 * phone (E.164) or email carried into the verify step.
 */
export type AuthState = {
  step: "enter" | "verify";
  channel: "phone" | "email";
  contact?: string;
  error?: string;
  /** Set on a successful verify so the client can animate, then navigate. */
  success?: boolean;
};

const GENERIC_ERROR =
  "Something went wrong on our side. Give it another go.";

/** Resolve an absolute origin for OAuth redirects. */
async function getOrigin(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const h = await headers();
  return h.get("origin") ?? `https://${h.get("host")}`;
}

// ---------------------------------------------------------------------------
// Phone (primary)
// ---------------------------------------------------------------------------

export async function sendPhoneOtp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const raw = String(formData.get("phone") ?? "");
  const phone = toE164(raw);
  if (!phone) {
    return {
      step: "enter",
      channel: "phone",
      error: "That number doesn't look right — check it and resend.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({ phone });
  if (error) {
    return { step: "enter", channel: "phone", error: GENERIC_ERROR };
  }

  return { step: "verify", channel: "phone", contact: phone };
}

export async function verifyPhoneOtp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const phone = String(formData.get("contact") ?? "");
  const token = String(formData.get("code") ?? "").trim();

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: "sms",
  });
  if (error) {
    return {
      step: "verify",
      channel: "phone",
      contact: phone,
      error: "That code didn't match. Try again or resend a new one.",
    };
  }

  // Session cookie is set above by verifyOtp (we're in a Server Action, so the
  // write is committed). Return success instead of redirecting so the client
  // can play the exit animation before navigating.
  return { step: "verify", channel: "phone", contact: phone, success: true };
}

// ---------------------------------------------------------------------------
// Email (fallback)
// ---------------------------------------------------------------------------

export async function sendEmailOtp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email || !email.includes("@")) {
    return {
      step: "enter",
      channel: "email",
      error: "That email doesn't look right — check it and resend.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({ email });
  if (error) {
    return { step: "enter", channel: "email", error: GENERIC_ERROR };
  }

  return { step: "verify", channel: "email", contact: email };
}

export async function verifyEmailOtp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("contact") ?? "");
  const token = String(formData.get("code") ?? "").trim();

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });
  if (error) {
    return {
      step: "verify",
      channel: "email",
      contact: email,
      error: "That code didn't match. Try again or resend a new one.",
    };
  }

  return { step: "verify", channel: "email", contact: email, success: true };
}

// ---------------------------------------------------------------------------
// Google (third option)
// ---------------------------------------------------------------------------

export async function signInWithGoogle(): Promise<void> {
  const supabase = await createClient();
  const origin = await getOrigin();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback?next=/` },
  });

  if (error || !data?.url) {
    redirect("/login?error=oauth");
  }

  redirect(data.url);
}

// ---------------------------------------------------------------------------
// Sign out
// ---------------------------------------------------------------------------

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
