"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { passwordSignInDestination } from "./auth-destination";
import { isDemoAuthEnabled } from "./demo-auth";
import { DEMO_COOKIE } from "./demo-cookie";
import { getRepository } from "./get-repository";
import { homePath } from "./roles";
import { createAuthClient, createDataClient } from "./supabase/client";
import { isSupabaseConfigured } from "./supabase/env";
import { useMockRepository } from "./test-site";
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

/** Signs in as one of the seeded demo users. Development and the mock repository only. */
export async function signInAsDemo(formData: FormData) {
  if (!isDemoAuthEnabled() || !useMockRepository()) redirect("/");

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
  const portal = formData.get("portal") === "resident" ? "resident" : "admin";
  const loginPath = portal === "resident" ? "/resident/login" : "/admin/login";
  if (!isSupabaseConfigured()) redirect(loginPath);

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) redirect(`${loginPath}?auth=missing`);

  const supabase = createAuthClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.session) redirect(`${loginPath}?auth=invalid`);

  const jar = await cookies();
  jar.set(SUPABASE_ACCESS_COOKIE, data.session.access_token, supabaseCookieOptions);
  jar.set(SUPABASE_REFRESH_COOKIE, data.session.refresh_token, supabaseCookieOptions);
  jar.set(DEMO_COOKIE, "", { ...supabaseCookieOptions, maxAge: 0 });

  const client = await createDataClient(
    data.session.access_token,
    data.session.refresh_token,
  );
  if (!client) redirect(`${loginPath}?auth=invalid`);
  const user = await createSupabaseRepository(
    client,
    data.session.user.id,
  ).getUser(data.session.user.id);
  redirect(passwordSignInDestination(user?.role ?? null, portal));
}

export async function signOut(formData?: FormData) {
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
  const expired = { ...cookieOptions, maxAge: 0 };
  jar.set(DEMO_COOKIE, "", expired);
  jar.set(SUPABASE_ACCESS_COOKIE, "", expired);
  jar.set(SUPABASE_REFRESH_COOKIE, "", expired);
  const portal = formData?.get("portal");
  if (portal === "resident") redirect("/resident/login");
  if (portal === "admin") redirect("/admin/login");
  redirect("/");
}
