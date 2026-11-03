import { Suspense } from "react";
import Link from "next/link";
import { Shell } from "@/components/shell";
import { UnitForm } from "@/components/unit-form";
import { requireRole } from "@/lib/auth";
import { unitErrorMessage } from "@/lib/form-messages";
import { getRepository } from "@/lib/get-repository";

export const metadata = {
  title: "Edit unit",
};

export default function EditUnitPage({
  params,
  searchParams,
}: {
  params: Promise<{ unitId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <Shell>
      <Suspense
        fallback={<p className="text-sm text-ink/70">Loading unit…</p>}
      >
        <EditUnit params={params} searchParams={searchParams} />
      </Suspense>
    </Shell>
  );
}

async function EditUnit({
  params,
  searchParams,
}: {
  params: Promise<{ unitId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ unitId }, query] = await Promise.all([params, searchParams]);
  const error = unitErrorMessage(query.error);
  const user = await requireRole("admin_treasurer");
  const units = await getRepository().listUnits(user.id);
  const unit = units.find((row) => row.id === unitId);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin"
        className="inline-flex min-h-11 items-center text-sm font-medium text-teal-deep"
      >
        Back to units
      </Link>
      {unit ? (
        <>
          <div>
            <p className="text-sm font-medium text-teal-deep">Units</p>
            <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight text-ink">
              Edit unit
            </h1>
            <p className="mt-2 text-base leading-7 text-ink/80">
              Update {unit.label}. A flat amount replaces the per-sqm rate, and
              a per-sqm rate uses the floor area.
            </p>
          </div>
          <UnitForm
            unit={unit}
            idPrefix={`unit-${unit.id}`}
            submitLabel="Save unit"
            error={error}
          />
        </>
      ) : (
        <div>
          <h1 className="font-heading text-3xl font-semibold text-ink">
            Unit not found
          </h1>
          <p className="mt-2 text-base leading-7 text-ink/80">
            That unit is not in this association.
          </p>
        </div>
      )}
    </div>
  );
}
