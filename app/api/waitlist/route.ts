import { NextResponse } from "next/server";
import { fieldsFromFormData, submitWaitlist } from "@/lib/waitlist";

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

async function readFields(request: Request): Promise<Record<string, unknown>> {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = (await request.json()) as Record<string, unknown>;
    return body;
  }
  return fieldsFromFormData(await request.formData());
}

export async function POST(request: Request) {
  const result = await submitWaitlist(await readFields(request), {
    ip: clientIp(request),
    userAgent: request.headers.get("user-agent"),
  });
  return NextResponse.json(result, { status: result.status });
}
