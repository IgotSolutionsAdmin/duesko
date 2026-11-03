import { DevRoleSwitch } from "@/components/dev-role-switch";
import { requireRole } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata = { title: "Help" };

export default async function HelpPage() {
  const user = await requireRole("resident");
  return (
    <div className="flex flex-col gap-4">
      <header>
        <p className="text-sm font-medium text-teal-deep">Help</p>
        <h1 className="mt-1 font-heading text-3xl font-semibold">Paying your dues</h1>
      </header>
      <section className="rounded-3xl bg-white p-5 text-sm leading-6 text-ink/80">
        <p>
          Pay your association by GCash, bank transfer, or another method they accept, then upload a photo of the receipt from Payments. An officer reviews the proof. If it is rejected, the reason appears on your account and the charge stays unpaid.
        </p>
        <p className="mt-3">
          Cash you hand to an officer is recorded by them. You do not upload a proof for that.
        </p>
      </section>
      {isSupabaseConfigured() ? null : (
        <DevRoleSwitch currentUserId={user.id} portal="resident" />
      )}
    </div>
  );
}
