import Link from "next/link";
import { DbConnectionTips } from "@/components/db-connection-tips";
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
        <DbConnectionTips />
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
