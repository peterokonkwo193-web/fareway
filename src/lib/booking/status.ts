export const BOOKING_STATUSES = ["PENDING", "CONTACTED", "AWAITING_PAYMENT", "CONFIRMED", "CANCELLED", "EXPIRED"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

/** Pending requests expire if nobody has picked them up within this window. */
export const EXPIRY_HOURS = 48;

export function isBookingStatus(value: string): value is BookingStatus {
  return (BOOKING_STATUSES as readonly string[]).includes(value);
}

/** Statuses customer care can move a request to from each status. */
export const ALLOWED_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ["CONTACTED", "AWAITING_PAYMENT", "CANCELLED", "EXPIRED"],
  CONTACTED: ["AWAITING_PAYMENT", "CONFIRMED", "CANCELLED"],
  AWAITING_PAYMENT: ["CONFIRMED", "CANCELLED", "CONTACTED"],
  CONFIRMED: ["CANCELLED"],
  CANCELLED: ["PENDING"],
  EXPIRED: ["PENDING", "CONTACTED"],
};

export function canTransition(from: BookingStatus, to: BookingStatus) {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

/** A request is stale when it is still Pending after its expiry time. */
export function isStale(status: string, expiresAt: Date, now: Date = new Date()) {
  return status === "PENDING" && expiresAt.getTime() <= now.getTime();
}

export const statusTone: Record<BookingStatus, "info" | "warning" | "success" | "muted" | "danger"> = {
  PENDING: "info",
  CONTACTED: "info",
  AWAITING_PAYMENT: "warning",
  CONFIRMED: "success",
  CANCELLED: "danger",
  EXPIRED: "muted",
};
