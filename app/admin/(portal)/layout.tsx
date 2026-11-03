import { Suspense } from "react";
import { AdminNav } from "@/components/admin-nav";
import { ContentToolbar } from "@/components/content-toolbar";
import { requireRole } from "@/lib/auth";
import { getRepository } from "@/lib/get-repository";

export default function AdminPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<p className="px-5 py-6 text-sm text-ink/70">Opening the admin portal…</p>}>
      <AdminFrame>{children}</AdminFrame>
    </Suspense>
  );
}

async function AdminFrame({ children }: { children: React.ReactNode }) {
  const user = await requireRole("admin_treasurer");
  const repository = getRepository();
  const [hoa, units, payments] = await Promise.all([
    repository.getHoa(user.id),
    repository.listUnits(user.id),
    repository.listPayments(user.id),
  ]);
  const pendingProofs = payments.filter((payment) => payment.status === "pending").length;
  return (
    <div className="min-h-dvh bg-white text-ink lg:flex">
      <AdminNav
        hoaName={hoa?.registeredName ?? "Association"}
        userName={user.fullName}
        userEmail={user.email}
        counts={{ payments: pendingProofs, units: units.length }}
      />
      <main className="portal-main mx-auto flex w-full max-w-lg flex-col px-5 pt-5 lg:max-w-none lg:flex-1 lg:px-8 lg:pt-6">
        <ContentToolbar portal="admin" />
        {children}
        <div data-testid="page-end" aria-hidden className="h-px w-full shrink-0" />
      </main>
    </div>
  );
}
