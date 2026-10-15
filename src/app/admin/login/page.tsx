import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LogoMark } from "@/components/layout/logo";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = { title: "Staff sign in" };

export default async function AdminLoginPage() {
  if ((await auth())?.user) redirect("/admin");
  return (
    <main className="grid min-h-dvh place-items-center p-4">
      <div className="card-surface w-full max-w-sm space-y-6 p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <LogoMark className="size-10" />
          <div>
            <h1 className="text-xl font-bold">Customer care</h1>
            <p className="text-sm text-muted-foreground">Fareway staff sign in</p>
          </div>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
