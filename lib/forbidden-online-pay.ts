/** Phrases that must not appear in product UI, docs, or tests (MVP is manual payments only). */
export const FORBIDDEN_ONLINE_PAY_PHRASES = [
  "payment link",
  "payment gateway",
  "licensed payment gateway",
  "online checkout",
  "online payment gateway",
  "pay online",
  "paymongo",
  "gateway",
] as const;

const phrasePattern = (phrase: string) =>
  new RegExp(`\\b${phrase.replaceAll(" ", "\\s+")}\\b`, "i");

/** Returns matched banned phrases. "gateway" alone is banned; "Online transfer" is allowed. */
export function forbiddenOnlinePayPhrases(text: string): string[] {
  const found: string[] = [];
  for (const phrase of FORBIDDEN_ONLINE_PAY_PHRASES) {
    if (phrasePattern(phrase).test(text)) found.push(phrase);
  }
  return found;
}

export function onlinePayForbiddenRegex(): RegExp {
  const parts = FORBIDDEN_ONLINE_PAY_PHRASES.map((phrase) =>
    phrase.replaceAll(" ", "\\s+"),
  );
  return new RegExp(`\\b(?:${parts.join("|")})\\b`, "i");
}
