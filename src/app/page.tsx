import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AgentCard } from "@/components/agent-card";
import { isDatabaseConfigured } from "@/lib/is-database-configured";
import { PAGE_SHELL } from "@/lib/page-shell";

export default async function Home() {
  if (!isDatabaseConfigured()) {
    return (
      <div className="flex min-h-full flex-1 flex-col">
        <main className={`relative flex flex-1 flex-col pb-24 pt-10 ${PAGE_SHELL}`}>
          <div className="surface-card max-w-2xl p-8 sm:p-10">
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
      <main className="relative flex w-full flex-1 flex-col">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,rgb(0_113_227/0.07),transparent)] dark:bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,rgb(212_175_55/0.08),transparent)]"
        />

        {/* ヒーロー：最初に「エージェントを探す」が一目で分かる */}
        <section
          className={`relative border-b border-[var(--border)] bg-[var(--background)]/80 pb-12 pt-10 sm:pb-16 sm:pt-14 lg:pb-20 lg:pt-16 ${PAGE_SHELL}`}
        >
          <div className="max-w-4xl">
            <p className="text-[13px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
              kabuto
            </p>
            <h1 className="mt-3 text-balance text-[clamp(2rem,5vw,3.5rem)] font-semibold leading-[1.08] tracking-tight text-foreground">
              エージェントを探す
            </h1>
            <p className="mt-4 max-w-2xl text-pretty text-[clamp(1rem,2vw,1.25rem)] leading-relaxed text-[var(--muted)]">
              目的に合う AI エージェントを選び、カードを開いてすぐ会話を始められます。ポイントは
              <strong className="font-semibold text-foreground"> 実行が終わったときだけ </strong>
              消費されます。
            </p>
          </div>

          <ol className="mt-10 grid max-w-3xl gap-4 sm:grid-cols-3 sm:gap-6">
            <li className="flex gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm dark:shadow-none">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[13px] font-bold text-white"
                aria-hidden
              >
                1
              </span>
              <div>
                <p className="text-[15px] font-semibold text-foreground">エージェントを選ぶ</p>
                <p className="mt-1 text-[13px] leading-snug text-[var(--muted)]">
                  下の一覧からカードをタップ
                </p>
              </div>
            </li>
            <li className="flex gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm dark:shadow-none">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[13px] font-bold text-white"
                aria-hidden
              >
                2
              </span>
              <div>
                <p className="text-[15px] font-semibold text-foreground">詳細で試す</p>
                <p className="mt-1 text-[13px] leading-snug text-[var(--muted)]">
                  スターターまたは自由入力で実行
                </p>
              </div>
            </li>
            <li className="flex gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm dark:shadow-none sm:col-span-1">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[13px] font-bold text-white"
                aria-hidden
              >
                3
              </span>
              <div>
                <p className="text-[15px] font-semibold text-foreground">評価・ウォレット</p>
                <p className="mt-1 text-[13px] leading-snug text-[var(--muted)]">
                  気に入ったらレビュー、pt はウォレットで確認
                </p>
              </div>
            </li>
          </ol>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#agent-list"
              className="btn-primary inline-flex rounded-full px-6 py-3 text-[16px]"
            >
              一覧へ進む
            </a>
            <Link
              href="/wallet"
              className="inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] px-5 py-3 text-[15px] font-medium text-[var(--accent)] shadow-sm transition hover:opacity-90 dark:shadow-none"
            >
              ウォレットを開く
            </Link>
            <Link
              href="/demo"
              className="link-subtle inline-flex items-center rounded-full px-3 py-2 text-[15px]"
            >
              はじめての方（デモログイン）
            </Link>
          </div>
        </section>

        {/* エージェント一覧：画面幅いっぱいにグリッド */}
        <section
          id="agent-list"
          className={`relative scroll-mt-20 pb-28 pt-10 sm:pt-14 ${PAGE_SHELL}`}
          aria-labelledby="agent-list-heading"
        >
          {loadError && (
            <div className="mb-10 surface-card border-[var(--destructive)]/25 bg-[var(--destructive)]/5 p-6 text-[15px] text-[var(--destructive)]">
              {loadError}
            </div>
          )}

          <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <h2
              id="agent-list-heading"
              className="text-[22px] font-semibold tracking-tight text-foreground sm:text-[26px]"
            >
              すべてのエージェント
            </h2>
            <p className="text-[15px] text-[var(--muted)]">
              {agents.length > 0
                ? `${agents.length} 件のエージェントが利用可能です`
                : "公開中のエージェント"}
            </p>
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
            <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 xl:grid-cols-3 xl:gap-8">
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
