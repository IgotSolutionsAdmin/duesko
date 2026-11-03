import "server-only";

import { cookies } from "next/headers";
import { destinationAfterAuth, passwordAlreadySet } from "./auth-destination";
import { DEMO_COOKIE } from "./demo-cookie";
import { createAuthClient } from "./supabase/client";
import {
  SUPABASE_ACCESS_COOKIE,
  SUPABASE_REFRESH_COOKIE,
  supabaseCookieOptions,
} from "./supabase/session";
import type { Role } from "./types";

export async function roleFor(
  supabase: ReturnType<typeof createAuthClient>,
  userId: string,
): Promise<Role | null> {
  const { data, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return null;
  if (data.role === "admin_treasurer" || data.role === "resident") return data.role;
  return null;
}

export function routeAfterSession(input: {
  linkType: string | null;
  invitedAt: string | null | undefined;
  metadata: unknown;
  role: Role | null;
}): string {
  return destinationAfterAuth({
    linkType: input.linkType,
    invitedAt: input.invitedAt ?? null,
    passwordSet: passwordAlreadySet(input.metadata),
    role: input.role,
  });
}

export async function writeSupabaseSession(accessToken: string, refreshToken: string) {
  const jar = await cookies();
  jar.set(SUPABASE_ACCESS_COOKIE, accessToken, supabaseCookieOptions);
  jar.set(SUPABASE_REFRESH_COOKIE, refreshToken, supabaseCookieOptions);
  jar.set(DEMO_COOKIE, "", { ...supabaseCookieOptions, maxAge: 0 });
}
