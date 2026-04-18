import { Skeleton } from "@/components/skeleton";

export default function AgentLoading() {
  return (
    <main className="flex min-h-screen w-full flex-1 flex-col">
      {/* ヘッダー */}
      <div className="border-b border-[var(--border)] px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <Skeleton className="h-5 w-44 rounded" />
        </div>
      </div>

      {/* メッセージエリア */}
      <div className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* エージェント紹介 */}
          <div className="space-y-2">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-4 w-full max-w-md" />
            <Skeleton className="h-4 w-3/4 max-w-sm" />
          </div>
          {/* 会話スターターボタン群 */}
          <div className="grid grid-cols-1 gap-2 pt-4 sm:grid-cols-2">
            {[140, 160, 130, 170].map((w, i) => (
              <Skeleton key={i} className="h-12 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>

      {/* 入力エリア */}
      <div className="border-t border-[var(--border)] px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <Skeleton className="h-12 rounded-2xl" />
        </div>
      </div>
    </main>
  );
}
