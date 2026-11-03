import { csvDocument } from "./csv";
import { dueskoReferenceFor } from "./duesko-reference";
import { centavosToPesoInput } from "./money";
import { methodLabel } from "./payments";
import type { AppUser, Charge, Payment, PaymentStatus, Unit } from "./types";

export type ExportKind = "units" | "charges" | "payments";

export interface ExportFilters {
  month: string | null;
  status: PaymentStatus | Charge["status"] | null;
}

export function parseExportKind(value: string | null | undefined): ExportKind | null {
  if (value === "units" || value === "charges" || value === "payments") return value;
  return null;
}

export function parseExportMonth(value: string | null | undefined): string | null {
  if (!value) return null;
  return /^\d{4}-\d{2}$/.test(value) ? value : null;
}

export function parseExportStatus(value: string | null | undefined): ExportFilters["status"] {
  if (
    value === "pending" ||
    value === "approved" ||
    value === "rejected" ||
    value === "paid" ||
    value === "unpaid"
  ) {
    return value;
  }
  return null;
}

export function pesosFromCentavos(centavos: number): string {
  return centavosToPesoInput(centavos);
}

export function filterCharges(charges: Charge[], filters: ExportFilters): Charge[] {
  return charges.filter((charge) => {
    if (filters.month && charge.period !== filters.month && !charge.dueDate.startsWith(filters.month)) {
      return false;
    }
    if (filters.status === "paid" || filters.status === "unpaid") {
      return charge.status === filters.status;
    }
    return true;
  });
}

export function filterPayments(payments: Payment[], filters: ExportFilters): Payment[] {
  return payments.filter((payment) => {
    if (filters.month && !payment.paidAt.startsWith(filters.month)) return false;
    if (
      filters.status === "pending" ||
      filters.status === "approved" ||
      filters.status === "rejected"
    ) {
      return payment.status === filters.status;
    }
    return true;
  });
}

export function unitsCsv(units: Unit[]): string {
  return csvDocument(
    ["unit_label", "rate_type", "rate_pesos", "area_sqm", "monthly_pesos"],
    units.map((unit) => {
      const monthly =
        unit.rateType === "flat"
          ? unit.rateCentavos
          : Math.round(unit.rateCentavos * (unit.areaSqm ?? 0));
      return [
        unit.label,
        unit.rateType,
        pesosFromCentavos(unit.rateCentavos),
        unit.areaSqm,
        pesosFromCentavos(monthly),
      ];
    }),
  );
}

export function chargesCsv(charges: Charge[], units: Unit[], filters: ExportFilters): string {
  const labels = new Map(units.map((unit) => [unit.id, unit.label]));
  return csvDocument(
    ["unit_label", "kind", "description", "period", "amount_pesos", "due_date", "status"],
    filterCharges(charges, filters).map((charge) => [
      labels.get(charge.unitId) ?? "",
      charge.kind,
      charge.description,
      charge.period,
      pesosFromCentavos(charge.amountCentavos),
      charge.dueDate,
      charge.status,
    ]),
  );
}

export function paymentsCsv(
  payments: Payment[],
  charges: Charge[],
  units: Unit[],
  people: AppUser[],
  filters: ExportFilters,
): string {
  const labels = new Map(units.map((unit) => [unit.id, unit.label]));
  const descriptions = new Map(charges.map((charge) => [charge.id, charge.description]));
  const names = new Map(people.map((person) => [person.id, person.fullName]));
  return csvDocument(
    [
      "unit_label",
      "charge",
      "proof_status",
      "amount_pesos",
      "date",
      "method",
      "reference_number",
      "duesko_reference",
      "approver",
      "rejection_reason",
    ],
    filterPayments(payments, filters).map((payment) => [
      labels.get(payment.unitId) ?? "",
      descriptions.get(payment.chargeId) ?? "",
      payment.status,
      pesosFromCentavos(payment.amountCentavos),
      payment.paidAt.slice(0, 10),
      methodLabel(payment.method),
      payment.referenceNo ?? payment.hoaReferenceNo,
      dueskoReferenceFor(payment),
      payment.reviewedBy ? (names.get(payment.reviewedBy) ?? payment.reviewedBy) : "",
      payment.rejectionReason,
    ]),
  );
}

export function exportFileName(kind: ExportKind, filters: ExportFilters): string {
  const parts = ["duesko", kind];
  if (filters.month) parts.push(filters.month);
  if (filters.status) parts.push(filters.status);
  return `${parts.join("-")}.csv`;
}
