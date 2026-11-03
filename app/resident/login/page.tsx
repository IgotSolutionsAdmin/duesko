import { Suspense } from "react";
import { PortalLogin } from "@/components/portal-login";

export const metadata = { title: "Resident sign in" };

export default function ResidentLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ auth?: string }>;
}) {
  return (
    <Suspense fallback={<p className="px-5 py-6 text-sm text-ink/70">Opening sign in…</p>}>
      <ResidentLogin searchParams={searchParams} />
    </Suspense>
  );
}

async function ResidentLogin({
  searchParams,
}: {
  searchParams: Promise<{ auth?: string }>;
}) {
  const { auth } = await searchParams;
  return <PortalLogin role="resident" errorCode={auth} />;
}
