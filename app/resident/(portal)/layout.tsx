import { Suspense } from "react";
import { ResidentNav } from "@/components/resident-nav";
import { requireRole } from "@/lib/auth";

export default function ResidentPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={<p className="px-5 py-6 text-sm text-ink/70">Opening your account…</p>}
    >
      <ResidentFrame>{children}</ResidentFrame>
    </Suspense>
  );
}

async function ResidentFrame({ children }: { children: React.ReactNode }) {
  await requireRole("resident");
  return (
    <div className="min-h-dvh bg-mist text-ink">
      <main className="mx-auto flex w-full max-w-lg flex-col px-5 py-6 pb-28">
        {children}
      </main>
      <ResidentNav />
    </div>
  );
}
