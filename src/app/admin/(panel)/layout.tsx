import Link from "next/link";
import { LayoutDashboard, ListChecks, LogOut, Trash2 } from "lucide-react";
import { LogoMark } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/header-controls";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/admin/require-admin";
import { logoutAction } from "@/app/admin/actions";

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/bookings", label: "Booking requests", icon: ListChecks },
  { href: "/admin/deletion-requests", label: "Data deletion", icon: Trash2 },
];

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[15rem_1fr]">
      <a href="#admin-main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground">
        Skip to content
      </a>
      <aside className="border-b border-border bg-card lg:sticky lg:top-0 lg:h-dvh lg:border-r lg:border-b-0">
        <div className="flex items-center gap-3 p-4">
          <LogoMark />
          <div className="min-w-0">
            <p className="font-bold">Fareway care</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <nav aria-label="Admin" className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted"
            >
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2 px-3 pb-4 lg:absolute lg:bottom-0 lg:w-full">
          <ThemeToggle />
          <form action={logoutAction} className="flex-1">
            <Button type="submit" variant="outline" size="lg" className="w-full">
              <LogOut className="size-4" aria-hidden="true" />
              Sign out
            </Button>
          </form>
        </div>
      </aside>
      <main id="admin-main" className="min-w-0 p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
