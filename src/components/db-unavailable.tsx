import Link from "next/link";
import { PAGE_SHELL } from "@/lib/page-shell";

export function DbUnavailableMessage() {
  return (
    <main className={`relative flex flex-1 flex-col pb-28 pt-14 ${PAGE_SHELL}`}>
      <div className="relative mx-auto w-full max-w-lg surface-card p-8 sm:p-10">
        <h1 className="text-[21px] font-semibold tracking-tight text-foreground">
          データベースに接続できません
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-[var(--muted)]">
          Vercel の{" "}
          <code className="rounded-lg bg-[var(--card-elevated)] px-2 py-0.5 text-[13px] ring-1 ring-[var(--border)]">
            DATABASE_URL
          </code>{" "}
          を確認し、マイグレーション（
          <code className="rounded-lg bg-[var(--card-elevated)] px-2 py-0.5 text-[13px] ring-1 ring-[var(--border)]">
            prisma migrate deploy
          </code>
          ）とシードを実行してください。
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex text-[15px] font-medium text-[var(--accent)] hover:underline"
        >
          トップへ戻る
        </Link>
      </div>
    </main>
  );
}
