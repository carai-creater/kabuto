import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";

export default async function CreatorPage() {
  const userId = await getSessionUserId();
  if (!userId) {
    redirect("/demo");
  }

  const [cw, agents] = await Promise.all([
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

  if (agents.length === 0 && !cw) {
    return (
      <main className="relative flex flex-1 flex-col px-4 pb-24 pt-8 sm:px-6">
        <div className="relative mx-auto w-full max-w-3xl">
          <h1 className="text-2xl font-semibold text-zinc-50">
            クリエイターダッシュボード
          </h1>
          <p className="mt-3 text-sm text-zinc-400">
            このアカウントではまだエージェントを作成していません。Bob
            のデモアカウントでログインするとサンプルが表示されます。
          </p>
          <Link
            href="/demo"
            className="mt-6 inline-flex rounded-xl border border-[#D4AF37]/35 bg-[#D4AF37]/10 px-4 py-2 text-sm text-[#E8D48B]"
          >
            デモで切り替え
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="relative flex flex-1 flex-col px-4 pb-24 pt-8 sm:px-6">
      <div className="relative mx-auto w-full max-w-3xl">
        <h1 className="text-2xl font-semibold text-zinc-50">
          クリエイターダッシュボード
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          利用回数・単価・評価のサマリー（分析の骨格）。
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-zinc-950/50 p-5">
            <p className="text-xs uppercase tracking-wider text-zinc-500">
              報酬残高（pt）
            </p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-[#E8D48B]">
              {(cw?.balancePt ?? 0).toLocaleString("ja-JP")}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-zinc-950/50 p-5">
            <p className="text-xs uppercase tracking-wider text-zinc-500">
              公開エージェント
            </p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-zinc-100">
              {agents.filter((a) => a.isPublished).length}
            </p>
          </div>
        </div>

        <section className="mt-10">
          <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-500">
            あなたのエージェント
          </h2>
          <ul className="mt-3 divide-y divide-white/10 rounded-2xl border border-white/10 bg-zinc-950/40">
            {agents.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div>
                  <Link
                    href={`/agents/${a.slug}`}
                    className="font-medium text-zinc-200 hover:text-white"
                  >
                    {a.title}
                  </Link>
                  <p className="text-xs text-zinc-500">
                    {a.pricePerUsePt} pt/回 · 利用 {a.usageCount} · 評価{" "}
                    {Number(a.ratingAvg).toFixed(1)}（{a.reviewCount} 件）
                  </p>
                </div>
                <span className="text-xs text-zinc-600">
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
