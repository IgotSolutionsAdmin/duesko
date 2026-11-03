"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEMO_COOKIE } from "./demo-cookie";
import { getRepository } from "./get-repository";
import { homePath } from "./roles";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 14,
};

/** Signs in as one of the two seeded demo users. Unknown ids are ignored. */
export async function signInAsDemo(formData: FormData) {
  const userId = formData.get("userId");
  if (typeof userId !== "string") redirect("/sign-in");

  const user = await getRepository().getUser(userId);
  if (!user) redirect("/sign-in");

  const jar = await cookies();
  jar.set(DEMO_COOKIE, user.id, cookieOptions);
  redirect(homePath(user.role));
}

export async function signOut() {
  const jar = await cookies();
  jar.delete(DEMO_COOKIE);
  redirect("/sign-in");
}
