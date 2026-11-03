import { STATUS_BADGE_COLORS, statusLabel } from "@/lib/payments";
import type { BadgeStatus } from "@/lib/types";

const tones: Record<BadgeStatus, string> = {
  pending: "text-ink",
  approved: "text-white",
  rejected: "text-white",
  unpaid: "text-ink",
  paid: "text-white",
  partial: "text-ink",
  sample: "text-ink border border-ink/20",
};

const fills: Record<BadgeStatus, string> = {
  pending: STATUS_BADGE_COLORS.pending,
  approved: STATUS_BADGE_COLORS.approved,
  rejected: STATUS_BADGE_COLORS.rejected,
  unpaid: STATUS_BADGE_COLORS.pending,
  paid: STATUS_BADGE_COLORS.approved,
  partial: "#D5E8E6",
  sample: STATUS_BADGE_COLORS.sampleBg,
};

export function StatusBadge({
  status,
}: {
  status: BadgeStatus;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${tones[status]}`}
      style={{ backgroundColor: fills[status], color: status === "sample" ? STATUS_BADGE_COLORS.sampleFg : undefined }}
      data-status={status}
    >
      {statusLabel(status)}
    </span>
  );
}

export function SampleBadge() {
  return <StatusBadge status="sample" />;
}
