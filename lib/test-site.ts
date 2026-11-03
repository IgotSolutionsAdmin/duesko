import { isSupabaseConfigured } from "./supabase/env";

/** Public sample deployment. The value is the string "true", not a secret. */
export function isTestSite(): boolean {
  return process.env.NEXT_PUBLIC_DUESKO_TEST_SITE === "true";
}

/**
 * The in-memory mock and demo sign-in.
 * Supabase, when its public URL and anon key are set, always wins so invited
 * accounts use real data even on the test site.
 * Otherwise local dev uses the mock, and a production build uses it only when
 * the test-site flag is on.
 */
export function useMockRepository(): boolean {
  if (isSupabaseConfigured()) return false;
  if (isTestSite()) return true;
  if (process.env.NODE_ENV === "production") return false;
  return true;
}
