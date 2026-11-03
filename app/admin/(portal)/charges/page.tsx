import { Suspense } from "react";
import Link from "next/link";
import { ChargeList } from "@/components/charge-list";
import { ListSkeleton } from "@/components/list-state";
import { SampleBadge } from "@/components/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import { getRepository } from "@/lib/get-repository";
import { useMockRepository } from "@/lib/test-site";
import { cn } from "cn";

export const metadata = { title: "Charges" };

export default function ChargesPage() {
  return (
    <Suspense fallback={<ListSkeleton label="Loading charges" />}>
      <Charges />
    </Suspense>
  );
}

async function Charges() {
  const user = await requireRole("admin_treasurer");
  const repository = getRepository();
  const [units, charges] = await Promise.all([
    repository.listUnits(user.id),
    repository.listCharges(user.id),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">Charges</h1>
          {useMockRepository() ? <SampleBadge /> : null}
        </div>
        <Link
          href="/admin/charges/new"
          className={cn(buttonVariants({ className: "h-11 px-4 text-base" }))}
        >
          Create charge
        </Link>
      </header>
      <ChargeList charges={charges} units={units} showUnit label="Charge list" />
    </div>
  );
}
