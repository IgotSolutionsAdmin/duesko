import { Suspense } from "react";
import Link from "next/link";
import { DevRoleSwitch } from "@/components/dev-role-switch";
import { HoaNameForm } from "@/components/hoa-name-form";
import { Shell } from "@/components/shell";
import { buttonVariants } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import { getRepository } from "@/lib/get-repository";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { nameErrorMessage } from "@/lib/form-messages";
import { describeMonthlyDues, formatCentavos, monthlyDuesCentavos } from "@/lib/money";
import { cn } from "cn";

export const metadata = {
  title: "HOA setup",
};

export default function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string }>;
}) {
  return (
    <Shell>
      <Suspense
        fallback={<p className="text-sm text-ink/70">Checking the demo session…</p>}
      >
        <AdminHome searchParams={searchParams} />
      </Suspense>
    </Shell>
  );
}

async function AdminHome({
  searchParams,
}: {
  searchParams: Promise<{ name?: string }>;
}) {
  const nameCode = (await searchParams).name;
  const user = await requireRole("admin_treasurer");
  const repository = getRepository();
  const [hoa, units] = await Promise.all([
    repository.getHoa(user.id),
    repository.listUnits(user.id),
  ]);
  const registeredName = hoa?.registeredName ?? "";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-medium text-teal-deep">HOA setup</p>
        <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight text-balance text-ink">
          {registeredName || "Association name is unavailable"}
        </h1>
        <p className="mt-3 text-base leading-7 text-ink/80">
          Signed in as {user.fullName}, admin treasurer. Set the registered
          name, then add each unit as a flat monthly amount or a per-sqm rate
          times its floor area.
        </p>
        <Link
          href="/admin/charges"
          className={cn(
            buttonVariants({
              variant: "outline",
              className: "mt-4 h-12 w-full bg-white text-base",
            }),
          )}
        >
          Charges
        </Link>
      </div>
      <section className="rounded-2xl border border-border bg-white p-5">
        <h2 className="font-heading text-lg font-semibold text-ink">
          Registered name
        </h2>
        <div className="mt-4">
          <HoaNameForm
            registeredName={registeredName}
            error={nameErrorMessage(nameCode)}
          />
        </div>
      </section>
      <section className="flex flex-col gap-3">
        <div>
          <h2 className="font-heading text-lg font-semibold text-ink">Units</h2>
          <p className="mt-1 text-sm leading-6 text-ink/70">
            {units.length === 1 ? "1 unit" : `${units.length} units`} on file.
            Amounts are Philippine pesos.
          </p>
        </div>
        {units.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-teal/40 bg-white p-5 text-sm leading-6 text-ink/80">
            No units yet. Add the first unit to start collecting dues.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {units.map((unit) => (
              <li
                key={unit.id}
                className="rounded-2xl border border-border bg-white p-4"
              >
                <h3 className="font-heading text-xl font-semibold text-ink">
                  {unit.label}
                </h3>
                <p className="mt-2 font-heading text-2xl font-semibold text-teal">
                  {formatCentavos(monthlyDuesCentavos(unit))}
                </p>
                <p className="mt-1 text-sm leading-6 text-ink/80">
                  {describeMonthlyDues(unit)}
                </p>
                <Link
                  href={`/admin/units/${unit.id}`}
                  className="mt-3 inline-flex min-h-11 items-center text-base font-medium text-teal-deep underline-offset-4 hover:underline"
                  aria-label={`Edit ${unit.label}`}
                >
                  Edit
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link
          href="/admin/units/new"
          className={cn(buttonVariants({ className: "h-12 w-full text-base" }))}
        >
          Add unit
        </Link>
      </section>
      {isSupabaseConfigured() ? null : <DevRoleSwitch currentUserId={user.id} />}
    </div>
  );
}
