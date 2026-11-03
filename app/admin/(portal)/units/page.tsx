import Link from "next/link";
import { DataRow, DataTable } from "@/components/data-table";
import { ListEmpty } from "@/components/list-state";
import { SampleBadge } from "@/components/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import { getRepository } from "@/lib/get-repository";
import { LIST_COPY } from "@/lib/list-states";
import { describeMonthlyDues, formatCentavos, monthlyDuesCentavos } from "@/lib/money";
import { useMockRepository } from "@/lib/test-site";
import { cn } from "cn";

export const metadata = { title: "Units" };

export default async function UnitsPage() {
  const user = await requireRole("admin_treasurer");
  const units = await getRepository().listUnits(user.id);
  const sample = useMockRepository();

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[13px] font-medium text-ink/50">Units</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight">
            {units.length} on file
          </h1>
        </div>
        {sample ? <SampleBadge /> : null}
      </header>
      {units.length === 0 ? (
        <ListEmpty>{LIST_COPY.unitsEmpty}</ListEmpty>
      ) : (
        <DataTable
          caption="Units on file"
          headers={[{ label: "Unit" }, { label: "Rate" }, { label: "Amount" }, { label: "Edit" }]}
        >
          {units.map((unit) => (
            <DataRow key={unit.id}>
              <td className="px-3 py-2.5">
                <h2 className="text-[13px] font-semibold">{unit.label}</h2>
                <p className="text-[12px] text-ink/50">{describeMonthlyDues(unit)}</p>
              </td>
              <td className="px-3 py-2.5 text-ink/70">{unit.rateType === "flat" ? "Flat" : "Per sqm"}</td>
              <td className="px-3 py-2.5 font-medium">{formatCentavos(monthlyDuesCentavos(unit))}</td>
              <td className="px-3 py-2.5">
                <Link
                  href={`/admin/units/${unit.id}`}
                  className="inline-flex min-h-11 items-center font-medium text-teal-deep"
                  aria-label={`Edit ${unit.label}`}
                >
                  Edit
                </Link>
              </td>
            </DataRow>
          ))}
        </DataTable>
      )}
      <Link
        href="/admin/units/new"
        className={cn(buttonVariants({ className: "h-12 w-full text-base" }))}
      >
        Add unit
      </Link>
    </div>
  );
}
