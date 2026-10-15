import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

/** Use at the top of every admin page and server action. */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email) redirect("/admin/login");
  return session.user;
}

/** For admin route handlers: returns the user or null (caller sends 401). */
export async function getAdmin() {
  const session = await auth();
  return session?.user?.email ? session.user : null;
}
