import Link from "next/link";
import { BarChart3, Coins, Star } from "lucide-react";
import type { Agent } from "@prisma/client";

type Props = {
  agent: Pick<
    Agent,
    | "id"
    | "slug"
    | "title"
    | "description"
    | "iconEmoji"
    | "pricePerUsePt"
    | "usageCount"
    | "ratingAvg"
    | "reviewCount"
    | "firstThreeFree"
    | "tags"
  >;
};

export function AgentCard({ agent }: Props) {
  const rating = Number(agent.ratingAvg);
  const hasRating = agent.reviewCount > 0;
  const highValue =
    agent.tags.includes("高コスパ") ||
    (agent.reviewCount >= 3 && rating >= 4);

  return (
    <article className="agent-card-surface group relative cursor-pointer overflow-hidden p-0 sm:p-0">
      <Link
        href={`/agents/${agent.slug}`}
        aria-label={`${agent.title} の詳細を見る`}
        className="absolute inset-0 z-10 rounded-[var(--radius-card)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
      />
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-stretch sm:gap-5 sm:p-5">
        {/* サムネイル（アスペクト 1:1 統一） */}
        <div className="relative mx-auto aspect-square w-full max-w-[112px] shrink-0 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--background-muted)] sm:mx-0">
          <span
            className="flex h-full w-full items-center justify-center text-[48px] leading-none"
            aria-hidden
          >
            {agent.iconEmoji || "🤖"}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h2 className="text-[16px] font-bold leading-snug tracking-tight text-[#333333] transition-colors group-hover:text-[var(--accent)] dark:text-[var(--foreground)]">
              {agent.title}
            </h2>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[var(--brand-muted)] px-2.5 py-1 text-[13px] font-bold tabular-nums text-[var(--brand)]">
              <Coins className="h-3.5 w-3.5 opacity-90" strokeWidth={2} aria-hidden />
              {agent.pricePerUsePt.toLocaleString("ja-JP")}
              <span className="text-[11px] font-semibold">pt</span>
            </span>
          </div>

          {/* 評価・実績 */}
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-[var(--muted)]">
            <span className="inline-flex items-center gap-1 tabular-nums">
              <Star
                className={`h-3.5 w-3.5 shrink-0 ${hasRating ? "fill-amber-400 text-amber-500" : "text-[var(--muted)]"}`}
                strokeWidth={hasRating ? 0 : 2}
                aria-hidden
              />
              {hasRating ? (
                <>
                  <span className="font-semibold text-[#333333] dark:text-[var(--foreground)]">
                    {rating.toFixed(1)}
                  </span>
                  <span className="text-[var(--muted)]">
                    （{agent.reviewCount} 件）
                  </span>
                </>
              ) : (
                <span>評価なし</span>
              )}
            </span>
            <span className="inline-flex items-center gap-1 tabular-nums">
              <BarChart3 className="h-3.5 w-3.5 opacity-80" aria-hidden />
              利用 {agent.usageCount.toLocaleString("ja-JP")} 回
            </span>
          </div>

          <p className="mt-3 line-clamp-2 text-[14px] leading-relaxed text-[var(--subtle)]">
            {agent.description}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {agent.firstThreeFree && (
              <span className="rounded-lg bg-[var(--brand-muted)] px-2 py-0.5 text-[11px] font-semibold text-[var(--accent)]">
                初回3回無料
              </span>
            )}
            {highValue && (
              <span className="rounded-lg bg-[var(--brand-muted)] px-2 py-0.5 text-[11px] font-semibold text-[var(--accent)]">
                高コスパ
              </span>
            )}
            {agent.tags
              .filter((t) => t !== "高コスパ")
              .slice(0, 3)
              .map((tag) => (
                <span
                  key={tag}
                  className="rounded-lg border border-[var(--border)] bg-transparent px-2 py-0.5 text-[11px] font-medium text-[var(--muted)]"
                >
                  {tag}
                </span>
              ))}
          </div>
        </div>
      </div>
    </article>
  );
}
