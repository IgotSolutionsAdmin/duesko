import { Suspense } from "react";
import { ListError, ListSkeleton } from "@/components/list-state";
import { requireRole } from "@/lib/auth";
import { exportMonthOptions, formatExportMonthLabel } from "@/lib/export-months";
import { getRepository } from "@/lib/get-repository";

export const metadata = { title: "Export" };

export default function ExportPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <Suspense fallback={<ListSkeleton label="Loading export" />}>
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
  const user = await requireRole("admin_treasurer");
  const repository = getRepository();
  const [charges, payments] = await Promise.all([
    repository.listCharges(user.id),
    repository.listPayments(user.id),
  ]);
  const months = exportMonthOptions(charges, payments);

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
      {error ? <ListError message="That export could not be prepared." /> : null}
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
        <select
          id="month"
          name="month"
          defaultValue=""
          aria-label="Month (optional)"
          className="h-12 rounded-2xl border border-border bg-mist px-3 text-base"
        >
          <option value="">All months</option>
          {months.map((month) => (
            <option key={month} value={month}>
              {formatExportMonthLabel(month)}
            </option>
          ))}
        </select>
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
          <option value="approved">Paid</option>
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
