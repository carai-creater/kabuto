import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";

export default async function WalletPage() {
  const userId = await getSessionUserId();
  if (!userId) {
    redirect("/demo");
  }

  const [wallet, rows] = await Promise.all([
    prisma.wallet.findUnique({
      where: { userId },
      select: { balancePt: true },
    }),
    prisma.usageLedger.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 40,
      include: {
        agent: { select: { title: true, slug: true } },
      },
    }),
  ]);

  return (
    <main className="relative flex flex-1 flex-col px-4 pb-24 pt-8 sm:px-6">
      <div className="relative mx-auto w-full max-w-3xl">
        <h1 className="text-2xl font-semibold text-zinc-50">ウォレット</h1>
        <p className="mt-2 text-sm text-zinc-400">
          プリペイド残高と消費履歴。Stripe 連携は今後のスプリントで接続します。
        </p>

        <div className="mt-8 rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/5 p-6">
          <p className="text-xs uppercase tracking-wider text-zinc-500">
            残高
          </p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-[#E8D48B]">
            {(wallet?.balancePt ?? 0).toLocaleString("ja-JP")}{" "}
            <span className="text-lg font-medium text-[#C9A227]">pt</span>
          </p>
          <p className="mt-3 text-xs text-zinc-500">
            例: 500 円 = 500pt、1,000 円 = 1,100pt（ボーナス）は Stripe 決済で実装予定。
          </p>
        </div>

        <section className="mt-10">
          <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-500">
            消費ログ
          </h2>
          {rows.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-500">まだ利用履歴がありません。</p>
          ) : (
            <ul className="mt-3 divide-y divide-white/10 rounded-2xl border border-white/10 bg-zinc-950/40">
              {rows.map((r) => (
                <li
                  key={r.id}
                  className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-3 text-sm"
                >
                  <div>
                    <Link
                      href={`/agents/${r.agent.slug}`}
                      className="font-medium text-zinc-200 hover:text-white"
                    >
                      {r.agent.title}
                    </Link>
                    <p className="text-xs text-zinc-500">
                      {r.createdAt.toLocaleString("ja-JP")}
                    </p>
                  </div>
                  <div className="text-right text-xs text-zinc-500">
                    <span className="tabular-nums text-zinc-200">
                      -{r.pointsCharged} pt
                    </span>
                    <span className="ml-2 block text-[10px] text-zinc-600">
                      クリエイター +{r.creatorEarningsPt} / 手数料 {r.platformFeePt}
                    </span>
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
