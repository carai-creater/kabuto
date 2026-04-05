import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AgentCard } from "@/components/agent-card";
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
    loadError =
      "接続できません。DATABASE_URL・SSL・ネットワーク（Supabase の IP 制限など）を確認してください。";
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <main className="relative flex w-full flex-1 flex-col items-center">
        <section
          className={`w-full border-b border-[var(--border)] py-14 sm:py-20 ${PAGE_SHELL} flex flex-col items-center`}
        >
          <div className={CENTER}>
            <h1 className="text-balance text-[clamp(1.6rem,4.5vw,2.25rem)] font-semibold leading-snug tracking-tight text-foreground">
              エージェントを探す
            </h1>
            <p className="mt-3 text-pretty text-[15px] leading-relaxed text-[var(--muted)]">
              カードを開いて会話を始められます。
            </p>
            <div className="mt-8">
              <a
                href="#agent-list"
                className="btn-primary inline-flex rounded-full px-7 py-2.5 text-[15px]"
              >
                一覧を見る
              </a>
            </div>
            <p className="mt-7 text-[13px] text-[var(--muted)]">
              <Link href="/demo" className="text-[var(--accent)] hover:underline">
                デモ
              </Link>
              <span className="mx-2 opacity-40">·</span>
              <Link href="/wallet" className="text-[var(--accent)] hover:underline">
                ウォレット
              </Link>
            </p>
          </div>
        </section>

        <section
          id="agent-list"
          className={`w-full scroll-mt-20 pb-20 pt-12 sm:pt-14 ${PAGE_SHELL} flex flex-col items-center`}
          aria-labelledby="agent-list-heading"
        >
          {loadError && (
            <div
              className={`${CENTER} max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card-elevated)] px-5 py-4 text-[14px] leading-relaxed text-[var(--muted)]`}
              role="alert"
            >
              {loadError}
            </div>
          )}

          <div className={`${CENTER} mt-8 max-w-2xl`}>
            <h2
              id="agent-list-heading"
              className="text-[20px] font-semibold tracking-tight text-foreground sm:text-[22px]"
            >
              すべてのエージェント
            </h2>
            {!loadError && (
              <p className="mt-1.5 text-[14px] text-[var(--muted)]">
                {agents.length > 0 ? `${agents.length} 件` : "公開中のエージェント"}
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
            <ul className="mx-auto mt-10 grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
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
