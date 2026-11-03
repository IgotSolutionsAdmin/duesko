import type { Result } from "./repository";

export const DEFAULT_HOW_TO_PAY =
  "DuesKo does not process payments. Pay your HOA through its usual channels, then upload your proof here.";

const MAX_LENGTH = 2000;

/** Officer-edited payment instructions. Blank values fail. */
export function parseHowToPay(input: string): Result<string> {
  const text = input.trim().replace(/\s+/g, " ");
  if (!text) {
    return { ok: false, message: "How to pay is required." };
  }
  if (text.length > MAX_LENGTH) {
    return { ok: false, message: "How to pay is too long." };
  }
  return { ok: true, value: text };
}

export function howToPayOrDefault(value: string | null | undefined): string {
  const text = value?.trim();
  return text ? text : DEFAULT_HOW_TO_PAY;
}
