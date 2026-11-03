import { Suspense } from "react";
import { DevRoleSwitch } from "@/components/dev-role-switch";
import { Shell } from "@/components/shell";
import { requireRole } from "@/lib/auth";
import { getRepository } from "@/lib/get-repository";
import { roleLabel } from "@/lib/roles";

export const metadata = {
  title: "Admin home",
};

export default function AdminPage() {
  return (
    <Shell>
      <Suspense
        fallback={<p className="text-sm text-ink/70">Checking the demo session…</p>}
      >
        <AdminHome />
      </Suspense>
    </Shell>
  );
}

async function AdminHome() {
  const user = await requireRole("admin_treasurer");
  const repository = getRepository();
  const [hoa, units] = await Promise.all([
    repository.getHoa(user.id),
    repository.listUnits(user.id),
  ]);
  const unitWord = units.length === 1 ? "unit" : "units";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-medium text-teal-deep">Admin home</p>
        <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight text-balance text-ink">
          {hoa?.registeredName ?? "Association name is unavailable"}
        </h1>
        <p className="mt-3 text-base leading-7 text-ink/80">
          Signed in as {user.fullName}, {roleLabel(user.role).toLowerCase()}.
          This screen is a placeholder. Unit setup, charges, and the
          who-has-paid list come later.
        </p>
      </div>
      <section className="rounded-2xl border border-border bg-white p-5">
        <p className="font-heading text-4xl font-semibold text-teal">
          {units.length}
        </p>
        <p className="mt-1 text-sm leading-6 text-ink/80">
          {unitWord} on file in this association. The admin treasurer can see
          every unit.
        </p>
      </section>
      <DevRoleSwitch currentUserId={user.id} />
    </div>
  );
}
