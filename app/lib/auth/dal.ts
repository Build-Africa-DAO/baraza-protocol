import "server-only";

import { cache } from "react";
import { createClient } from "@/app/lib/supabase/server";

/**
 * Data Access Layer — the single place that reads the authenticated user.
 *
 * Always uses `auth.getUser()` (which revalidates the token with Supabase),
 * never `getSession()` alone, so auth decisions can't be spoofed from a
 * tampered cookie. Memoized per render pass with React `cache`.
 */
export const getUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});
