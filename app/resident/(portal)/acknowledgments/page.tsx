import Link from "next/link";
import { ListEmpty } from "@/components/list-state";
import { requireRole } from "@/lib/auth";
import { getRepository } from "@/lib/get-repository";
import { LIST_COPY } from "@/lib/list-states";
import { formatCentavos, formatShortDay } from "@/lib/money";

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
        <ListEmpty>
          {`${LIST_COPY.acknowledgmentsEmpty} Paid records from ${hoa?.registeredName ?? "your association"} will appear here.`}
        </ListEmpty>
      ) : (
        <ul className="flex flex-col gap-3">
          {approved.map((payment) => (
            <li key={payment.id}>
              <Link
                href={`/resident/acknowledgments/${payment.id}`}
                className="block rounded-3xl bg-white p-5"
              >
                <p className="text-xs font-semibold tracking-[0.14em] text-ink/50">
                  PAYMENT ACKNOWLEDGMENT
                </p>
                <p className="mt-2 font-heading text-3xl font-semibold">
                  {formatCentavos(payment.amountCentavos)}
                </p>
                <p className="mt-2 text-sm text-ink/70">{names.get(payment.chargeId)}</p>
                <p className="text-sm text-ink/70">{formatShortDay(payment.paidAt)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
