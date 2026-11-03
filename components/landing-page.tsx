import Link from "next/link";
import { DuesKoLogo } from "@/components/duesko-logo";
import { WaitlistForm } from "@/components/waitlist-form";
import {
  LANDING_FAQ,
  LANDING_FEATURES,
  LANDING_HERO,
  LANDING_HOW,
  LANDING_PROBLEM,
  LANDING_WAITLIST,
} from "@/lib/landing-copy";
import { isWaitlistOpen } from "@/lib/waitlist";

const sectionClass = "mx-auto w-full max-w-5xl px-5";
const h2Class = "font-heading text-3xl font-semibold tracking-tight text-ink sm:text-4xl";

export function LandingPage() {
  const waitlistOpen = isWaitlistOpen();

  return (
    <div className="bg-mist text-ink">
      <header className="sticky top-0 z-20 border-b border-border bg-white/95">
        <div className={`${sectionClass} flex h-16 items-center justify-between gap-4`}>
          <Link href="/" aria-label="DuesKo home">
            <DuesKoLogo className="text-xl" />
          </Link>
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-teal-deep px-4 text-sm font-semibold text-teal-deep"
          >
            Sign in
          </Link>
        </div>
      </header>

      <main>
        <section className="border-b border-border bg-mist">
          <div className={`${sectionClass} flex flex-col gap-6 py-12 sm:py-16 lg:py-24`}>
            <h1 className="max-w-4xl font-heading text-4xl font-semibold tracking-tight text-ink sm:text-5xl lg:text-6xl">
              {LANDING_HERO.h1}
            </h1>
            <p className="max-w-3xl text-base leading-7 text-ink/70 sm:text-lg">{LANDING_HERO.subheadline}</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href="#waitlist"
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-teal-deep px-5 text-base font-semibold text-white"
              >
                {LANDING_HERO.primaryCta}
              </a>
              <a
                href="#how"
                className="inline-flex h-12 items-center justify-center rounded-2xl border border-teal-deep px-5 text-base font-semibold text-teal-deep"
              >
                {LANDING_HERO.secondaryCta}
              </a>
            </div>
          </div>
        </section>

        <section id="problem" className="scroll-mt-20 bg-white py-14 sm:py-20">
          <div className={`${sectionClass} flex flex-col gap-8`}>
            <div className="max-w-3xl">
              <h2 className={h2Class}>{LANDING_PROBLEM.heading}</h2>
              <p className="mt-4 text-base leading-7 text-ink/70">{LANDING_PROBLEM.intro}</p>
            </div>
            <ul className="grid gap-4 md:grid-cols-2">
              {LANDING_PROBLEM.cards.map((card) => (
                <li key={card.title} className="rounded-3xl bg-mist p-5">
                  <h3 className="font-heading text-lg font-semibold">{card.title}</h3>
                  <p className="mt-2 text-base leading-7 text-ink/70">{card.body}</p>
                </li>
              ))}
            </ul>
            <p className="max-w-3xl text-base leading-7 text-ink">{LANDING_PROBLEM.closing}</p>
          </div>
        </section>

        <section id="how" className="scroll-mt-20 bg-mist py-14 sm:py-20">
          <div className={`${sectionClass} flex flex-col gap-8`}>
            <h2 className={h2Class}>{LANDING_HOW.heading}</h2>
            <ol className="grid gap-4 lg:grid-cols-3">
              {LANDING_HOW.steps.map((step, index) => (
                <li key={step.title} className="rounded-3xl bg-white p-5">
                  <p className="font-heading text-sm font-semibold text-teal-light">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-3 font-heading text-xl font-semibold">{step.title}</h3>
                  <p className="mt-2 text-base leading-7 text-ink/70">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="features" className="scroll-mt-20 bg-white py-14 sm:py-20">
          <div className={`${sectionClass} flex flex-col gap-8`}>
            <h2 className={h2Class}>{LANDING_FEATURES.heading}</h2>
            <ul className="grid gap-4 sm:grid-cols-2">
              {LANDING_FEATURES.items.map((item) => (
                <li key={item.title} className="border-t border-border pt-4">
                  <h3 className="font-heading text-lg font-semibold">{item.title}</h3>
                  <p className="mt-1 text-base leading-7 text-ink/70">{item.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="faq" className="scroll-mt-20 bg-mist py-14 sm:py-20">
          <div className={`${sectionClass} flex flex-col gap-6`}>
            <h2 className={h2Class}>{LANDING_FAQ.heading}</h2>
            <div className="flex flex-col gap-2">
              {LANDING_FAQ.items.map((item) => (
                <details key={item.question} className="group rounded-3xl bg-white px-5 py-2">
                  <summary className="cursor-pointer list-none py-3 font-heading text-base font-semibold">
                    {item.question}
                  </summary>
                  <p className="pb-4 text-base leading-7 text-ink/70">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section id="waitlist" className="scroll-mt-20 bg-white py-14 sm:py-20">
          <div className={`${sectionClass} grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)]`}>
            <div>
              <h2 className={h2Class}>{LANDING_WAITLIST.heading}</h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-ink/70">{LANDING_WAITLIST.body}</p>
            </div>
            <WaitlistForm open={waitlistOpen} />
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-teal-deep py-10 text-white">
        <div className={`${sectionClass} flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`}>
          <DuesKoLogo className="text-white" markClassName="brightness-110" />
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <Link href="/privacy" className="underline-offset-2 hover:underline">
              Privacy Notice
            </Link>
            <Link href="/login" className="underline-offset-2 hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
