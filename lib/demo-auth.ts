/** Passwordless demo cookie sign-in is local development only. */
export function isDemoAuthEnabled(): boolean {
  return process.env.NODE_ENV === "development";
}

/** The DEV ONLY role-switch panel is rendered only during `next dev`. */
export function shouldRenderDevRoleSwitch(): boolean {
  return isDemoAuthEnabled();
}
