import { isSupabaseConfigured } from "./supabase/env";
import { isTestSite, useMockRepository } from "./test-site";

/** Passwordless demo cookie sign-in for the public sample deployment only. */
export function isDemoAuthEnabled(): boolean {
  if (!isTestSite()) return false;
  if (isSupabaseConfigured()) return false;
  if (process.env.NODE_ENV === "development") return true;
  if (process.env.DUESKO_E2E === "1") return true;
  return false;
}

/** The DEV ONLY role-switch panel is rendered only on the test site during `next dev`. */
export function shouldRenderDevRoleSwitch(): boolean {
  if (!isTestSite()) return false;
  if (process.env.DUESKO_E2E === "1") return false;
  return process.env.NODE_ENV === "development";
}

/** `/dev/reset` and related dev routes stay on the test site for local dev and Playwright. */
export function allowDevReset(): boolean {
  if (!isTestSite()) return false;
  return process.env.DUESKO_E2E === "1" || process.env.NODE_ENV === "development";
}
