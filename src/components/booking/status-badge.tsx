import { useTranslations } from "next-intl";
import { statusTone, type BookingStatus } from "@/lib/booking/status";
import { cn } from "@/lib/utils";

const toneClass = {
  info: "bg-sky-soft text-link",
  warning: "bg-warning-soft text-warning",
  success: "bg-success-soft text-success-foreground",
  muted: "bg-muted text-muted-foreground",
  danger: "bg-destructive/10 text-destructive",
} as const;

export function StatusBadge({ status, className }: { status: BookingStatus; className?: string }) {
  const t = useTranslations("status");
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold whitespace-nowrap",
        toneClass[statusTone[status]],
        className,
      )}
    >
      <span className="size-2 rounded-full bg-current" aria-hidden="true" />
      <span className="sr-only">{t("label")}: </span>
      {t(status)}
    </span>
  );
}
