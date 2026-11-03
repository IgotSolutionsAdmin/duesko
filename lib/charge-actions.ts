"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "./auth";
import { parseMonthlyForm, parseSpecialForm } from "./charge-form";
import { chargeErrorCode } from "./form-messages";
import { getRepository } from "./get-repository";

function fail(kind: "dues" | "special", message: string): never {
  const key = kind === "dues" ? "dues" : "special";
  redirect(`/admin/charges?${key}=${chargeErrorCode(message)}`);
}

export async function createMonthlyDues(formData: FormData) {
  const user = await requireRole("admin_treasurer");
  const parsed = parseMonthlyForm(formData);
  if (!parsed.ok) fail("dues", parsed.message);

  const result = await getRepository().createMonthlyDues(user.id, parsed.value);
  if (!result.ok) fail("dues", result.message);

  revalidatePath("/admin/charges");
  revalidatePath("/resident");
  redirect("/admin/charges");
}

export async function createSpecialAssessment(formData: FormData) {
  const user = await requireRole("admin_treasurer");
  const parsed = parseSpecialForm(formData);
  if (!parsed.ok) fail("special", parsed.message);

  const repository = getRepository();
  const units = await repository.listUnits(user.id);
  const unitIds =
    parsed.value.scope === "all"
      ? units.map((unit) => unit.id)
      : parsed.value.unitIds;
  const result = await repository.createSpecialAssessment(user.id, {
    description: parsed.value.description,
    amountCentavos: parsed.value.amountCentavos,
    dueDate: parsed.value.dueDate,
    unitIds,
  });
  if (!result.ok) fail("special", result.message);

  revalidatePath("/admin/charges");
  revalidatePath("/resident");
  redirect("/admin/charges");
}
