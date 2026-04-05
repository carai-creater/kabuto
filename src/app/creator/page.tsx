import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { DbUnavailableMessage } from "@/components/db-unavailable";
import { isDatabaseConfigured } from "@/lib/is-database-configured";
import { PAGE_SHELL } from "@/lib/page-shell";

export default async function CreatorPage() {
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
        className={`relative flex flex-1 flex-col pb-28 pt-12 ${PAGE_SHELL}`}
      >
        <div className="relative mx-auto w-full max-w-4xl xl:max-w-5xl">
          <h1 className="text-[32px] font-semibold tracking-tight text-foreground">
            クリエイターダッシュボード
          </h1>
          <p className="mt-3 text-[17px] leading-relaxed text-[var(--muted)]">
            このアカウントではまだエージェントを作成していません。Bob
            のデモアカウントでログインするとサンプルが表示されます。
          </p>
          <Link
            href="/demo"
            className="mt-8 inline-flex rounded-full border border-[var(--border)] bg-[var(--card)] px-5 py-2.5 text-[15px] font-medium text-[var(--accent)] shadow-sm transition hover:opacity-90 dark:shadow-none"
          >
            デモで切り替え
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className={`relative flex flex-1 flex-col pb-28 pt-12 ${PAGE_SHELL}`}>
      <div className="relative mx-auto w-full max-w-4xl xl:max-w-5xl">
        <h1 className="text-[32px] font-semibold tracking-tight text-foreground">
          クリエイターダッシュボード
        </h1>
        <p className="mt-2 text-[17px] leading-relaxed text-[var(--muted)]">
          利用回数・単価・評価のサマリー。
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          <div className="surface-card p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
              報酬残高（pt）
            </p>
            <p className="mt-2 text-[32px] font-semibold tabular-nums text-[var(--brand)]">
              {(cw?.balancePt ?? 0).toLocaleString("ja-JP")}
            </p>
          </div>
          <div className="surface-card p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
              公開エージェント
            </p>
            <p className="mt-2 text-[32px] font-semibold tabular-nums text-foreground">
              {agents.filter((a) => a.isPublished).length}
            </p>
          </div>
        </div>

        <section className="mt-12">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
            あなたのエージェント
          </h2>
          <ul className="mt-4 divide-y divide-[var(--border)] overflow-hidden rounded-[22px] border border-[var(--border)] bg-[var(--card)] shadow-sm dark:shadow-none">
            {agents.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
              >
                <div>
                  <Link
                    href={`/agents/${a.slug}`}
                    className="text-[17px] font-medium text-[var(--accent)] hover:underline"
                  >
                    {a.title}
                  </Link>
                  <p className="mt-0.5 text-[13px] text-[var(--muted)]">
                    {a.pricePerUsePt} pt/回 · 利用 {a.usageCount} · 評価{" "}
                    {Number(a.ratingAvg).toFixed(1)}（{a.reviewCount} 件）
                  </p>
                </div>
                <span className="text-[12px] text-[var(--muted)]">
                  {a.isPublished ? "公開" : "下書き"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
