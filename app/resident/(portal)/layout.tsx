import { Suspense } from "react";
import { ContentToolbar } from "@/components/content-toolbar";
import { ResidentNav } from "@/components/resident-nav";
import { requireRole } from "@/lib/auth";
import { getRepository } from "@/lib/get-repository";

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
  const user = await requireRole("resident");
  const hoa = await getRepository().getHoa(user.id);
  return (
    <div className="min-h-dvh bg-white text-ink lg:flex">
      <ResidentNav userName={user.fullName} userEmail={user.email} hoaName={hoa?.registeredName} />
      <main className="portal-main mx-auto flex min-h-dvh w-full max-w-lg flex-1 flex-col px-5 pt-5 lg:min-h-0 lg:max-w-none lg:px-8 lg:pt-6">
        <ContentToolbar portal="resident" />
        {children}
        <div data-testid="page-end" aria-hidden className="h-px w-full shrink-0" />
      </main>
    </div>
  );
}
