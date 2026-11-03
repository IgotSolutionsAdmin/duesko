import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getRepository } from "@/lib/get-repository";
import { formatCentavos, formatShortDay } from "@/lib/money";
import { methodLabel } from "@/lib/payments";

export const metadata = { title: "Acknowledgments" };

export default async function ResidentAcknowledgmentsPage() {
  const user = await requireRole("resident");
  const repository = getRepository();
  const [hoa, payments, charges] = await Promise.all([
    repository.getHoa(user.id),
    repository.listPayments(user.id),
    repository.listCharges(user.id),
  ]);
  const approved = payments.filter((payment) => payment.status === "approved");
  const names = new Map(charges.map((charge) => [charge.id, charge.description]));

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center gap-3">
        <Link href="/resident" className="text-2xl text-teal-deep" aria-label="Back">‹</Link>
        <h1 className="font-heading text-2xl font-semibold">Acknowledgments</h1>
      </header>
      {approved.length === 0 ? (
        <p className="rounded-3xl bg-white p-5 text-sm text-ink/70">
          Approved payments from {hoa?.registeredName ?? "your association"} will appear here.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {approved.map((payment) => (
            <li key={payment.id} className="rounded-3xl bg-white p-5">
              <p className="text-xs font-semibold tracking-[0.14em] text-ink/50">PAYMENT ACKNOWLEDGMENT</p>
              <p className="mt-2 font-heading text-3xl font-semibold">{formatCentavos(payment.amountCentavos)}</p>
              <p className="mt-2 text-sm text-ink/70">{names.get(payment.chargeId)}</p>
              <p className="text-sm text-ink/70">
                {methodLabel(payment.method)} · {formatShortDay(payment.paidAt)}
              </p>
              <button type="button" disabled className="mt-4 h-11 w-full rounded-2xl border border-border text-sm text-ink/40">
                Download acknowledgment
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
