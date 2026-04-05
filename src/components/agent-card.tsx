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
      className="group surface-card block p-6 transition hover:border-[var(--border-strong)] hover:shadow-md dark:hover:shadow-none"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--card-elevated)] text-[26px] ring-1 ring-[var(--border)]"
            aria-hidden
          >
            {agent.iconEmoji}
          </span>
          <div>
            <h2 className="text-[17px] font-semibold tracking-tight text-foreground group-hover:text-[var(--accent)]">
              {agent.title}
            </h2>
            <p className="mt-0.5 text-[13px] text-[var(--muted)]">
              利用 {agent.usageCount.toLocaleString("ja-JP")} 回 · レビュー{" "}
              {agent.reviewCount} 件
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-[var(--brand-muted)] px-2.5 py-1 text-[12px] font-semibold tabular-nums text-[var(--brand)]">
          {agent.pricePerUsePt} pt
        </span>
      </div>
      <p className="line-clamp-2 text-[15px] leading-relaxed text-[var(--subtle)]">
        {agent.description}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {agent.firstThreeFree && (
          <span className="rounded-full bg-emerald-500/12 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
            初回3回無料
          </span>
        )}
        {highValue && (
          <span className="rounded-full bg-amber-500/12 px-2.5 py-0.5 text-[11px] font-medium text-amber-800 dark:text-amber-300">
            高コスパ
          </span>
        )}
        {agent.tags
          .filter((t) => t !== "高コスパ")
          .slice(0, 3)
          .map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-[var(--card-elevated)] px-2.5 py-0.5 text-[11px] text-[var(--muted)] ring-1 ring-[var(--border)]"
            >
              {tag}
            </span>
          ))}
      </div>
    </Link>
  );
}
