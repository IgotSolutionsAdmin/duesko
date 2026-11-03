import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { setOwnPassword } from "@/lib/auth-link-actions";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { readSupabaseTokens } from "@/lib/supabase/session";

export const metadata = { title: "Choose a password" };

const problems: Record<string, string> = {
  short: "Use at least 8 characters.",
  mismatch: "Those passwords do not match.",
  save: "That password was not saved. Try a different one.",
};

export default function SetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ auth?: string }>;
}) {
  return (
    <Suspense fallback={<p className="px-5 py-6 text-sm text-ink/70">Opening password…</p>}>
      <SetPassword searchParams={searchParams} />
    </Suspense>
  );
}

async function SetPassword({
  searchParams,
}: {
  searchParams: Promise<{ auth?: string }>;
}) {
  await connection();
  if (!isSupabaseConfigured()) redirect("/admin/login");
  const tokens = await readSupabaseTokens();
  if (!tokens) redirect("/admin/login");

  const { auth } = await searchParams;
  const message = auth ? (problems[auth] ?? null) : null;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-6 bg-mist px-5 py-8 text-ink">
      <p className="flex items-center gap-2 font-heading text-2xl font-semibold text-teal-deep">
        <span className="size-3 rounded-full bg-mango" aria-hidden />
        DuesKo
      </p>
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Choose a password</h1>
        <p className="mt-2 text-base leading-7 text-ink/70">
          This password is yours. DuesKo does not choose one for you. After you save it, your portal opens.
        </p>
      </div>
      <form action={setOwnPassword} className="flex flex-col gap-3">
        <label htmlFor="password" className="text-sm font-medium">
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="h-12 rounded-2xl border border-border bg-white px-3 text-base"
        />
        <label htmlFor="confirm" className="text-sm font-medium">
          Confirm password
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="h-12 rounded-2xl border border-border bg-white px-3 text-base"
        />
        {message ? (
          <p role="alert" className="text-sm text-destructive">
            {message}
          </p>
        ) : null}
        <Button type="submit" className="h-12 w-full text-base">
          Save password
        </Button>
      </form>
    </main>
  );
}
