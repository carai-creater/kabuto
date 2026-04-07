import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock, CreditCard, MessageSquare, Wallet } from "lucide-react";

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
  let recentLines: {
    slug: string;
    title: string;
    iconEmoji: string;
    lastAt: Date;
  }[] = [];

  try {
    const [u, w, ledgers] = await Promise.all([
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
    ]);
    user = u;
    wallet = w;

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

  const greeting = user?.name ?? user?.email ?? "ユーザー";

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div>
        <p className="text-[12px] font-semibold tracking-[0.08em] text-[var(--muted)]">
          マイページ
        </p>
        <h1 className="mt-2 text-[28px] font-semibold tracking-tight text-foreground sm:text-[32px]">
          ようこそ、{greeting} さん
        </h1>
        <p className="mt-2 text-[15px] text-[var(--muted)]">
          残高と最近の会話を確認できます。
        </p>
      </div>

      <div className="mt-10 flex flex-col gap-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-lg ring-1 ring-black/5 dark:shadow-black/40 dark:ring-white/5">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-[var(--muted)]">
              <Wallet className="h-4 w-4 text-[var(--accent)]" aria-hidden />
              残高 (pt)
            </div>
            <p className="mt-4 text-[40px] font-semibold tabular-nums leading-none text-[var(--brand)]">
              {(wallet?.balancePt ?? 0).toLocaleString("ja-JP")}
              <span className="ml-1 text-[18px] font-medium text-[var(--muted)]">
                pt
              </span>
            </p>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-lg ring-1 ring-black/5 dark:shadow-black/40 dark:ring-white/5">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-[var(--muted)]">
              <MessageSquare className="h-4 w-4 text-[var(--accent)]" aria-hidden />
              最近の会話
            </div>
            {recentLines.length === 0 ? (
              <p className="mt-4 text-[14px] leading-relaxed text-[var(--muted)]">
                まだ会話履歴がありません。トップからエージェントを選んでください。
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {recentLines.map((a) => (
                  <li key={a.slug}>
                    <Link
                      href={`/agents/${a.slug}`}
                      className="flex items-center gap-3 rounded-lg border border-transparent px-1 py-1 transition hover:border-[var(--border)] hover:bg-[var(--card-elevated)]"
                    >
                      <span className="text-xl" aria-hidden>
                        {a.iconEmoji}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-medium text-foreground">
                          {a.title}
                        </p>
                        <p className="flex items-center gap-1 text-[11px] text-[var(--muted)]">
                          <Clock className="h-3 w-3" aria-hidden />
                          {a.lastAt.toLocaleString("ja-JP")}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div>
          <Link
            href="/wallet#charge"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-4 text-[15px] font-semibold text-white shadow-lg shadow-[var(--accent)]/25 transition hover:opacity-95 sm:w-auto sm:min-w-[280px]"
          >
            <CreditCard className="h-5 w-5" aria-hidden />
            クレジットをチャージ
          </Link>
          <p className="mt-2 text-[12px] text-[var(--muted)]">
            Stripe 連携は今後のスプリントで接続予定です（ウォレット画面へ）。
          </p>
        </div>
      </div>
    </div>
  );
}
