"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { passwordResetRedirectTo } from "./auth-reset-url";
import { roleFor, writeSupabaseSession } from "./auth-session";
import { passwordChoiceError } from "./password-choice";
import { homePath } from "./roles";
import { createAuthClient } from "./supabase/client";
import { isSupabaseConfigured } from "./supabase/env";
import { cookiePkceStorage } from "./supabase/pkce-cookies";
import { readSupabaseTokens } from "./supabase/session";

const AUTH_CALLBACK_PATH = "/auth/callback";

/** Sends a password reset link. Always shows the same neutral confirmation. */
export async function sendPasswordResetEmail(formData: FormData) {
  const portal = formData.get("portal") === "resident" ? "resident" : "admin";
  const loginPath = portal === "resident" ? "/resident/login" : "/admin/login";
  if (!isSupabaseConfigured()) redirect(`${loginPath}?auth=reset-sent`);

  const email = String(formData.get("email") ?? "").trim();
  if (!email) redirect(`${loginPath}?forgot=1&auth=missing`);

  const origin = await requestOrigin();
  const supabase = createAuthClient(await cookiePkceStorage());
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: passwordResetRedirectTo(origin),
  });
  redirect(`${loginPath}?auth=reset-sent`);
}

/** Sends a magic link. Does not create an account and does not choose a password. */
export async function sendMagicLink(formData: FormData) {
  const portal = formData.get("portal") === "resident" ? "resident" : "admin";
  const loginPath = portal === "resident" ? "/resident/login" : "/admin/login";
  if (!isSupabaseConfigured()) redirect(loginPath);

  const email = String(formData.get("email") ?? "").trim();
  if (!email) redirect(`${loginPath}?auth=missing`);

  const origin = await requestOrigin();
  const supabase = createAuthClient(await cookiePkceStorage());
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${origin}${AUTH_CALLBACK_PATH}`,
    },
  });
  if (error) redirect(`${loginPath}?auth=unsent`);
  redirect(`${loginPath}?auth=sent`);
}

/** Saves the password the invited person typed, then opens their portal. */
export async function setOwnPassword(formData: FormData) {
  if (!isSupabaseConfigured()) redirect("/");
  const tokens = await readSupabaseTokens();
  if (!tokens) redirect("/");

  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const problem = passwordChoiceError(password, confirm);
  if (problem) redirect(`/auth/set-password?auth=${problem}`);

  const supabase = createAuthClient();
  const { data: signedIn, error: sessionError } = await supabase.auth.setSession({
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
  });
  if (sessionError || !signedIn.session) redirect("/auth/set-password?auth=save");

  const { data: updated, error } = await supabase.auth.updateUser({
    password,
    data: { password_set: true },
  });
  if (error || !updated.user) redirect("/auth/set-password?auth=save");

  const { data: latest } = await supabase.auth.getSession();
  const session = latest.session ?? signedIn.session;
  await writeSupabaseSession(session.access_token, session.refresh_token);

  const role = await roleFor(supabase, session.user.id);
  redirect(role ? homePath(role) : "/admin/login?auth=profile");
}

async function requestOrigin(): Promise<string> {
  const headerList = await headers();
  const origin = headerList.get("origin");
  if (origin) return origin.replace(/\/$/, "");
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const proto = headerList.get("x-forwarded-proto") ?? "https";
  if (host) return `${proto}://${host}`;
  return "https://duesko.vercel.app";
}
