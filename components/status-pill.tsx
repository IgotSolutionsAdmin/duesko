import { StatusBadge } from "@/components/status-badge";
import type { BadgeStatus } from "@/lib/types";

/** Shared status colors live on StatusBadge. */
export function StatusPill({
  status,
}: {
  status: BadgeStatus;
}) {
  return <StatusBadge status={status} />;
}
