import Link from "next/link";
import { Star, Coins, BarChart3 } from "lucide-react";
import type { Agent } from "@prisma/client";

type Props = {
  agent: Pick<
    Agent,
    | "id"
    | "slug"
    | "title"
    | "description"
    | "iconEmoji"
    | "iconUrl"
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

  return (
    <article className="agent-card-surface group relative flex flex-col overflow-hidden">
      <Link
        href={`/agents/${agent.slug}`}
        aria-label={`${agent.title} の詳細を見る`}
        className="absolute inset-0 z-10 rounded-[var(--radius-card)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
      />

      <div className="flex flex-col gap-3 p-5 sm:p-6">
        {/* アイコン */}
        {agent.iconUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={agent.iconUrl} alt="" width={44} height={44} className="h-11 w-11 rounded-xl object-cover" />
        )}

        {/* タグ */}
        {(agent.firstThreeFree || agent.tags.length > 0) && (
          <div className="flex flex-wrap gap-1.5">
            {agent.firstThreeFree && (
              <span className="rounded-full bg-[var(--tag-pastel-bg)] px-2 py-0.5 text-[10px] font-semibold tracking-wide text-[var(--tag-pastel-text)]">
                初回3回無料
              </span>
            )}
            {agent.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-[var(--tag-neutral-bg)] px-2 py-0.5 text-[10px] font-medium text-[var(--tag-neutral-text)]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* タイトル・説明 */}
        <div>
          <h2 className="text-[17px] font-bold leading-snug tracking-tight text-[var(--foreground)] transition-colors group-hover:text-[var(--accent)]">
            {agent.title}
          </h2>
          <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-[var(--muted)]">
            {agent.description}
          </p>
        </div>
      </div>

      {/* フッター */}
      <div className="flex items-center justify-between gap-3 border-t border-[var(--border)] px-5 py-3 sm:px-6 dark:bg-[var(--card-elevated)]">
        <div className="flex items-center gap-4 text-[12px] text-[var(--muted)]">
          <span className="inline-flex items-center gap-1 tabular-nums">
            <Star
              className={`h-3.5 w-3.5 shrink-0 ${hasRating ? "fill-amber-400 text-amber-400" : ""}`}
              strokeWidth={hasRating ? 0 : 1.5}
              aria-hidden
            />
            {hasRating ? (
              <>
                <span className="font-semibold text-[var(--foreground)]">{rating.toFixed(1)}</span>
                <span className="text-[var(--muted)]">（{agent.reviewCount}）</span>
              </>
            ) : (
              <span>評価なし</span>
            )}
          </span>
          <span className="inline-flex items-center gap-1 tabular-nums">
            <BarChart3 className="h-3.5 w-3.5 opacity-60" aria-hidden />
            {agent.usageCount.toLocaleString("ja-JP")} 回
          </span>
        </div>

        <span className="inline-flex shrink-0 items-center gap-1 tabular-nums text-[13px] font-bold text-[var(--brand)]">
          <Coins className="h-3.5 w-3.5 opacity-80" strokeWidth={2} aria-hidden />
          {agent.pricePerUsePt.toLocaleString("ja-JP")}
          <span className="text-[11px] font-semibold">pt</span>
        </span>
      </div>
    </article>
  );
}
