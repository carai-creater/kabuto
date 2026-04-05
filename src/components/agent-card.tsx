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
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/60 p-5 shadow-[0_0_0_1px_rgba(212,175,55,0.06)] transition hover:border-[#D4AF37]/35 hover:shadow-[0_0_40px_-16px_rgba(212,175,55,0.35)]"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-black text-2xl ring-1 ring-white/10"
            aria-hidden
          >
            {agent.iconEmoji}
          </span>
          <div>
            <h2 className="font-semibold text-zinc-100 group-hover:text-white">
              {agent.title}
            </h2>
            <p className="text-xs text-zinc-500">
              利用 {agent.usageCount.toLocaleString("ja-JP")} 回 · レビュー{" "}
              {agent.reviewCount} 件
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-md border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-2 py-1 text-xs font-medium tabular-nums text-[#E8D48B]">
          {agent.pricePerUsePt} pt / 回
        </span>
      </div>
      <p className="line-clamp-2 text-sm leading-relaxed text-zinc-400">
        {agent.description}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {agent.firstThreeFree && (
          <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-300 ring-1 ring-emerald-500/30">
            初回3回無料
          </span>
        )}
        {highValue && (
          <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-200 ring-1 ring-amber-500/25">
            高コスパ
          </span>
        )}
        {agent.tags
          .filter((t) => t !== "高コスパ")
          .slice(0, 3)
          .map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-white/5 px-2 py-0.5 text-[11px] text-zinc-400 ring-1 ring-white/10"
            >
              {tag}
            </span>
          ))}
      </div>
    </Link>
  );
}
