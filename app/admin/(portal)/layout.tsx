import { Suspense } from "react";
import { AdminNav } from "@/components/admin-nav";
import { requireRole } from "@/lib/auth";

export default function AdminPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<p className="px-5 py-6 text-sm text-ink/70">Opening the admin portal…</p>}>
      <AdminFrame>{children}</AdminFrame>
    </Suspense>
  );
}

async function AdminFrame({ children }: { children: React.ReactNode }) {
  await requireRole("admin_treasurer");
  return (
    <div className="min-h-dvh bg-mist text-ink">
      <main className="mx-auto flex w-full max-w-lg flex-col px-5 py-6 pb-28">
        {children}
      </main>
      <AdminNav />
    </div>
  );
}
