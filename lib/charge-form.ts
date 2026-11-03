import { parseDueDate, parsePeriod } from "./charges";
import { parsePesoToCentavos } from "./money";
import type { Result } from "./repository";

export interface MonthlyForm {
  period: string;
  dueDate: string;
  description: string;
}

export type SpecialForm =
  | {
      description: string;
      amountCentavos: number;
      dueDate: string;
      scope: "all";
    }
  | {
      description: string;
      amountCentavos: number;
      dueDate: string;
      scope: "selected";
      unitIds: string[];
    };

export function parseMonthlyForm(formData: FormData): Result<MonthlyForm> {
  const period = parsePeriod(String(formData.get("period") ?? ""));
  if (!period.ok) return period;
  const dueDate = parseDueDate(String(formData.get("dueDate") ?? ""));
  if (!dueDate.ok) return dueDate;
  const description = String(formData.get("description") ?? "")
    .trim()
    .replace(/\s+/g, " ");
  if (description.length > 200) {
    return { ok: false, message: "Description is too long." };
  }
  return {
    ok: true,
    value: { period: period.value, dueDate: dueDate.value, description },
  };
}

export function parseSpecialForm(formData: FormData): Result<SpecialForm> {
  const description = String(formData.get("description") ?? "")
    .trim()
    .replace(/\s+/g, " ");
  if (!description) return { ok: false, message: "Description is required." };
  if (description.length > 200) {
    return { ok: false, message: "Description is too long." };
  }
  const amountCentavos = parsePesoToCentavos(String(formData.get("amount") ?? ""));
  if (amountCentavos === null || amountCentavos <= 0) {
    return {
      ok: false,
      message: "Enter the amount in pesos, such as 500.00.",
    };
  }
  const dueDate = parseDueDate(String(formData.get("dueDate") ?? ""));
  if (!dueDate.ok) return dueDate;

  const scope = formData.get("scope");
  if (scope === "all") {
    return {
      ok: true,
      value: {
        description,
        amountCentavos,
        dueDate: dueDate.value,
        scope: "all",
      },
    };
  }
  if (scope !== "selected") {
    return { ok: false, message: "Choose all units or selected units." };
  }
  const unitIds = formData
    .getAll("unitId")
    .filter((value): value is string => typeof value === "string" && value.length > 0);
  if (unitIds.length === 0) {
    return { ok: false, message: "Choose at least one unit." };
  }
  return {
    ok: true,
    value: {
      description,
      amountCentavos,
      dueDate: dueDate.value,
      scope: "selected",
      unitIds,
    },
  };
}
