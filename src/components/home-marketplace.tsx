"use client";

import type { AgentListItem } from "@/components/agent-directory";
import { MarketplaceAgentCard } from "@/components/marketplace-agent-card";
import { PAGE_SHELL } from "@/lib/page-shell";
import Link from "next/link";
import { Search, Zap, Gift, PenLine } from "lucide-react";
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
  // unstable_cache はシリアライズで Date → string になるため new Date() で安全に変換
  const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
  const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
  return tb - ta;
}

const CATEGORIES = [
  { label: "すべて",      tag: null },
  { label: "文章・ライティング", tag: "文章" },
  { label: "データ分析",  tag: "データ" },
  { label: "コーディング", tag: "コード" },
  { label: "業務効率化",  tag: "業務" },
  { label: "画像・デザイン", tag: "画像" },
  { label: "調査・リサーチ", tag: "リサーチ" },
  { label: "翻訳・言語",  tag: "翻訳" },
];

const EXAMPLE_PROMPTS = [
  "議事録を自動でまとめる…",
  "コードをレビューしてもらう…",
  "競合他社を調査する…",
  "英語メールを翻訳する…",
  "データをグラフにする…",
];

type Props = {
  agents: AgentListItem[];
  variant?: "home" | "browse";
};

export function HomeMarketplace({ agents, variant = "home" }: Props) {
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [placeholderIdx] = useState(() => Math.floor(Math.random() * EXAMPLE_PROMPTS.length));

  const filtered = useMemo(() => {
    return agents.filter((a) => {
      const matchQ = matchesQuery(a, query);
      const matchTag = !activeTag || a.tags.some((t) => t.includes(activeTag));
      return matchQ && matchTag;
    });
  }, [agents, query, activeTag]);

  const sorted = useMemo(() => [...filtered].sort(byUsage), [filtered]);
  const newest = useMemo(() => [...filtered].sort(byNewest).slice(0, 6), [filtered]);
  const isSearching = query.trim().length > 0 || activeTag !== null;

  return (
    <div className="flex min-h-full flex-1 flex-col">

      {/* ─── Hero: 検索ファースト ─── */}
      <section className="w-full border-b border-[var(--border)] bg-[var(--background)]">
        <div className={`${PAGE_SHELL} py-16 sm:py-24`}>
          <div className="mx-auto max-w-2xl">

            {variant !== "browse" && (
              <p className="mb-5 text-center text-[13px] font-medium text-[var(--muted)]">
                <span className="mr-1.5 inline-block rounded-full bg-[var(--brand-muted)] px-2.5 py-0.5 text-[var(--accent)]">
                  新規登録で 1,000 pt 無料
                </span>
              </p>
            )}

            <h1 className="text-center text-[clamp(1.75rem,4.5vw,2.75rem)] font-bold leading-[1.1] tracking-tight text-[var(--foreground)]">
              AIエージェントを探す
            </h1>
            <p className="mt-3 text-center text-[16px] text-[var(--muted)]">
              {agents.length} 件のエージェントから、あなたの仕事を自動化しよう
            </p>

            {/* 検索バー */}
            <div className="relative mt-8">
              <Search
                className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--muted)]"
                strokeWidth={2}
                aria-hidden
              />
              <input
                id="marketplace-search-input"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={EXAMPLE_PROMPTS[placeholderIdx]}
                autoComplete="off"
                className="h-[56px] w-full rounded-2xl border border-[var(--border)] bg-[var(--card)] pl-14 pr-6 text-[16px] text-[var(--foreground)] shadow-sm outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-[var(--muted)] hover:text-[var(--foreground)]"
                  aria-label="クリア"
                >
                  ✕
                </button>
              )}
            </div>

            {/* カテゴリチップ */}
            <div className="mt-4 flex flex-wrap gap-2">
              {CATEGORIES.map((c) => {
                const active = c.tag === activeTag;
                return (
                  <button
                    key={c.label}
                    type="button"
                    onClick={() => setActiveTag(active ? null : c.tag)}
                    className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium transition ${
                      active
                        ? "bg-[var(--accent)] text-white"
                        : "border border-[var(--border)] bg-[var(--card)] text-[var(--muted)] hover:border-[var(--accent)]/50 hover:text-[var(--foreground)]"
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ─── 価値訴求（ホーム・非検索時のみ） ─── */}
      {variant === "home" && !isSearching && (
        <div className="border-b border-[var(--border)] bg-[var(--card)]">
          <div className={`${PAGE_SHELL} py-10`}>
            <ul className="mx-auto grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
              {[
                { Icon: Zap,     title: "すぐ使える",        desc: "登録してポイントをチャージするだけ。複雑なセットアップ不要。" },
                { Icon: Gift,    title: "新規 1,000 pt 無料", desc: "アカウント作成で 1,000 pt を付与。まずは無料でお試しください。" },
                { Icon: PenLine, title: "自分でも作れる",     desc: "プロンプトを書くだけで AI エージェントを公開・収益化できます。" },
              ].map(({ Icon, title, desc }) => (
                <li key={title} className="flex items-start gap-3 rounded-xl p-2">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center text-[var(--accent)]">
                    <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
                  </span>
                  <div>
                    <p className="text-[14px] font-semibold text-[var(--foreground)]">{title}</p>
                    <p className="mt-1 text-[13px] leading-relaxed text-[var(--muted)]">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ─── 結果エリア ─── */}
      <div id="marketplace-search" className={`${PAGE_SHELL} flex-1 pb-24 pt-10`}>
        <div className="mx-auto max-w-6xl">

          {filtered.length === 0 ? (
            <div className="mt-16 text-center">
              <Search className="mx-auto h-8 w-8 text-[var(--muted)]" strokeWidth={1.5} aria-hidden />
              <p className="mt-3 text-[16px] font-medium text-[var(--foreground)]">
                「{query}」に一致するエージェントが見つかりません
              </p>
              <button
                type="button"
                onClick={() => { setQuery(""); setActiveTag(null); }}
                className="mt-4 text-[14px] text-[var(--accent)] underline"
              >
                検索をリセット
              </button>
            </div>
          ) : isSearching ? (
            /* 検索中: フラットリスト */
            <div>
              <p className="mb-6 text-[14px] text-[var(--muted)]">
                <span className="font-semibold text-[var(--foreground)]">{filtered.length}</span> 件のエージェント
              </p>
              <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {sorted.map((agent) => (
                  <li key={agent.id}>
                    <MarketplaceAgentCard agent={agent} />
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            /* デフォルト: セクション分け */
            <div className="flex flex-col gap-16">

              {/* 注目 */}
              <section>
                <div className="mb-6 flex items-end justify-between">
                  <div>
                    <h2 className="text-[20px] font-bold text-[var(--foreground)]">注目のエージェント</h2>
                    <p className="mt-1 text-[13px] text-[var(--muted)]">利用実績の多い上位エージェント</p>
                  </div>
                  <Link href="/agents" className="text-[13px] font-medium text-[var(--accent)] hover:underline">
                    すべて見る →
                  </Link>
                </div>
                <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {sorted.slice(0, 3).map((agent) => (
                    <li key={agent.id}>
                      <MarketplaceAgentCard agent={agent} />
                    </li>
                  ))}
                </ul>
              </section>

              {/* 新着 */}
              {newest.length > 0 && (
                <section>
                  <div className="mb-6 flex items-end justify-between">
                    <div>
                      <h2 className="text-[20px] font-bold text-[var(--foreground)]">新着エージェント</h2>
                      <p className="mt-1 text-[13px] text-[var(--muted)]">最近追加されたエージェント</p>
                    </div>
                  </div>
                  <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {newest.map((agent) => (
                      <li key={agent.id}>
                        <MarketplaceAgentCard agent={agent} />
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* クリエイター向けCTA */}
              <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
                <p className="text-[28px] font-bold text-[var(--foreground)]">エージェントを公開しよう</p>
                <p className="mt-2 text-[15px] text-[var(--muted)]">
                  あなたが作ったエージェントを世界に公開して、利用されるたびに収益を得られます
                </p>
                <Link
                  href="/dashboard/creator/new"
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-8 py-3 text-[15px] font-semibold text-white transition hover:bg-[var(--accent-hover)]"
                >
                  エージェントを作成する
                </Link>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
