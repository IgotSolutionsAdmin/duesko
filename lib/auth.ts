import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEMO_COOKIE } from "./demo-cookie";
import { getRepository } from "./get-repository";
import { homePath } from "./roles";
import type { AppUser, Role } from "./types";

/** Reads the DEV ONLY demo cookie and resolves it against the mock repository. */
export async function getDemoUser(): Promise<AppUser | null> {
  const jar = await cookies();
  const userId = jar.get(DEMO_COOKIE)?.value;
  if (!userId) return null;
  return getRepository().getUser(userId);
}

/** Sends an anonymous visitor to sign-in, and the other role to their own home. */
export async function requireRole(role: Role): Promise<AppUser> {
  const user = await getDemoUser();
  if (!user) redirect("/sign-in");
  if (user.role !== role) redirect(homePath(user.role));
  return user;
}
