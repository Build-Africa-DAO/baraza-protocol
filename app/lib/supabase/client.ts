import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client for use inside Client Components.
 * Reads the public URL + anon key (safe to expose; protected by RLS).
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
