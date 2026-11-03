import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import { getRepository } from "@/lib/get-repository";
import { formatCentavos, formatShortDay } from "@/lib/money";
import { approveProof, rejectProof } from "@/lib/payment-actions";
import { methodLabel } from "@/lib/payments";

export const metadata = { title: "Payments" };

export default function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <Suspense fallback={<p className="text-sm text-ink/70">Loading payments…</p>}>
      <Payments searchParams={searchParams} />
    </Suspense>
  );
}

async function Payments({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await connection();
  const error = (await searchParams).error;
  const user = await requireRole("admin_treasurer");
  const repository = getRepository();
  const [payments, charges, units] = await Promise.all([
    repository.listPayments(user.id),
    repository.listCharges(user.id),
    repository.listUnits(user.id),
  ]);
  const pending = payments.filter((payment) => payment.status === "pending");
  const labels = new Map(units.map((unit) => [unit.id, unit.label]));
  const chargeNames = new Map(charges.map((charge) => [charge.id, charge.description]));
  const proofUrls = new Map<string, string>();
  for (const payment of pending) {
    if (!payment.proofPath) continue;
    const url = await repository.getProofUrl(user.id, payment.id);
    if (url.ok) proofUrls.set(payment.id, url.value);
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-teal-deep">Payments</p>
          <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight">
            Pending proofs
          </h1>
        </div>
        <Link href="/admin/payments/cash" className="text-sm font-semibold text-teal-deep">
          Record cash
        </Link>
      </header>
      {error ? (
        <p role="alert" className="text-sm leading-6 text-destructive">
          {error}
        </p>
      ) : null}
      {pending.length === 0 ? (
        <p className="rounded-3xl bg-white p-5 text-sm leading-6 text-ink/70">
          No proofs are waiting. Record a cash or manual payment if the resident paid you directly.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {pending.map((payment) => (
            <li key={payment.id} className="rounded-3xl bg-white p-4">
              <p className="text-sm font-medium text-teal-deep">
                {labels.get(payment.unitId) ?? "Unit"}
              </p>
              <h2 className="mt-1 font-heading text-xl font-semibold">
                {chargeNames.get(payment.chargeId) ?? "Charge"}
              </h2>
              <p className="mt-2 font-heading text-2xl font-semibold text-teal">
                {formatCentavos(payment.amountCentavos)}
              </p>
              <p className="mt-1 text-sm leading-6 text-ink/70">
                {methodLabel(payment.method)} · {formatShortDay(payment.paidAt)} · Ref{" "}
                {payment.referenceNo}
              </p>
              {proofUrls.get(payment.id) ? (
                // Signed proof URLs must not pass through the image optimizer.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={proofUrls.get(payment.id)}
                  alt="Proof of payment"
                  className="mt-3 max-h-56 w-full rounded-2xl object-contain bg-mist"
                />
              ) : null}
              <div className="mt-4 flex flex-col gap-3">
                <form action={approveProof}>
                  <input type="hidden" name="paymentId" value={payment.id} />
                  <Button type="submit" className="h-12 w-full text-base">
                    Approve
                  </Button>
                </form>
                <form action={rejectProof} className="flex flex-col gap-2">
                  <input type="hidden" name="paymentId" value={payment.id} />
                  <label htmlFor={`reason-${payment.id}`} className="text-sm font-medium">
                    Reason for rejection
                  </label>
                  <input
                    id={`reason-${payment.id}`}
                    name="reason"
                    required
                    className="h-12 w-full rounded-2xl border border-border px-3 text-base"
                  />
                  <Button type="submit" variant="outline" className="h-12 w-full bg-white text-base">
                    Reject
                  </Button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
      <section className="rounded-3xl bg-white p-4">
        <h2 className="font-heading text-lg font-semibold">Recent payments</h2>
        <ul className="mt-2 flex flex-col">
          {payments.slice(0, 8).map((payment) => (
            <li key={payment.id} className="flex items-center justify-between gap-3 border-t border-border py-3 first:border-t-0">
              <span>
                <span className="block font-medium">{labels.get(payment.unitId)}</span>
                <span className="block text-sm text-ink/60">
                  {methodLabel(payment.method)} · {formatShortDay(payment.paidAt)}
                </span>
              </span>
              <span className="text-right">
                <StatusPill status={payment.status} />
                <span className="mt-1 block text-sm">{formatCentavos(payment.amountCentavos)}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
