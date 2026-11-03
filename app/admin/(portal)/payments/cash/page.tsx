import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import { getRepository } from "@/lib/get-repository";
import { recordCashPayment } from "@/lib/payment-actions";

export const metadata = { title: "Record cash payment" };

const fieldClass =
  "h-12 w-full rounded-2xl border border-border bg-mist px-3 text-base outline-none";

export default function CashPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <Suspense fallback={<p className="text-sm text-ink/70">Loading the form…</p>}>
      <CashForm searchParams={searchParams} />
    </Suspense>
  );
}

async function CashForm({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const error = (await searchParams).error;
  const user = await requireRole("admin_treasurer");
  const repository = getRepository();
  const [charges, units] = await Promise.all([
    repository.listCharges(user.id),
    repository.listUnits(user.id),
  ]);
  const labels = new Map(units.map((unit) => [unit.id, unit.label]));

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center gap-3">
        <Link href="/admin/payments" className="text-2xl text-teal-deep" aria-label="Back">
          ‹
        </Link>
        <h1 className="font-heading text-2xl font-semibold leading-tight">
          Record cash payment
        </h1>
      </header>
      <form action={recordCashPayment} className="flex flex-col gap-4 rounded-xl border border-border bg-white p-5">
        <label htmlFor="chargeId" className="text-sm font-medium text-ink">
          Unit
        </label>
        <select id="chargeId" name="chargeId" required className={fieldClass}>
          <option value="">Choose a charge</option>
          {charges.map((charge) => (
            <option key={charge.id} value={charge.id}>
              {labels.get(charge.unitId) ?? "Unit"} · {charge.description}
            </option>
          ))}
        </select>
        <label htmlFor="amount" className="text-sm font-medium text-ink">
          Amount
        </label>
        <div className="flex h-12 items-center rounded-2xl border border-border bg-mist px-3">
          <span className="font-medium text-teal-deep" aria-hidden>₱</span>
          <input id="amount" name="amount" required inputMode="decimal" className="h-full w-full bg-transparent px-2 text-base outline-none" />
        </div>
        <label htmlFor="paidOn" className="text-sm font-medium text-ink">
          Date received
        </label>
        <input id="paidOn" name="paidOn" type="date" required className={fieldClass} />
        <label htmlFor="method" className="text-sm font-medium text-ink">
          Received as
        </label>
        <select id="method" name="method" defaultValue="cash" className={fieldClass}>
          <option value="cash">Cash</option>
          <option value="gcash">GCash</option>
          <option value="bank_transfer">Bank transfer</option>
          <option value="other">Other</option>
        </select>
        <label htmlFor="hoaReferenceNo" className="text-sm font-medium text-ink">
          HOA reference no.
        </label>
        <input id="hoaReferenceNo" name="hoaReferenceNo" className={fieldClass} />
        <label htmlFor="note" className="text-sm font-medium text-ink">
          Note (optional)
        </label>
        <input id="note" name="note" className={fieldClass} />
        {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" name="next" value="list" className="h-12 w-full text-base">
          Save cash payment
        </Button>
        <Button type="submit" name="next" value="acknowledgment" variant="outline" className="h-12 w-full bg-white text-base">
          Save & issue acknowledgment
        </Button>
      </form>
    </div>
  );
}
