import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { RunAgentPanel } from "@/components/run-agent-panel";
import { ReviewForm } from "@/components/review-form";
import { DbUnavailableMessage } from "@/components/db-unavailable";
import { isDatabaseConfigured } from "@/lib/is-database-configured";
import { PAGE_SHELL } from "@/lib/page-shell";
import { getSessionUserId } from "@/lib/session";

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
  const sessionUserId = await getSessionUserId();

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

  const isOwner = Boolean(sessionUserId && sessionUserId === agent.creatorId);
  const tools = Array.isArray(agent.tools) ? agent.tools : [];
  const rating = Number(agent.ratingAvg);
  const highValue =
    agent.tags.includes("高コスパ") ||
    (agent.reviewCount >= 3 && rating >= 4);

  return (
    <main
      className={`relative flex flex-1 flex-col pb-28 pt-8 sm:pt-10 ${PAGE_SHELL}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_40%_at_50%_-10%,rgb(0_113_227/0.06),transparent)] dark:bg-[radial-gradient(ellipse_70%_40%_at_50%_-10%,rgb(10_132_255/0.08),transparent)]"
      />
      <article className="relative mx-auto w-full max-w-3xl xl:max-w-4xl">
        <header className="border-b border-[var(--border)] pb-8">
          <div className="flex gap-4">
            <span
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--card-elevated)] text-[32px] ring-1 ring-black/[0.06] dark:ring-white/[0.08]"
              aria-hidden
            >
              {agent.iconEmoji}
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="text-[24px] font-semibold leading-tight tracking-tight text-foreground sm:text-[28px]">
                {agent.title}
              </h1>
              <p className="mt-1 text-[14px] text-[var(--muted)]">
                {agent.creator.name ?? agent.creator.email ?? "クリエイター"}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {agent.firstThreeFree && (
                  <span className="rounded-full bg-[var(--brand-muted)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--accent)]">
                    初回3回無料
                  </span>
                )}
                {highValue && (
                  <span className="rounded-full bg-[var(--brand-muted)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--accent)]">
                    高コスパ
                  </span>
                )}
                {agent.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-[var(--border)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--muted)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-[14px] sm:grid-cols-4">
                <div>
                  <dt className="text-[12px] text-[var(--muted)]">評価</dt>
                  <dd className="mt-0.5 font-medium tabular-nums text-foreground">
                    {agent.reviewCount > 0 ? `${rating.toFixed(1)}` : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[12px] text-[var(--muted)]">レビュー</dt>
                  <dd className="mt-0.5 font-medium tabular-nums text-foreground">
                    {agent.reviewCount} 件
                  </dd>
                </div>
                <div>
                  <dt className="text-[12px] text-[var(--muted)]">利用</dt>
                  <dd className="mt-0.5 font-medium tabular-nums text-foreground">
                    {agent.usageCount.toLocaleString("ja-JP")}
                  </dd>
                </div>
                <div>
                  <dt className="text-[12px] text-[var(--muted)]">料金</dt>
                  <dd className="mt-0.5 font-semibold tabular-nums text-[var(--brand)]">
                    {agent.pricePerUsePt} pt/回
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </header>

        <p className="mt-8 text-[15px] leading-relaxed text-[var(--subtle)]">
          {agent.description}
        </p>

        <div className="mt-10">
          <RunAgentPanel
            agentId={agent.id}
            pricePerUsePt={agent.pricePerUsePt}
            starters={agent.conversationStarters}
            tools={agent.tools}
            showToolDetails={isOwner}
          />
        </div>

        <div className="mt-10">
          <ReviewForm agentId={agent.id} />
        </div>

        {!isOwner && tools.length > 0 && (
          <p className="mt-10 text-[13px] text-[var(--muted)]">
            このエージェントは外部ツール連携に対応しています。
          </p>
        )}

        {isOwner && (
          <>
            <section className="mt-12 rounded-2xl border border-[var(--border)] bg-[var(--card-elevated)]/50 p-1">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3">
                <p className="text-[12px] font-semibold text-[var(--accent)]">
                  クリエイター向け · 内部設定
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-[var(--muted)]">
                  次の内容はあなた（作成者）だけが表示されます。ユーザーには公開されません。
                </p>
              </div>
            </section>

            <section className="mt-8 space-y-3">
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                役割（Instruction）
              </h2>
              <pre className="max-h-56 overflow-auto rounded-2xl border border-[var(--border)] bg-[var(--card-elevated)] p-4 text-[13px] leading-relaxed text-[var(--foreground)]">
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
          </>
        )}
      </article>
    </main>
  );
}
