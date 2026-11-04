import Link from "next/link";
import { DuesKoLogo } from "@/components/duesko-logo";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center gap-6 bg-mist px-5 py-10 text-ink">
      <Link href="/" aria-label="DuesKo home">
        <DuesKoLogo className="text-3xl" />
      </Link>
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Choose a portal</h1>
        <p className="mt-2 text-base leading-7 text-ink/70">
          Officers and residents sign in separately. Each person only sees their own portal.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <Link
          href="/admin/login"
          className="flex h-14 items-center justify-center rounded-2xl bg-teal-deep text-base font-semibold text-white"
        >
          Officer sign in
        </Link>
        <Link
          href="/resident/login"
          className="flex h-14 items-center justify-center rounded-2xl border border-teal-deep text-base font-semibold text-teal-deep"
        >
          Resident sign in
        </Link>
      </div>
    </main>
  );
}
