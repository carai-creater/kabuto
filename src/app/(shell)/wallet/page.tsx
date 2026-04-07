import Link from "next/link";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { DbUnavailableMessage } from "@/components/db-unavailable";
import { isDatabaseConfigured } from "@/lib/is-database-configured";
const ledgerWithAgent = {
  include: {
    agent: { select: { title: true, slug: true } },
  },
} satisfies Prisma.UsageLedgerFindManyArgs;

type UsageLedgerRow = Prisma.UsageLedgerGetPayload<typeof ledgerWithAgent>;

export default async function WalletPage() {
  if (!isDatabaseConfigured()) {
    return <DbUnavailableMessage />;
  }

  const userId = await getSessionUserId();
  if (!userId) {
    redirect("/demo");
  }

  let wallet: { balancePt: number } | null = null;
  let rows: UsageLedgerRow[] = [];

  try {
    [wallet, rows] = await Promise.all([
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
    ]);
  } catch {
    return <DbUnavailableMessage />;
  }

  return (
    <div className="mx-auto w-full max-w-4xl pb-8">
      <h1 className="text-[28px] font-semibold tracking-tight text-foreground sm:text-[32px]">
        ウォレット
      </h1>
      <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)]">
        プリペイド残高と消費履歴。Stripe 連携は今後のスプリントで接続します。
      </p>

      <div id="charge" className="surface-card mt-10 scroll-mt-24 p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
            残高
          </p>
          <p className="mt-2 text-[40px] font-semibold leading-none tracking-tight tabular-nums text-[var(--brand)]">
            {(wallet?.balancePt ?? 0).toLocaleString("ja-JP")}
            <span className="ml-1 text-[22px] font-semibold text-[var(--subtle)]">
              pt
            </span>
          </p>
          <p className="mt-4 text-[13px] leading-relaxed text-[var(--muted)]">
            例: 500 円 = 500pt、1,000 円 = 1,100pt（ボーナス）は Stripe 決済で実装予定。
          </p>
        </div>

        <section className="mt-12">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
            消費ログ
          </h2>
          {rows.length === 0 ? (
            <p className="mt-4 text-[15px] text-[var(--muted)]">
              まだ利用履歴がありません。
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-[var(--border)] overflow-hidden rounded-[22px] border border-[var(--border)] bg-[var(--card)] shadow-sm dark:shadow-none">
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
                  <div className="text-right text-[12px] text-[var(--muted)]">
                    <span className="tabular-nums text-foreground">
                      -{r.pointsCharged} pt
                    </span>
                    <span className="ml-2 block text-[11px] text-[var(--muted)]">
                      クリエイター +{r.creatorEarningsPt} / 手数料{" "}
                      {r.platformFeePt}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
    </div>
  );
}
