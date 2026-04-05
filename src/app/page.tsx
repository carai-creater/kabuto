import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AgentCard } from "@/components/agent-card";
import { isDatabaseConfigured } from "@/lib/is-database-configured";

export default async function Home() {
  if (!isDatabaseConfigured()) {
    return (
      <div className="flex min-h-full flex-1 flex-col">
        <main className="relative flex flex-1 flex-col px-5 pb-28 pt-14 sm:px-8">
          <div className="relative mx-auto w-full max-w-2xl surface-card p-8 sm:p-10">
            <h1 className="text-[21px] font-semibold tracking-tight text-foreground">
              データベースが未設定です
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed text-[var(--muted)]">
              Vercel の Project → Settings → Environment Variables に{" "}
              <code className="rounded-lg bg-[var(--card-elevated)] px-2 py-0.5 text-[13px] text-foreground ring-1 ring-[var(--border)]">
                DATABASE_URL
              </code>{" "}
              を追加し、Postgres（Supabase / Neon 等）の接続文字列を設定してください。その後{" "}
              <code className="rounded-lg bg-[var(--card-elevated)] px-2 py-0.5 text-[13px] ring-1 ring-[var(--border)]">
                npx prisma migrate deploy
              </code>{" "}
              と{" "}
              <code className="rounded-lg bg-[var(--card-elevated)] px-2 py-0.5 text-[13px] ring-1 ring-[var(--border)]">
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
      <main className="relative flex flex-1 flex-col px-5 pb-28 pt-12 sm:px-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-15%,rgb(0_113_227/0.06),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-15%,rgb(212_175_55/0.07),transparent)]"
        />
        <div className="relative mx-auto w-full max-w-5xl">
          {loadError && (
            <div className="mb-10 surface-card border-[var(--destructive)]/25 bg-[var(--destructive)]/5 p-6 text-[15px] text-[var(--destructive)]">
              {loadError}
            </div>
          )}
          <div className="mb-12 flex flex-col gap-6 sm:mb-16 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                Marketplace
              </p>
              <h1 className="mt-2 text-[32px] font-semibold leading-tight tracking-tight text-foreground sm:text-[40px]">
                エージェントを探す
              </h1>
              <p className="mt-3 text-[17px] leading-relaxed text-[var(--muted)]">
                評価と利用回数を確認し、会話スターターからすぐ試せます。
              </p>
            </div>
            <Link
              href="/wallet"
              className="inline-flex w-fit items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] px-5 py-2.5 text-[15px] font-medium text-[var(--accent)] shadow-sm transition hover:opacity-90 dark:shadow-none"
            >
              ウォレット
            </Link>
          </div>

          {!loadError && agents.length === 0 ? (
            <p className="surface-card px-8 py-14 text-center text-[15px] text-[var(--muted)]">
              まだ公開エージェントがありません。{" "}
              <code className="rounded-md bg-[var(--card-elevated)] px-2 py-0.5 text-[13px] ring-1 ring-[var(--border)]">
                npm run db:seed
              </code>{" "}
              でサンプルを投入してください。
            </p>
          ) : !loadError ? (
            <ul className="grid gap-5 sm:grid-cols-2 sm:gap-6">
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
