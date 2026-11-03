const nameErrors: Record<string, string> = {
  required: "Registered name is required.",
  long: "Registered name is too long.",
};

const unitErrors: Record<string, string> = {
  label: "Unit label is required.",
  long: "Unit label is too long.",
  amount: "Enter the amount in pesos, such as 1500.00.",
  area: "Enter the floor area in square metres.",
  rate: "Choose a flat amount or a per-sqm rate.",
  duplicate: "A unit with that label already exists.",
  missing: "That unit was not found.",
};

export function nameErrorCode(message: string): string {
  return message === "Registered name is too long." ? "long" : "required";
}

export function unitErrorCode(message: string): string {
  switch (message) {
    case "Unit label is required.":
      return "label";
    case "Unit label is too long.":
      return "long";
    case "Enter the amount in pesos, such as 1500.00.":
      return "amount";
    case "Enter the floor area in square metres.":
      return "area";
    case "Choose a flat amount or a per-sqm rate.":
      return "rate";
    case "A unit with that label already exists.":
      return "duplicate";
    case "That unit was not found.":
      return "missing";
    default:
      return "label";
  }
}

export function nameErrorMessage(code: string | undefined): string | null {
  if (!code) return null;
  return nameErrors[code] ?? null;
}

export function unitErrorMessage(code: string | undefined): string | null {
  if (!code) return null;
  return unitErrors[code] ?? null;
}

const chargeErrors: Record<string, string> = {
  period: "Choose a month.",
  due: "Choose a due date.",
  description: "Description is required.",
  long: "Description is too long.",
  amount: "Enter the amount in pesos, such as 500.00.",
  units: "Choose at least one unit.",
  scope: "Choose all units or selected units.",
  exists: "Monthly dues for that period already exist.",
  foreign: "Choose a unit in this association.",
  save: "Could not save the charges.",
};

export function chargeErrorCode(message: string): string {
  switch (message) {
    case "Choose a month.":
      return "period";
    case "Choose a due date.":
      return "due";
    case "Description is required.":
      return "description";
    case "Description is too long.":
      return "long";
    case "Enter the amount in pesos, such as 500.00.":
      return "amount";
    case "Choose at least one unit.":
      return "units";
    case "Choose all units or selected units.":
      return "scope";
    case "Monthly dues for that period already exist.":
      return "exists";
    case "Choose a unit in this association.":
      return "foreign";
    default:
      return "save";
  }
}

export function chargeErrorMessage(code: string | undefined): string | null {
  if (!code) return null;
  return chargeErrors[code] ?? null;
}
