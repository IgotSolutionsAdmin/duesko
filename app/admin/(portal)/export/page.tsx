export const metadata = { title: "Export" };

export default function ExportPage() {
  return (
    <div className="flex flex-col gap-4">
      <header>
        <p className="text-sm font-medium text-teal-deep">Export</p>
        <h1 className="mt-1 font-heading text-3xl font-semibold">Payments CSV</h1>
      </header>
      <p className="rounded-3xl bg-white p-5 text-sm leading-6 text-ink/70">
        A download of payments and balances will be added later. Nothing is exported from this screen yet.
      </p>
      <button type="button" disabled className="h-12 rounded-2xl bg-teal-deep/40 text-base font-medium text-white">
        Download CSV
      </button>
    </div>
  );
}
