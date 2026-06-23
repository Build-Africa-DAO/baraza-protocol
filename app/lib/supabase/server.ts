import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server-side Supabase client for Server Components, Server Actions, and
 * Route Handlers.
 *
 * Next.js 16 note: `cookies()` is async, so this factory is async too.
 * `setAll` is wrapped in try/catch because cookies cannot be written during
 * a Server Component render — those writes are a no-op here and the session
 * is instead refreshed in `proxy.ts`. In Server Actions / Route Handlers the
 * write succeeds and the session cookie is persisted.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component render — safe to ignore.
            // The proxy refreshes the session cookie on the response.
          }
        },
      },
    },
  );
}
