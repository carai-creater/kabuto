import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AgentCard } from "@/components/agent-card";
import { isDatabaseConfigured } from "@/lib/is-database-configured";

export default async function Home() {
  if (!isDatabaseConfigured()) {
    return (
      <div className="flex min-h-full flex-1 flex-col">
        <main className="relative flex flex-1 flex-col px-4 pb-24 pt-10 sm:px-6">
          <div className="relative mx-auto w-full max-w-6xl rounded-2xl border border-amber-500/30 bg-amber-500/5 p-8 text-sm text-zinc-200">
            <h1 className="text-lg font-semibold text-amber-200">
              データベースが未設定です
            </h1>
            <p className="mt-3 leading-relaxed text-zinc-400">
              Vercel の Project → Settings → Environment Variables に{" "}
              <code className="rounded bg-black/40 px-1.5 py-0.5 text-zinc-300">
                DATABASE_URL
              </code>{" "}
              を追加し、Postgres（Supabase / Neon 等）の接続文字列を設定してください。その後{" "}
              <code className="rounded bg-black/40 px-1.5 py-0.5">
                npx prisma migrate deploy
              </code>{" "}
              と{" "}
              <code className="rounded bg-black/40 px-1.5 py-0.5">
                npm run db:seed
              </code>{" "}
              を実行してスキーマとデモデータを投入します。
            </p>
          </div>
        </main>
      </div>
    );
  }

  let agents: Awaited<ReturnType<typeof prisma.agent.findMany>> = [];
  let loadError: string | null = null;

  try {
    agents = await prisma.agent.findMany({
      where: { isPublished: true },
      orderBy: { usageCount: "desc" },
    });
  } catch (err) {
    console.error("[Home] database error:", err);
    loadError =
      "データベースに接続できません。DATABASE_URL・SSL・IP 許可（Supabase など）を確認してください。";
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <main className="relative flex flex-1 flex-col px-4 pb-24 pt-10 sm:px-6">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(212,175,55,0.1),transparent)]"
        />
        <div className="relative mx-auto w-full max-w-6xl">
          {loadError && (
            <div className="mb-8 rounded-2xl border border-red-500/30 bg-red-500/5 p-6 text-sm text-red-200">
              {loadError}
            </div>
          )}
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

          {!loadError && agents.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-white/15 bg-zinc-950/40 p-10 text-center text-sm text-zinc-500">
              まだ公開エージェントがありません。{" "}
              <code className="rounded bg-white/5 px-1.5 py-0.5 text-zinc-300">
                npm run db:seed
              </code>{" "}
              でサンプルを投入してください。
            </p>
          ) : !loadError ? (
            <ul className="grid gap-4 sm:grid-cols-2">
              {agents.map((a) => (
                <li key={a.id}>
                  <AgentCard agent={a} />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </main>
    </div>
  );
}
