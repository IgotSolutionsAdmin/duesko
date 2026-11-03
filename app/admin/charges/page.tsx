import { Suspense } from "react";
import Link from "next/link";
import { ChargeList } from "@/components/charge-list";
import { DevRoleSwitch } from "@/components/dev-role-switch";
import { Shell } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import { createMonthlyDues, createSpecialAssessment } from "@/lib/charge-actions";
import { chargeErrorMessage } from "@/lib/form-messages";
import { getRepository } from "@/lib/get-repository";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata = {
  title: "Charges",
};

const fieldClass =
  "h-12 w-full rounded-xl border border-border bg-white px-3 text-base text-ink outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

export default function ChargesPage({
  searchParams,
}: {
  searchParams: Promise<{ dues?: string; special?: string }>;
}) {
  return (
    <Shell>
      <Suspense
        fallback={<p className="text-sm text-ink/70">Checking the demo session…</p>}
      >
        <Charges searchParams={searchParams} />
      </Suspense>
    </Shell>
  );
}

async function Charges({
  searchParams,
}: {
  searchParams: Promise<{ dues?: string; special?: string }>;
}) {
  const query = await searchParams;
  const user = await requireRole("admin_treasurer");
  const repository = getRepository();
  const [units, charges] = await Promise.all([
    repository.listUnits(user.id),
    repository.listCharges(user.id),
  ]);
  const duesError = chargeErrorMessage(query.dues);
  const specialError = chargeErrorMessage(query.special);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin"
        className="inline-flex min-h-11 items-center text-sm font-medium text-teal-deep"
      >
        Back to HOA setup
      </Link>
      <div>
        <p className="text-sm font-medium text-teal-deep">Charges</p>
        <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight text-ink">
          Dues and assessments
        </h1>
        <p className="mt-2 text-base leading-7 text-ink/80">
          Monthly dues use each unit&apos;s flat amount or per-sqm rate.
          A special assessment can cover every unit or only the ones you
          select. Amounts are Philippine pesos, stored as centavos. New
          charges start unpaid.
        </p>
      </div>

      <section aria-label="Monthly dues" className="rounded-2xl border border-border bg-white p-5">
        <h2 className="font-heading text-lg font-semibold text-ink">
          Monthly dues
        </h2>
        <form action={createMonthlyDues} className="mt-4 flex flex-col gap-3">
          <label htmlFor="dues-period" className="text-sm font-medium text-ink">
            Period
          </label>
          <input id="dues-period" name="period" type="month" required className={fieldClass} />
          <label htmlFor="dues-due" className="text-sm font-medium text-ink">
            Due date
          </label>
          <input id="dues-due" name="dueDate" type="date" required className={fieldClass} />
          <label htmlFor="dues-description" className="text-sm font-medium text-ink">
            Description
          </label>
          <input
            id="dues-description"
            name="description"
            maxLength={200}
            placeholder="Leave blank to use the month name"
            className={fieldClass}
          />
          {duesError ? (
            <p role="alert" className="text-sm leading-6 text-destructive">
              {duesError}
            </p>
          ) : (
            <p className="text-sm leading-6 text-ink/70">
              One unpaid charge is created for every unit that does not
              already have dues for that month.
            </p>
          )}
          <Button type="submit" className="h-12 w-full text-base">
            Create monthly dues
          </Button>
        </form>
      </section>

      <section
        aria-label="Special assessment"
        className="rounded-2xl border border-border bg-white p-5"
      >
        <h2 className="font-heading text-lg font-semibold text-ink">
          Special assessment
        </h2>
        <form action={createSpecialAssessment} className="mt-4 flex flex-col gap-3">
          <label htmlFor="special-description" className="text-sm font-medium text-ink">
            Description
          </label>
          <input
            id="special-description"
            name="description"
            required
            maxLength={200}
            className={fieldClass}
          />
          <label htmlFor="special-amount" className="text-sm font-medium text-ink">
            Amount (PHP)
          </label>
          <div className="flex h-12 items-center rounded-xl border border-border bg-white px-3 focus-within:ring-3 focus-within:ring-ring/50">
            <span className="text-base font-medium text-teal-deep" aria-hidden>
              ₱
            </span>
            <input
              id="special-amount"
              name="amount"
              required
              inputMode="decimal"
              className="h-full w-full bg-transparent px-2 text-base text-ink outline-none"
            />
          </div>
          <label htmlFor="special-due" className="text-sm font-medium text-ink">
            Due date
          </label>
          <input id="special-due" name="dueDate" type="date" required className={fieldClass} />
          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium text-ink">Who is charged</legend>
            <label className="flex min-h-12 items-center gap-3 rounded-xl border border-border px-3 text-base">
              <input type="radio" name="scope" value="all" defaultChecked />
              All units
            </label>
            <label className="flex min-h-12 items-center gap-3 rounded-xl border border-border px-3 text-base">
              <input type="radio" name="scope" value="selected" />
              Selected units
            </label>
          </fieldset>
          <div className="special-units gap-2">
            {units.map((unit) => (
              <label
                key={unit.id}
                className="flex min-h-12 items-center gap-3 rounded-xl border border-border px-3 text-base"
              >
                <input type="checkbox" name="unitId" value={unit.id} />
                {unit.label}
              </label>
            ))}
          </div>
          {specialError ? (
            <p role="alert" className="text-sm leading-6 text-destructive">
              {specialError}
            </p>
          ) : null}
          <Button type="submit" className="h-12 w-full text-base">
            Create special assessment
          </Button>
        </form>
      </section>

      <ChargeList charges={charges} units={units} showUnit label="Charge list" />
      {isSupabaseConfigured() ? null : <DevRoleSwitch currentUserId={user.id} />}
    </div>
  );
}
