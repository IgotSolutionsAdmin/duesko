import { homePath } from "./roles";
import type { Role } from "./types";

const LINK_TYPES = new Set(["invite", "recovery", "magiclink", "email", "signup"]);

/** Keeps only auth link types the callback knows how to route. */
export function linkTypeFromParam(value: string | null | undefined): string | null {
  if (!value || !LINK_TYPES.has(value)) return null;
  return value;
}

/**
 * Where to send someone after a magic link or invite creates a session.
 * An invite, or an invited account that has not chosen a password yet, goes
 * to /auth/set-password. Everyone else goes to their portal.
 */
export function destinationAfterAuth(input: {
  linkType: string | null;
  invitedAt: string | null;
  passwordSet: boolean;
  role: Role | null;
}): "/auth/set-password" | "/admin" | "/resident" | "/admin/login?auth=profile" {
  const linkType = linkTypeFromParam(input.linkType);
  if (linkType === "invite" || linkType === "recovery") return "/auth/set-password";
  if (input.invitedAt && !input.passwordSet) return "/auth/set-password";
  if (input.role) return homePath(input.role);
  return "/admin/login?auth=profile";
}

export function passwordAlreadySet(metadata: unknown): boolean {
  if (!metadata || typeof metadata !== "object") return false;
  return (metadata as { password_set?: unknown }).password_set === true;
}
