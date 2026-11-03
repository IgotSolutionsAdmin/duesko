import { formatCentavos } from "@/lib/money";
import type { Charge, Unit } from "@/lib/types";

export function ChargeList({
  charges,
  units,
  showUnit,
  label,
}: {
  charges: Charge[];
  units: Unit[];
  showUnit: boolean;
  label: string;
}) {
  const labels = new Map(units.map((unit) => [unit.id, unit.label]));
  const ordered = [...charges].sort(
    (a, b) =>
      a.dueDate.localeCompare(b.dueDate) ||
      a.description.localeCompare(b.description) ||
      (labels.get(a.unitId) ?? "").localeCompare(labels.get(b.unitId) ?? ""),
  );

  return (
    <section aria-label={label} className="flex flex-col gap-3">
      <h2 className="font-heading text-lg font-semibold text-ink">{label}</h2>
      {ordered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-teal/40 bg-white p-5 text-sm leading-6 text-ink/80">
          No charges yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {ordered.map((charge) => (
            <li
              key={charge.id}
              className="rounded-2xl border border-border bg-white p-4"
            >
              {showUnit ? (
                <p className="text-sm font-medium text-teal-deep">
                  {labels.get(charge.unitId) ?? "Unit"}
                </p>
              ) : null}
              <h3 className="mt-1 font-heading text-xl font-semibold text-ink">
                {charge.description}
              </h3>
              <p className="mt-2 font-heading text-2xl font-semibold text-teal">
                {formatCentavos(charge.amountCentavos)}
              </p>
              <p className="mt-1 text-sm leading-6 text-ink/80">
                {charge.kind === "dues" ? "Monthly dues" : "Special assessment"}
                {" · "}
                Due {charge.dueDate}
                {" · "}
                {charge.status === "paid" ? "Paid" : "Unpaid"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
