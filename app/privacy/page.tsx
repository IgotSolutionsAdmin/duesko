import Link from "next/link";
import type { Metadata } from "next";
import { DuesKoLogo } from "@/components/duesko-logo";
import { PRIVACY_NOTICE } from "@/lib/privacy-notice";

export const metadata: Metadata = {
  title: PRIVACY_NOTICE.title,
  description: PRIVACY_NOTICE.body,
};

export default function PrivacyPage() {
  return (
    <main className="min-h-dvh bg-mist text-ink">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between px-5">
          <Link href="/" aria-label="DuesKo home">
            <DuesKoLogo className="text-xl" />
          </Link>
          <Link href="/login" className="text-sm font-semibold text-teal-deep">
            Sign in
          </Link>
        </div>
      </header>
      <article className="mx-auto w-full max-w-3xl px-5 py-12">
        <h1 className="font-heading text-3xl font-semibold">{PRIVACY_NOTICE.title}</h1>
        <p className="mt-4 text-base leading-7 text-ink/70">{PRIVACY_NOTICE.body}</p>
      </article>
    </main>
  );
}
