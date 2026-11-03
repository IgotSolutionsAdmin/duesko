import { NextResponse } from "next/server";
import { allowDevReset } from "@/lib/demo-auth";
import { resetRepository } from "@/lib/get-repository";

/** Clears the in-memory mock between e2e tests. Hidden in production. */
export async function POST() {
  if (!allowDevReset()) {
    return new NextResponse(null, { status: 404 });
  }
  resetRepository();
  return new NextResponse(null, { status: 204 });
}
