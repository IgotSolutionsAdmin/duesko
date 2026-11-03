import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Shell } from "@/components/shell";
import { getDemoUser } from "@/lib/auth";
import { signInAsDemo } from "@/lib/demo-auth-actions";
import { seed } from "@/lib/mock/seed";
import { homePath, roleLabel } from "@/lib/roles";

export const metadata = {
  title: "Sign in",
};

export default function SignInPage() {
  return (
    <Shell>
      <Suspense
        fallback={<p className="text-sm text-ink/70">Checking the demo session…</p>}
      >
        <SignInChooser />
      </Suspense>
    </Shell>
  );
}

async function SignInChooser() {
  const current = await getDemoUser();
  if (current) redirect(homePath(current.role));

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
          Pick a seeded demo account. Supabase Auth connects in a later step.
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
