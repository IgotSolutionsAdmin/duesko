import { DevRoleSwitch } from "@/components/dev-role-switch";
import { HowToPayCard } from "@/components/how-to-pay-card";
import { requireRole } from "@/lib/auth";
import { getRepository } from "@/lib/get-repository";
import { shouldRenderDevRoleSwitch } from "@/lib/demo-auth";

export const metadata = { title: "Help" };

export default async function HelpPage() {
  const user = await requireRole("resident");
  const hoa = await getRepository().getHoa(user.id);
  return (
    <div className="flex flex-col gap-4">
      <header>
        <p className="text-sm font-medium text-teal-deep">Help</p>
        <h1 className="mt-1 font-heading text-3xl font-semibold">Paying your dues</h1>
      </header>
      <HowToPayCard howToPay={hoa?.howToPay} />
      <section className="rounded-3xl bg-white p-5 text-sm leading-6 text-ink/80">
        <p>
          DuesKo does not take payments. After you pay your association, upload a JPG, PNG, or PDF
          proof. An officer reviews it. If it is rejected, the reason appears on your account and
          you can re-upload.
        </p>
        <p className="mt-3">
          Cash you hand to an officer is recorded by them. You do not upload a proof for that.
        </p>
      </section>
      {shouldRenderDevRoleSwitch() ? (
        <DevRoleSwitch currentUserId={user.id} portal="resident" />
      ) : null}
    </div>
  );
}
