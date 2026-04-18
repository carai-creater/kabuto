import { Skeleton } from "@/components/skeleton";

export default function DashboardLoading() {
  return (
    <div className="w-full space-y-10">
      {/* ヘッダー */}
      <div className="border-b border-slate-200/80 pb-8 dark:border-slate-800 space-y-3">
        <Skeleton className="h-3 w-16 rounded-full" />
        <Skeleton className="h-9 w-72 rounded-lg" />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* 残高 + 最近の会話 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-44 rounded-2xl" />
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900/80 space-y-4">
          <Skeleton className="h-3 w-24 rounded-full" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 通知トグル + チャージ */}
      <div className="space-y-4">
        <Skeleton className="h-16 rounded-2xl" />
        <Skeleton className="h-14 w-64 rounded-xl" />
      </div>
    </div>
  );
}
