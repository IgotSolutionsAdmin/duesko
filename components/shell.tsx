export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-mist text-ink md:grid md:grid-cols-[minmax(16rem,22rem)_minmax(0,1fr)]">
      <header className="bg-teal-deep px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-6 text-white md:flex md:min-h-dvh md:flex-col md:justify-between md:px-8 md:py-10">
        <div>
          <p className="flex items-center gap-2">
            <span className="size-3 rounded-full bg-mango" aria-hidden />
            <span className="font-heading text-2xl font-semibold tracking-tight">
              DuesKo
            </span>
          </p>
          <p className="mt-3 max-w-xs text-sm leading-6 text-white/80">
            HOA dues for Philippine associations. Residents see their own unit.
            The admin treasurer sees every unit and who has paid.
          </p>
        </div>
        <p className="mt-6 text-xs tracking-wide text-white/60 md:mt-0">
          Day 1 skeleton · demo data
        </p>
      </header>
      <main className="px-5 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:px-10 md:py-10">
        <div className="mx-auto flex w-full max-w-lg flex-col">{children}</div>
      </main>
    </div>
  );
}
