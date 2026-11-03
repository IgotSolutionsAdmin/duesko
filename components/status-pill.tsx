import { statusLabel } from "@/lib/payments";
import type { PaymentStatus } from "@/lib/types";

export function StatusPill({
  status,
}: {
  status: PaymentStatus | "paid" | "unpaid" | "partial";
}) {
  const tone =
    status === "paid" || status === "approved"
      ? "bg-teal/15 text-teal-deep"
      : status === "unpaid" || status === "pending"
        ? "bg-mango/35 text-ink"
        : status === "rejected"
          ? "bg-destructive/10 text-destructive"
          : "bg-ink/10 text-ink/70";
  const dot =
    status === "paid" || status === "approved"
      ? "bg-teal"
      : status === "unpaid" || status === "pending"
        ? "bg-mango"
        : status === "rejected"
          ? "bg-destructive"
          : "bg-ink/40";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>
      <span className={`size-2 rounded-full ${dot}`} aria-hidden />
      {statusLabel(status)}
    </span>
  );
}
