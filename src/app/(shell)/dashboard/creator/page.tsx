import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BarChart3,
  Bot,
  Pencil,
  Plus,
  Sparkles,
  Star,
  Store,
} from "lucide-react";

import { ensureProfileForUser } from "@/lib/auth/profile";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { DbUnavailableMessage } from "@/components/db-unavailable";
import { isDatabaseConfigured } from "@/lib/is-database-configured";

export async function generateMetadata() {
  return { title: "クリエイターダッシュボード — kabuto" };
}

export default async function CreatorDashboardPage() {
  if (!isDatabaseConfigured()) {
    return <DbUnavailableMessage />;
  }

  const userId = await getSessionUserId();
  if (!userId) {
    redirect("/login?next=%2Fdashboard%2Fcreator");
  }

  try {
    await ensureProfileForUser(userId);
  } catch {
    return <DbUnavailableMessage />;
  }

  let agents: {
    id: string;
    slug: string;
    title: string;
    iconEmoji: string;
    pricePerUsePt: number;
    isPublished: boolean;
    ratingAvg: import("@prisma/client").Prisma.Decimal;
    reviewCount: number;
  }[] = [];

  let totalRevenuePt = 0;

  try {
    const [agentRows, revenueAgg] = await Promise.all([
      prisma.agent.findMany({
        where: { creatorId: userId },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          slug: true,
          title: true,
          iconEmoji: true,
          pricePerUsePt: true,
          isPublished: true,
          ratingAvg: true,
          reviewCount: true,
        },
      }),
      prisma.usageLedger.aggregate({
        where: { agent: { creatorId: userId } },
        _sum: { creatorEarningsPt: true },
      }),
    ]);
    agents = agentRows;
    totalRevenuePt = revenueAgg._sum.creatorEarningsPt ?? 0;
  } catch {
    return <DbUnavailableMessage />;
  }

  const publishedCount = agents.filter((a) => a.isPublished).length;

  let weightedStars = 0;
  let totalReviews = 0;
  for (const a of agents) {
    weightedStars += Number(a.ratingAvg) * a.reviewCount;
    totalReviews += a.reviewCount;
  }
  const avgRating =
    totalReviews > 0 ? weightedStars / totalReviews : 0;

  return (
    <div className="w-full">
      <header className="flex flex-col gap-6 border-b border-slate-200/80 pb-8 dark:border-slate-800 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Creator
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            クリエイターダッシュボード
          </h1>
          <p className="mt-2 max-w-xl text-slate-600 dark:text-slate-400">
            公開状況と売上
          </p>
        </div>
        <Link
          href="/dashboard/creator/new"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[var(--accent)]/20 transition hover:bg-[var(--accent-hover)] dark:bg-[var(--accent)] dark:hover:bg-[var(--accent-hover)]"
        >
          <Plus className="h-5 w-5" aria-hidden />
          新規作成
        </Link>
      </header>

      <section className="mt-10 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-none">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <Store className="h-4 w-4 text-[var(--accent)] dark:text-[var(--accent)]" aria-hidden />
            公開中のエージェント
          </div>
          <p className="mt-4 text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
            {publishedCount}
            <span className="ml-1 text-base font-medium text-slate-500 dark:text-slate-400">
              件
            </span>
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-none">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <BarChart3 className="h-4 w-4 text-[var(--accent)] dark:text-[var(--accent)]" aria-hidden />
            総売上 (pt)
          </div>
          <p className="mt-4 text-3xl font-bold tabular-nums text-[var(--accent)] dark:text-[var(--accent)]">
            {totalRevenuePt.toLocaleString("ja-JP")}
            <span className="ml-1 text-base font-medium text-slate-500 dark:text-slate-400">
              pt
            </span>
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-none">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <Star className="h-4 w-4 text-amber-500" aria-hidden />
            平均評価
          </div>
          <p className="mt-4 flex items-baseline gap-1.5 text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
            {totalReviews > 0 ? avgRating.toFixed(1) : "—"}
            {totalReviews > 0 ? (
              <span className="text-amber-500" aria-hidden>
                ★
              </span>
            ) : null}
          </p>
          <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-500">
            {totalReviews > 0
              ? `レビュー ${totalReviews.toLocaleString("ja-JP")} 件`
              : "レビューなし"}
          </p>
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[var(--accent)] dark:text-[var(--accent)]" aria-hidden />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            あなたのエージェント
          </h2>
        </div>

        {agents.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-950/50">
            <div
              className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent)]/15 to-[var(--accent)]/5 ring-1 ring-[var(--accent)]/20"
              aria-hidden
            >
              <div className="relative">
                <Bot className="h-10 w-10 text-[var(--accent)] dark:text-[var(--accent)]" strokeWidth={1.5} />
                <Sparkles className="absolute -right-1 -top-1 h-5 w-5 text-amber-400" strokeWidth={2} />
              </div>
            </div>
            <p className="mt-6 text-base font-semibold text-slate-800 dark:text-slate-100">
              エージェントはまだありません
            </p>
            <Link
              href="/dashboard/creator/new"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white shadow-md shadow-[var(--accent)]/20 transition hover:bg-[var(--accent-hover)]"
            >
              <Plus className="h-5 w-5" aria-hidden />
              新規作成
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-none">
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {agents.map((a) => (
                <li key={a.id}>
                  <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-5">
                    <div className="flex min-w-0 flex-1 items-center gap-4">
                      <span
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-2xl dark:bg-slate-800"
                        aria-hidden
                      >
                        {a.iconEmoji}
                      </span>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/dashboard/creator/edit/${encodeURIComponent(a.slug)}`}
                          className="truncate text-base font-semibold text-slate-900 hover:text-[var(--accent)] dark:text-white dark:hover:text-[var(--accent)]"
                        >
                          {a.title}
                        </Link>
                        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                          <span className="tabular-nums">
                            {a.pricePerUsePt.toLocaleString("ja-JP")} pt/回
                          </span>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                              a.isPublished
                                ? "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                                : "bg-slate-200/80 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                            }`}
                          >
                            {a.isPublished ? "公開中" : "下書き"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center justify-end gap-2 sm:justify-center">
                      <Link
                        href={`/dashboard/creator/edit/${encodeURIComponent(a.slug)}`}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-[var(--accent)]/40 hover:bg-[var(--brand-muted)] hover:text-[var(--accent)] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-[var(--accent)]/30 dark:hover:bg-slate-700 dark:hover:text-[var(--accent)]"
                      >
                        <Pencil className="h-4 w-4" aria-hidden />
                        編集
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
