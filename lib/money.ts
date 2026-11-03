import type { Unit } from "./types";

const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

/** "2026-12-15" or an ISO timestamp becomes "Dec 15". */
export function formatShortDay(iso: string): string {
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return iso;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

/** Format integer centavos as Philippine pesos. ₱1.00 is 100 centavos. */
export function formatCentavos(centavos: number): string {
  return peso.format(centavos / 100);
}

/** Monthly dues for a unit, in centavos. Per-sqm rates round to the nearest centavo. */
export function monthlyDuesCentavos(
  unit: Pick<Unit, "rateType" | "rateCentavos" | "areaSqm">,
): number {
  if (unit.rateType === "flat") {
    return unit.rateCentavos;
  }
  return Math.round(unit.rateCentavos * (unit.areaSqm ?? 0));
}

/** One line a resident or treasurer can read. Amounts are Philippine pesos. */
export function describeMonthlyDues(
  unit: Pick<Unit, "rateType" | "rateCentavos" | "areaSqm">,
): string {
  const monthly = formatCentavos(monthlyDuesCentavos(unit));
  if (unit.rateType === "flat") {
    return `Flat rate · ${monthly} a month`;
  }
  const area = unit.areaSqm ?? 0;
  return `${formatCentavos(unit.rateCentavos)} per sqm × ${area} sqm · ${monthly} a month`;
}

/** Parses a peso amount such as "1500", "1,500.50", or "₱35.00" into centavos. */
export function parsePesoToCentavos(input: string): number | null {
  const trimmed = input.trim().replaceAll("₱", "").replaceAll(",", "").replaceAll(" ", "");
  if (!/^\d+(\.\d{0,2})?$/.test(trimmed) || trimmed === ".") return null;
  const [whole, frac = ""] = trimmed.split(".");
  if (whole.length > 12) return null;
  const centavos = Number(whole) * 100 + Number(frac.padEnd(2, "0"));
  if (!Number.isSafeInteger(centavos)) return null;
  return centavos;
}

/** Renders stored centavos as a peso input value, for example "1500.00". */
export function centavosToPesoInput(centavos: number): string {
  const sign = centavos < 0 ? "-" : "";
  const abs = Math.abs(centavos);
  const pesos = Math.trunc(abs / 100);
  const cents = abs % 100;
  return `${sign}${pesos}.${String(cents).padStart(2, "0")}`;
}
