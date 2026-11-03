import Link from "next/link";
import { DevRoleSwitch } from "@/components/dev-role-switch";
import { HowToPayCard } from "@/components/how-to-pay-card";
import { ListEmpty } from "@/components/list-state";
import { SampleBadge, StatusWithSample } from "@/components/status-badge";
import { requireRole } from "@/lib/auth";
import { firstName } from "@/lib/greeting";
import { getRepository } from "@/lib/get-repository";
import { LIST_COPY } from "@/lib/list-states";
import { describeMonthlyDues, formatCentavos, formatShortDay } from "@/lib/money";
import {
  approvedCentavos,
  canReupload,
  chargeBalanceStatus,
  latestProof,
  methodLabel,
} from "@/lib/payments";
import { shouldRenderDevRoleSwitch } from "@/lib/demo-auth";
import { useMockRepository } from "@/lib/test-site";

export const metadata = { title: "Your account" };

export default async function ResidentHome() {
  const user = await requireRole("resident");
  const repository = getRepository();
  const [hoa, units, charges, payments] = await Promise.all([
    repository.getHoa(user.id),
    repository.listUnits(user.id),
    repository.listCharges(user.id),
    repository.listPayments(user.id),
  ]);
  const unit = units[0];
  const balance = charges.reduce((sum, charge) => {
    const covered = Math.min(charge.amountCentavos, approvedCentavos(payments, charge.id));
    return sum + Math.max(0, charge.amountCentavos - covered);
  }, 0);
  const openCharge = charges.find((charge) => chargeBalanceStatus(charge, payments) !== "paid");
  const latest = latestProof(payments);
  const sample = useMockRepository();

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold leading-tight">
            Hi, {firstName(user.fullName)}
          </h1>
          <p className="mt-1 max-w-[14rem] text-sm leading-5 text-ink/70">
            {hoa?.registeredName}
          </p>
        </div>
        {sample ? <SampleBadge /> : <span className="mt-1 h-3 w-16 rounded-full bg-teal-deep" aria-hidden />}
      </header>

      <section className="rounded-3xl bg-teal-deep p-5 text-white">
        <h2 className="text-xs font-semibold tracking-[0.14em] text-white/75">
          {unit?.label ?? "Your unit"}
        </h2>
        {unit ? (
          <p className="mt-1 text-sm text-white/80">{describeMonthlyDues(unit)}</p>
        ) : null}
        <p className="mt-4 text-sm text-white/80">Balance due</p>
        <p className="mt-1 font-heading text-4xl font-semibold tracking-tight">
          {formatCentavos(balance)}
        </p>
        {openCharge ? (
          <Link
            href={`/resident/payments?charge=${openCharge.id}`}
            className="mt-5 flex h-12 items-center justify-center rounded-2xl bg-mango text-base font-semibold text-ink"
          >
            Upload proof of payment
          </Link>
        ) : (
          <p className="mt-5 text-sm text-white/80">You have no balance due.</p>
        )}
      </section>

      <section className="rounded-3xl bg-white p-4" aria-label="Latest submission">
        <h2 className="font-heading text-lg font-semibold">Latest submission</h2>
        {latest ? (
          <div className="mt-3 flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <StatusWithSample status={latest.status} sample={sample} />
            </div>
            <p className="text-sm leading-6 text-ink/70">
              {latest.status === "pending"
                ? "An officer will review your proof. You will see Paid or Rejected here."
                : latest.status === "rejected"
                  ? `Rejected: ${latest.rejectionReason}`
                  : `${methodLabel(latest.method)} · ${formatShortDay(latest.paidAt)}`}
            </p>
            {canReupload(latest) ? (
              <Link
                href={`/resident/payments?charge=${latest.chargeId}&reupload=1`}
                className="inline-flex min-h-11 items-center text-sm font-semibold text-teal-deep"
              >
                Re-upload
              </Link>
            ) : null}
          </div>
        ) : (
          <div className="mt-3">
            <ListEmpty>No proofs uploaded yet.</ListEmpty>
          </div>
        )}
      </section>

      <section className="rounded-3xl bg-white p-4" aria-label="My dues and payments">
        <h2 className="font-heading text-lg font-semibold">My dues & payments</h2>
        {charges.length === 0 ? (
          <div className="mt-3">
            <ListEmpty>{LIST_COPY.duesEmpty}</ListEmpty>
          </div>
        ) : (
          <ul className="mt-2">
            {charges.map((charge) => {
              const status = chargeBalanceStatus(charge, payments);
              const approved = payments
                .filter((payment) => payment.chargeId === charge.id && payment.status === "approved")
                .sort((a, b) => b.paidAt.localeCompare(a.paidAt))[0];
              const proof = latestProof(payments, charge.id);
              return (
                <li key={charge.id} className="border-t border-border py-3 first:border-t-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-medium">{charge.description}</h3>
                      <p className="text-sm text-ink/60">
                        {status === "paid" && approved
                          ? `Paid ${formatShortDay(approved.paidAt)} · ${methodLabel(approved.method)}`
                          : `Due ${formatShortDay(charge.dueDate)}`}
                      </p>
                      {proof && canReupload(proof) ? (
                        <Link
                          href={`/resident/payments?charge=${charge.id}&reupload=1`}
                          className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-teal-deep"
                        >
                          Re-upload
                        </Link>
                      ) : null}
                    </div>
                    <div className="shrink-0 text-right">
                      <StatusWithSample status={proof ? proof.status : status} sample={sample} />
                      <p className="mt-1 text-sm">{formatCentavos(charge.amountCentavos)}</p>
                    </div>
                  </div>
                  {proof?.status === "rejected" && proof.rejectionReason ? (
                    <p className="mt-2 w-full text-sm text-destructive">
                      Rejected: {proof.rejectionReason}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
        <Link href="/resident/acknowledgments" className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-teal-deep">
          View payment acknowledgments ›
        </Link>
      </section>

      <HowToPayCard howToPay={hoa?.howToPay} />

      {shouldRenderDevRoleSwitch() ? (
        <DevRoleSwitch currentUserId={user.id} portal="resident" />
      ) : null}
    </div>
  );
}
