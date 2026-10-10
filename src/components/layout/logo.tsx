import Link from "next/link";
import { cn } from "@/lib/utils";

/** Original Fareway mark: a rising flight arc over a horizon line. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-8", className)}>
      <rect width="32" height="32" rx="9" fill="#0B3D91" />
      <path d="M7 22.5c4.5-1 9.5-4.5 13-10" stroke="#1FA2FF" strokeWidth="2.6" strokeLinecap="round" fill="none" />
      <path d="M17.5 9.5l6.5-1.8-1.6 6.6-1.6-3.2z" fill="#FF7A3D" />
      <path d="M7 25.5h18" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("inline-flex items-center gap-2 rounded-lg text-lg font-extrabold tracking-tight text-primary", className)}
      aria-label="Fareway home"
    >
      <LogoMark />
      <span>Fareway</span>
    </Link>
  );
}
