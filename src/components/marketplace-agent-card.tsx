import Link from "next/link";
import { Star, Coins } from "lucide-react";

import type { AgentListItem } from "@/components/agent-directory";
import { isDemoSlug } from "@/lib/marketplace-demo-agents";

type Props = {
  agent: AgentListItem;
};

export function MarketplaceAgentCard({ agent }: Props) {
  const demo = isDemoSlug(agent.slug);
  const rating = Number(agent.ratingAvg);
  const hasRating = agent.reviewCount > 0;
  const detailHref = demo ? "/login?next=%2Fdashboard" : `/agents/${agent.slug}`;

  return (
    <article className="group flex h-full flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] transition duration-200 hover:border-[var(--accent)]/40 hover:shadow-[0_2px_16px_0_rgba(0,0,0,0.06)] dark:hover:shadow-[0_2px_16px_0_rgba(0,0,0,0.3)]">
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        {/* アイコン */}
        {agent.iconUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={agent.iconUrl} alt="" width={44} height={44} className="mb-4 h-11 w-11 rounded-xl object-cover" />
        )}

        {/* タグ */}
        {(agent.firstThreeFree || agent.tags.length > 0) && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {agent.firstThreeFree && (
              <span className="rounded-full bg-[var(--tag-pastel-bg)] px-2 py-0.5 text-[10px] font-semibold tracking-wide text-[var(--tag-pastel-text)]">
                初回3回無料
              </span>
            )}
            {agent.tags.slice(0, 2).map((tag) => (
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
        <h3 className="text-[16px] font-bold leading-snug tracking-tight text-[var(--foreground)]">
          {agent.title}
        </h3>
        <p className="mt-2 flex-1 text-[13px] leading-relaxed text-[var(--muted)] line-clamp-3">
          {agent.description}
        </p>

        {/* フッター */}
        <div className="mt-5 flex items-center justify-between gap-2 border-t border-[var(--border)] pt-4">
          <div className="flex items-center gap-3 text-[12px] text-[var(--muted)]">
            <span className="inline-flex items-center gap-1 tabular-nums">
              <Star
                className={`h-3.5 w-3.5 shrink-0 ${hasRating ? "fill-amber-400 text-amber-400" : ""}`}
                strokeWidth={hasRating ? 0 : 1.5}
                aria-hidden
              />
              {hasRating ? (
                <span className="font-semibold text-[var(--foreground)]">{rating.toFixed(1)}</span>
              ) : (
                <span>—</span>
              )}
            </span>
            <span className="tabular-nums">
              <span className="font-semibold text-[var(--foreground)]">
                {agent.pricePerUsePt.toLocaleString("ja-JP")}
              </span>
              <span className="ml-0.5">pt</span>
            </span>
          </div>

          <Link
            href={detailHref}
            className="inline-flex shrink-0 items-center justify-center rounded-full border border-[var(--accent)] px-4 py-1.5 text-[12px] font-semibold text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            {demo ? "はじめる" : "利用する"}
          </Link>
        </div>
      </div>
    </article>
  );
}
