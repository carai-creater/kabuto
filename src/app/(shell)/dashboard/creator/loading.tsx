import { Skeleton } from "@/components/skeleton";

export default function CreatorDashboardLoading() {
  return (
    <div className="w-full space-y-8">
      <div className="space-y-3">
        <Skeleton className="h-3 w-24 rounded-full" />
        <Skeleton className="h-8 w-56 rounded-lg" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
            <div className="space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div className="flex gap-3 pt-1">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-14" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
