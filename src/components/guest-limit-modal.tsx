"use client";

import Link from "next/link";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function GuestLimitModal({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guest-limit-title"
    >
      <div className="surface-card max-w-md p-6 shadow-xl ring-1 ring-black/10 dark:ring-white/10">
        <h2
          id="guest-limit-title"
          className="text-[18px] font-semibold text-foreground"
        >
          本日のお試し回数に達しました
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-[var(--muted)]">
          未ログインでの利用は 1 日 3 回までです。ログインするとウォレット残高の範囲で継続できます。
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/login"
            className="btn-primary inline-flex min-w-[140px] justify-center px-4 py-2 text-[14px]"
            onClick={onClose}
          >
            ログインして継続
          </Link>
          <button
            type="button"
            className="rounded-full border border-[var(--border)] px-4 py-2 text-[14px] text-[var(--muted)] transition hover:bg-[var(--card-elevated)]"
            onClick={onClose}
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
