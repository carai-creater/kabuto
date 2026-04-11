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
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-5 bg-[var(--background)] px-5 text-center">
      <p className="text-[21px] font-bold text-[#333333] dark:text-[var(--foreground)]">
        読み込み中にエラーが発生しました
      </p>
      <p className="max-w-md text-[15px] text-[var(--muted)]">
        <code className="rounded-md bg-[var(--card-elevated)] px-2 py-0.5 text-[13px] ring-1 ring-[var(--border)]">
          DATABASE_URL
        </code>{" "}
        や接続を確認してください。
      </p>
      {error.digest && (
        <p className="font-mono text-[11px] text-[var(--muted)]">
          digest: {error.digest}
        </p>
      )}
      <button
        type="button"
        onClick={() => reset()}
        className="btn-primary"
      >
        再試行
      </button>
    </div>
  );
}
