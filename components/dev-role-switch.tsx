import { Button } from "@/components/ui/button";
import { shouldRenderDevRoleSwitch } from "@/lib/demo-auth";
import { signInAsDemo, signOut } from "@/lib/demo-auth-actions";
import { seed } from "@/lib/mock/seed";
import { roleLabel } from "@/lib/roles";

export function DevRoleSwitch({
  currentUserId,
  portal,
}: {
  currentUserId: string;
  portal: "admin" | "resident";
}) {
  if (!shouldRenderDevRoleSwitch()) return null;

  const others = seed.users.filter((user) => user.id !== currentUserId);

  return (
    <section
      data-testid="dev-role-switch"
      className="rounded-2xl border border-mango bg-mango/25 p-4"
    >
      <p className="font-heading text-xs font-semibold tracking-[0.16em] text-ink">
        DEV ONLY
      </p>
      <p className="mt-1 text-sm leading-6 text-ink">
        Demo role switch for the two seeded accounts. Remove this cookie
        session before a real deployment.
      </p>
      <div className="mt-3 flex flex-col gap-2">
        {others.map((user) => (
          <form key={user.id} action={signInAsDemo}>
            <input type="hidden" name="userId" value={user.id} suppressHydrationWarning />
            <Button
              type="submit"
              variant="outline"
              className="h-11 w-full bg-white text-base"
            >
              Switch to {user.fullName}, {roleLabel(user.role).toLowerCase()}
            </Button>
          </form>
        ))}
        <form action={signOut}>
          <input type="hidden" name="portal" value={portal} suppressHydrationWarning />
          <Button type="submit" variant="ghost" className="h-11 w-full text-base">
            Sign out
          </Button>
        </form>
      </div>
    </section>
  );
}
