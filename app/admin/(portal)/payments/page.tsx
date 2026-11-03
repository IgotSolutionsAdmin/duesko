import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { ListEmpty, ListError, ListSkeleton } from "@/components/list-state";
import { RejectProofDialog } from "@/components/reject-proof-dialog";
import { StatusWithSample } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import { getRepository } from "@/lib/get-repository";
import { LIST_COPY } from "@/lib/list-states";
import { formatCentavos, formatShortDay } from "@/lib/money";
import { approveProof } from "@/lib/payment-actions";
import { methodLabel } from "@/lib/payments";
import { useMockRepository } from "@/lib/test-site";

export const metadata = { title: "Payments" };

export default function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <Suspense fallback={<ListSkeleton rows={4} label="Loading payments" />}>
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
  const sample = useMockRepository();

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
        <ListError message={LIST_COPY.proofsLoadError} retryHref="/admin/payments" />
      ) : pending.length === 0 ? (
        <ListEmpty>
          {LIST_COPY.proofsEmpty}{" "}
          <Link href="/admin/payments/cash" className="font-semibold text-teal-deep">
            Record a cash or manual payment
          </Link>{" "}
          if the resident paid you directly.
        </ListEmpty>
      ) : (
        <ul className="flex flex-col gap-4">
          {pending.map((payment) => (
            <li key={payment.id} className="rounded-3xl bg-white p-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-teal-deep">
                  {labels.get(payment.unitId) ?? "Unit"}
                </p>
                <StatusWithSample status="pending" sample={sample} />
              </div>
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
                  <input type="hidden" name="paymentId" value={payment.id} suppressHydrationWarning />
                  <Button type="submit" className="h-12 w-full text-base">
                    Approve
                  </Button>
                </form>
                <RejectProofDialog paymentId={payment.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
      <section className="rounded-3xl bg-white p-4">
        <h2 className="font-heading text-lg font-semibold">Recent payments</h2>
        {payments.length === 0 ? (
          <div className="mt-2">
            <ListEmpty>{LIST_COPY.paymentsEmpty}</ListEmpty>
          </div>
        ) : (
          <ul className="mt-2 flex flex-col">
            {payments.map((payment) => (
              <li key={payment.id} className="border-t border-border py-3 first:border-t-0">
                <div className="flex items-start justify-between gap-3">
                  <span>
                    <span className="block font-medium">{labels.get(payment.unitId)}</span>
                    <span className="block text-sm text-ink/60">
                      {methodLabel(payment.method)} · {formatShortDay(payment.paidAt)}
                    </span>
                    {payment.status === "approved" ? (
                      <Link
                        href={`/admin/acknowledgments?payment=${payment.id}`}
                        className="mt-1 inline-block text-sm font-semibold text-teal-deep"
                      >
                        Open acknowledgment
                      </Link>
                    ) : null}
                  </span>
                  <span className="shrink-0 text-right">
                    <StatusWithSample status={payment.status} sample={sample} />
                    <span className="mt-1 block text-sm">{formatCentavos(payment.amountCentavos)}</span>
                  </span>
                </div>
                {payment.status === "rejected" && payment.rejectionReason ? (
                  <p className="mt-2 w-full text-sm text-destructive">
                    {payment.rejectionReason}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
