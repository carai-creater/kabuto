import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AgentCard } from "@/components/agent-card";

export default async function Home() {
  const agents = await prisma.agent.findMany({
    where: { isPublished: true },
    orderBy: { usageCount: "desc" },
  });

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <main className="relative flex flex-1 flex-col px-4 pb-24 pt-10 sm:px-6">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(212,175,55,0.1),transparent)]"
        />
        <div className="relative mx-auto w-full max-w-6xl">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#D4AF37]/90">
                Marketplace
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
                エージェントを探す
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-400">
                評価と利用回数を確認し、会話スターターからすぐ試せます。実行完了時にのみポイントが消費されます。
              </p>
            </div>
            <Link
              href="/wallet"
              className="inline-flex w-fit items-center justify-center rounded-xl border border-[#D4AF37]/35 bg-[#D4AF37]/10 px-4 py-2 text-sm font-medium text-[#E8D48B] transition hover:bg-[#D4AF37]/15"
            >
              ウォレットを見る
            </Link>
          </div>

          {agents.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-white/15 bg-zinc-950/40 p-10 text-center text-sm text-zinc-500">
              まだ公開エージェントがありません。{" "}
              <code className="rounded bg-white/5 px-1.5 py-0.5 text-zinc-300">
                npm run db:seed
              </code>{" "}
              でサンプルを投入してください。
            </p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {agents.map((a) => (
                <li key={a.id}>
                  <AgentCard agent={a} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
