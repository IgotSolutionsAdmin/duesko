import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Shell } from "@/components/shell";
import { getDemoUser } from "@/lib/auth";
import { homePath } from "@/lib/roles";

export default function HomePage() {
  return (
    <Shell>
      <Suspense
        fallback={
          <p className="text-sm text-ink/70">Opening DuesKo…</p>
        }
      >
        <HomeGate />
      </Suspense>
    </Shell>
  );
}

async function HomeGate() {
  const user = await getDemoUser();
  redirect(user ? homePath(user.role) : "/sign-in");
  return null;
}
