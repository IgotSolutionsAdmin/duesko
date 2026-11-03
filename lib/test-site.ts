import { isSupabaseConfigured } from "./supabase/env";

/** Public sample deployment. The value is the string "true", not a secret. */
export function isTestSite(): boolean {
  return process.env.NEXT_PUBLIC_DUESKO_TEST_SITE === "true";
}

/**
 * The in-memory mock store is available only on the public test site when
 * Supabase is not configured. Real deployments use Supabase instead.
 */
export function useMockRepository(): boolean {
  if (isSupabaseConfigured()) return false;
  return isTestSite();
}
