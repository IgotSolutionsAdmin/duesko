import { ListEmpty } from "@/components/list-state";
import { SampleBadge, StatusBadge } from "@/components/status-badge";
import { LIST_COPY } from "@/lib/list-states";
import { formatCentavos } from "@/lib/money";
import { useMockRepository } from "@/lib/test-site";
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
  const sample = useMockRepository();

  return (
    <section aria-label={label} className="flex flex-col gap-3">
      <h2 className="font-heading text-lg font-semibold text-ink">{label}</h2>
      {ordered.length === 0 ? (
        <ListEmpty>{LIST_COPY.chargesEmpty}</ListEmpty>
      ) : (
        <ul className="flex flex-col gap-3">
          {ordered.map((charge) => (
            <li
              key={charge.id}
              className="rounded-2xl border border-border bg-white p-4"
            >
              <div className="flex items-start justify-between gap-2">
                {showUnit ? (
                  <p className="text-sm font-medium text-teal-deep">
                    {labels.get(charge.unitId) ?? "Unit"}
                  </p>
                ) : (
                  <span />
                )}
                <span className="flex items-center gap-1">
                  <StatusBadge status={charge.status} />
                  {sample ? <SampleBadge /> : null}
                </span>
              </div>
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
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
