import { Suspense } from "react";

export const metadata = { title: "Export" };

export default function ExportPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <Suspense fallback={<p className="text-sm text-ink/70">Opening export…</p>}>
      <ExportForm searchParams={searchParams} />
    </Suspense>
  );
}

async function ExportForm({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const error = (await searchParams).error;
  return (
    <div className="flex flex-col gap-4">
      <header>
        <p className="text-sm font-medium text-teal-deep">Export</p>
        <h1 className="mt-1 font-heading text-3xl font-semibold">Payments CSV</h1>
      </header>
      <p className="rounded-3xl bg-white p-5 text-sm leading-6 text-ink/70">
        Download units, charges, or payments for this association. Amounts are pesos converted
        from stored centavos. Each download is written to the export audit log.
      </p>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          That export could not be prepared.
        </p>
      ) : null}
      <form action="/admin/export/csv" method="get" className="flex flex-col gap-4 rounded-3xl bg-white p-5">
        <label htmlFor="kind" className="text-sm font-medium">
          What to download
        </label>
        <select
          id="kind"
          name="kind"
          defaultValue="payments"
          className="h-12 rounded-2xl border border-border bg-mist px-3 text-base"
        >
          <option value="units">Units</option>
          <option value="charges">Charges</option>
          <option value="payments">Payments</option>
        </select>
        <label htmlFor="month" className="text-sm font-medium">
          Month (optional)
        </label>
        <input
          id="month"
          name="month"
          type="month"
          className="h-12 rounded-2xl border border-border bg-mist px-3 text-base"
        />
        <label htmlFor="status" className="text-sm font-medium">
          Status (optional)
        </label>
        <select
          id="status"
          name="status"
          defaultValue=""
          className="h-12 rounded-2xl border border-border bg-mist px-3 text-base"
        >
          <option value="">Any status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
        </select>
        <button type="submit" className="h-12 rounded-2xl bg-teal text-base font-medium text-white">
          Download CSV
        </button>
      </form>
    </div>
  );
}
