import { dueskoReferenceFor } from "./duesko-reference";
import { roleLabel } from "./roles";
import type { Payment, Role } from "./types";

/** Draft from Legal. Pending Lance and Mae. Replace this file when they sign off. */
export const ACKNOWLEDGMENT_VERSION = "draft-1";

export const ACKNOWLEDGMENT_HEADER = "PAYMENT ACKNOWLEDGMENT";

export const ACKNOWLEDGMENT_FOOTER =
  "THIS IS NOT AN INVOICE. THIS DOCUMENT IS NOT VALID FOR CLAIM OF INPUT TAX.";

export const ACKNOWLEDGMENT_METHOD_CASH = "Cash received by officer";
export const ACKNOWLEDGMENT_METHOD_PROOF = "Online transfer, proof of payment reviewed";

export function acknowledgmentMethodLabel(payment: Pick<Payment, "proofPath">): string {
  return payment.proofPath ? ACKNOWLEDGMENT_METHOD_PROOF : ACKNOWLEDGMENT_METHOD_CASH;
}

export function formatAcknowledgmentAmount(centavos: number): string {
  const pesos = (centavos / 100).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `₱${pesos}`;
}

/** Avoid "Inc.." when a registered name already ends with a period. */
export function withTerminalPeriod(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

export function formatAcknowledgmentWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(date);
}

export function officerCredit(name: string, role: Role | null): string {
  if (!role) return name;
  return `${name}, ${roleLabel(role)}`;
}

export interface AcknowledgmentFields {
  hoaName: string;
  residentName: string;
  unitLabel: string;
  amount: string;
  periodOrDescription: string;
  method: string;
  officerLine: string;
  dateTime: string;
  dueskoReference: string;
}

export function acknowledgmentFields(input: {
  hoaName: string;
  residentName: string;
  unitLabel: string;
  payment: Payment;
  periodOrDescription: string;
  officerName: string;
  officerRole: Role | null;
}): AcknowledgmentFields {
  return {
    hoaName: input.hoaName,
    residentName: input.residentName,
    unitLabel: input.unitLabel,
    amount: formatAcknowledgmentAmount(input.payment.amountCentavos),
    periodOrDescription: input.periodOrDescription,
    method: acknowledgmentMethodLabel(input.payment),
    officerLine: officerCredit(input.officerName, input.officerRole),
    dateTime: formatAcknowledgmentWhen(input.payment.reviewedAt ?? input.payment.paidAt),
    dueskoReference: dueskoReferenceFor(input.payment),
  };
}

/** Exact Legal draft, ready for the page and for the forbidden-word scan. */
export function renderAcknowledgmentText(fields: AcknowledgmentFields): string {
  return [
    ACKNOWLEDGMENT_HEADER,
    `This is a system-generated record that ${fields.hoaName} has recorded the payment below from ${fields.residentName}, ${withTerminalPeriod(fields.unitLabel)}`,
    `Amount: ${fields.amount}`,
    `For: ${fields.periodOrDescription}`,
    `Payment method: ${fields.method}`,
    `Recorded by: ${fields.officerLine} on ${fields.dateTime}`,
    `Reference no.: ${fields.dueskoReference}`,
    `This acknowledgment is issued by ${withTerminalPeriod(fields.hoaName)} DuesKo only provides the recording software and does not receive or hold HOA funds. For questions about this payment, contact your HOA.`,
    ACKNOWLEDGMENT_FOOTER,
  ].join("\n");
}

export { forbiddenAcknowledgmentWords } from "./forbidden-words";
