import { prisma } from "@/lib/prisma";
import { AgentDirectory } from "@/components/agent-directory";
import { DbConnectionTips } from "@/components/db-connection-tips";
import { isDatabaseConfigured } from "@/lib/is-database-configured";
import { PAGE_SHELL } from "@/lib/page-shell";

/** トップは本文を狭めて中央に寄せる（大画面で右に空白が偏らないようにする） */
const CENTER = "mx-auto w-full max-w-lg text-center";

export default async function Home() {
  if (!isDatabaseConfigured()) {
    return (
      <div className="flex min-h-full flex-1 flex-col">
        <main
          className={`flex flex-1 flex-col items-center justify-center pb-24 pt-12 ${PAGE_SHELL}`}
        >
          <div className={`surface-card ${CENTER} max-w-md p-8 sm:p-9`}>
            <h1 className="text-[18px] font-semibold tracking-tight text-foreground">
              データベースが未設定です
            </h1>
            <p className="mt-3 text-[14px] leading-relaxed text-[var(--muted)]">
              Vercel に{" "}
              <code className="rounded-md bg-[var(--card-elevated)] px-1.5 py-0.5 text-[12px] ring-1 ring-[var(--border)]">
                DATABASE_URL
              </code>{" "}
              を追加して再デプロイし、次を実行してください。
            </p>
            <pre className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card-elevated)] px-4 py-3 text-left text-[12px] leading-relaxed text-foreground">
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
    loadError = "connection_failed";
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <main className="relative flex w-full flex-1 flex-col items-center">
        <section
          id="agent-list"
          className={`w-full scroll-mt-20 pb-20 pt-10 sm:pt-12 ${PAGE_SHELL} flex flex-col items-center`}
          aria-labelledby="agent-list-heading"
        >
          {loadError && (
            <div
              className={`${CENTER} max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--card-elevated)] px-5 py-4 text-[14px] leading-relaxed text-[var(--muted)]`}
              role="alert"
            >
              <p className="font-medium text-foreground">
                データベースに接続できません
              </p>
              <DbConnectionTips />
            </div>
          )}

          <div className={`${CENTER} max-w-2xl`}>
            <h2
              id="agent-list-heading"
              className="text-[28px] font-semibold leading-tight tracking-tight text-foreground sm:text-[32px]"
            >
              エージェントを探す
            </h2>
            {!loadError && agents.length > 0 && (
              <p className="mt-2 text-[15px] text-[var(--muted)]">
                検索するか、下の一覧から選べます
              </p>
            )}
            {!loadError && agents.length === 0 && (
              <p className="mt-2 text-[15px] text-[var(--muted)]">
                公開中のエージェント
              </p>
            )}
          </div>

          {!loadError && agents.length === 0 ? (
            <p className={`${CENTER} mt-10 max-w-md text-[14px] text-[var(--muted)]`}>
              まだありません。{" "}
              <code className="rounded-md bg-[var(--card-elevated)] px-1.5 py-0.5 text-[12px] ring-1 ring-[var(--border)]">
                npm run db:seed
              </code>
            </p>
          ) : !loadError ? (
            <div className="mt-8 w-full">
              <AgentDirectory agents={agents} />
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}
