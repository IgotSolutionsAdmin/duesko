const SET_PASSWORD_PATH = "/auth/set-password";

/** Allowed post-callback path for password recovery. */
export function safeAuthNext(next: string | null | undefined): string | null {
  if (!next) return null;
  if (next === SET_PASSWORD_PATH || next.startsWith(`${SET_PASSWORD_PATH}?`)) return next;
  return null;
}

/** redirectTo for supabase.auth.resetPasswordForEmail. */
export function passwordResetRedirectTo(origin: string): string {
  const base = origin.replace(/\/$/, "");
  const next = encodeURIComponent(SET_PASSWORD_PATH);
  return `${base}/auth/callback?next=${next}`;
}

/** Keeps recovery flows on the set-password page when the link asked for it. */
export function applyAuthNextDestination(
  destination: string,
  next: string | null | undefined,
): string {
  const safe = safeAuthNext(next);
  if (destination === SET_PASSWORD_PATH && safe) return safe;
  return destination;
}
