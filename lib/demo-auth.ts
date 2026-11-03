/** Passwordless demo cookie sign-in for local development and Playwright. */
export function isDemoAuthEnabled(): boolean {
  return process.env.NODE_ENV === "development" || process.env.DUESKO_E2E === "1";
}

/** The DEV ONLY role-switch panel is rendered only during `next dev`. */
export function shouldRenderDevRoleSwitch(): boolean {
  if (process.env.DUESKO_E2E === "1") return false;
  return process.env.NODE_ENV === "development";
}

/** `/dev/reset` stays available for Playwright against a production start. */
export function allowDevReset(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.DUESKO_E2E === "1";
}
