import { Suspense } from "react";
import { redirect } from "next/navigation";

/** Old sign-in URL. Keeps the auth error on the officer login instead of the chooser. */
export default function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ auth?: string }>;
}) {
  return (
    <Suspense fallback={<p className="px-5 py-6 text-sm text-ink/70">Opening sign in…</p>}>
      <ForwardSignIn searchParams={searchParams} />
    </Suspense>
  );
}

async function ForwardSignIn({
  searchParams,
}: {
  searchParams: Promise<{ auth?: string }>;
}) {
  const { auth } = await searchParams;
  const allowed =
    auth === "missing" || auth === "invalid" || auth === "profile" || auth === "sent" || auth === "unsent";
  redirect(allowed ? `/admin/login?auth=${auth}` : "/admin/login");
  return null;
}
