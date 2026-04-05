import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AgentCard } from "@/components/agent-card";
import { isDatabaseConfigured } from "@/lib/is-database-configured";
import { PAGE_SHELL } from "@/lib/page-shell";

export default async function Home() {
  if (!isDatabaseConfigured()) {
    return (
      <div className="flex min-h-full flex-1 flex-col">
        <main
          className={`flex flex-1 flex-col items-center justify-center px-5 pb-24 pt-16 ${PAGE_SHELL}`}
        >
          <div className="surface-card w-full max-w-md p-8 text-center sm:p-10">
            <h1 className="text-[19px] font-semibold tracking-tight text-foreground">
              データベースが未設定です
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed text-[var(--muted)]">
              Vercel に{" "}
              <code className="rounded-md bg-[var(--card-elevated)] px-1.5 py-0.5 text-[13px] ring-1 ring-[var(--border)]">
                DATABASE_URL
              </code>{" "}
              を追加し、再デプロイ後に次を実行してください。
            </p>
            <pre className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--card-elevated)] px-4 py-3 text-left text-[13px] leading-relaxed text-foreground">
              npx prisma migrate deploy{"\n"}npm run db:seed
            </pre>
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
      "データベースに接続できません。DATABASE_URL・SSL・IP 許可を確認してください。";
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <main className="relative flex w-full flex-1 flex-col">
        <section
          className={`border-b border-[var(--border)] py-16 sm:py-20 ${PAGE_SHELL}`}
        >
          <div className="mx-auto max-w-xl text-center">
            <h1 className="text-balance text-[clamp(1.75rem,5vw,2.75rem)] font-semibold leading-tight tracking-tight text-foreground">
              エージェントを探す
            </h1>
            <p className="mx-auto mt-4 max-w-md text-pretty text-[15px] leading-relaxed text-[var(--muted)]">
              目的に合う AI エージェントを選び、詳細から会話を始められます。
            </p>
            <div className="mt-10">
              <a href="#agent-list" className="btn-primary inline-flex rounded-full px-8 py-3 text-[15px]">
                一覧を見る
              </a>
            </div>
            <p className="mt-8 text-[14px] text-[var(--muted)]">
              <Link href="/demo" className="text-[var(--accent)] hover:underline">
                デモでログイン
              </Link>
              <span className="mx-2 text-[var(--border-strong)]">·</span>
              <Link href="/wallet" className="text-[var(--accent)] hover:underline">
                ウォレット
              </Link>
            </p>
          </div>
        </section>

        <section
          id="agent-list"
          className={`scroll-mt-20 pb-24 pt-14 sm:pt-16 ${PAGE_SHELL}`}
          aria-labelledby="agent-list-heading"
        >
          {loadError && (
            <div className="mx-auto mb-10 max-w-lg rounded-2xl border border-[var(--destructive)]/25 bg-[var(--destructive)]/5 px-6 py-4 text-center text-[15px] text-[var(--destructive)]">
              {loadError}
            </div>
          )}

          <div className="mx-auto max-w-3xl text-center">
            <h2
              id="agent-list-heading"
              className="text-[22px] font-semibold tracking-tight text-foreground sm:text-[24px]"
            >
              すべてのエージェント
            </h2>
            <p className="mt-2 text-[15px] text-[var(--muted)]">
              {agents.length > 0
                ? `${agents.length} 件`
                : loadError
                  ? ""
                  : "公開中のエージェント"}
            </p>
          </div>

          {!loadError && agents.length === 0 ? (
            <p className="mx-auto mt-12 max-w-md text-center text-[15px] text-[var(--muted)]">
              まだありません。{" "}
              <code className="rounded-md bg-[var(--card-elevated)] px-2 py-0.5 text-[13px] ring-1 ring-[var(--border)]">
                npm run db:seed
              </code>{" "}
              でサンプルを投入できます。
            </p>
          ) : !loadError ? (
            <ul className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {agents.map((a) => (
                <li key={a.id}>
                  <AgentCard agent={a} />
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      </main>
    </div>
  );
}
