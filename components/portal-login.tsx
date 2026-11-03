import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { sendMagicLink, sendPasswordResetEmail } from "@/lib/auth-link-actions";
import { isDemoAuthEnabled, shouldRenderDevRoleSwitch } from "@/lib/demo-auth";
import { signInAsDemo, signInWithPassword } from "@/lib/demo-auth-actions";
import { seed } from "@/lib/mock/seed";
import { homePath, roleLabel } from "@/lib/roles";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { useMockRepository } from "@/lib/test-site";
import type { Role } from "@/lib/types";

const authErrors: Record<string, string> = {
  missing: "Email and password are required.",
  invalid: "Email or password is incorrect.",
  sent: "Check your email for a sign-in link. It expires soon and works once.",
  unsent: "The sign-in link could not be sent.",
  profile:
    "That account has no association profile yet. public.users.id must match auth.users.id.",
  "reset-sent": "If that email has an account, we sent a link.",
};

export async function PortalLogin({
  role,
  errorCode,
  forgot,
}: {
  role: Role;
  errorCode?: string;
  forgot?: boolean;
}) {
  const current = await getCurrentUser();
  if (current) redirect(homePath(current.role));

  const title = role === "admin_treasurer" ? "Officer sign in" : "Resident sign in";
  const error = errorCode ? (authErrors[errorCode] ?? null) : null;
  const noticeRole =
    errorCode === "sent" || errorCode === "reset-sent" ? "status" : "alert";

  if (isSupabaseConfigured()) {
    const portal = role === "resident" ? "resident" : "admin";
    const loginPath = portal === "resident" ? "/resident/login" : "/admin/login";
    if (forgot) {
      return (
        <LoginFrame
          title="Forgot or set password?"
          lede="Enter your email. If an account exists, we will send a link to choose a new password."
          notice={error}
          noticeRole={noticeRole}
        >
          <form action={sendPasswordResetEmail} className="flex flex-col gap-3">
            <input type="hidden" name="portal" value={portal} suppressHydrationWarning />
            <label htmlFor="reset-email" className="text-sm font-medium">Email</label>
            <input id="reset-email" name="email" type="email" required autoComplete="email" className="h-12 rounded-2xl border border-border bg-white px-3 text-base" />
            <Button type="submit" className="h-12 w-full text-base">Email me a reset link</Button>
          </form>
          <Link href={loginPath} className="text-center text-sm font-medium text-teal-deep underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        </LoginFrame>
      );
    }
    return (
      <LoginFrame title={title} lede="Use your email and password, or ask for a one-time sign-in link." notice={error} noticeRole={noticeRole}>
        <form action={signInWithPassword} className="flex flex-col gap-3">
          <input type="hidden" name="portal" value={portal} suppressHydrationWarning />
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <input id="email" name="email" type="email" required autoComplete="email" className="h-12 rounded-2xl border border-border bg-white px-3 text-base" />
          <label htmlFor="password" className="text-sm font-medium">Password</label>
          <input id="password" name="password" type="password" required autoComplete="current-password" className="h-12 rounded-2xl border border-border bg-white px-3 text-base" />
          <Button type="submit" className="h-12 w-full text-base">Sign in</Button>
        </form>
        <Link href={`${loginPath}?forgot=1`} className="text-sm font-medium text-teal-deep underline-offset-4 hover:underline">
          Forgot or set password?
        </Link>
        <form action={sendMagicLink} className="flex flex-col gap-3">
          <input type="hidden" name="portal" value={portal} suppressHydrationWarning />
          <label htmlFor="magic-email" className="text-sm font-medium">Email for a sign-in link</label>
          <input id="magic-email" name="email" type="email" required autoComplete="email" className="h-12 rounded-2xl border border-border bg-white px-3 text-base" />
          <Button type="submit" variant="outline" className="h-12 w-full bg-white text-base">Email me a sign-in link</Button>
        </form>
      </LoginFrame>
    );
  }

  if (isDemoAuthEnabled() && useMockRepository()) {
    const people = seed.users.filter((user) => user.role === role);
    return (
      <LoginFrame
        title={title}
        lede={
          shouldRenderDevRoleSwitch()
            ? "DEV ONLY. This mock sign-in is hidden when Supabase is configured."
            : "No password. This sample account is not a real person."
        }
        notice={error}
        noticeRole={noticeRole}
      >
        <div className="flex flex-col gap-3">
          {people.map((user) => {
            const unit = seed.units.find((row) => row.id === user.unitId);
            return (
              <form key={user.id} action={signInAsDemo} className="rounded-xl border border-border bg-white p-4">
                <input type="hidden" name="userId" value={user.id} suppressHydrationWarning />
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

  return (
    <LoginFrame
      title={title}
      lede="Sign in with the email and password for your association account."
      notice={error}
    >
      <p className="text-sm leading-6 text-ink/70">
        Production sign-in uses Supabase Auth only. Passwordless demo login is off.
      </p>
    </LoginFrame>
  );
}

function LoginFrame({
  title,
  lede,
  notice,
  noticeRole = "alert",
  children,
}: {
  title: string;
  lede: string;
  notice?: string | null;
  noticeRole?: "alert" | "status";
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
      {notice ? (
        <p role={noticeRole} className={noticeRole === "status" ? "text-sm text-teal-deep" : "text-sm text-destructive"}>
          {notice}
        </p>
      ) : null}
      {children}
    </main>
  );
}
