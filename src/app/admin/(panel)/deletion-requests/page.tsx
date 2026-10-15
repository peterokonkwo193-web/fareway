import type { Metadata } from "next";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { processDeletionAction } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/admin/require-admin";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Data deletion requests" };

export default async function DeletionRequestsPage() {
  await requireAdmin();
  const requests = await db.dataDeletionRequest.findMany({ orderBy: [{ status: "desc" }, { createdAt: "desc" }], take: 200 });
  const emails = [...new Set(requests.filter((r) => r.status === "RECEIVED").map((r) => r.email))];
  const counts = emails.length
    ? await db.bookingRequest.groupBy({ by: ["contactEmail"], where: { contactEmail: { in: emails } }, _count: { _all: true } })
    : [];
  const countFor = (email: string) => counts.find((c) => c.contactEmail === email)?._count._all ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Data deletion requests</h1>
        <p className="max-w-2xl text-muted-foreground">
          Before deleting, confirm the requester controls the email address (for example by replying to the acknowledgement email). Deleting removes every
          booking request, passenger record, note and price alert for that email. It cannot be undone.
        </p>
      </div>
      {requests.length === 0 && <p className="card-surface p-6 text-muted-foreground">No requests.</p>}
      <ul className="space-y-3">
        {requests.map((r) => (
          <li key={r.id} className="card-surface flex flex-wrap items-center justify-between gap-4 p-4">
            <div>
              <p className="font-semibold">{r.email}</p>
              <p className="text-sm text-muted-foreground">
                Received {format(r.createdAt, "d MMM yyyy, HH:mm")}
                {r.reference && ` · reference ${r.reference}`}
                {r.status === "RECEIVED" && ` · ${countFor(r.email)} booking request(s) on file`}
              </p>
            </div>
            {r.status === "RECEIVED" ? (
              <div className="flex flex-wrap items-center gap-3">
                <form action={processDeletionAction} className="flex items-center gap-3">
                  <input type="hidden" name="requestId" value={r.id} />
                  <input type="hidden" name="decision" value="delete" />
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="verified" required className="size-4 accent-[var(--primary)]" />
                    Identity verified
                  </label>
                  <Button type="submit" variant="destructive" size="lg">
                    Delete data
                  </Button>
                </form>
                <form action={processDeletionAction}>
                  <input type="hidden" name="requestId" value={r.id} />
                  <input type="hidden" name="decision" value="reject" />
                  <Button type="submit" variant="ghost" size="lg">
                    Reject
                  </Button>
                </form>
              </div>
            ) : (
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-sm font-semibold",
                  r.status === "COMPLETED" ? "bg-success-soft text-success-foreground" : "bg-muted text-muted-foreground",
                )}
              >
                {r.status === "COMPLETED" ? `Deleted ${r.removedCount ?? 0} request(s)` : "Rejected"}
                {r.processedAt && ` · ${format(r.processedAt, "d MMM")}`}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
