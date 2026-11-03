import { monthlyDuesCentavos } from "./money";
import type { Result } from "./repository";
import type { Unit } from "./types";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** "2026-12" becomes "December 2026 dues". */
export function duesDescription(period: string): string {
  const [year, month] = period.split("-");
  return `${MONTHS[Number(month) - 1]} ${year} dues`;
}

export function parsePeriod(input: string): Result<string> {
  const period = input.trim();
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) {
    return { ok: false, message: "Choose a month." };
  }
  return { ok: true, value: period };
}

export function parseDueDate(input: string): Result<string> {
  const dueDate = input.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dueDate);
  if (!match) return { ok: false, message: "Choose a due date." };
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return { ok: false, message: "Choose a due date." };
  }
  return { ok: true, value: dueDate };
}

export function monthlyAmountCentavos(unit: Unit): number {
  return monthlyDuesCentavos(unit);
}
