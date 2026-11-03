import { NextResponse } from "next/server";
import { isDemoAuthEnabled } from "@/lib/demo-auth";

/** Cookie demo session endpoint. Production always 404s. */
export async function GET() {
  if (!isDemoAuthEnabled()) {
    return new NextResponse(null, { status: 404 });
  }
  return new NextResponse(null, { status: 405 });
}

export async function POST() {
  if (!isDemoAuthEnabled()) {
    return new NextResponse(null, { status: 404 });
  }
  return new NextResponse(null, { status: 405 });
}
