import { parsePesoToCentavos } from "./money";
import type { Result } from "./repository";
import type { UnitDraft } from "./types";

/** Reads the add/edit unit form. Flat units store no floor area. */
export function parseUnitForm(formData: FormData): Result<UnitDraft> {
  const label = String(formData.get("label") ?? "")
    .trim()
    .replace(/\s+/g, " ");
  if (!label) return { ok: false, message: "Unit label is required." };
  if (label.length > 80) return { ok: false, message: "Unit label is too long." };

  const rateType = formData.get("rateType");
  if (rateType !== "flat" && rateType !== "per_sqm") {
    return { ok: false, message: "Choose a flat amount or a per-sqm rate." };
  }

  const rateCentavos = parsePesoToCentavos(String(formData.get("amount") ?? ""));
  if (rateCentavos === null) {
    return {
      ok: false,
      message: "Enter the amount in pesos, such as 1500.00.",
    };
  }

  if (rateType === "flat") {
    return {
      ok: true,
      value: { label, rateType, rateCentavos, areaSqm: null },
    };
  }

  const area = parseAreaSqm(String(formData.get("areaSqm") ?? ""));
  if (area === null) {
    return { ok: false, message: "Enter the floor area in square metres." };
  }

  return {
    ok: true,
    value: { label, rateType, rateCentavos, areaSqm: area },
  };
}

function parseAreaSqm(input: string): number | null {
  const trimmed = input.trim().replaceAll(",", "");
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  const area = Number(trimmed);
  if (!Number.isFinite(area) || area <= 0 || area > 100_000) return null;
  return area;
}
