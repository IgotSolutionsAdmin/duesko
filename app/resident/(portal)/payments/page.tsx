import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/status-pill";
import { requireRole } from "@/lib/auth";
import { getRepository } from "@/lib/get-repository";
import { formatCentavos, formatShortDay } from "@/lib/money";
import { submitProof } from "@/lib/payment-actions";
import { chargeBalanceStatus, methodLabel } from "@/lib/payments";

export const metadata = { title: "Upload proof" };

const fieldClass =
  "h-12 w-full rounded-2xl border border-border bg-mist px-3 text-base outline-none";

export default function ResidentPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ charge?: string; error?: string }>;
}) {
  return (
    <Suspense fallback={<p className="text-sm text-ink/70">Loading payments…</p>}>
      <ResidentPayments searchParams={searchParams} />
    </Suspense>
  );
}

async function ResidentPayments({
  searchParams,
}: {
  searchParams: Promise<{ charge?: string; error?: string }>;
}) {
  const query = await searchParams;
  const user = await requireRole("resident");
  const repository = getRepository();
  const [charges, payments] = await Promise.all([
    repository.listCharges(user.id),
    repository.listPayments(user.id),
  ]);
  const open = charges.filter((charge) => chargeBalanceStatus(charge, payments) !== "paid");

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center gap-3">
        <Link href="/resident" className="text-2xl text-teal-deep" aria-label="Back">
          ‹
        </Link>
        <h1 className="font-heading text-2xl font-semibold">Upload proof of payment</h1>
      </header>
      <form action={submitProof} className="flex flex-col gap-4 rounded-3xl bg-white p-5">
        <label htmlFor="chargeId" className="text-xs font-semibold tracking-[0.14em] text-teal-deep">
          CHARGE
        </label>
        <select id="chargeId" name="chargeId" required defaultValue={query.charge} className={fieldClass}>
          <option value="">Choose a charge</option>
          {open.map((charge) => (
            <option key={charge.id} value={charge.id}>
              {charge.description} · {formatCentavos(charge.amountCentavos)}
            </option>
          ))}
        </select>
        <label htmlFor="amount" className="text-xs font-semibold tracking-[0.14em] text-teal-deep">
          AMOUNT (PHP)
        </label>
        <div className="flex h-12 items-center rounded-2xl border border-border bg-mist px-3">
          <span className="font-medium text-teal-deep" aria-hidden>₱</span>
          <input id="amount" name="amount" required inputMode="decimal" className="h-full w-full bg-transparent px-2 text-base outline-none" />
        </div>
        <label htmlFor="paidOn" className="text-xs font-semibold tracking-[0.14em] text-teal-deep">
          PAYMENT DATE
        </label>
        <input id="paidOn" name="paidOn" type="date" required className={fieldClass} />
        <label htmlFor="method" className="text-xs font-semibold tracking-[0.14em] text-teal-deep">
          METHOD
        </label>
        <select id="method" name="method" defaultValue="gcash" className={fieldClass}>
          <option value="gcash">GCash</option>
          <option value="bank_transfer">Bank transfer</option>
          <option value="other">Other</option>
        </select>
        <label htmlFor="referenceNo" className="text-xs font-semibold tracking-[0.14em] text-teal-deep">
          REFERENCE NO.
        </label>
        <input id="referenceNo" name="referenceNo" required className={fieldClass} />
        <label htmlFor="proof" className="text-xs font-semibold tracking-[0.14em] text-teal-deep">
          PROOF OF PAYMENT
        </label>
        <input id="proof" name="proof" type="file" accept="image/png,image/jpeg,image/webp" required className="text-sm" />
        {query.error ? (
          <p role="alert" className="text-sm text-destructive">{query.error}</p>
        ) : (
          <p className="text-sm leading-6 text-ink/60">PNG, JPG, or WebP. 5 MB maximum.</p>
        )}
        <Button type="submit" className="h-12 w-full text-base">
          Upload proof of payment
        </Button>
      </form>
      <section className="rounded-3xl bg-white p-4">
        <h2 className="font-heading text-lg font-semibold">Payment history</h2>
        <ul>
          {payments.map((payment) => (
            <li key={payment.id} className="border-t border-border py-3 first:border-t-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{methodLabel(payment.method)}</p>
                  <p className="text-sm text-ink/60">{formatShortDay(payment.paidAt)}</p>
                  {payment.status === "rejected" && payment.rejectionReason ? (
                    <p className="mt-1 text-sm text-destructive">{payment.rejectionReason}</p>
                  ) : null}
                </div>
                <div className="text-right">
                  <StatusPill status={payment.status} />
                  <p className="mt-1 text-sm">{formatCentavos(payment.amountCentavos)}</p>
                </div>
              </div>
            </li>
          ))}
          {payments.length === 0 ? (
            <li className="pt-2 text-sm text-ink/60">No payments yet.</li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
