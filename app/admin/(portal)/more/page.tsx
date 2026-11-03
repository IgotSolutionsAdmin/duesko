import { Suspense } from "react";
import Link from "next/link";
import { HoaNameForm } from "@/components/hoa-name-form";
import { HowToPayForm } from "@/components/how-to-pay-form";
import { ListSkeleton } from "@/components/list-state";
import { requireRole } from "@/lib/auth";
import { howToPayErrorMessage, nameErrorMessage } from "@/lib/form-messages";
import { getRepository } from "@/lib/get-repository";
import { DEFAULT_HOW_TO_PAY } from "@/lib/how-to-pay";

export const metadata = { title: "More" };

export default function MorePage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string; pay?: string }>;
}) {
  return (
    <Suspense fallback={<ListSkeleton label="Loading association" />}>
      <More searchParams={searchParams} />
    </Suspense>
  );
}

async function More({
  searchParams,
}: {
  searchParams: Promise<{ name?: string; pay?: string }>;
}) {
  const query = await searchParams;
  const user = await requireRole("admin_treasurer");
  const hoa = await getRepository().getHoa(user.id);
  const registeredName = hoa?.registeredName ?? "";

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="text-sm font-medium text-teal-deep">More</p>
        <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight text-balance">
          {registeredName || "Association"}
        </h1>
      </header>
      <section className="rounded-3xl bg-white p-5">
        <h2 className="font-heading text-lg font-semibold">Registered name</h2>
        <div className="mt-4">
          <HoaNameForm
            registeredName={registeredName}
            error={nameErrorMessage(query.name)}
          />
        </div>
      </section>
      <section className="rounded-3xl bg-white p-5">
        <h2 className="font-heading text-lg font-semibold">How to pay</h2>
        <div className="mt-4">
          <HowToPayForm
            howToPay={hoa?.howToPay ?? DEFAULT_HOW_TO_PAY}
            error={howToPayErrorMessage(query.pay)}
          />
        </div>
      </section>
      <nav className="flex flex-col gap-2">
        <Link href="/admin/acknowledgments" className="rounded-2xl bg-white px-4 py-4 font-medium">
          Payment acknowledgments
        </Link>
        <Link href="/admin/export" className="rounded-2xl bg-white px-4 py-4 font-medium">
          Export payments
        </Link>
      </nav>
    </div>
  );
}
