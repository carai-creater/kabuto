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
  | "pricePerUsePt"
  | "usageCount"
  | "ratingAvg"
  | "reviewCount"
  | "firstThreeFree"
  | "tags"
>;

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
    <>
      <div className="mx-auto w-full max-w-2xl">
        <label htmlFor="agent-search" className="sr-only">
          エージェントを検索
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--muted)] opacity-70"
            strokeWidth={2}
            aria-hidden
          />
          <input
            id="agent-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="名前・説明・タグで検索…"
            autoComplete="off"
            className="input-apple h-12 w-full rounded-xl border-[var(--border)] bg-[var(--card)] pl-12 pr-4 text-[16px] placeholder:text-[var(--muted)]"
          />
        </div>
        <p className="mt-4 text-[14px] text-[var(--muted)]">
          {filtered.length === agents.length ? (
            <>{agents.length} 件を表示</>
          ) : (
            <>
              <span className="font-semibold tabular-nums text-[#333333] dark:text-[var(--foreground)]">
                {filtered.length}
              </span>
              件が該当（全 {agents.length} 件）
            </>
          )}
        </p>
      </div>

      {filtered.length === 0 ? (
        <p className="mx-auto mt-12 max-w-md text-center text-[15px] text-[var(--muted)]">
          該当するエージェントがありません。別のキーワードを試してください。
        </p>
      ) : (
        <ul className="mx-auto mt-8 grid w-full max-w-5xl grid-cols-1 gap-6 md:grid-cols-2">
          {filtered.map((a) => (
            <li key={a.id}>
              <AgentCard agent={a} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
