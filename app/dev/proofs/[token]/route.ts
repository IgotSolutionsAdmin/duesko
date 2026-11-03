import { NextResponse } from "next/server";
import { isTestSite } from "@/lib/test-site";
import { readProofToken } from "@/lib/mock/proof-tokens";

/** Serves a mock proof for a short-lived token. Hidden when the token is missing or expired. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  if (!isTestSite()) {
    return new NextResponse(null, { status: 404 });
  }
  const { token } = await params;
  const file = readProofToken(token);
  if (!file) return new NextResponse(null, { status: 404 });
  return new NextResponse(Buffer.from(file.bytes), {
    headers: {
      "Content-Type": file.contentType,
      "Cache-Control": "private, max-age=60",
    },
  });
}
