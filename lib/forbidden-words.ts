const ACKNOWLEDGMENT_PHRASES = [
  "official receipt",
  "bir",
  "cas",
  "accredited",
  "registered",
] as const;

import { FORBIDDEN_ONLINE_PAY_PHRASES } from "./forbidden-online-pay";

const MARKETING_PHRASES = FORBIDDEN_ONLINE_PAY_PHRASES;

function matchesPhrase(text: string, phrase: string): boolean {
  const pattern = new RegExp(`\\b${phrase.replaceAll(" ", "\\s+")}\\b`, "i");
  return pattern.test(text);
}

function standaloneOr(text: string): boolean {
  return /(?<![A-Za-z])OR(?![A-Za-z])/.test(text);
}

/** Words Legal asked us never to print on acknowledgments. OR is the abbreviation. */
export function forbiddenAcknowledgmentWords(text: string): string[] {
  const found: string[] = ACKNOWLEDGMENT_PHRASES.filter((phrase) => matchesPhrase(text, phrase));
  if (standaloneOr(text)) found.push("OR");
  return found;
}

/** Landing and privacy pages also ban payment-product wording. */
export function forbiddenMarketingWords(text: string): string[] {
  const found: string[] = [...ACKNOWLEDGMENT_PHRASES, ...MARKETING_PHRASES].filter((phrase) =>
    matchesPhrase(text, phrase),
  );
  if (standaloneOr(text)) found.push("OR");
  return found;
}
