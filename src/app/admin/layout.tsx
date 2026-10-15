import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Customer care", template: "%s | Fareway admin" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-background">{children}</div>;
}
