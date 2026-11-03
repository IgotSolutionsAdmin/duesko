import { acknowledgmentFields, type AcknowledgmentFields } from "./acknowledgment-copy";
import type { DuesRepository } from "./repository";
import type { Payment } from "./types";

export async function loadAcknowledgment(
  repository: DuesRepository,
  userId: string,
  paymentId: string,
): Promise<{ payment: Payment; fields: AcknowledgmentFields } | null> {
  const [hoa, payments, charges, units, people] = await Promise.all([
    repository.getHoa(userId),
    repository.listPayments(userId),
    repository.listCharges(userId),
    repository.listUnits(userId),
    repository.listUsers(userId),
  ]);
  const payment = payments.find((row) => row.id === paymentId && row.status === "approved");
  if (!payment) return null;
  const charge = charges.find((row) => row.id === payment.chargeId);
  const unit = units.find((row) => row.id === payment.unitId);
  const resident = people.find((row) => row.unitId === payment.unitId && row.role === "resident");
  const officer = people.find((row) => row.id === (payment.reviewedBy ?? payment.recordedBy));
  return {
    payment,
    fields: acknowledgmentFields({
      hoaName: hoa?.registeredName ?? "Association",
      residentName: resident?.fullName ?? "Resident",
      unitLabel: unit?.label ?? "Unit",
      payment,
      periodOrDescription: charge?.description ?? "Charge",
      officerName: officer?.fullName ?? "Officer",
      officerRole: officer?.role ?? "admin_treasurer",
    }),
  };
}
