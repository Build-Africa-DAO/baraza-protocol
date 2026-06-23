"use client";

import { signInWithGoogle } from "@/app/lib/auth/actions";

export default function GoogleButton() {
  return (
    <form action={signInWithGoogle}>
      <button
        type="submit"
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-black/15 bg-white px-4 py-3 text-sm font-semibold text-[#1a1a1a] transition hover:bg-black/[0.03] focus:outline-none focus:ring-2 focus:ring-orange-500/30 active:translate-y-px"
      >
        <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.15-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
          />
          <path
            fill="#FBBC05"
            d="M5.85 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.67-2.84Z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.67 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
          />
        </svg>
        Continue with Google
      </button>
    </form>
  );
}
