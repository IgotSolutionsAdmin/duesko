import { Suspense } from "react";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getRepository } from "@/lib/get-repository";
import { formatCentavos, formatShortDay } from "@/lib/money";
import { methodLabel } from "@/lib/payments";

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
  const [hoa, payments, charges, units, people] = await Promise.all([
    repository.getHoa(user.id),
    repository.listPayments(user.id),
    repository.listCharges(user.id),
    repository.listUnits(user.id),
    repository.listUsers(user.id),
  ]);
  const approved = payments.filter((payment) => payment.status === "approved");
  const payment = approved.find((row) => row.id === paymentId) ?? approved[0];
  const charge = charges.find((row) => row.id === payment?.chargeId);
  const unit = units.find((row) => row.id === payment?.unitId);
  const resident = people.find((row) => row.unitId === payment?.unitId);

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="text-sm font-medium text-teal-deep">Acknowledgments</p>
        <h1 className="mt-1 font-heading text-3xl font-semibold">Payment acknowledgment</h1>
      </header>
      {payment ? (
        <article className="rounded-3xl bg-white p-5 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-teal/15 text-2xl text-teal-deep">
            ✓
          </div>
          <p className="mt-4 text-xs font-semibold tracking-[0.16em] text-ink/50">
            PAYMENT ACKNOWLEDGMENT
          </p>
          <p className="mt-2 font-heading text-4xl font-semibold">
            {formatCentavos(payment.amountCentavos)}
          </p>
          <p className="mt-2 text-sm leading-6 text-ink/70">
            Received with thanks, {hoa?.registeredName}
          </p>
          <dl className="mt-5 space-y-3 border-t border-dashed border-border pt-4 text-left text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-ink/60">Acknowledgment no.</dt>
              <dd className="font-medium">{payment.hoaReferenceNo ?? payment.id.slice(0, 8).toUpperCase()}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink/60">Unit</dt>
              <dd className="font-medium">{unit?.label}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink/60">Resident</dt>
              <dd className="font-medium">{resident?.fullName ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink/60">For</dt>
              <dd className="font-medium">{charge?.description}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink/60">Paid via</dt>
              <dd className="font-medium">{methodLabel(payment.method)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink/60">Date</dt>
              <dd className="font-medium">{formatShortDay(payment.paidAt)}</dd>
            </div>
          </dl>
          <p className="mt-4 text-sm leading-6 text-ink/60">
            This page acknowledges a payment recorded by your HOA officers.
          </p>
          <button type="button" disabled className="mt-4 h-12 w-full rounded-2xl border border-border text-base font-medium text-ink/40">
            Download acknowledgment
          </button>
          <button type="button" disabled className="mt-3 h-12 w-full rounded-2xl border border-border text-base font-medium text-ink/40">
            Share via Viber or Messenger
          </button>
        </article>
      ) : (
        <p className="rounded-3xl bg-white p-5 text-sm text-ink/70">No approved payments yet.</p>
      )}
      <ul className="flex flex-col gap-2">
        {approved.map((row) => (
          <li key={row.id}>
            <Link href={`/admin/acknowledgments?payment=${row.id}`} className="block rounded-2xl bg-white px-4 py-3 text-sm">
              {formatCentavos(row.amountCentavos)} · {formatShortDay(row.paidAt)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
