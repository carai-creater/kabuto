import { parseKabutoEditor } from "@/lib/agent/editor-config";
import type { AgentDetailPayload } from "@/lib/agent/agent-detail-include";
import { RunAgentPanel } from "@/components/run-agent-panel";
import { FavoriteButton } from "@/components/favorite-button";

type Props = {
  agent: AgentDetailPayload;
  sessionUserId: string | null;
  initialMessages?: { role: "user" | "assistant"; content: string }[];
  chatSessionId?: string;
  initialFavorited?: boolean;
};

export function AgentDetailView({ agent, sessionUserId, initialMessages, chatSessionId, initialFavorited = false }: Props) {
  const rating = Number(agent.ratingAvg);
  const hasRating = agent.reviewCount > 0;
  const highValue =
    agent.tags.includes("高コスパ") ||
    (agent.reviewCount >= 3 && rating >= 4);

  const isDraftPreview =
    !agent.isPublished &&
    Boolean(sessionUserId && sessionUserId === agent.creatorId);

  const editor = parseKabutoEditor(agent.toolConfig);

  return (
    <main className="flex min-h-screen w-full flex-1 flex-col">
      {isDraftPreview ? (
        <div
          className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-center text-[13px] text-amber-950 dark:bg-amber-500/15 dark:text-amber-100"
          role="status"
        >
          下書きプレビュー（ストアには未公開です）
        </div>
      ) : null}
      <RunAgentPanel
        agentId={agent.id}
        isLoggedIn={Boolean(sessionUserId)}
        defaultModelId={agent.defaultLlm}
        useCreatorRecommendedModel={editor?.useRecommendedModel !== false}
        pricePerUsePt={agent.pricePerUsePt}
        starters={agent.conversationStarters}
        tools={agent.tools}
        fullScreenChat
        initialMessages={initialMessages}
        chatSessionId={chatSessionId}
      />
      <section className="mx-auto w-full max-w-4xl px-4 pb-6 sm:px-6">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[15px] font-semibold text-foreground">{agent.title}</p>
          <FavoriteButton
            agentId={agent.id}
            initialFavorited={initialFavorited}
            isLoggedIn={Boolean(sessionUserId)}
          />
        </div>
        <details className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
          <summary className="cursor-pointer text-[13px] font-semibold text-[var(--muted)]">
            サービス詳細
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
