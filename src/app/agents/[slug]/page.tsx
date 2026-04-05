import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { RunAgentPanel } from "@/components/run-agent-panel";
import { ReviewForm } from "@/components/review-form";
import { DbUnavailableMessage } from "@/components/db-unavailable";
import { isDatabaseConfigured } from "@/lib/is-database-configured";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata(props: Props): Promise<Metadata> {
  try {
    const { slug } = await props.params;
    const agent = await prisma.agent.findUnique({
      where: { slug },
      select: { title: true, description: true },
    });
    if (!agent) return { title: "エージェント" };
    return {
      title: `${agent.title} — kabuto`,
      description: agent.description.slice(0, 160),
    };
  } catch {
    return { title: "kabuto" };
  }
}

export default async function AgentDetailPage(props: Props) {
  if (!isDatabaseConfigured()) {
    return <DbUnavailableMessage />;
  }

  const { slug } = await props.params;

  let agent;
  try {
    agent = await prisma.agent.findFirst({
      where: { slug, isPublished: true },
      include: {
        conversationStarters: true,
        knowledgeDocuments: { orderBy: { createdAt: "asc" } },
        creator: { select: { name: true, email: true } },
      },
    });
  } catch {
    return <DbUnavailableMessage />;
  }

  if (!agent) {
    notFound();
  }

  const tools = Array.isArray(agent.tools) ? agent.tools : [];
  const rating = Number(agent.ratingAvg);
  const highValue =
    agent.tags.includes("高コスパ") ||
    (agent.reviewCount >= 3 && rating >= 4);

  return (
    <main className="relative flex flex-1 flex-col px-4 pb-24 pt-8 sm:px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_40%_at_50%_-10%,rgba(212,175,55,0.12),transparent)]"
      />
      <article className="relative mx-auto w-full max-w-3xl">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            <span
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-black text-4xl ring-1 ring-white/10"
              aria-hidden
            >
              {agent.iconEmoji}
            </span>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
                {agent.title}
              </h1>
              <p className="mt-1 text-sm text-zinc-500">
                クリエイター:{" "}
                {agent.creator.name ?? agent.creator.email ?? "—"}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
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
                {agent.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md bg-white/5 px-2 py-0.5 text-[11px] text-zinc-400 ring-1 ring-white/10"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <dl className="grid shrink-0 grid-cols-2 gap-x-6 gap-y-2 text-sm sm:text-right">
            <div>
              <dt className="text-zinc-500">評価</dt>
              <dd className="font-medium tabular-nums text-zinc-100">
                {agent.reviewCount > 0 ? `${rating.toFixed(1)} / 5` : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">レビュー</dt>
              <dd className="font-medium tabular-nums text-zinc-100">
                {agent.reviewCount} 件
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">利用回数</dt>
              <dd className="font-medium tabular-nums text-zinc-100">
                {agent.usageCount.toLocaleString("ja-JP")}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">コスト</dt>
              <dd className="font-medium tabular-nums text-[#E8D48B]">
                {agent.pricePerUsePt} pt / 回
              </dd>
            </div>
          </dl>
        </header>

        <section className="mt-8 space-y-4">
          <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-500">
            説明
          </h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
            {agent.description}
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-500">
            役割（Instruction）
          </h2>
          <pre className="mt-2 max-h-48 overflow-auto rounded-xl border border-white/10 bg-black/40 p-4 text-xs leading-relaxed text-zinc-300">
            {agent.systemPrompt}
          </pre>
        </section>

        {agent.knowledgeDocuments.length > 0 && (
          <section className="mt-8">
            <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-500">
              知識（RAG）ドキュメント
            </h2>
            <ul className="mt-2 space-y-2">
              {agent.knowledgeDocuments.map((d) => (
                <li
                  key={d.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-zinc-950/40 px-3 py-2 text-sm text-zinc-300"
                >
                  <span className="truncate">{d.title}</span>
                  <span className="shrink-0 text-xs text-zinc-500">{d.mimeType}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-10">
          <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-500">
            機能（Tools）
          </h2>
          {tools.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500">未設定</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {(tools as { name?: string; type?: string }[]).map((t, i) => (
                <li
                  key={`${t.name ?? i}`}
                  className="rounded-xl border border-white/10 bg-zinc-950/40 px-3 py-2 text-sm text-zinc-300"
                >
                  <span className="font-medium">{t.name ?? "tool"}</span>
                  {t.type ? (
                    <span className="text-zinc-500"> · {t.type}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="mt-10">
          <RunAgentPanel
            agentId={agent.id}
            pricePerUsePt={agent.pricePerUsePt}
            starters={agent.conversationStarters}
            tools={agent.tools}
          />
        </div>

        <div className="mt-10">
          <ReviewForm agentId={agent.id} />
        </div>
      </article>
    </main>
  );
}
