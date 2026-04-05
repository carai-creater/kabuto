import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { DbUnavailableMessage } from "@/components/db-unavailable";
import { isDatabaseConfigured } from "@/lib/is-database-configured";
import { PAGE_SHELL } from "@/lib/page-shell";

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
  let recent: {
    id: string;
    createdAt: Date;
    pointsCharged: number;
    agent: { title: string; slug: string };
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
        take: 15,
        include: {
          agent: { select: { title: true, slug: true } },
        },
      }),
    ]);
    user = u;
    wallet = w;
    recent = ledgers;
  } catch {
    return <DbUnavailableMessage />;
  }

  const greeting = user?.name ?? user?.email ?? "ユーザー";

  return (
    <main className={`relative flex flex-1 flex-col pb-28 pt-10 ${PAGE_SHELL}`}>
      <div className="mx-auto w-full max-w-3xl">
        <p className="text-[12px] font-semibold tracking-[0.08em] text-[var(--muted)]">
          マイページ
        </p>
        <h1 className="mt-2 text-[28px] font-semibold tracking-tight text-foreground sm:text-[32px]">
          ダッシュボード
        </h1>
        <p className="mt-2 text-[15px] text-[var(--muted)]">
          {greeting} さん — 利用状況とウォレットの概要です。
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <div className="agent-card-surface p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
              ウォレット残高
            </p>
            <p className="mt-2 text-[32px] font-semibold tabular-nums text-[var(--brand)]">
              {(wallet?.balancePt ?? 0).toLocaleString("ja-JP")}
              <span className="text-[15px] font-medium text-[var(--muted)]"> pt</span>
            </p>
            <Link
              href="/wallet"
              className="mt-4 inline-flex text-[14px] font-medium text-[var(--accent)] hover:underline"
            >
              詳細・履歴を見る →
            </Link>
          </div>
          <div className="agent-card-surface flex flex-col justify-between p-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                ショートカット
              </p>
              <ul className="mt-3 space-y-2 text-[15px]">
                <li>
                  <Link href="/" className="text-[var(--accent)] hover:underline">
                    エージェントを探す
                  </Link>
                </li>
                <li>
                  <Link href="/creator" className="text-[var(--accent)] hover:underline">
                    クリエイターダッシュボード
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <section className="mt-12">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
            最近の利用
          </h2>
          {recent.length === 0 ? (
            <p className="mt-4 text-[15px] text-[var(--muted)]">
              まだ利用履歴がありません。トップからエージェントを選んで会話を始めてください。
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-[var(--border)] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
              {recent.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-3.5"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/agents/${row.agent.slug}`}
                      className="text-[15px] font-medium text-[var(--accent)] hover:underline"
                    >
                      {row.agent.title}
                    </Link>
                    <p className="text-[12px] text-[var(--muted)]">
                      {row.createdAt.toLocaleString("ja-JP")} · −
                      {row.pointsCharged} pt
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
