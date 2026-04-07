import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { DbUnavailableMessage } from "@/components/db-unavailable";
import { isDatabaseConfigured } from "@/lib/is-database-configured";

export default async function CreatorManagePage() {
  if (!isDatabaseConfigured()) {
    return <DbUnavailableMessage />;
  }

  const userId = await getSessionUserId();
  if (!userId) {
    redirect("/demo");
  }

  let agents: {
    id: string;
    slug: string;
    title: string;
    usageCount: number;
    pricePerUsePt: number;
    isPublished: boolean;
  }[] = [];

  try {
    agents = await prisma.agent.findMany({
      where: { creatorId: userId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        slug: true,
        title: true,
        usageCount: true,
        pricePerUsePt: true,
        isPublished: true,
      },
    });
  } catch {
    return <DbUnavailableMessage />;
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[12px] font-semibold tracking-[0.08em] text-[var(--muted)]">
            クリエイター
          </p>
          <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-foreground sm:text-[32px]">
            エージェント管理
          </h1>
          <p className="mt-2 text-[15px] text-[var(--muted)]">
            作成したエージェントの一覧と新規作成です。
          </p>
        </div>
        <Link
          href="/dashboard/creator/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-[14px] font-semibold text-white shadow-lg shadow-[var(--accent)]/25 transition hover:opacity-95"
        >
          <Plus className="h-5 w-5" aria-hidden />
          新規作成
        </Link>
      </div>

      <section className="mt-10">
        {agents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)] p-12 text-center shadow-lg dark:shadow-black/40">
            <p className="text-[15px] text-[var(--muted)]">
              まだエージェントがありません。新規作成から追加してください。
            </p>
            <Link
              href="/dashboard/creator/new"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 text-[14px] font-semibold text-white shadow-lg"
            >
              <Plus className="h-5 w-5" aria-hidden />
              新規作成
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {agents.map((a) => (
              <li
                key={a.id}
                className="flex flex-col gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-lg dark:shadow-black/40 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <Link
                    href={`/agents/${a.slug}`}
                    className="text-[17px] font-semibold text-[var(--accent)] hover:underline"
                  >
                    {a.title}
                  </Link>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-[var(--muted)]">
                    <span>利用価格: {a.pricePerUsePt.toLocaleString("ja-JP")} pt/回</span>
                    <span>利用数: {a.usageCount.toLocaleString("ja-JP")}</span>
                    <span
                      className={
                        a.isPublished
                          ? "text-emerald-500 dark:text-emerald-400"
                          : "text-[var(--muted)]"
                      }
                    >
                      {a.isPublished ? "公開中" : "下書き"}
                    </span>
                  </div>
                </div>
                <Link
                  href={`/agents/${a.slug}`}
                  className="shrink-0 rounded-xl border border-[var(--border)] px-4 py-2 text-center text-[13px] font-medium text-foreground transition hover:bg-[var(--card-elevated)]"
                >
                  開く
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
