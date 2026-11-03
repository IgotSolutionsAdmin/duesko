import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { signInAsDemo, signInWithPassword } from "@/lib/demo-auth-actions";
import { seed } from "@/lib/mock/seed";
import { homePath, roleLabel } from "@/lib/roles";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { isTestSite, useMockRepository } from "@/lib/test-site";
import type { Role } from "@/lib/types";

const authErrors: Record<string, string> = {
  missing: "Email and password are required.",
  invalid: "Email or password is incorrect.",
  profile:
    "That account has no association profile yet. public.users.id must match auth.users.id.",
};

export async function PortalLogin({
  role,
  errorCode,
}: {
  role: Role;
  errorCode?: string;
}) {
  const current = await getCurrentUser();
  if (current) redirect(homePath(current.role));

  const title = role === "admin_treasurer" ? "Officer sign in" : "Resident sign in";
  const error = errorCode ? (authErrors[errorCode] ?? null) : null;

  if (useMockRepository() && isTestSite()) {
    const userId =
      role === "admin_treasurer"
        ? "33333333-3333-4333-8333-333333333301"
        : "33333333-3333-4333-8333-333333333302";
    const label =
      role === "admin_treasurer"
        ? "Sign in as demo admin (Ana Reyes)"
        : "Sign in as demo resident (Juan dela Cruz)";
    return (
      <LoginFrame title={title} lede="No password. This sample account is not a real person.">
        <form action={signInAsDemo}>
          <input type="hidden" name="userId" value={userId} />
          <Button type="submit" className="h-12 w-full text-base">
            {label}
          </Button>
        </form>
      </LoginFrame>
    );
  }

  if (!useMockRepository() && isSupabaseConfigured()) {
    return (
      <LoginFrame title={title} lede="Use the email and password for your Supabase Auth account.">
        <form action={signInWithPassword} className="flex flex-col gap-3">
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <input id="email" name="email" type="email" required autoComplete="email" className="h-12 rounded-2xl border border-border bg-white px-3 text-base" />
          <label htmlFor="password" className="text-sm font-medium">Password</label>
          <input id="password" name="password" type="password" required autoComplete="current-password" className="h-12 rounded-2xl border border-border bg-white px-3 text-base" />
          {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="h-12 w-full text-base">Sign in</Button>
        </form>
      </LoginFrame>
    );
  }

  if (!useMockRepository()) {
    return (
      <LoginFrame
        title={title}
        lede="This production build has no database. Set the Supabase env vars, or NEXT_PUBLIC_DUESKO_TEST_SITE=true for the sample site."
      >
        <p className="text-sm leading-6 text-ink/70">Demo sign-in is turned off.</p>
      </LoginFrame>
    );
  }

  const people = seed.users.filter((user) => user.role === role);
  return (
    <LoginFrame
      title={title}
      lede="DEV ONLY. This mock sign-in is hidden when Supabase is configured."
    >
      <div className="flex flex-col gap-3">
        {people.map((user) => {
          const unit = seed.units.find((row) => row.id === user.unitId);
          return (
            <form key={user.id} action={signInAsDemo} className="rounded-3xl bg-white p-4">
              <input type="hidden" name="userId" value={user.id} />
              <p className="font-heading text-lg font-semibold">{user.fullName}</p>
              <p className="mt-1 text-sm text-teal-deep">
                {roleLabel(user.role)}
                {unit ? ` · ${unit.label}` : ""}
              </p>
              <Button type="submit" className="mt-4 h-12 w-full text-base">
                Sign in as {user.fullName}
              </Button>
            </form>
          );
        })}
      </div>
    </LoginFrame>
  );
}

function LoginFrame({
  title,
  lede,
  children,
}: {
  title: string;
  lede: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-6 bg-mist px-5 py-8 text-ink">
      <p className="flex items-center gap-2 font-heading text-2xl font-semibold text-teal-deep">
        <span className="size-3 rounded-full bg-mango" aria-hidden />
        DuesKo
      </p>
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-base leading-7 text-ink/70">{lede}</p>
      </div>
      {children}
    </main>
  );
}
