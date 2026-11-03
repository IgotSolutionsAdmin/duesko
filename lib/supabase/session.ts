import "server-only";
import { cookies } from "next/headers";
import { createAuthClient, createDataClient } from "./client";
import { SUPABASE_ACCESS_COOKIE, SUPABASE_REFRESH_COOKIE } from "./cookie-names";
import type { SupabaseClient } from "@supabase/supabase-js";

export { SUPABASE_ACCESS_COOKIE, SUPABASE_REFRESH_COOKIE };

export const supabaseCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 14,
};

type Tokens = { accessToken: string; refreshToken: string };

async function readTokens(): Promise<Tokens | null> {
  const jar = await cookies();
  const accessToken = jar.get(SUPABASE_ACCESS_COOKIE)?.value;
  const refreshToken = jar.get(SUPABASE_REFRESH_COOKIE)?.value;
  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

/** Validates the access token with Supabase Auth and returns auth.users.id. */
export async function readVerifiedUserId(): Promise<string | null> {
  const tokens = await readTokens();
  if (!tokens) return null;
  const supabase = createAuthClient();
  const { data, error } = await supabase.auth.getUser(tokens.accessToken);
  if (error || !data.user) return null;
  return data.user.id;
}

export async function openDataClient(): Promise<{
  client: SupabaseClient;
  sessionUserId: string;
} | null> {
  const tokens = await readTokens();
  if (!tokens) return null;
  const client = await createDataClient(tokens.accessToken, tokens.refreshToken);
  if (!client) return null;
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return null;
  return { client, sessionUserId: data.user.id };
}
