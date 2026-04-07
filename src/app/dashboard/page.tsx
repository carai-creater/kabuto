import Link from "next/link";
import { redirect } from "next/navigation";
import { Bot, Clock, MessageSquare, Sparkles } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { DbUnavailableMessage } from "@/components/db-unavailable";
import { isDatabaseConfigured } from "@/lib/is-database-configured";

export default async function UserDashboardPage() {
  if (!isDatabaseConfigured()) {
    return <DbUnavailableMessage />;
  }

  const userId = await getSessionUserId();
  if (!userId) {
    redirect("/demo");
  }

  let user: { name: string | null; email: string } | null = null;
  let wallet: { balancePt: number } | null = null;
  let totalConversations = 0;
  const savedPlaceholder = 0;
  let recentAgents: {
    slug: string;
    title: string;
    iconEmoji: string;
    lastAt: Date;
  }[] = [];
  let isCreator = false;

  try {
    const [u, w, usageCount, ledgers, profile] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true },
      }),
      prisma.wallet.findUnique({
        where: { userId },
        select: { balancePt: true },
      }),
      prisma.usageLedger.count({ where: { userId } }),
      prisma.usageLedger.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 40,
        include: {
          agent: {
            select: { slug: true, title: true, iconEmoji: true },
          },
        },
      }),
      prisma.profile.findUnique({
        where: { userId },
        select: { role: true },
      }),
    ]);
    user = u;
    wallet = w;
    totalConversations = usageCount;
    isCreator = profile?.role === "creator";

    const seen = new Set<string>();
    for (const row of ledgers) {
      if (seen.has(row.agentId)) continue;
      seen.add(row.agentId);
      recentAgents.push({
        slug: row.agent.slug,
        title: row.agent.title,
        iconEmoji: row.agent.iconEmoji,
        lastAt: row.createdAt,
      });
      if (recentAgents.length >= 6) break;
    }
  } catch {
    return <DbUnavailableMessage />;
  }

  const greeting = user?.name ?? user?.email ?? "ユーザー";

  return (
    <div className="mx-auto w-full max-w-4xl">
      <p className="text-[12px] font-semibold tracking-[0.08em] text-[var(--muted)]">
        マイページ
      </p>
      <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-foreground sm:text-[32px]">
            ダッシュボード
          </h1>
          <p className="mt-2 text-[15px] text-[var(--muted)]">
            {greeting} さん — 利用状況の概要です。
          </p>
        </div>
        {isCreator ? (
          <Link
            href="/dashboard/creator"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-[14px] font-semibold text-white shadow-lg shadow-[var(--accent)]/20 transition hover:opacity-95"
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            クリエイターダッシュボードへ
          </Link>
        ) : null}
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-lg dark:shadow-black/40">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
            残高 (pt)
          </p>
          <p className="mt-2 text-[32px] font-semibold tabular-nums text-[var(--brand)]">
            {(wallet?.balancePt ?? 0).toLocaleString("ja-JP")}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-lg dark:shadow-black/40">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
            総会話数
          </p>
          <p className="mt-2 text-[32px] font-semibold tabular-nums text-foreground">
            {totalConversations.toLocaleString("ja-JP")}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-lg dark:shadow-black/40">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
            保存済み
          </p>
          <p className="mt-2 text-[32px] font-semibold tabular-nums text-foreground">
            {savedPlaceholder.toLocaleString("ja-JP")}
          </p>
          <p className="mt-2 text-[12px] text-[var(--muted)]">
            ブックマークは近日対応予定です
          </p>
        </div>
      </div>

      <section className="mt-12">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold text-foreground">
          <MessageSquare className="h-5 w-5 text-[var(--accent)]" aria-hidden />
          アクティビティ
        </h2>
        <p className="mt-1 text-[13px] text-[var(--muted)]">
          最近利用したエージェント
        </p>

        {recentAgents.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-[var(--border)] bg-[var(--card-elevated)]/50 p-10 text-center shadow-inner">
            <p className="text-[15px] text-[var(--muted)]">
              まだ利用履歴がありません。
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-[var(--accent)] px-6 py-3 text-[14px] font-semibold text-white shadow-lg shadow-[var(--accent)]/20 transition hover:opacity-95"
            >
              最初のエージェントを探す
            </Link>
          </div>
        ) : (
          <ul className="mt-6 space-y-2">
            {recentAgents.map((a) => (
              <li key={a.slug}>
                <Link
                  href={`/agents/${a.slug}`}
                  className="flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-md transition hover:border-[var(--accent)]/40 dark:shadow-black/30"
                >
                  <span
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--card-elevated)] text-2xl"
                    aria-hidden
                  >
                    {a.iconEmoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[16px] font-semibold text-foreground">
                      {a.title}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-[var(--muted)]">
                      <Clock className="h-3.5 w-3.5" aria-hidden />
                      {a.lastAt.toLocaleString("ja-JP")}
                    </p>
                  </div>
                  <Bot className="h-5 w-5 shrink-0 text-[var(--muted)]" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
