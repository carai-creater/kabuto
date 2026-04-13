import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Bot,
  ChevronRight,
  Clock,
  CreditCard,
  MessageSquare,
  Sparkles,
  Star,
  Wallet,
} from "lucide-react";

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
    redirect("/login?next=%2Fdashboard");
  }

  let user: { name: string | null; email: string } | null = null;
  let wallet: { balancePt: number } | null = null;
  let recentLines: {
    slug: string;
    title: string;
    iconEmoji: string;
    lastAt: Date;
  }[] = [];
  let favorites: { id: string; slug: string; title: string; iconEmoji: string }[] = [];

  try {
    const [u, w, ledgers, favRows] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true },
      }),
      prisma.wallet.findUnique({
        where: { userId },
        select: { balancePt: true },
      }),
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
      prisma.agentFavorite.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: {
          agent: { select: { id: true, slug: true, title: true, iconEmoji: true } },
        },
      }),
    ]);
    user = u;
    wallet = w;
    favorites = favRows.map((r) => r.agent);

    const seen = new Set<string>();
    for (const row of ledgers) {
      if (seen.has(row.agentId)) continue;
      seen.add(row.agentId);
      recentLines.push({
        slug: row.agent.slug,
        title: row.agent.title,
        iconEmoji: row.agent.iconEmoji,
        lastAt: row.createdAt,
      });
      if (recentLines.length >= 8) break;
    }
  } catch {
    return <DbUnavailableMessage />;
  }

  const displayName = user?.name ?? user?.email ?? "User";

  return (
    <div className="w-full">
      <header className="border-b border-slate-200/80 pb-8 dark:border-slate-800">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          マイページ
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          Welcome back, {displayName}!
        </h1>
        <p className="mt-3 max-w-2xl text-base text-slate-600 dark:text-slate-400">
          残高と直近の会話
        </p>
      </header>

      {/* お気に入り */}
      {favorites.length > 0 && (
        <section className="mt-10">
          <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <Star className="h-4 w-4 text-amber-500" aria-hidden />
            お気に入り
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {favorites.map((a) => (
              <Link
                key={a.id}
                href={`/agents/${a.slug}`}
                className="group flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-4 text-center shadow-sm transition hover:border-amber-400/60 hover:shadow-md dark:border-slate-700 dark:bg-slate-900/80"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-2xl dark:bg-slate-800">
                  {a.iconEmoji}
                </span>
                <p className="line-clamp-2 text-[13px] font-semibold text-slate-800 dark:text-slate-100">
                  {a.title}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="mt-10 flex flex-col gap-8">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* 残高 */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-none sm:p-8">
            <div className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <Wallet className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden />
              残高 (pt)
            </div>
            <p className="mt-5 text-5xl font-extrabold tabular-nums tracking-tight text-blue-600 dark:text-blue-400">
              {(wallet?.balancePt ?? 0).toLocaleString("ja-JP")}
              <span className="ml-2 text-xl font-semibold text-slate-500 dark:text-slate-400">
                pt
              </span>
            </p>
          </section>

          {/* 最近の会話 */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-none sm:p-8">
            <div className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden />
              最近の会話
            </div>

            {recentLines.length === 0 ? (
              <div className="mt-8 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-950/50">
                <div
                  className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/15 to-violet-500/15 ring-1 ring-blue-500/20 dark:from-blue-500/20 dark:to-violet-500/10"
                  aria-hidden
                >
                  <div className="relative">
                    <Bot className="h-10 w-10 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
                    <Sparkles className="absolute -right-1 -top-1 h-5 w-5 text-amber-400" strokeWidth={2} />
                  </div>
                </div>
                <p className="mt-5 text-sm font-medium text-slate-600 dark:text-slate-300">
                  会話はまだありません
                </p>
                <Link
                  href="/"
                  className="mt-6 inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/25 transition hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400"
                >
                  エージェントを見る
                </Link>
              </div>
            ) : (
              <ul className="mt-6 divide-y divide-slate-100 dark:divide-slate-800">
                {recentLines.map((a) => (
                  <li key={a.slug}>
                    <Link
                      href={`/agents/${a.slug}`}
                      aria-label={`${a.title} を開く`}
                      className="group flex items-center gap-4 py-4 pr-1 transition first:pt-0 last:pb-0 hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                    >
                      <span
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl dark:bg-slate-800"
                        aria-hidden
                      >
                        {a.iconEmoji}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {a.title}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                          <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          {a.lastAt.toLocaleString("ja-JP")}
                        </p>
                      </div>
                      <ChevronRight
                        className="h-5 w-5 shrink-0 text-slate-400 transition group-hover:text-blue-600 dark:text-slate-500 dark:group-hover:text-blue-400"
                        aria-hidden
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div>
          <Link
            href="/wallet#charge"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-4 text-[15px] font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-500 sm:w-auto sm:min-w-[280px] dark:bg-blue-600 dark:hover:bg-blue-500"
          >
            <CreditCard className="h-5 w-5" aria-hidden />
            クレジットをチャージ
          </Link>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-500">
            Stripe 連携は準備中
          </p>
        </div>
      </div>
    </div>
  );
}
