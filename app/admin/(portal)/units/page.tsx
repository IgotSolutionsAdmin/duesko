import Link from "next/link";
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
          <p className="text-sm font-medium text-teal-deep">Units</p>
          <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight">
            {units.length} on file
          </h1>
        </div>
        {sample ? <SampleBadge /> : null}
      </header>
      {units.length === 0 ? (
        <ListEmpty>{LIST_COPY.unitsEmpty}</ListEmpty>
      ) : (
        <ul className="flex flex-col gap-3">
          {units.map((unit) => (
            <li key={unit.id} className="rounded-3xl bg-white p-4">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-heading text-xl font-semibold">{unit.label}</h2>
                {sample ? <SampleBadge /> : null}
              </div>
              <p className="mt-2 font-heading text-2xl font-semibold text-teal">
                {formatCentavos(monthlyDuesCentavos(unit))}
              </p>
              <p className="mt-1 text-sm leading-6 text-ink/70">{describeMonthlyDues(unit)}</p>
              <Link
                href={`/admin/units/${unit.id}`}
                className="mt-3 inline-flex min-h-11 items-center text-base font-medium text-teal-deep"
                aria-label={`Edit ${unit.label}`}
              >
                Edit
              </Link>
            </li>
          ))}
        </ul>
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
