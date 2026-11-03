import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import { createCharge } from "@/lib/charge-actions";
import { chargeErrorMessage } from "@/lib/form-messages";
import { getRepository } from "@/lib/get-repository";

export const metadata = { title: "Create charge" };

const fieldClass =
  "h-12 w-full rounded-2xl border border-border bg-mist px-3 text-base text-ink outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

export default function NewChargePage({
  searchParams,
}: {
  searchParams: Promise<{ dues?: string; special?: string }>;
}) {
  return (
    <Suspense fallback={<p className="text-sm text-ink/70">Loading the form…</p>}>
      <NewCharge searchParams={searchParams} />
    </Suspense>
  );
}

async function NewCharge({
  searchParams,
}: {
  searchParams: Promise<{ dues?: string; special?: string }>;
}) {
  const query = await searchParams;
  const user = await requireRole("admin_treasurer");
  const units = await getRepository().listUnits(user.id);
  const error = chargeErrorMessage(query.dues) ?? chargeErrorMessage(query.special);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center gap-3">
        <Link href="/admin/charges" className="text-2xl leading-none text-teal-deep" aria-label="Back">
          ‹
        </Link>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Create charge</h1>
      </header>
      <form action={createCharge} className="flex flex-col gap-4 rounded-3xl bg-white p-5">
        <fieldset className="flex flex-col gap-2">
          <legend className="text-xs font-semibold tracking-[0.14em] text-teal-deep">
            CHARGE TYPE
          </legend>
          <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-border px-3">
            <input type="radio" name="kind" value="monthly" defaultChecked />
            Monthly dues
          </label>
          <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-border px-3">
            <input type="radio" name="kind" value="special" />
            Special assessment
          </label>
        </fieldset>
        <div className="kind-monthly gap-3">
          <label htmlFor="dues-period" className="text-xs font-semibold tracking-[0.14em] text-teal-deep">
            PERIOD
          </label>
          <input id="dues-period" name="period" type="month" className={fieldClass} />
          <label htmlFor="dues-name" className="text-xs font-semibold tracking-[0.14em] text-teal-deep">
            CHARGE NAME
          </label>
          <input
            id="dues-name"
            name="monthlyDescription"
            maxLength={200}
            placeholder="Leave blank to use the month"
            className={fieldClass}
          />
          <label htmlFor="dues-due" className="text-xs font-semibold tracking-[0.14em] text-teal-deep">
            DUE DATE
          </label>
          <input id="dues-due" name="monthlyDue" type="date" className={fieldClass} />
        </div>
        <div className="kind-special gap-3">
          <label htmlFor="special-description" className="text-xs font-semibold tracking-[0.14em] text-teal-deep">
            CHARGE NAME
          </label>
          <input id="special-description" name="description" maxLength={200} className={fieldClass} />
          <label htmlFor="special-amount" className="text-xs font-semibold tracking-[0.14em] text-teal-deep">
            AMOUNT PER UNIT (PHP)
          </label>
          <div className="flex h-12 items-center rounded-2xl border border-border bg-mist px-3">
            <span className="font-medium text-teal-deep" aria-hidden>₱</span>
            <input
              id="special-amount"
              name="amount"
              inputMode="decimal"
              className="h-full w-full bg-transparent px-2 text-base outline-none"
            />
          </div>
          <label htmlFor="special-due" className="text-xs font-semibold tracking-[0.14em] text-teal-deep">
            DUE DATE
          </label>
          <input id="special-due" name="dueDate" type="date" className={fieldClass} />
          <fieldset className="flex flex-col gap-2">
            <legend className="text-xs font-semibold tracking-[0.14em] text-teal-deep">
              APPLY TO
            </legend>
            <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-border px-3">
              <input type="radio" name="scope" value="all" defaultChecked />
              All units ({units.length})
            </label>
            <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-border px-3">
              <input type="radio" name="scope" value="selected" />
              Selected units
            </label>
          </fieldset>
          <div className="special-units gap-2">
            {units.map((unit) => (
              <label key={unit.id} className="flex min-h-12 items-center gap-3 rounded-2xl border border-border px-3">
                <input type="checkbox" name="unitId" value={unit.id} />
                {unit.label}
              </label>
            ))}
          </div>
        </div>
        {error ? (
          <p role="alert" className="text-sm leading-6 text-destructive">
            {error}
          </p>
        ) : (
          <p className="text-sm leading-6 text-ink/60">
            {units.length} units can receive this charge. Residents upload proof
            after it is created.
          </p>
        )}
        <Button type="submit" className="h-12 w-full text-base">
          Create charge
        </Button>
      </form>
    </div>
  );
}
