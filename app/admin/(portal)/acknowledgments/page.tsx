import { Suspense } from "react";
import Link from "next/link";
import { PaymentAcknowledgment } from "@/components/payment-acknowledgment";
import { PrintButton } from "@/components/print-button";
import { requireRole } from "@/lib/auth";
import { loadAcknowledgment } from "@/lib/acknowledgment-view";
import { getRepository } from "@/lib/get-repository";
import { formatCentavos, formatShortDay } from "@/lib/money";

export const metadata = { title: "Acknowledgments" };

export default function AcknowledgmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string }>;
}) {
  return (
    <Suspense fallback={<p className="text-sm text-ink/70">Loading acknowledgments…</p>}>
      <Acknowledgments searchParams={searchParams} />
    </Suspense>
  );
}

async function Acknowledgments({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string }>;
}) {
  const paymentId = (await searchParams).payment;
  const user = await requireRole("admin_treasurer");
  const repository = getRepository();
  const payments = (await repository.listPayments(user.id)).filter(
    (payment) => payment.status === "approved",
  );
  const selected = paymentId
    ? await loadAcknowledgment(repository, user.id, paymentId)
    : payments[0]
      ? await loadAcknowledgment(repository, user.id, payments[0].id)
      : null;

  return (
    <div className="flex flex-col gap-5">
      <header className="print:hidden">
        <p className="text-sm font-medium text-teal-deep">Acknowledgments</p>
        <p className="mt-1 font-heading text-3xl font-semibold">Payment acknowledgment</p>
      </header>
      {selected ? (
        <div className="flex flex-col gap-3">
          <PaymentAcknowledgment fields={selected.fields} />
          <PrintButton />
        </div>
      ) : (
        <p className="rounded-3xl bg-white p-5 text-sm text-ink/70">No approved payments yet.</p>
      )}
      <ul className="flex flex-col gap-2 print:hidden">
        {payments.map((row) => (
          <li key={row.id}>
            <Link
              href={`/admin/acknowledgments?payment=${row.id}`}
              className="block rounded-2xl bg-white px-4 py-3 text-sm"
            >
              {formatCentavos(row.amountCentavos)} · {formatShortDay(row.paidAt)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
