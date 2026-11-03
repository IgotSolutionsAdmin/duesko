"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "./auth";
import { getRepository } from "./get-repository";
import { parseManualPayment, parseProofSubmission } from "./payments";

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function submitProof(formData: FormData) {
  const user = await requireRole("resident");
  const file = formData.get("proof");
  const bytes =
    file instanceof File ? new Uint8Array(await file.arrayBuffer()) : new Uint8Array();
  const parsed = parseProofSubmission({
    chargeId: String(formData.get("chargeId") ?? ""),
    amount: String(formData.get("amount") ?? ""),
    paidOn: String(formData.get("paidOn") ?? ""),
    method: String(formData.get("method") ?? ""),
    referenceNo: String(formData.get("referenceNo") ?? ""),
    bytes,
  });
  if (!parsed.ok) fail("/resident/payments", parsed.message);
  const result = await getRepository().submitProof(user.id, parsed.value);
  if (!result.ok) fail("/resident/payments", result.message);
  revalidatePath("/resident");
  revalidatePath("/resident/payments");
  revalidatePath("/admin/payments");
  redirect("/resident/payments");
}

export async function approveProof(formData: FormData) {
  const user = await requireRole("admin_treasurer");
  const paymentId = String(formData.get("paymentId") ?? "");
  const result = await getRepository().approvePayment(user.id, paymentId);
  if (!result.ok) fail("/admin/payments", result.message);
  revalidatePath("/admin");
  revalidatePath("/admin/payments");
  revalidatePath("/resident");
  redirect("/admin/payments");
}

export async function rejectProof(formData: FormData) {
  const user = await requireRole("admin_treasurer");
  const paymentId = String(formData.get("paymentId") ?? "");
  const reason = String(formData.get("reason") ?? "");
  const result = await getRepository().rejectPayment(user.id, paymentId, reason);
  if (!result.ok) fail("/admin/payments", result.message);
  revalidatePath("/admin/payments");
  revalidatePath("/resident");
  redirect("/admin/payments");
}

export async function recordCashPayment(formData: FormData) {
  const user = await requireRole("admin_treasurer");
  const parsed = parseManualPayment({
    chargeId: String(formData.get("chargeId") ?? ""),
    amount: String(formData.get("amount") ?? ""),
    paidOn: String(formData.get("paidOn") ?? ""),
    method: String(formData.get("method") ?? "cash"),
    hoaReferenceNo: String(formData.get("hoaReferenceNo") ?? ""),
    note: String(formData.get("note") ?? ""),
  });
  if (!parsed.ok) fail("/admin/payments/cash", parsed.message);
  const result = await getRepository().recordManualPayment(user.id, parsed.value);
  if (!result.ok) fail("/admin/payments/cash", result.message);
  revalidatePath("/admin");
  revalidatePath("/admin/payments");
  revalidatePath("/resident");
  const next = formData.get("next");
  if (next === "acknowledgment") {
    redirect(`/admin/acknowledgments?payment=${result.value.id}`);
  }
  redirect("/admin/payments");
}
