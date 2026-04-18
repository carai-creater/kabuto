import { Skeleton } from "@/components/skeleton";

export default function ShellLoading() {
  return (
    <div className="w-full space-y-8">
      {/* ページヘッダー */}
      <div className="border-b border-slate-200/80 pb-8 dark:border-slate-800 space-y-3">
        <Skeleton className="h-3 w-20 rounded-full" />
        <Skeleton className="h-9 w-64 rounded-lg" />
        <Skeleton className="h-4 w-48" />
      </div>

      {/* カードグリッド */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>

      {/* リスト */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-4 py-3">
            <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
