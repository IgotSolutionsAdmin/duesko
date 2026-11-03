const TTL_MS = 60_000;

type Entry = { bytes: Uint8Array; contentType: string; expiresAt: number };

const globalTokens = globalThis as typeof globalThis & {
  __dueskoProofTokens?: Map<string, Entry>;
};

function tokens(): Map<string, Entry> {
  globalTokens.__dueskoProofTokens ??= new Map();
  return globalTokens.__dueskoProofTokens;
}

/** Short-lived stand-in for a Supabase signed URL. */
export function issueProofToken(bytes: Uint8Array, contentType: string): string {
  const token = crypto.randomUUID();
  tokens().set(token, { bytes, contentType, expiresAt: Date.now() + TTL_MS });
  return token;
}

export function readProofToken(
  token: string,
): { bytes: Uint8Array; contentType: string } | null {
  const entry = tokens().get(token);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    tokens().delete(token);
    return null;
  }
  return { bytes: entry.bytes, contentType: entry.contentType };
}

export function resetProofTokens(): void {
  globalTokens.__dueskoProofTokens = new Map();
}
