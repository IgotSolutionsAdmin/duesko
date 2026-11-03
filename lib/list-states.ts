export const LIST_COPY = {
  unitsEmpty: "No units yet.",
  chargesEmpty: "No charges yet.",
  paymentsEmpty: "No payments yet.",
  proofsEmpty: "No proofs are waiting.",
  duesEmpty: "No dues on this account yet.",
  acknowledgmentsEmpty: "No approved payments yet.",
  loadError: "This list could not be loaded.",
} as const;

export type ListViewState = "loading" | "empty" | "error" | "ready";

export function listViewState(input: {
  loading?: boolean;
  error?: string | null;
  count: number;
}): ListViewState {
  if (input.loading) return "loading";
  if (input.error) return "error";
  if (input.count === 0) return "empty";
  return "ready";
}
