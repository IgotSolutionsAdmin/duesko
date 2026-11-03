import { Suspense } from "react";
import Link from "next/link";
import { ListEmpty, ListSkeleton } from "@/components/list-state";
import { ProofUploadForm } from "@/components/proof-upload-form";
import { SampleBadge, StatusWithSample } from "@/components/status-badge";
import { requireRole } from "@/lib/auth";
import { getRepository } from "@/lib/get-repository";
import { DEFAULT_HOW_TO_PAY } from "@/lib/how-to-pay";
import { LIST_COPY } from "@/lib/list-states";
import { formatCentavos, formatShortDay } from "@/lib/money";
import { canReupload, chargeBalanceStatus, hasPendingProof, methodLabel } from "@/lib/payments";
import { useMockRepository } from "@/lib/test-site";

export const metadata = { title: "Upload proof" };

export default function ResidentPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ charge?: string; error?: string; reupload?: string }>;
}) {
  return (
    <Suspense fallback={<ListSkeleton label="Loading payments" />}>
      <ResidentPayments searchParams={searchParams} />
    </Suspense>
  );
}

async function ResidentPayments({
  searchParams,
}: {
  searchParams: Promise<{ charge?: string; error?: string; reupload?: string }>;
}) {
  const query = await searchParams;
  const user = await requireRole("resident");
  const repository = getRepository();
  const [hoa, charges, payments] = await Promise.all([
    repository.getHoa(user.id),
    repository.listCharges(user.id),
    repository.listPayments(user.id),
  ]);
  const open = charges.filter((charge) => chargeBalanceStatus(charge, payments) !== "paid");
  const pendingChargeIds = open
    .filter((charge) => hasPendingProof(payments, charge.id))
    .map((charge) => charge.id);
  const sample = useMockRepository();

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center gap-3">
        <Link href="/resident" className="text-2xl text-teal-deep" aria-label="Back">
          ‹
        </Link>
        <h1 className="font-heading text-2xl font-semibold">
          {query.reupload ? "Re-upload proof" : "Upload proof of payment"}
        </h1>
        {sample ? <SampleBadge /> : null}
      </header>
      <ProofUploadForm
        charges={open}
        defaultChargeId={query.charge}
        howToPay={hoa?.howToPay ?? DEFAULT_HOW_TO_PAY}
        pendingChargeIds={pendingChargeIds}
        reupload={query.reupload === "1"}
        serverError={query.error}
      />
      <section className="rounded-3xl bg-white p-4" aria-label="Payment history">
        <h2 className="font-heading text-lg font-semibold">Payment history</h2>
        {payments.length === 0 ? (
          <div className="mt-3">
            <ListEmpty>{LIST_COPY.paymentsEmpty}</ListEmpty>
          </div>
        ) : (
          <ul className="mt-2">
            {payments.map((payment) => (
              <li key={payment.id} className="border-t border-border py-3 first:border-t-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{methodLabel(payment.method)}</p>
                    <p className="text-sm text-ink/60">{formatShortDay(payment.paidAt)}</p>
                    {payment.status === "rejected" && payment.rejectionReason ? (
                      <p className="mt-1 text-sm text-destructive">{payment.rejectionReason}</p>
                    ) : null}
                    {canReupload(payment) ? (
                      <Link
                        href={`/resident/payments?charge=${payment.chargeId}&reupload=1`}
                        className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-teal-deep"
                      >
                        Re-upload
                      </Link>
                    ) : null}
                  </div>
                  <div className="text-right">
                    <StatusWithSample status={payment.status} sample={sample} />
                    <p className="mt-1 text-sm">{formatCentavos(payment.amountCentavos)}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
