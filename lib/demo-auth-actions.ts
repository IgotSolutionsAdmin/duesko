"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEMO_COOKIE } from "./demo-cookie";
import { getRepository } from "./get-repository";
import { homePath } from "./roles";
import { createAuthClient, createDataClient } from "./supabase/client";
import { isSupabaseConfigured } from "./supabase/env";
import { createSupabaseRepository } from "./supabase/repository";
import {
  SUPABASE_ACCESS_COOKIE,
  SUPABASE_REFRESH_COOKIE,
  supabaseCookieOptions,
} from "./supabase/session";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 14,
};

/** Signs in as one of the seeded demo users. Only the mock repository uses this. */
export async function signInAsDemo(formData: FormData) {
  if (isSupabaseConfigured()) redirect("/sign-in");

  const userId = formData.get("userId");
  if (typeof userId !== "string") redirect("/sign-in");

  const user = await getRepository().getUser(userId);
  if (!user) redirect("/sign-in");

  const jar = await cookies();
  jar.set(DEMO_COOKIE, user.id, cookieOptions);
  redirect(homePath(user.role));
}

/** Email and password sign-in for Supabase Auth. */
export async function signInWithPassword(formData: FormData) {
  if (!isSupabaseConfigured()) redirect("/sign-in");

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) redirect("/sign-in?auth=missing");

  const supabase = createAuthClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.session) redirect("/sign-in?auth=invalid");

  const jar = await cookies();
  jar.set(SUPABASE_ACCESS_COOKIE, data.session.access_token, supabaseCookieOptions);
  jar.set(SUPABASE_REFRESH_COOKIE, data.session.refresh_token, supabaseCookieOptions);
  jar.delete(DEMO_COOKIE);

  const client = await createDataClient(
    data.session.access_token,
    data.session.refresh_token,
  );
  if (!client) redirect("/sign-in?auth=invalid");
  const user = await createSupabaseRepository(
    client,
    data.session.user.id,
  ).getUser(data.session.user.id);
  redirect(user ? homePath(user.role) : "/sign-in?auth=profile");
}

export async function signOut() {
  const jar = await cookies();
  const accessToken = jar.get(SUPABASE_ACCESS_COOKIE)?.value;
  const refreshToken = jar.get(SUPABASE_REFRESH_COOKIE)?.value;
  if (isSupabaseConfigured() && accessToken && refreshToken) {
    const supabase = createAuthClient();
    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    await supabase.auth.signOut();
  }
  jar.delete(DEMO_COOKIE);
  jar.delete(SUPABASE_ACCESS_COOKIE);
  jar.delete(SUPABASE_REFRESH_COOKIE);
  redirect("/sign-in");
}
