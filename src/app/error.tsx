"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app/error]", error.message, error.digest);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-lg font-medium text-zinc-100">
        読み込み中にエラーが発生しました
      </p>
      <p className="max-w-md text-sm text-zinc-500">
        多くの場合、本番の{" "}
        <code className="rounded bg-white/10 px-1">DATABASE_URL</code>{" "}
        未設定または DB 接続失敗です。Vercel のログと環境変数を確認してください。
      </p>
      {error.digest && (
        <p className="font-mono text-xs text-zinc-600">digest: {error.digest}</p>
      )}
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-zinc-100 hover:bg-white/10"
      >
        再試行
      </button>
    </div>
  );
}
