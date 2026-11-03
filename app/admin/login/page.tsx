import { Suspense } from "react";
import { PortalLogin } from "@/components/portal-login";

export const metadata = { title: "Officer sign in" };

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ auth?: string }>;
}) {
  return (
    <Suspense fallback={<p className="px-5 py-6 text-sm text-ink/70">Opening sign in…</p>}>
      <AdminLogin searchParams={searchParams} />
    </Suspense>
  );
}

async function AdminLogin({ searchParams }: { searchParams: Promise<{ auth?: string }> }) {
  const { auth } = await searchParams;
  return <PortalLogin role="admin_treasurer" errorCode={auth} />;
}
