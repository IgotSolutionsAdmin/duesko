import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PaymentAcknowledgment } from "@/components/payment-acknowledgment";
import { PrintButton } from "@/components/print-button";
import { requireRole } from "@/lib/auth";
import { loadAcknowledgment } from "@/lib/acknowledgment-view";
import { getRepository } from "@/lib/get-repository";
import { useMockRepository } from "@/lib/test-site";

export const metadata = { title: "Payment acknowledgment" };

export default function ResidentAcknowledgmentPage({
  params,
}: {
  params: Promise<{ paymentId: string }>;
}) {
  return (
    <Suspense fallback={<p className="text-sm text-ink/70">Opening acknowledgment…</p>}>
      <ResidentAcknowledgment params={params} />
    </Suspense>
  );
}

async function ResidentAcknowledgment({
  params,
}: {
  params: Promise<{ paymentId: string }>;
}) {
  const { paymentId } = await params;
  const user = await requireRole("resident");
  const loaded = await loadAcknowledgment(getRepository(), user.id, paymentId);
  if (!loaded) notFound();

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center gap-3 print:hidden">
        <Link href="/resident/acknowledgments" className="text-2xl text-teal-deep" aria-label="Back">
          ‹
        </Link>
        <p className="font-heading text-2xl font-semibold">Payment acknowledgment</p>
      </header>
      <PaymentAcknowledgment fields={loaded.fields} sample={useMockRepository()} />
      <PrintButton />
    </div>
  );
}
