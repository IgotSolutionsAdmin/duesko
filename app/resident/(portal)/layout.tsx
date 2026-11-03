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
    <div className="min-h-dvh bg-mist text-ink lg:flex">
      <ResidentNav />
      <main className="portal-main mx-auto flex w-full max-w-lg flex-col px-5 pt-6 lg:max-w-none lg:flex-1 lg:px-10 lg:pt-8">
        {children}
        <div data-testid="page-end" aria-hidden className="h-px w-full shrink-0" />
      </main>
    </div>
  );
}
