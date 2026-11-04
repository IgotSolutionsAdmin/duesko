"use server";

import { headers } from "next/headers";
import {
  fieldsFromFormData,
  submitWaitlist,
  type WaitlistResult,
} from "./waitlist";

export type WaitlistActionState = WaitlistResult | { status: "idle" };

export async function joinWaitlist(
  _previous: WaitlistActionState,
  formData: FormData,
): Promise<WaitlistActionState> {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || headerList.get("x-real-ip") || "unknown";
  return submitWaitlist(fieldsFromFormData(formData), {
    ip,
    userAgent: headerList.get("user-agent"),
  });
}
