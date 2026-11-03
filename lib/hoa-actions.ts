"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "./auth";
import { nameErrorCode, unitErrorCode } from "./form-messages";
import { getRepository } from "./get-repository";
import { parseRegisteredName } from "./registered-name";
import { parseUnitForm } from "./unit-form";

export async function saveRegisteredName(formData: FormData) {
  const user = await requireRole("admin_treasurer");
  const parsed = parseRegisteredName(String(formData.get("registeredName") ?? ""));
  if (!parsed.ok) redirect(`/admin/more?name=${nameErrorCode(parsed.message)}`);

  const result = await getRepository().updateRegisteredName(user.id, parsed.value);
  if (!result.ok) redirect(`/admin/more?name=${nameErrorCode(result.message)}`);

  revalidatePath("/admin");
  revalidatePath("/admin/more");
  revalidatePath("/resident");
  redirect("/admin/more");
}

export async function saveUnit(formData: FormData) {
  const user = await requireRole("admin_treasurer");
  const unitId = formData.get("unitId");
  const editing = typeof unitId === "string" && unitId.length > 0;
  const back = editing ? `/admin/units/${unitId}` : "/admin/units/new";

  const parsed = parseUnitForm(formData);
  if (!parsed.ok) redirect(`${back}?error=${unitErrorCode(parsed.message)}`);

  const repository = getRepository();
  const result = editing
    ? await repository.updateUnit(user.id, unitId, parsed.value)
    : await repository.createUnit(user.id, parsed.value);
  if (!result.ok) redirect(`${back}?error=${unitErrorCode(result.message)}`);

  revalidatePath("/admin");
  revalidatePath("/admin/units");
  revalidatePath("/resident");
  redirect("/admin/units");
}
