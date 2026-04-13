import Link from "next/link";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { DbUnavailableMessage } from "@/components/db-unavailable";
import { isDatabaseConfigured } from "@/lib/is-database-configured";
import { BuyPointsPanel } from "@/components/buy-points-panel";
import { grantWalletPromoIfNeeded } from "@/lib/wallet-promo";

const ledgerWithAgent = {
  include: {
    agent: { select: { title: true, slug: true } },
  },
} satisfies Prisma.UsageLedgerFindManyArgs;

type UsageLedgerRow = Prisma.UsageLedgerGetPayload<typeof ledgerWithAgent>;

export default async function WalletPage({
  searchParams,
}: {
  searchParams: Promise<{ purchased?: string }>;
}) {
  if (!isDatabaseConfigured()) {
    return <DbUnavailableMessage />;
  }

  const userId = await getSessionUserId();
  if (!userId) {
    redirect("/login?next=%2Fwallet");
  }

  await grantWalletPromoIfNeeded(userId);

  const { purchased } = await searchParams;

  let wallet: { balancePt: number } | null = null;
  let rows: UsageLedgerRow[] = [];
  let recentPurchases: { amountPt: number; amountYen: number; status: string; createdAt: Date }[] = [];

  try {
    [wallet, rows, recentPurchases] = await Promise.all([
      prisma.wallet.findUnique({
        where: { userId },
        select: { balancePt: true },
      }),
      prisma.usageLedger.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 40,
        ...ledgerWithAgent,
      }),
      prisma.pointPurchase.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { amountPt: true, amountYen: true, status: true, createdAt: true },
      }),
    ]);
  } catch {
    return <DbUnavailableMessage />;
  }

  const stripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY);

  return (
    <div className="mx-auto w-full max-w-4xl pb-8">
      <h1 className="text-[28px] font-semibold tracking-tight text-foreground sm:text-[32px]">
        ウォレット
      </h1>

      {purchased === "1" && (
        <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-[14px] font-medium text-emerald-700 dark:text-emerald-300">
          ポイントの購入が完了しました。反映まで少し時間がかかる場合があります。
        </div>
      )}

      {/* 残高 */}
      <div className="surface-card mt-8 p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
          現在の残高
        </p>
        <p className="mt-2 text-[44px] font-semibold leading-none tracking-tight tabular-nums text-[var(--brand)]">
          {(wallet?.balancePt ?? 0).toLocaleString("ja-JP")}
          <span className="ml-1 text-[24px] font-semibold text-[var(--subtle)]">
            pt
          </span>
        </p>
      </div>

      {/* ポイント購入 */}
      <section className="mt-10">
        <h2 className="text-[18px] font-semibold tracking-tight text-foreground">
          ポイントを購入
        </h2>
        <p className="mt-1 text-[14px] text-[var(--muted)]">
          1 pt = 1 円。ポイントはすべてのサービスで共通利用できます。
        </p>
        {stripeConfigured ? (
          <BuyPointsPanel />
        ) : (
          <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card-elevated)] px-5 py-5 text-[14px] text-[var(--muted)]">
            決済機能は準備中です。管理者に連絡してください。
          </div>
        )}
      </section>

      {/* 購入履歴 */}
      {recentPurchases.length > 0 && (
        <section className="mt-10">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
            購入履歴
          </h2>
          <ul className="mt-4 divide-y divide-[var(--border)] overflow-hidden rounded-[18px] border border-[var(--border)] bg-[var(--card)]">
            {recentPurchases.map((p, i) => (
              <li key={i} className="flex items-center justify-between gap-4 px-5 py-3 text-[14px]">
                <div>
                  <span className="font-medium tabular-nums text-foreground">
                    +{p.amountPt.toLocaleString("ja-JP")} pt
                  </span>
                  <span className="ml-2 text-[12px] text-[var(--muted)]">
                    {p.amountYen.toLocaleString("ja-JP")} 円
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                      p.status === "completed"
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                        : p.status === "failed"
                          ? "bg-red-500/15 text-red-600 dark:text-red-400"
                          : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                    }`}
                  >
                    {p.status === "completed" ? "完了" : p.status === "failed" ? "失敗" : "処理中"}
                  </span>
                  <span className="text-[12px] text-[var(--muted)]">
                    {p.createdAt.toLocaleDateString("ja-JP")}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 利用履歴 */}
      <section className="mt-10">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
          利用履歴
        </h2>
        {rows.length === 0 ? (
          <p className="mt-4 text-[15px] text-[var(--muted)]">
            まだ利用履歴がありません。
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-[var(--border)] overflow-hidden rounded-[18px] border border-[var(--border)] bg-[var(--card)] shadow-sm dark:shadow-none">
            {rows.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-baseline justify-between gap-2 px-5 py-4 text-[15px]"
              >
                <div>
                  <Link
                    href={`/agents/${r.agent.slug}`}
                    className="font-medium text-[var(--accent)] hover:underline"
                  >
                    {r.agent.title}
                  </Link>
                  <p className="mt-0.5 text-[12px] text-[var(--muted)]">
                    {r.createdAt.toLocaleString("ja-JP")}
                  </p>
                </div>
                <span className="tabular-nums text-foreground">
                  -{r.pointsCharged} pt
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
