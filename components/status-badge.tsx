import { STATUS_BADGE_COLORS, statusLabel } from "@/lib/payments";
import type { BadgeStatus } from "@/lib/types";

const tones: Record<BadgeStatus, string> = {
  pending: "bg-[#FFF1DA] text-[#8A5A00]",
  approved: "bg-[#E3F6EC] text-[#17663F]",
  rejected: "bg-[#FDE8E6] text-[#B42318]",
  unpaid: "bg-[#FFF1DA] text-[#8A5A00]",
  paid: "bg-[#E3F6EC] text-[#17663F]",
  partial: "bg-[#E0F5F2] text-[#0A5C5B]",
  sample: "text-ink border border-ink/20",
};

const fills: Record<BadgeStatus, string | undefined> = {
  pending: undefined,
  approved: undefined,
  rejected: undefined,
  unpaid: undefined,
  paid: undefined,
  partial: undefined,
  sample: STATUS_BADGE_COLORS.sampleBg,
};

export function StatusBadge({
  status,
}: {
  status: BadgeStatus;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${tones[status]}`}
      style={{
        backgroundColor: fills[status],
        color: status === "sample" ? STATUS_BADGE_COLORS.sampleFg : undefined,
      }}
      data-status={status}
    >
      {statusLabel(status)}
    </span>
  );
}

export function SampleBadge() {
  return <StatusBadge status="sample" />;
}

/** Status first, Sample immediately after, on one line. */
export function StatusWithSample({
  status,
  sample,
}: {
  status: BadgeStatus;
  sample: boolean;
}) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <StatusBadge status={status} />
      {sample ? <SampleBadge /> : null}
    </span>
  );
}
