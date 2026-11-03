import { DevRoleSwitch } from "@/components/dev-role-switch";
import { ListEmpty } from "@/components/list-state";
import { SampleBadge, StatusWithSample } from "@/components/status-badge";
import { requireRole } from "@/lib/auth";
import { LIST_COPY } from "@/lib/list-states";
import { firstName } from "@/lib/greeting";
import { getRepository } from "@/lib/get-repository";
import { formatCentavos, formatShortDay } from "@/lib/money";
import { approvedCentavos, chargeBalanceStatus } from "@/lib/payments";
import { useMockRepository } from "@/lib/test-site";

export const metadata = { title: "Dashboard" };

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "•";
}

export default async function AdminDashboard() {
  const user = await requireRole("admin_treasurer");
  const repository = getRepository();
  const [hoa, units, charges, payments, people] = await Promise.all([
    repository.getHoa(user.id),
    repository.listUnits(user.id),
    repository.listCharges(user.id),
    repository.listPayments(user.id),
    repository.listUsers(user.id),
  ]);
  const dues = charges.filter((charge) => charge.kind === "dues" && charge.period);
  const latestPeriod = dues.map((charge) => charge.period ?? "").sort().at(-1) ?? null;
  const periodCharges = latestPeriod
    ? dues.filter((charge) => charge.period === latestPeriod)
    : [];
  const billed = periodCharges.reduce((sum, charge) => sum + charge.amountCentavos, 0);
  const collected = periodCharges.reduce(
    (sum, charge) => sum + Math.min(charge.amountCentavos, approvedCentavos(payments, charge.id)),
    0,
  );
  const percent = billed === 0 ? 0 : Math.round((collected / billed) * 100);
  const dueDate = periodCharges.map((charge) => charge.dueDate).sort()[0];
  const paidUnits = periodCharges.filter(
    (charge) => chargeBalanceStatus(charge, payments) === "paid",
  ).length;
  const openUnits = periodCharges.length - paidUnits;
  const monthNames = [
    "JANUARY",
    "FEBRUARY",
    "MARCH",
    "APRIL",
    "MAY",
    "JUNE",
    "JULY",
    "AUGUST",
    "SEPTEMBER",
    "OCTOBER",
    "NOVEMBER",
    "DECEMBER",
  ];
  const periodLabel = latestPeriod
    ? `${monthNames[Number(latestPeriod.slice(5, 7)) - 1]} ${latestPeriod.slice(0, 4)}`
    : "DUES";

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold leading-tight tracking-tight text-ink">
            Magandang umaga, {firstName(user.fullName)}
          </h1>
          <p className="mt-1 max-w-[14rem] text-sm leading-5 text-ink/70">
            {hoa?.registeredName ?? "Association"}
          </p>
        </div>
        {useMockRepository() ? <SampleBadge /> : <span className="mt-1 h-3 w-16 rounded-full bg-teal-deep" aria-hidden />}
      </header>

      <section className="rounded-3xl bg-teal-deep p-5 text-white">
        <p className="text-xs font-semibold tracking-[0.14em] text-white/80">
          {periodLabel} DUES
        </p>
        <p className="mt-3 font-heading text-4xl font-semibold tracking-tight">
          {formatCentavos(collected)}
        </p>
        <p className="mt-1 text-sm text-white/80">
          collected of {formatCentavos(billed)}
        </p>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/20">
          <div className="h-full rounded-full bg-mango" style={{ width: `${percent}%` }} />
        </div>
        <div className="mt-3 flex items-center justify-between text-sm">
          <p>{percent}% collected</p>
          <p>{dueDate ? `Due ${formatShortDay(dueDate)}` : "No due date"}</p>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <section className="rounded-3xl bg-white p-4">
          <p className="text-xs font-semibold tracking-[0.14em] text-ink/50">PAID</p>
          <p className="mt-2 font-heading text-4xl font-semibold text-ink">{paidUnits}</p>
          <p className="text-sm text-ink/60">units</p>
        </section>
        <section className="rounded-3xl bg-white p-4">
          <p className="text-xs font-semibold tracking-[0.14em] text-ink/50">NOT YET PAID</p>
          <p className="mt-2 font-heading text-4xl font-semibold text-mango">{openUnits}</p>
          <p className="text-sm text-ink/60">units</p>
        </section>
      </div>

      <section className="rounded-3xl bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold">Units</h2>
          <p className="text-sm text-ink/50">{units.length} total</p>
        </div>
        {units.length === 0 ? (
          <div className="mt-3">
            <ListEmpty>{LIST_COPY.unitsEmpty}</ListEmpty>
          </div>
        ) : (
        <ul className="mt-3 flex flex-col">
          {units.map((unit) => {
            const resident = people.find((person) => person.unitId === unit.id);
            const charge = periodCharges.find((row) => row.unitId === unit.id);
            const status = charge ? chargeBalanceStatus(charge, payments) : "unpaid";
            const name = resident?.fullName ?? "No resident yet";
            return (
              <li key={unit.id} className="flex items-center gap-3 border-t border-border py-3 first:border-t-0">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-teal/15 font-heading text-sm font-semibold text-teal-deep">
                  {initials(resident?.fullName ?? unit.label)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-ink">{unit.label}</span>
                  <span className="block truncate text-sm text-ink/60">{name}</span>
                </span>
                <span className="text-right">
                  <StatusWithSample status={status} sample={useMockRepository()} />
                  <span className="mt-1 block text-sm text-ink/70">
                    {formatCentavos(charge?.amountCentavos ?? 0)}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
        )}
      </section>

      {useMockRepository() ? (
        <DevRoleSwitch currentUserId={user.id} portal="admin" />
      ) : null}
    </div>
  );
}
