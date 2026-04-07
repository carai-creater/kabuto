import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";

/**
 * クリエイター権限がないユーザー向けの案内（リダイレクトせず表示する）
 */
export function CreatorOnlyGate() {
  return (
    <div className="w-full">
      <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
        <div
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 dark:bg-slate-800"
          aria-hidden
        >
          <Lock className="h-8 w-8 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
        </div>
        <h1 className="mt-6 text-xl font-bold text-slate-900 dark:text-white">
          クリエイター専用のエリアです
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          エージェントの作成・管理には、管理者による
          <strong className="text-slate-800 dark:text-slate-200">
            クリエイター権限
          </strong>
          の付与が必要です。権限が付与されると、ここからエージェントを公開できます。
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-5 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
          >
            マイページに戻る
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            エージェントを見る
          </Link>
        </div>
      </div>
    </div>
  );
}
