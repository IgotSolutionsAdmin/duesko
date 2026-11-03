import type { Charge, Payment } from "./types";

/** Distinct YYYY-MM values from charge periods, due dates, and payment dates. */
export function exportMonthOptions(charges: Charge[], payments: Payment[]): string[] {
  const months = new Set<string>();
  for (const charge of charges) {
    if (charge.period) months.add(charge.period);
    months.add(charge.dueDate.slice(0, 7));
  }
  for (const payment of payments) {
    months.add(payment.paidAt.slice(0, 7));
  }
  return [...months].sort((a, b) => b.localeCompare(a));
}

export function formatExportMonthLabel(month: string): string {
  const [year, monthNum] = month.split("-").map(Number);
  if (!year || !monthNum) return month;
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, monthNum - 1, 1)));
}
