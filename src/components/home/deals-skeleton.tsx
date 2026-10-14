import { Skeleton } from "@/components/ui/skeleton";

export function DealsSkeleton() {
  return (
    <div className="container-page space-y-14" aria-busy="true" aria-label="Loading deals">
      <div>
        <Skeleton className="mb-6 h-8 w-72" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="aspect-[4/3] rounded-xl" />
          ))}
        </div>
      </div>
      <div>
        <Skeleton className="mb-6 h-8 w-80" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  );
}
