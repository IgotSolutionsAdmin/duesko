import { isSupabaseConfigured } from "./supabase/env";

/** Public sample deployment. The value is the string "true", not a secret. */
export function isTestSite(): boolean {
  return process.env.NEXT_PUBLIC_DUESKO_TEST_SITE === "true";
}

/**
 * The in-memory mock and demo sign-in.
 * Local dev uses them whenever Supabase is unset.
 * A production build uses them only when the test-site flag is on.
 */
export function useMockRepository(): boolean {
  if (isTestSite()) return true;
  if (process.env.NODE_ENV === "production") return false;
  return !isSupabaseConfigured();
}
