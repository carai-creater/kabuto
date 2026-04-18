import Link from "next/link";
import { PAGE_SHELL } from "@/lib/page-shell";

export default function NotFound() {
  return (
    <div className={`${PAGE_SHELL} flex min-h-[60vh] flex-col items-center justify-center py-24 text-center`}>
      <p className="text-[64px] font-bold tabular-nums leading-none text-[var(--accent)]">404</p>
      <h1 className="mt-4 text-[26px] font-semibold tracking-tight text-[var(--foreground)]">
        ページが見つかりません
      </h1>
      <p className="mt-3 max-w-md text-[15px] leading-relaxed text-[var(--muted)]">
        お探しのページは移動・削除されたか、URL が間違っている可能性があります。
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="btn-primary px-6 py-3 text-[14px]"
        >
          ホームへ戻る
        </Link>
        <Link
          href="/agents"
          className="rounded-full border border-[var(--border)] bg-[var(--card)] px-6 py-3 text-[14px] font-medium text-[var(--foreground)] transition hover:border-[var(--accent)]/40"
        >
          エージェントを探す
        </Link>
      </div>
    </div>
  );
}
