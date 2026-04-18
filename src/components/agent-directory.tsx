"use client";

import type { Agent } from "@prisma/client";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { AgentCard } from "@/components/agent-card";

export type AgentListItem = Pick<
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
> & { createdAt?: Date };

type Props = {
  agents: AgentListItem[];
};

function matchesQuery(agent: AgentListItem, raw: string): boolean {
  const q = raw.trim().toLowerCase();
  if (!q) return true;
  const blob = [agent.title, agent.description, agent.slug, ...agent.tags]
    .join(" ")
    .toLowerCase();
  return q
    .split(/\s+/)
    .filter((w) => w.length > 0)
    .every((word) => blob.includes(word));
}

export function AgentDirectory({ agents }: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () => agents.filter((a) => matchesQuery(a, query)),
    [agents, query],
  );

  return (
    <div className="w-full max-w-5xl">
      <div className="mx-auto w-full max-w-2xl">
        <label htmlFor="agent-search" className="sr-only">
          エージェントを検索
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--muted)]"
            strokeWidth={2}
            aria-hidden
          />
          <input
            id="agent-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="検索…"
            autoComplete="off"
            className="h-14 w-full rounded-full border border-[var(--border)] bg-[var(--card)] pl-14 pr-6 text-[16px] leading-[1.7] text-[#333333] shadow-none outline-none ring-0 transition placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 dark:text-[var(--foreground)]"
          />
        </div>
        <p className="mt-4 text-[14px] text-[var(--muted)]">
          {filtered.length === agents.length ? (
            <>{agents.length} 件</>
          ) : (
            <>
              <span className="font-semibold tabular-nums text-[#333333] dark:text-[var(--foreground)]">
                {filtered.length}
              </span>
              {" / "}
              {agents.length} 件
            </>
          )}
        </p>
      </div>

      {/* カード一覧: 白コンテナで区切りを明確に */}
      <div className="mt-8 rounded-[12px] border border-[var(--border)] bg-[var(--card)] p-5 sm:p-8">
        {filtered.length === 0 ? (
          <p className="py-12 text-center text-[15px] text-[var(--muted)]">
            該当なし
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {filtered.map((a) => (
              <li key={a.id}>
                <AgentCard agent={a} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
