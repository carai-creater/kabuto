"use client";

import type { AgentListItem } from "@/components/agent-directory";
import { MarketplaceAgentCard } from "@/components/marketplace-agent-card";
import { PAGE_SHELL } from "@/lib/page-shell";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

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

function byUsage(a: AgentListItem, b: AgentListItem) {
  return b.usageCount - a.usageCount;
}

function byNewest(a: AgentListItem, b: AgentListItem) {
  const ta = a.createdAt?.getTime() ?? 0;
  const tb = b.createdAt?.getTime() ?? 0;
  return tb - ta;
}

type Props = {
  agents: AgentListItem[];
  /** デモデータ表示中（控えめな注記用） */
  isSampleCatalog?: boolean;
};

export function HomeMarketplace({ agents, isSampleCatalog }: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () => agents.filter((a) => matchesQuery(a, query)),
    [agents, query],
  );

  const featured = useMemo(() => {
    return [...filtered].sort(byUsage).slice(0, 3);
  }, [filtered]);

  const popular = useMemo(() => {
    return [...filtered].sort(byUsage).slice(0, 6);
  }, [filtered]);

  const newest = useMemo(() => {
    return [...filtered].sort(byNewest).slice(0, 6);
  }, [filtered]);

  return (
    <div className="flex min-h-full flex-1 flex-col bg-[var(--background)]">
      {/* ヒーロー */}
      <header className="relative w-full overflow-hidden border-b border-[var(--border)] bg-gradient-to-b from-white to-[var(--background)] dark:from-[var(--card)] dark:to-[var(--background)]">
        <div className={`${PAGE_SHELL} py-12 sm:py-16 lg:py-20`}>
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)] sm:text-[13px]">
              AI スキルマーケット
            </p>
            <h1 className="mt-4 text-balance text-[clamp(1.75rem,4vw,2.75rem)] font-semibold leading-[1.15] tracking-tight text-[#1e293b] dark:text-[var(--foreground)]">
              目的に合うエージェントを、
              <br className="sm:hidden" />
              さがしてみましょう
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-pretty text-[16px] leading-relaxed text-[var(--muted)] sm:text-[17px]">
              公開エージェントをポイントで利用できます。気になるスキルから選ぶか、検索して見つけてください。
            </p>
            {isSampleCatalog && (
              <p className="mt-6 text-[13px] text-[var(--muted)]">
                サンプルカタログを表示しています。接続後は公開エージェントがここに並びます。
              </p>
            )}
          </div>
        </div>
      </header>

      <div className={`${PAGE_SHELL} flex flex-1 flex-col pb-24 pt-10 sm:pt-12`}>
        <div className="mx-auto w-full max-w-6xl">
          <label htmlFor="marketplace-search" className="sr-only">
            エージェントを検索
          </label>
          <div className="relative mx-auto max-w-2xl">
            <Search
              className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--muted)]"
              strokeWidth={2}
              aria-hidden
            />
            <input
              id="marketplace-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="キーワードで検索…"
              autoComplete="off"
              className="h-14 w-full rounded-full border border-[var(--border)] bg-[var(--card)] pl-14 pr-6 text-[16px] text-[#333333] shadow-sm outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 dark:text-[var(--foreground)]"
            />
          </div>
          <p className="mt-3 text-center text-[13px] text-[var(--muted)]">
            {filtered.length === agents.length ? (
              <>{agents.length} 件のエージェント</>
            ) : (
              <>
                <span className="font-semibold tabular-nums text-[#334155] dark:text-[var(--foreground)]">
                  {filtered.length}
                </span>
                {" 件 / "}
                {agents.length} 件
              </>
            )}
          </p>
        </div>

        {filtered.length === 0 ? (
          <p className="mx-auto mt-16 max-w-md text-center text-[15px] text-[var(--muted)]">
            該当するエージェントがありません。別のキーワードで試してください。
          </p>
        ) : (
          <div className="mx-auto mt-14 flex w-full max-w-6xl flex-col gap-16 sm:gap-20">
            <section aria-labelledby="section-featured">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <h2
                  id="section-featured"
                  className="text-[22px] font-bold tracking-tight text-[#0f172a] dark:text-[var(--foreground)] sm:text-[24px]"
                >
                  注目のエージェント
                </h2>
                <p className="text-[14px] text-[var(--muted)]">
                  利用実績の多いスキル
                </p>
              </div>
              <ul className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {featured.map((agent) => (
                  <li key={`feat-${agent.id}`}>
                    <MarketplaceAgentCard agent={agent} />
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="section-popular">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <h2
                  id="section-popular"
                  className="text-[22px] font-bold tracking-tight text-[#0f172a] dark:text-[var(--foreground)] sm:text-[24px]"
                >
                  人気のスキル
                </h2>
                <p className="text-[14px] text-[var(--muted)]">
                  よく使われているエージェント
                </p>
              </div>
              <ul className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {popular.map((agent) => (
                  <li key={`pop-${agent.id}`}>
                    <MarketplaceAgentCard agent={agent} />
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="section-new">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <h2
                  id="section-new"
                  className="text-[22px] font-bold tracking-tight text-[#0f172a] dark:text-[var(--foreground)] sm:text-[24px]"
                >
                  新着
                </h2>
                <p className="text-[14px] text-[var(--muted)]">
                  最近追加されたスキル
                </p>
              </div>
              <ul className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {newest.map((agent) => (
                  <li key={`new-${agent.id}`}>
                    <MarketplaceAgentCard agent={agent} />
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
