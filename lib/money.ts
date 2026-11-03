import type { Unit } from "./types";

const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

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
