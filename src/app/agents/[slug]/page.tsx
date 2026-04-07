import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { RunAgentPanel } from "@/components/run-agent-panel";
import { DbUnavailableMessage } from "@/components/db-unavailable";
import { isDatabaseConfigured } from "@/lib/is-database-configured";
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

  const rating = Number(agent.ratingAvg);
  const hasRating = agent.reviewCount > 0;
  const highValue =
    agent.tags.includes("高コスパ") ||
    (agent.reviewCount >= 3 && rating >= 4);

  const sessionUserId = await getSessionUserId();

  return (
    <main className="flex min-h-screen w-full flex-1 flex-col">
      <RunAgentPanel
        agentId={agent.id}
        isLoggedIn={Boolean(sessionUserId)}
        defaultModelId={agent.defaultLlm}
        pricePerUsePt={agent.pricePerUsePt}
        starters={agent.conversationStarters}
        tools={agent.tools}
        fullScreenChat
      />
      <section className="mx-auto w-full max-w-4xl px-4 pb-6 sm:px-6">
        <details className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
          <summary className="cursor-pointer text-[13px] font-semibold text-[var(--muted)]">
            エージェント情報を表示
          </summary>
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-[13px] sm:grid-cols-4">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card-elevated)] px-3 py-2">
                <p className="text-[11px] text-[var(--muted)]">評価</p>
                <p className="mt-1 font-semibold tabular-nums text-foreground">
                  {hasRating ? rating.toFixed(1) : "—"}
                </p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card-elevated)] px-3 py-2">
                <p className="text-[11px] text-[var(--muted)]">レビュー</p>
                <p className="mt-1 font-semibold tabular-nums text-foreground">
                  {agent.reviewCount} 件
                </p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card-elevated)] px-3 py-2">
                <p className="text-[11px] text-[var(--muted)]">利用</p>
                <p className="mt-1 font-semibold tabular-nums text-foreground">
                  {agent.usageCount.toLocaleString("ja-JP")}
                </p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card-elevated)] px-3 py-2">
                <p className="text-[11px] text-[var(--muted)]">料金</p>
                <p className="mt-1 font-semibold tabular-nums text-[var(--brand)]">
                  {agent.pricePerUsePt} pt/回
                </p>
              </div>
            </div>

            <p className="text-[14px] leading-relaxed text-[var(--subtle)]">
              {agent.description}
            </p>

            <div className="flex flex-wrap gap-2">
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
          </div>
        </details>
      </section>
    </main>
  );
}
