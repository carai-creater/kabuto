"use client";

import type { Agent } from "@prisma/client";
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
    [agents, query]
  );

  return (
    <>
      <div className="mx-auto w-full max-w-2xl">
        <label htmlFor="agent-search" className="sr-only">
          エージェントを検索
        </label>
        <div className="relative">
          <span
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[18px] opacity-50"
            aria-hidden
          >
            🔍
          </span>
          <input
            id="agent-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="名前・説明・タグで検索…"
            autoComplete="off"
            className="input-apple h-12 w-full rounded-2xl border-[var(--border)] bg-[var(--card)] pl-12 pr-4 text-[16px] shadow-sm ring-1 ring-black/[0.04] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25 dark:ring-white/[0.06]"
          />
        </div>
        <p className="mt-3 text-[15px] text-[var(--muted)]">
          {filtered.length === agents.length ? (
            <>{agents.length} 件を表示</>
          ) : (
            <>
              <span className="font-medium tabular-nums text-foreground">
                {filtered.length}
              </span>
              件が該当（全 {agents.length} 件）
            </>
          )}
        </p>
      </div>

      {filtered.length === 0 ? (
        <p className="mx-auto mt-10 max-w-md text-center text-[15px] text-[var(--muted)]">
          該当するエージェントがありません。別のキーワードを試してください。
        </p>
      ) : (
        <ul className="mx-auto mt-8 grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
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
