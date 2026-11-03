/** Stable DuesKo reference when a payment has not stored one yet. */
export function dueskoReferenceFor(payment: { id: string; dueskoReference?: string | null }): string {
  if (payment.dueskoReference) return payment.dueskoReference;
  return `DK-${payment.id.replaceAll("-", "").slice(0, 16).toUpperCase()}`;
}

export function createDueskoReference(): string {
  return `DK-${crypto.randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase()}`;
}
