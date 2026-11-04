import { DataRow, DataTable } from "@/components/data-table";
import { DevRoleSwitch } from "@/components/dev-role-switch";
import { ListEmpty } from "@/components/list-state";
import { SampleBadge, StatusWithSample } from "@/components/status-badge";
import { requireRole } from "@/lib/auth";
import { LIST_COPY } from "@/lib/list-states";
import { firstName } from "@/lib/greeting";
import { getRepository } from "@/lib/get-repository";
import { formatCentavos, formatShortDay } from "@/lib/money";
import { approvedCentavos, chargeBalanceStatus } from "@/lib/payments";
import { shouldRenderDevRoleSwitch } from "@/lib/demo-auth";
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
    <div className="flex flex-col gap-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold leading-tight tracking-tight text-ink">
            Magandang umaga, {firstName(user.fullName)}
          </h1>
          <p className="mt-1 max-w-[14rem] text-[13px] leading-5 text-ink/60">
            {hoa?.registeredName ?? "Association"}
          </p>
        </div>
        {useMockRepository() ? <SampleBadge /> : <span className="mt-1 h-3 w-16 rounded-full bg-teal-deep" aria-hidden />}
      </header>

      <div className="grid gap-3 md:grid-cols-3">
        <section className="rounded-xl border border-border bg-white p-4 md:col-span-1">
          <p className="text-[11px] font-medium tracking-[0.08em] text-ink/45">
            {periodLabel} DUES
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-ink">
            {formatCentavos(collected)}
          </p>
          <p className="mt-1 text-[13px] text-ink/50">
            collected of {formatCentavos(billed)}
          </p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#eef1f1]">
            <div className="h-full rounded-full bg-teal" style={{ width: `${percent}%` }} />
          </div>
          <div className="mt-2 flex items-center justify-between text-[13px] text-ink/55">
            <p>{percent}% collected</p>
            <p>{dueDate ? `Due ${formatShortDay(dueDate)}` : "No due date"}</p>
          </div>
        </section>
        <section className="rounded-xl border border-border bg-white p-4">
          <p className="text-[11px] font-medium tracking-[0.08em] text-ink/45">PAID</p>
          <p className="mt-2 text-2xl font-semibold text-ink">{paidUnits}</p>
          <p className="text-[13px] text-ink/50">units</p>
        </section>
        <section className="rounded-xl border border-border bg-white p-4">
          <p className="text-[11px] font-medium tracking-[0.08em] text-ink/45">NOT YET PAID</p>
          <p className="mt-2 text-2xl font-semibold text-ink">{openUnits}</p>
          <p className="text-[13px] text-ink/50">units</p>
        </section>
      </div>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-4 border-b border-border">
            <h2 className="border-b-2 border-teal pb-2 text-[13px] font-medium text-ink">Units</h2>
            <p className="pb-2 text-[13px] text-ink/40">{units.length} total</p>
          </div>
        </div>
        {units.length === 0 ? (
          <ListEmpty>{LIST_COPY.unitsEmpty}</ListEmpty>
        ) : (
        <DataTable
          caption="Units"
          headers={[{ label: "Unit" }, { label: "Resident" }, { label: "Status" }, { label: "Amount" }]}
        >
          {units.map((unit) => {
            const resident = people.find((person) => person.unitId === unit.id);
            const charge = periodCharges.find((row) => row.unitId === unit.id);
            const status = charge ? chargeBalanceStatus(charge, payments) : "unpaid";
            const name = resident?.fullName ?? "No resident yet";
            return (
              <DataRow key={unit.id}>
                <td className="px-3 py-2.5">
                  <span className="flex items-center gap-2">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-teal/10 text-[11px] font-semibold text-teal-deep">
                      {initials(resident?.fullName ?? unit.label)}
                    </span>
                    <span className="font-medium">{unit.label}</span>
                  </span>
                </td>
                <td className="px-3 py-2.5 text-ink/70">{name}</td>
                <td className="px-3 py-2.5">
                  <StatusWithSample status={status} sample={useMockRepository()} />
                </td>
                <td className="px-3 py-2.5 text-ink/80">
                  {formatCentavos(charge?.amountCentavos ?? 0)}
                </td>
              </DataRow>
            );
          })}
        </DataTable>
        )}
      </section>

      {shouldRenderDevRoleSwitch() ? (
        <DevRoleSwitch currentUserId={user.id} portal="admin" />
      ) : null}
    </div>
  );
}
