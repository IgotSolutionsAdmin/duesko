import type { Result } from "./repository";

const MAX_LENGTH = 200;

/** Required legal name of the association. Blank and whitespace-only values fail. */
export function parseRegisteredName(input: string): Result<string> {
  const name = input.trim().replace(/\s+/g, " ");
  if (!name) {
    return { ok: false, message: "Registered name is required." };
  }
  if (name.length > MAX_LENGTH) {
    return { ok: false, message: "Registered name is too long." };
  }
  return { ok: true, value: name };
}
