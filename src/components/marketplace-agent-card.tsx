import Link from "next/link";
import { BarChart3, Coins, Star } from "lucide-react";

import type { AgentListItem } from "@/components/agent-directory";
import { isDemoSlug } from "@/lib/marketplace-demo-agents";

type Props = {
  agent: AgentListItem;
};

export function MarketplaceAgentCard({ agent }: Props) {
  const demo = isDemoSlug(agent.slug);
  const rating = Number(agent.ratingAvg);
  const hasRating = agent.reviewCount > 0;
  const detailHref = demo
    ? "/login?next=%2Fdashboard"
    : `/agents/${agent.slug}`;

  return (
    <article
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm transition duration-300 ease-out hover:-translate-y-1 hover:border-[var(--border-strong)] hover:shadow-lg dark:hover:shadow-black/40"
    >
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex gap-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--background-muted)] text-[32px] leading-none shadow-inner"
            aria-hidden
          >
            {agent.iconEmoji || "🤖"}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-[17px] font-bold leading-snug tracking-tight text-[#333333] dark:text-[var(--foreground)]">
              {agent.title}
            </h3>
            <p className="mt-2 line-clamp-2 text-[14px] leading-relaxed text-[var(--muted)]">
              {agent.description}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {agent.firstThreeFree && (
            <span className="rounded-full bg-[var(--tag-pastel-bg)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--tag-pastel-text)]">
              初回3回無料
            </span>
          )}
          {agent.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-[var(--tag-neutral-bg)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--tag-neutral-text)]"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[var(--border)] pt-4 text-[13px] text-[var(--muted)]">
          <span className="inline-flex items-center gap-1.5 tabular-nums">
            <Star
              className={`h-4 w-4 shrink-0 ${hasRating ? "fill-amber-400 text-amber-500" : "text-[var(--muted)]"}`}
              strokeWidth={hasRating ? 0 : 2}
              aria-hidden
            />
            {hasRating ? (
              <>
                <span className="font-semibold text-[#333333] dark:text-[var(--foreground)]">
                  {rating.toFixed(1)}
                </span>
                <span>（{agent.reviewCount} 件）</span>
              </>
            ) : (
              <span>評価なし</span>
            )}
          </span>
          <span className="inline-flex items-center gap-1.5 tabular-nums">
            <BarChart3 className="h-4 w-4 opacity-75" aria-hidden />
            {agent.usageCount.toLocaleString("ja-JP")} 回
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1 text-[15px] font-bold tabular-nums text-[var(--brand)]">
            <Coins className="h-4 w-4 opacity-90" strokeWidth={2} aria-hidden />
            {agent.pricePerUsePt.toLocaleString("ja-JP")}
            <span className="text-[12px] font-semibold">pt</span>
            <span className="text-[12px] font-normal text-[var(--muted)]">/ 回</span>
          </span>
          <Link
            href={detailHref}
            className="inline-flex shrink-0 items-center justify-center rounded-full bg-[var(--accent)] px-4 py-2 text-[14px] font-semibold text-white shadow-sm transition hover:bg-[var(--accent-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            {demo ? "はじめる" : "利用する"}
          </Link>
        </div>
      </div>
    </article>
  );
}
