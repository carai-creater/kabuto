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
    <article className="agent-card-surface group relative flex flex-col overflow-hidden">
      <Link
        href={`/agents/${agent.slug}`}
        aria-label={`${agent.title} の詳細を見る`}
        className="absolute inset-0 z-10 rounded-[var(--radius-card)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
      />

      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:gap-5">
        <div className="relative mx-auto aspect-square w-full max-w-[112px] shrink-0 overflow-hidden rounded-[12px] border border-[var(--border)] bg-[var(--background-muted)] sm:mx-0">
          <span
            className="flex h-full w-full items-center justify-center text-[48px] leading-none"
            aria-hidden
          >
            {agent.iconEmoji || "🤖"}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-[18px] font-bold leading-snug tracking-tight text-[#333333] transition-colors group-hover:text-[var(--accent)] dark:text-[var(--foreground)]">
            {agent.title}
          </h2>
          <p className="mt-2 line-clamp-2 text-[14px] leading-[1.7] text-[var(--muted)]">
            {agent.description}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {agent.firstThreeFree && (
              <span className="rounded-[10px] bg-[var(--tag-pastel-bg)] px-2.5 py-1 text-[11px] font-medium text-[var(--tag-pastel-text)]">
                初回3回無料
              </span>
            )}
            {highValue && (
              <span className="rounded-[10px] bg-[var(--tag-pastel-bg)] px-2.5 py-1 text-[11px] font-medium text-[var(--tag-pastel-text)]">
                高コスパ
              </span>
            )}
            {agent.tags
              .filter((t) => t !== "高コスパ")
              .slice(0, 3)
              .map((tag) => (
                <span
                  key={tag}
                  className="rounded-[10px] bg-[var(--tag-neutral-bg)] px-2.5 py-1 text-[11px] font-medium text-[var(--tag-neutral-text)]"
                >
                  {tag}
                </span>
              ))}
          </div>
        </div>
      </div>

      {/* フッター: 評価・実績・価格 */}
      <div className="relative z-0 flex flex-col gap-3 border-t border-[var(--border)] bg-[#f8fafc] px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between dark:bg-[var(--card-elevated)]">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px] text-[var(--muted)]">
          <span className="inline-flex items-center gap-1.5 tabular-nums">
            <Star
              className={`h-4 w-4 shrink-0 ${hasRating ? "fill-amber-400 text-amber-500" : "text-[var(--muted)]"}`}
              strokeWidth={hasRating ? 0 : 2}
              aria-hidden
            />
            {hasRating ? (
              <>
                <span className="font-bold text-[#333333] dark:text-[var(--foreground)]">
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
          <span className="inline-flex items-center gap-1.5 tabular-nums">
            <BarChart3 className="h-4 w-4 opacity-75" aria-hidden />
            利用 {agent.usageCount.toLocaleString("ja-JP")} 回
          </span>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-[10px] bg-white px-3 py-1.5 text-[14px] font-bold tabular-nums text-[var(--brand)] ring-1 ring-[var(--border)] dark:bg-[var(--card)] sm:self-center">
          <Coins className="h-4 w-4 opacity-90" strokeWidth={2} aria-hidden />
          {agent.pricePerUsePt.toLocaleString("ja-JP")}
          <span className="text-[12px] font-semibold">pt</span>
        </span>
      </div>
    </article>
  );
}
