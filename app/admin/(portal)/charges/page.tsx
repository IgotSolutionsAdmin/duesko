import Link from "next/link";
import { ChargeList } from "@/components/charge-list";
import { buttonVariants } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import { getRepository } from "@/lib/get-repository";
import { cn } from "cn";

export const metadata = { title: "Charges" };

export default async function ChargesPage() {
  const user = await requireRole("admin_treasurer");
  const repository = getRepository();
  const [units, charges] = await Promise.all([
    repository.listUnits(user.id),
    repository.listCharges(user.id),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center justify-between gap-3">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Charges</h1>
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
