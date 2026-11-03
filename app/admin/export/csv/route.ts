import { NextResponse, type NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import {
  chargesCsv,
  exportFileName,
  parseExportKind,
  parseExportMonth,
  parseExportStatus,
  paymentsCsv,
  unitsCsv,
} from "@/lib/export-data";
import { getRepository } from "@/lib/get-repository";

export async function GET(request: NextRequest) {
  const user = await requireRole("admin_treasurer");
  const kind = parseExportKind(request.nextUrl.searchParams.get("kind"));
  if (!kind) {
    return NextResponse.redirect(new URL("/admin/export?error=kind", request.url));
  }
  const filters = {
    month: parseExportMonth(request.nextUrl.searchParams.get("month")),
    status: parseExportStatus(request.nextUrl.searchParams.get("status")),
  };
  const repository = getRepository();
  const [units, charges, payments, people] = await Promise.all([
    repository.listUnits(user.id),
    repository.listCharges(user.id),
    repository.listPayments(user.id),
    repository.listUsers(user.id),
  ]);
  const recorded = await repository.recordExport(user.id, {
    kind,
    month: filters.month,
    status: filters.status,
  });
  if (!recorded.ok) {
    return NextResponse.redirect(new URL("/admin/export?error=audit", request.url));
  }

  const body =
    kind === "units"
      ? unitsCsv(units)
      : kind === "charges"
        ? chargesCsv(charges, units, filters)
        : paymentsCsv(payments, charges, units, people, filters);

  return new NextResponse(body, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${exportFileName(kind, filters)}"`,
      "cache-control": "no-store",
    },
  });
}
