import Link from "next/link";
import { PAGE_SHELL } from "@/lib/page-shell";

export function DbUnavailableMessage() {
  return (
    <main
      className={`flex flex-1 flex-col items-center justify-center px-5 pb-28 pt-14 ${PAGE_SHELL}`}
    >
      <div className="surface-card w-full max-w-md p-8 text-center sm:p-10">
        <h1 className="text-[19px] font-semibold tracking-tight text-foreground">
          データベースに接続できません
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-[var(--muted)]">
          <code className="rounded-md bg-[var(--card-elevated)] px-1.5 py-0.5 text-[13px] ring-1 ring-[var(--border)]">
            DATABASE_URL
          </code>{" "}
          とマイグレーションを確認してください。
        </p>
        <Link
          href="/"
          className="mt-8 inline-block text-[15px] font-medium text-[var(--accent)] hover:underline"
        >
          トップへ戻る
        </Link>
      </div>
    </main>
  );
}
