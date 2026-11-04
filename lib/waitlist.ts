import { z } from "zod";
import { isSupabaseConfigured } from "./supabase/env";
import { isTestSite } from "./test-site";

export const WAITLIST_UNITS = ["1-50", "51-150", "151-300", "301-500", "500+"] as const;
export const WAITLIST_ROLES = [
  "President",
  "Treasurer",
  "Secretary",
  "Board member",
  "Property manager or admin staff",
  "Homeowner",
  "Other",
] as const;
export const WAITLIST_METHODS = [
  "GCash",
  "Bank transfer",
  "Cash (office or guard house)",
  "Checks",
  "Spreadsheet tracking",
  "Viber or FB group chat",
  "Other",
] as const;

const waitlistSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required.").max(200),
  email: z.string().trim().email("Enter a valid email.").max(320),
  mobile: z
    .string()
    .trim()
    .max(40)
    .refine(
      (value) => value === "" || /^[+\d][\d\s-]{6,}$/.test(value),
      "Enter a mobile number such as 09XX XXX XXXX.",
    )
    .optional(),
  hoaName: z.string().trim().min(1, "HOA / condo name is required.").max(200),
  city: z.string().trim().min(1, "City / municipality is required.").max(120),
  units: z.enum(WAITLIST_UNITS, { error: "Choose the number of units." }),
  role: z.enum(WAITLIST_ROLES, { error: "Choose your role." }),
  collectMethods: z
    .array(z.enum(WAITLIST_METHODS))
    .min(1, "Choose how you collect dues today."),
  notes: z.string().trim().max(2000).optional(),
  consent: z.literal(true, { error: "Consent is required." }),
  website: z.string().optional(),
});

export type WaitlistInput = z.infer<typeof waitlistSchema>;

export type WaitlistSuccess = {
  status: 200;
  firstName: string;
  hoaName: string;
  email: string;
  message: string;
};

export type WaitlistFailure = {
  status: 400 | 403 | 429 | 503;
  message: string;
  fields?: Record<string, string>;
};

export type WaitlistResult = WaitlistSuccess | WaitlistFailure;

export function isWaitlistOpen(): boolean {
  return process.env.NEXT_PUBLIC_DUESKO_WAITLIST_OPEN === "true";
}

export function waitlistSuccessMessage(firstName: string, hoaName: string, email: string): string {
  return `You're on the list! Salamat, ${firstName}! We've saved your spot on the DuesKo waitlist for ${hoaName}. We'll email you at ${email} when there's news.`;
}

export function firstNameFrom(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName.trim();
}

export function parseWaitlistFields(
  raw: Record<string, unknown>,
): { ok: true; value: WaitlistInput } | { ok: false; fields: Record<string, string>; message: string } {
  const parsed = waitlistSchema.safeParse({
    ...raw,
    mobile: typeof raw.mobile === "string" ? raw.mobile : "",
    notes: typeof raw.notes === "string" ? raw.notes : "",
    website: typeof raw.website === "string" ? raw.website : "",
    collectMethods: Array.isArray(raw.collectMethods)
      ? raw.collectMethods
      : typeof raw.collectMethods === "string" && raw.collectMethods
        ? [raw.collectMethods]
        : [],
    consent: raw.consent === true || raw.consent === "true" || raw.consent === "on" || raw.consent === "yes",
  });
  if (parsed.success) return { ok: true, value: parsed.data };
  const fields: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!fields[key]) fields[key] = issue.message;
  }
  return {
    ok: false,
    fields,
    message: Object.values(fields)[0] ?? "Check the form and try again.",
  };
}

export function fieldsFromFormData(formData: FormData): Record<string, unknown> {
  return {
    fullName: String(formData.get("fullName") ?? ""),
    email: String(formData.get("email") ?? ""),
    mobile: String(formData.get("mobile") ?? ""),
    hoaName: String(formData.get("hoaName") ?? ""),
    city: String(formData.get("city") ?? ""),
    units: String(formData.get("units") ?? ""),
    role: String(formData.get("role") ?? ""),
    collectMethods: formData.getAll("collectMethods").map(String),
    notes: String(formData.get("notes") ?? ""),
    consent: formData.get("consent"),
    website: String(formData.get("website") ?? ""),
  };
}

type RateBucket = { count: number; resetAt: number };

const rateByIp = new Map<string, RateBucket>();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;

export function resetWaitlistRateLimit(): void {
  rateByIp.clear();
}

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const current = rateByIp.get(ip);
  if (!current || current.resetAt <= now) {
    rateByIp.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  current.count += 1;
  return current.count > RATE_LIMIT;
}

export type WaitlistRecord = {
  id: string;
  createdAt: string;
  fullName: string;
  email: string;
  mobile: string | null;
  hoaName: string;
  city: string;
  unitsRange: string;
  role: string;
  collectMethods: string[];
  notes: string | null;
  consentAt: string;
  userAgent: string | null;
};

const mockSignups: WaitlistRecord[] = [];

export function resetMockWaitlist(): void {
  mockSignups.length = 0;
}

export function listMockWaitlist(): WaitlistRecord[] {
  return [...mockSignups];
}

function useMockWaitlist(): boolean {
  if (isTestSite()) return true;
  return !isSupabaseConfigured();
}

async function persistWaitlist(
  input: WaitlistInput,
  userAgent: string | null,
): Promise<WaitlistResult> {
  const firstName = firstNameFrom(input.fullName);
  const success: WaitlistSuccess = {
    status: 200,
    firstName,
    hoaName: input.hoaName,
    email: input.email,
    message: waitlistSuccessMessage(firstName, input.hoaName, input.email),
  };
  const now = new Date().toISOString();
  const row: WaitlistRecord = {
    id: crypto.randomUUID(),
    createdAt: now,
    fullName: input.fullName,
    email: input.email,
    mobile: input.mobile ? input.mobile : null,
    hoaName: input.hoaName,
    city: input.city,
    unitsRange: input.units,
    role: input.role,
    collectMethods: input.collectMethods,
    notes: input.notes ? input.notes : null,
    consentAt: now,
    userAgent,
  };

  if (useMockWaitlist()) {
    mockSignups.push(row);
    return success;
  }

  const { createAuthClient } = await import("./supabase/client");
  const supabase = createAuthClient();
  const { error } = await supabase.from("waitlist_signups").insert({
    full_name: row.fullName,
    email: row.email,
    mobile: row.mobile,
    hoa_name: row.hoaName,
    city: row.city,
    units_range: row.unitsRange,
    role: row.role,
    collect_methods: row.collectMethods,
    notes: row.notes,
    consent_at: row.consentAt,
    user_agent: row.userAgent,
  });
  if (error) {
    return { status: 503, message: "We could not save your spot. Try again shortly." };
  }
  return success;
}

export async function submitWaitlist(
  raw: Record<string, unknown>,
  context: { ip: string; userAgent: string | null },
): Promise<WaitlistResult> {
  if (!isWaitlistOpen()) {
    return { status: 403, message: "The waitlist opens soon. Check back shortly." };
  }
  if (rateLimited(context.ip || "unknown")) {
    return { status: 429, message: "Please wait a few minutes before trying again." };
  }
  const parsed = parseWaitlistFields(raw);
  if (!parsed.ok) {
    return { status: 400, message: parsed.message, fields: parsed.fields };
  }
  if (parsed.value.website) {
    const firstName = firstNameFrom(parsed.value.fullName);
    return {
      status: 200,
      firstName,
      hoaName: parsed.value.hoaName,
      email: parsed.value.email,
      message: waitlistSuccessMessage(firstName, parsed.value.hoaName, parsed.value.email),
    };
  }
  return persistWaitlist(parsed.value, context.userAgent);
}
