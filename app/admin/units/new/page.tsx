import { Suspense } from "react";
import Link from "next/link";
import { Shell } from "@/components/shell";
import { UnitForm } from "@/components/unit-form";
import { requireRole } from "@/lib/auth";
import { unitErrorMessage } from "@/lib/form-messages";

export const metadata = {
  title: "Add unit",
};

export default function NewUnitPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <Shell>
      <Suspense
        fallback={<p className="text-sm text-ink/70">Checking the demo session…</p>}
      >
        <NewUnit searchParams={searchParams} />
      </Suspense>
    </Shell>
  );
}

async function NewUnit({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const error = unitErrorMessage((await searchParams).error);
  await requireRole("admin_treasurer");

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin"
        className="inline-flex min-h-11 items-center text-sm font-medium text-teal-deep"
      >
        Back to units
      </Link>
      <div>
        <p className="text-sm font-medium text-teal-deep">Units</p>
        <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight text-ink">
          Add unit
        </h1>
        <p className="mt-2 text-base leading-7 text-ink/80">
          Choose a flat monthly amount, or a per-sqm rate and the floor area.
          What you type is in Philippine pesos. It is stored as centavos.
        </p>
      </div>
      <UnitForm idPrefix="new-unit" submitLabel="Add unit" error={error} />
    </div>
  );
}
