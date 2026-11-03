import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isDemoAuthEnabled } from "./demo-auth";
import { DEMO_COOKIE } from "./demo-cookie";
import { getRepository } from "./get-repository";
import { homePath } from "./roles";
import { isSupabaseConfigured } from "./supabase/env";
import { readVerifiedUserId } from "./supabase/session";
import { useMockRepository } from "./test-site";
import type { AppUser, Role } from "./types";

/** The signed-in user. Supabase Auth when configured, otherwise the demo cookie in development. */
export async function getCurrentUser(): Promise<AppUser | null> {
  if (isDemoAuthEnabled() && useMockRepository()) {
    const jar = await cookies();
    const userId = jar.get(DEMO_COOKIE)?.value;
    if (!userId) return null;
    return getRepository().getUser(userId);
  }
  if (isSupabaseConfigured()) {
    const userId = await readVerifiedUserId();
    if (!userId) return null;
    return getRepository().getUser(userId);
  }
  return null;
}

/** Sends an anonymous visitor to that portal's login, and the other role home. */
export async function requireRole(role: Role): Promise<AppUser> {
  const login = role === "resident" ? "/resident/login" : "/admin/login";
  const user = await getCurrentUser();
  if (!user) redirect(login);
  if (user.role !== role) redirect(homePath(user.role));
  return user;
}
