import { Suspense } from "react";
import { DevRoleSwitch } from "@/components/dev-role-switch";
import { Shell } from "@/components/shell";
import { requireRole } from "@/lib/auth";
import { getRepository } from "@/lib/get-repository";
import { describeMonthlyDues } from "@/lib/money";

export const metadata = {
  title: "Your account",
};

export default function ResidentPage() {
  return (
    <Shell>
      <Suspense
        fallback={<p className="text-sm text-ink/70">Checking the demo session…</p>}
      >
        <ResidentHome />
      </Suspense>
    </Shell>
  );
}

async function ResidentHome() {
  const user = await requireRole("resident");
  const repository = getRepository();
  const [hoa, units] = await Promise.all([
    repository.getHoa(user.id),
    repository.listUnits(user.id),
  ]);

  const intro = hoa
    ? `${user.fullName} is signed in as the resident for ${hoa.registeredName}`
    : `${user.fullName} is signed in as the resident`;
  const introSentence = intro.endsWith(".") ? intro : `${intro}.`;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-medium text-teal-deep">Your account</p>
        <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight text-ink">
          {user.fullName}
        </h1>
        <p className="mt-3 text-base leading-7 text-ink/80">
          {introSentence} This screen is a placeholder. Charges and the pay
          link come later. This page lists only the unit linked to the
          signed-in resident.
        </p>
      </div>
      {units.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-teal/40 bg-white p-5">
          <h2 className="font-heading text-lg font-semibold text-ink">
            No unit linked yet
          </h2>
          <p className="mt-1 text-sm leading-6 text-ink/80">
            This resident account has no unit on file.
          </p>
        </section>
      ) : (
        <div className="flex flex-col gap-3">
          {units.map((unit) => (
            <section
              key={unit.id}
              className="rounded-2xl border border-border bg-white p-5"
            >
              <p className="text-sm text-teal-deep">Your unit</p>
              <h2 className="mt-1 font-heading text-2xl font-semibold text-ink">
                {unit.label}
              </h2>
              <p className="mt-2 text-sm leading-6 text-ink/80">
                {describeMonthlyDues(unit)}
              </p>
            </section>
          ))}
        </div>
      )}
      <DevRoleSwitch currentUserId={user.id} />
    </div>
  );
}
