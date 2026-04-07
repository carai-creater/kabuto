/** ダッシュボード系ルート遷移中のスケルトン（RSC 完了まで即時表示） */
export default function ShellLoading() {
  return (
    <div className="w-full animate-pulse">
      <div className="h-8 w-48 rounded-lg bg-slate-200 dark:bg-slate-800" />
      <div className="mt-4 h-4 max-w-md rounded bg-slate-200 dark:bg-slate-800" />
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/80"
          />
        ))}
      </div>
      <div className="mt-10 h-64 rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/80" />
    </div>
  );
}
