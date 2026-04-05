import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { DbUnavailableMessage } from "@/components/db-unavailable";
import { isDatabaseConfigured } from "@/lib/is-database-configured";
import { PAGE_SHELL } from "@/lib/page-shell";

export default async function CreatorDashboardPage() {
  if (!isDatabaseConfigured()) {
    return <DbUnavailableMessage />;
  }

  const userId = await getSessionUserId();
  if (!userId) {
    redirect("/demo");
  }

  let cw: { balancePt: number } | null = null;
  let agents: {
    id: string;
    slug: string;
    title: string;
    usageCount: number;
    pricePerUsePt: number;
    ratingAvg: import("@prisma/client").Prisma.Decimal;
    reviewCount: number;
    isPublished: boolean;
  }[] = [];

  try {
    const pair = await Promise.all([
      prisma.creatorWallet.findUnique({
        where: { userId },
        select: { balancePt: true },
      }),
      prisma.agent.findMany({
        where: { creatorId: userId },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          slug: true,
          title: true,
          usageCount: true,
          pricePerUsePt: true,
          ratingAvg: true,
          reviewCount: true,
          isPublished: true,
        },
      }),
    ]);
    cw = pair[0];
    agents = pair[1];
  } catch {
    return <DbUnavailableMessage />;
  }

  if (agents.length === 0 && !cw) {
    return (
      <main
        className={`relative flex flex-1 flex-col pb-28 pt-10 ${PAGE_SHELL}`}
      >
        <div className="mx-auto w-full max-w-3xl">
          <p className="text-[12px] font-semibold tracking-[0.08em] text-[var(--muted)]">
            クリエイター
          </p>
          <h1 className="mt-2 text-[28px] font-semibold tracking-tight text-foreground sm:text-[32px]">
            ダッシュボード
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-[var(--muted)]">
            このアカウントではまだエージェントがありません。Bob
            のデモアカウントでログインするとサンプルが表示されます。
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/demo"
              className="inline-flex rounded-full border border-[var(--border)] bg-[var(--card)] px-5 py-2.5 text-[15px] font-medium text-[var(--accent)] shadow-sm transition hover:opacity-90 dark:shadow-none"
            >
              デモで切り替え
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex rounded-full px-5 py-2.5 text-[15px] font-medium text-[var(--muted)] hover:text-foreground"
            >
              利用者ダッシュボード
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const totalUses = agents.reduce((s, a) => s + a.usageCount, 0);

  return (
    <main className={`relative flex flex-1 flex-col pb-28 pt-10 ${PAGE_SHELL}`}>
      <div className="mx-auto w-full max-w-3xl">
        <p className="text-[12px] font-semibold tracking-[0.08em] text-[var(--muted)]">
          クリエイター
        </p>
        <h1 className="mt-2 text-[28px] font-semibold tracking-tight text-foreground sm:text-[32px]">
          ダッシュボード
        </h1>
        <p className="mt-2 text-[15px] text-[var(--muted)]">
          報酬・公開状況・各エージェントの利用状況です。Instruction / RAG /
          Tools は各エージェントのページ下部（作成者のみ表示）で確認できます。
        </p>

        <div className="mt-8 flex flex-wrap gap-3 text-[14px]">
          <Link
            href="/dashboard"
            className="text-[var(--accent)] hover:underline"
          >
            利用者向けマイページ →
          </Link>
          <span className="text-[var(--border-strong)]">|</span>
          <Link href="/" className="text-[var(--accent)] hover:underline">
            ストアを見る
          </Link>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <div className="agent-card-surface p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
              報酬残高
            </p>
            <p className="mt-2 text-[28px] font-semibold tabular-nums text-[var(--brand)]">
              {(cw?.balancePt ?? 0).toLocaleString("ja-JP")}
              <span className="text-[14px] font-medium text-[var(--muted)]">
                {" "}
                pt
              </span>
            </p>
          </div>
          <div className="agent-card-surface p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
              公開中
            </p>
            <p className="mt-2 text-[28px] font-semibold tabular-nums text-foreground">
              {agents.filter((a) => a.isPublished).length}
              <span className="text-[14px] font-medium text-[var(--muted)]">
                {" "}
                件
              </span>
            </p>
          </div>
          <div className="agent-card-surface p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
              累計実行
            </p>
            <p className="mt-2 text-[28px] font-semibold tabular-nums text-foreground">
              {totalUses.toLocaleString("ja-JP")}
            </p>
          </div>
        </div>

        <section className="mt-12">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
            あなたのエージェント
          </h2>
          <ul className="mt-4 divide-y divide-[var(--border)] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
            {agents.map((a) => (
              <li
                key={a.id}
                className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <Link
                    href={`/agents/${a.slug}`}
                    className="text-[17px] font-semibold text-[var(--accent)] hover:underline"
                  >
                    {a.title}
                  </Link>
                  <p className="mt-1 text-[13px] text-[var(--muted)]">
                    {a.pricePerUsePt} pt/回 · 利用 {a.usageCount.toLocaleString("ja-JP")}{" "}
                    · 評価 {Number(a.ratingAvg).toFixed(1)}（{a.reviewCount} 件）
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <span className="rounded-full border border-[var(--border)] px-2.5 py-0.5 text-[11px] text-[var(--muted)]">
                    {a.isPublished ? "公開" : "下書き"}
                  </span>
                  <Link
                    href={`/agents/${a.slug}`}
                    className="rounded-full bg-[var(--accent)] px-3 py-1.5 text-[12px] font-medium text-white hover:opacity-90"
                  >
                    開く
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
