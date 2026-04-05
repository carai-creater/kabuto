import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { RunAgentPanel } from "@/components/run-agent-panel";
import { ReviewForm } from "@/components/review-form";
import { DbUnavailableMessage } from "@/components/db-unavailable";
import { isDatabaseConfigured } from "@/lib/is-database-configured";
import { PAGE_SHELL } from "@/lib/page-shell";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata(props: Props): Promise<Metadata> {
  try {
    const { slug } = await props.params;
    const agent = await prisma.agent.findUnique({
      where: { slug },
      select: { title: true, description: true },
    });
    if (!agent) return { title: "エージェント" };
    return {
      title: `${agent.title} — kabuto`,
      description: agent.description.slice(0, 160),
    };
  } catch {
    return { title: "kabuto" };
  }
}

export default async function AgentDetailPage(props: Props) {
  if (!isDatabaseConfigured()) {
    return <DbUnavailableMessage />;
  }

  const { slug } = await props.params;

  let agent;
  try {
    agent = await prisma.agent.findFirst({
      where: { slug, isPublished: true },
      include: {
        conversationStarters: true,
        knowledgeDocuments: { orderBy: { createdAt: "asc" } },
        creator: { select: { name: true, email: true } },
      },
    });
  } catch {
    return <DbUnavailableMessage />;
  }

  if (!agent) {
    notFound();
  }

  const tools = Array.isArray(agent.tools) ? agent.tools : [];
  const rating = Number(agent.ratingAvg);
  const highValue =
    agent.tags.includes("高コスパ") ||
    (agent.reviewCount >= 3 && rating >= 4);

  return (
    <main
      className={`relative flex flex-1 flex-col pb-28 pt-10 ${PAGE_SHELL}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_40%_at_50%_-10%,rgb(0_113_227/0.06),transparent)] dark:bg-[radial-gradient(ellipse_70%_40%_at_50%_-10%,rgb(212_175_55/0.08),transparent)]"
      />
      <article className="relative mx-auto w-full max-w-4xl xl:max-w-5xl">
        <header className="flex flex-col gap-6 border-b border-[var(--border)] pb-10 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            <span
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-[var(--card-elevated)] text-4xl ring-1 ring-[var(--border)]"
              aria-hidden
            >
              {agent.iconEmoji}
            </span>
            <div>
              <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-foreground sm:text-[32px]">
                {agent.title}
              </h1>
              <p className="mt-2 text-[15px] text-[var(--muted)]">
                クリエイター:{" "}
                {agent.creator.name ?? agent.creator.email ?? "—"}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {agent.firstThreeFree && (
                  <span className="rounded-full bg-emerald-500/12 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                    初回3回無料
                  </span>
                )}
                {highValue && (
                  <span className="rounded-full bg-amber-500/12 px-2.5 py-0.5 text-[11px] font-medium text-amber-800 dark:text-amber-300">
                    高コスパ
                  </span>
                )}
                {agent.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-[var(--card-elevated)] px-2.5 py-0.5 text-[11px] text-[var(--muted)] ring-1 ring-[var(--border)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <dl className="grid shrink-0 grid-cols-2 gap-x-8 gap-y-3 text-[15px] sm:text-right">
            <div>
              <dt className="text-[13px] text-[var(--muted)]">評価</dt>
              <dd className="mt-0.5 font-medium tabular-nums text-foreground">
                {agent.reviewCount > 0 ? `${rating.toFixed(1)} / 5` : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-[13px] text-[var(--muted)]">レビュー</dt>
              <dd className="mt-0.5 font-medium tabular-nums text-foreground">
                {agent.reviewCount} 件
              </dd>
            </div>
            <div>
              <dt className="text-[13px] text-[var(--muted)]">利用回数</dt>
              <dd className="mt-0.5 font-medium tabular-nums text-foreground">
                {agent.usageCount.toLocaleString("ja-JP")}
              </dd>
            </div>
            <div>
              <dt className="text-[13px] text-[var(--muted)]">コスト</dt>
              <dd className="mt-0.5 font-semibold tabular-nums text-[var(--brand)]">
                {agent.pricePerUsePt} pt / 回
              </dd>
            </div>
          </dl>
        </header>

        <section className="mt-10 space-y-3">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
            説明
          </h2>
          <p className="whitespace-pre-wrap text-[17px] leading-relaxed text-[var(--subtle)]">
            {agent.description}
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
            役割（Instruction）
          </h2>
          <pre className="mt-3 max-h-48 overflow-auto rounded-2xl border border-[var(--border)] bg-[var(--card-elevated)] p-4 text-[13px] leading-relaxed text-[var(--foreground)]">
            {agent.systemPrompt}
          </pre>
        </section>

        {agent.knowledgeDocuments.length > 0 && (
          <section className="mt-10">
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
              知識（RAG）ドキュメント
            </h2>
            <ul className="mt-3 space-y-2">
              {agent.knowledgeDocuments.map((d) => (
                <li
                  key={d.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-[15px] text-[var(--foreground)] shadow-sm dark:shadow-none"
                >
                  <span className="truncate">{d.title}</span>
                  <span className="shrink-0 text-[12px] text-[var(--muted)]">
                    {d.mimeType}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-10">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
            機能（Tools）
          </h2>
          {tools.length === 0 ? (
            <p className="mt-3 text-[15px] text-[var(--muted)]">未設定</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {(tools as { name?: string; type?: string }[]).map((t, i) => (
                <li
                  key={`${t.name ?? i}`}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-[15px] text-[var(--foreground)] shadow-sm dark:shadow-none"
                >
                  <span className="font-medium">{t.name ?? "tool"}</span>
                  {t.type ? (
                    <span className="text-[var(--muted)]"> · {t.type}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="mt-12">
          <RunAgentPanel
            agentId={agent.id}
            pricePerUsePt={agent.pricePerUsePt}
            starters={agent.conversationStarters}
            tools={agent.tools}
          />
        </div>

        <div className="mt-10">
          <ReviewForm agentId={agent.id} />
        </div>
      </article>
    </main>
  );
}
