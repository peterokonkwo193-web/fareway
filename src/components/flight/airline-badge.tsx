import type { Carrier } from "@/lib/flights/types";
import { cn } from "@/lib/utils";

const palette = [
  "bg-[#e8f0ff] text-[#0b3d91] dark:bg-[#16294a] dark:text-[#cfe0ff]",
  "bg-[#fff2eb] text-[#9a3a0c] dark:bg-[#3a1f12] dark:text-[#ffb08a]",
  "bg-[#e8f7f0] text-[#146c3d] dark:bg-[#0f2e20] dark:text-[#5fe09a]",
  "bg-[#f3e8ff] text-[#6b21a8] dark:bg-[#2a1840] dark:text-[#d8b4fe]",
  "bg-[#ebf6ff] text-[#0a66b8] dark:bg-[#132c4d] dark:text-[#6cc2ff]",
];

/** Text badge with the carrier's IATA code (no third-party logos). */
export function AirlineBadge({ carrier, size = "md", className }: { carrier: Carrier; size?: "sm" | "md"; className?: string }) {
  const color = palette[(carrier.code.charCodeAt(0) + carrier.code.charCodeAt(1)) % palette.length];
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-lg font-bold tracking-wide",
        size === "sm" ? "size-7 text-[0.6875rem]" : "size-10 text-sm",
        color,
        className,
      )}
    >
      {carrier.code}
    </span>
  );
}
