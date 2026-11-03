import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Shell } from "@/components/shell";
import { getCurrentUser } from "@/lib/auth";
import { signInAsDemo, signInWithPassword } from "@/lib/demo-auth-actions";
import { seed } from "@/lib/mock/seed";
import { homePath, roleLabel } from "@/lib/roles";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata = {
  title: "Sign in",
};

const authErrors: Record<string, string> = {
  missing: "Email and password are required.",
  invalid: "Email or password is incorrect.",
  profile:
    "That account has no association profile yet. public.users.id must match auth.users.id.",
};

export default function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ auth?: string }>;
}) {
  return (
    <Shell>
      <Suspense
        fallback={<p className="text-sm text-ink/70">Checking the demo session…</p>}
      >
        <SignInChooser searchParams={searchParams} />
      </Suspense>
    </Shell>
  );
}

async function SignInChooser({
  searchParams,
}: {
  searchParams: Promise<{ auth?: string }>;
}) {
  const current = await getCurrentUser();
  if (current) redirect(homePath(current.role));

  if (isSupabaseConfigured()) {
    const code = (await searchParams).auth;
    const error = code ? (authErrors[code] ?? null) : null;
    return <PasswordSignIn error={error} />;
  }

  return <DemoSignIn />;
}

function PasswordSignIn({ error }: { error: string | null }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-ink">
          Sign in
        </h1>
        <p className="mt-2 text-base leading-7 text-ink/80">
          Use the email and password for your Supabase Auth account.
        </p>
      </div>
      <form action={signInWithPassword} className="flex flex-col gap-3">
        <label htmlFor="email" className="text-sm font-medium text-ink">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="h-12 w-full rounded-xl border border-border bg-white px-3 text-base text-ink outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <label htmlFor="password" className="text-sm font-medium text-ink">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="h-12 w-full rounded-xl border border-border bg-white px-3 text-base text-ink outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        {error ? (
          <p role="alert" className="text-sm leading-6 text-destructive">
            {error}
          </p>
        ) : null}
        <Button type="submit" className="h-12 w-full text-base">
          Sign in
        </Button>
      </form>
    </div>
  );
}

function DemoSignIn() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="inline-flex rounded-full bg-mango/40 px-2.5 py-1 font-heading text-xs font-semibold tracking-[0.16em] text-ink">
          DEV ONLY
        </p>
        <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-ink">
          Sign in
        </h1>
        <p className="mt-2 text-base leading-7 text-ink/80">
          Pick a seeded demo account. This mock sign-in is hidden when
          Supabase is configured.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {seed.users.map((user) => {
          const unit = seed.units.find((row) => row.id === user.unitId);
          return (
            <form
              key={user.id}
              action={signInAsDemo}
              className="rounded-2xl border border-border bg-white p-4"
            >
              <input type="hidden" name="userId" value={user.id} />
              <p className="font-heading text-lg font-semibold text-ink">
                {user.fullName}
              </p>
              <p className="mt-1 text-sm text-teal-deep">
                {roleLabel(user.role)}
                {unit ? ` · ${unit.label}` : ""}
              </p>
              <p className="mt-1 text-sm text-ink/70">{user.email}</p>
              <Button type="submit" className="mt-4 h-12 w-full text-base">
                Sign in as {user.fullName}
              </Button>
            </form>
          );
        })}
      </div>
    </div>
  );
}
