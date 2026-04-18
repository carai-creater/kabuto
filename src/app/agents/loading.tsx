import { PAGE_SHELL } from "@/lib/page-shell";
import { Skeleton } from "@/components/skeleton";

function AgentCardSkeleton() {
  return (
    <div className="flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
      <div className="flex flex-col gap-3 p-5 sm:p-6">
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-[var(--border)] px-5 py-3 sm:px-6">
        <div className="flex gap-4">
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-4 w-14" />
        </div>
        <Skeleton className="h-4 w-12" />
      </div>
    </div>
  );
}

export default function AgentsBrowseLoading() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-[var(--background)]">
      <div className={`${PAGE_SHELL} py-8`}>
        {/* 検索バー */}
        <Skeleton className="mx-auto mb-8 h-14 max-w-2xl rounded-full" />
        {/* カードグリッド */}
        <ul className="mx-auto grid max-w-6xl grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i}>
              <AgentCardSkeleton />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
