import { NextResponse } from "next/server";
import { fieldsFromFormData, isWaitlistOpen, submitWaitlist } from "@/lib/waitlist";

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
  if (!isWaitlistOpen()) {
    return NextResponse.json(
      { status: 403, message: "The waitlist opens soon. Check back shortly." },
      { status: 403 },
    );
  }
  let fields: Record<string, unknown>;
  try {
    fields = await readFields(request);
  } catch {
    return NextResponse.json({ status: 400, message: "Could not read the form." }, { status: 400 });
  }
  const result = await submitWaitlist(fields, {
    ip: clientIp(request),
    userAgent: request.headers.get("user-agent"),
  });
  return NextResponse.json(result, { status: result.status });
}
