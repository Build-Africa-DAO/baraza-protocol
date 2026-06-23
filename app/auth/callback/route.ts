import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";

/**
 * Google OAuth callback. Supabase redirects here with a `code`; we exchange
 * it for a session (which sets the auth cookie) and send the user on.
 *
 * `next` is validated to be a relative path to prevent open-redirects.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  const nextParam = searchParams.get("next") ?? "/";
  const next = nextParam.startsWith("/") ? nextParam : "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth`);
}
