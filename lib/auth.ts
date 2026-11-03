import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEMO_COOKIE } from "./demo-cookie";
import { getRepository } from "./get-repository";
import { homePath } from "./roles";
import { isSupabaseConfigured } from "./supabase/env";
import { readVerifiedUserId } from "./supabase/session";
import type { AppUser, Role } from "./types";

/** The signed-in user. Supabase Auth when configured, otherwise the DEV ONLY cookie. */
export async function getCurrentUser(): Promise<AppUser | null> {
  if (isSupabaseConfigured()) {
    const userId = await readVerifiedUserId();
    if (!userId) return null;
    return getRepository().getUser(userId);
  }

  const jar = await cookies();
  const userId = jar.get(DEMO_COOKIE)?.value;
  if (!userId) return null;
  return getRepository().getUser(userId);
}

/** Sends an anonymous visitor to sign-in, and the other role to their own home. */
export async function requireRole(role: Role): Promise<AppUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (user.role !== role) redirect(homePath(user.role));
  return user;
}
