import { DataRow, DataTable } from "@/components/data-table";
import { ListEmpty } from "@/components/list-state";
import { StatusWithSample } from "@/components/status-badge";
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
      <h2 className="text-[13px] font-medium text-ink">{label}</h2>
      {ordered.length === 0 ? (
        <ListEmpty>{LIST_COPY.chargesEmpty}</ListEmpty>
      ) : (
        <DataTable
          caption={label}
          headers={[
            { label: "Charge" },
            { label: "Kind" },
            { label: "Due" },
            { label: "Status" },
            { label: "Amount" },
          ]}
        >
          {ordered.map((charge) => (
            <DataRow key={charge.id}>
              <td className="px-3 py-2.5">
                {showUnit ? (
                  <p className="text-[12px] font-medium text-teal-deep">
                    {labels.get(charge.unitId) ?? "Unit"}
                  </p>
                ) : null}
                <h3 className="text-[13px] font-semibold text-ink">{charge.description}</h3>
              </td>
              <td className="px-3 py-2.5 text-ink/70">
                {charge.kind === "dues" ? "Monthly dues" : "Special assessment"}
              </td>
              <td className="px-3 py-2.5 text-ink/70">{charge.dueDate}</td>
              <td className="px-3 py-2.5">
                <StatusWithSample status={charge.status} sample={sample} />
              </td>
              <td className="px-3 py-2.5 font-medium">
                <p>{formatCentavos(charge.amountCentavos)}</p>
              </td>
            </DataRow>
          ))}
        </DataTable>
      )}
    </section>
  );
}
