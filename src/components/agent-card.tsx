import Link from "next/link";
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
  const highValue =
    agent.tags.includes("高コスパ") ||
    (agent.reviewCount >= 3 && rating >= 4);

  return (
    <Link
      href={`/agents/${agent.slug}`}
      className="agent-card-surface group block p-4 sm:p-5"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="min-w-0">
            <h2 className="text-[16px] font-semibold leading-snug tracking-tight text-foreground transition-colors group-hover:text-[var(--accent)]">
              {agent.title}
            </h2>
            <p className="mt-1 text-[12px] font-medium text-[var(--muted)]">
              利用 {agent.usageCount.toLocaleString("ja-JP")} 回 · レビュー{" "}
              {agent.reviewCount} 件
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-[var(--brand-muted)] px-2.5 py-1 text-[12px] font-semibold tabular-nums text-[var(--brand)]">
          {agent.pricePerUsePt} pt
        </span>
      </div>
      <p className="line-clamp-2 text-[14px] leading-[1.5] text-[var(--subtle)]">
        {agent.description}
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
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
        {agent.tags
          .filter((t) => t !== "高コスパ")
          .slice(0, 3)
          .map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-[var(--border)] bg-transparent px-2.5 py-0.5 text-[11px] font-medium text-[var(--muted)]"
            >
              {tag}
            </span>
          ))}
      </div>
    </Link>
  );
}
