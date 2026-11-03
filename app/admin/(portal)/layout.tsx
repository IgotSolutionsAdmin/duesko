import { Suspense } from "react";
import { AdminNav } from "@/components/admin-nav";
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
  const hoa = await getRepository().getHoa(user.id);
  return (
    <div className="min-h-dvh bg-mist text-ink lg:flex">
      <AdminNav hoaName={hoa?.registeredName ?? "Association"} />
      <main className="mx-auto flex w-full max-w-lg flex-col px-5 py-6 pb-28 lg:max-w-none lg:flex-1 lg:px-10 lg:py-8 lg:pb-8">
        {children}
      </main>
    </div>
  );
}
