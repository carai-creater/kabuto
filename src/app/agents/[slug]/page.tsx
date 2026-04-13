import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { AgentDetailView } from "@/components/agent-detail-view";
import { agentDetailInclude } from "@/lib/agent/agent-detail-include";
import { prisma } from "@/lib/prisma";
import { DbUnavailableMessage } from "@/components/db-unavailable";
import { isDatabaseConfigured } from "@/lib/is-database-configured";
import { getSessionUserId } from "@/lib/session";
import { getLatestChatSession } from "@/app/actions/chat-history";

function normalizeSlug(raw: string): string {
  try {
    return decodeURIComponent(raw).trim();
  } catch {
    return raw.trim();
  }
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata(props: Props): Promise<Metadata> {
  try {
    const { slug: raw } = await props.params;
    const slug = normalizeSlug(raw);
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

  const { slug: raw } = await props.params;
  const slug = normalizeSlug(raw);
  if (!slug) {
    notFound();
  }

  // session取得とagent取得を並列実行
  let sessionUserId: string | null;
  let agent;
  try {
    // まず公開済みエージェントとして並列フェッチ
    [sessionUserId, agent] = await Promise.all([
      getSessionUserId(),
      prisma.agent.findFirst({
        where: { slug, isPublished: true },
        include: agentDetailInclude,
      }),
    ]);

    // 未公開の場合、ログインユーザーがクリエイターなら再取得
    if (!agent && sessionUserId) {
      agent = await prisma.agent.findFirst({
        where: { slug, creatorId: sessionUserId },
        include: agentDetailInclude,
      });
    }
  } catch {
    return <DbUnavailableMessage />;
  }

  if (!agent) {
    notFound();
  }

  // ログイン中のみ履歴・お気に入り状態をロード（並列）
  const [chatHistory, favoriteRow, linkedAgents] = sessionUserId
    ? await Promise.all([
        getLatestChatSession(agent.id),
        prisma.agentFavorite.findUnique({
          where: { userId_agentId: { userId: sessionUserId, agentId: agent.id } },
          select: { id: true },
        }),
        prisma.agent.findMany({
          where: { creatorId: sessionUserId, id: { not: agent.id } },
          orderBy: [{ isPublished: "desc" }, { updatedAt: "desc" }],
          select: { id: true, slug: true, title: true },
          take: 6,
        }),
      ])
    : [null, null, []];

  return (
    <AgentDetailView
      agent={agent}
      sessionUserId={sessionUserId}
      initialMessages={chatHistory?.messages}
      chatSessionId={chatHistory?.sessionId}
      initialFavorited={Boolean(favoriteRow)}
      linkedAgents={linkedAgents}
    />
  );
}
