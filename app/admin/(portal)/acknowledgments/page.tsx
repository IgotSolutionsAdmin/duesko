import { Suspense } from "react";
import Link from "next/link";
import { ListEmpty, ListSkeleton } from "@/components/list-state";
import { PaymentAcknowledgment } from "@/components/payment-acknowledgment";
import { LIST_COPY } from "@/lib/list-states";
import { PrintButton } from "@/components/print-button";
import { requireRole } from "@/lib/auth";
import { loadAcknowledgment } from "@/lib/acknowledgment-view";
import { getRepository } from "@/lib/get-repository";
import { formatCentavos, formatShortDay } from "@/lib/money";
import { useMockRepository } from "@/lib/test-site";

export const metadata = { title: "Acknowledgments" };

export default function AcknowledgmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string }>;
}) {
  return (
    <Suspense fallback={<ListSkeleton label="Loading acknowledgments" />}>
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
  const [payments, charges, units] = await Promise.all([
    repository.listPayments(user.id),
    repository.listCharges(user.id),
    repository.listUnits(user.id),
  ]);
  const approved = payments.filter((payment) => payment.status === "approved");
  const labels = new Map(units.map((unit) => [unit.id, unit.label]));
  const chargeNames = new Map(charges.map((charge) => [charge.id, charge.description]));
  const selected = paymentId
    ? await loadAcknowledgment(repository, user.id, paymentId)
    : approved[0]
      ? await loadAcknowledgment(repository, user.id, approved[0].id)
      : null;
  const sample = useMockRepository();

  return (
    <div className="flex flex-col gap-5">
      <header className="print:hidden">
        <p className="text-[13px] font-medium text-ink/50">Acknowledgments</p>
        <p className="mt-1 text-xl font-semibold">Payment acknowledgment</p>
      </header>
      {selected ? (
        <div className="flex flex-col gap-3">
          <PaymentAcknowledgment fields={selected.fields} sample={sample} />
          <PrintButton />
        </div>
      ) : (
        <ListEmpty>{LIST_COPY.acknowledgmentsEmpty}</ListEmpty>
      )}
      <ul className="flex flex-col gap-2 print:hidden">
        {approved.map((row) => (
          <li key={row.id}>
            <Link
              href={`/admin/acknowledgments?payment=${row.id}`}
              className="block rounded-2xl bg-white px-4 py-3 text-sm"
            >
              <span className="block font-medium text-ink">
                {labels.get(row.unitId) ?? "Unit"} · {chargeNames.get(row.chargeId) ?? "Charge"}
              </span>
              <span className="mt-1 block text-ink/60">
                {formatCentavos(row.amountCentavos)} · {formatShortDay(row.paidAt)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
