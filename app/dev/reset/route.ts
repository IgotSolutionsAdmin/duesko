import { NextResponse } from "next/server";
import { resetRepository } from "@/lib/get-repository";

/** Clears the in-memory mock between e2e tests. Hidden in production. */
export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse(null, { status: 404 });
  }
  resetRepository();
  return new NextResponse(null, { status: 204 });
}
