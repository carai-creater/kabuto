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
      className="agent-card-surface group block p-5 sm:p-6"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--card-elevated)] text-[26px] ring-1 ring-black/[0.06] dark:ring-white/[0.08]"
            aria-hidden
          >
            {agent.iconEmoji}
          </span>
          <div className="min-w-0">
            <h2 className="text-[17px] font-semibold leading-snug tracking-tight text-foreground transition-colors group-hover:text-[var(--accent)]">
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
      <p className="line-clamp-2 text-[15px] leading-[1.47] text-[var(--subtle)]">
        {agent.description}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
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
