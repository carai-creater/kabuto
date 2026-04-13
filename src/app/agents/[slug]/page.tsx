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

  const sessionUserId = await getSessionUserId();

  let agent;
  try {
    agent = await prisma.agent.findFirst({
      where: sessionUserId
        ? {
            slug,
            OR: [{ isPublished: true }, { creatorId: sessionUserId }],
          }
        : { slug, isPublished: true },
      include: agentDetailInclude,
    });
  } catch {
    return <DbUnavailableMessage />;
  }

  if (!agent) {
    notFound();
  }

  // ログイン中のみ履歴をロード
  const chatHistory = sessionUserId
    ? await getLatestChatSession(agent.id)
    : null;

  return (
    <AgentDetailView
      agent={agent}
      sessionUserId={sessionUserId}
      initialMessages={chatHistory?.messages}
      chatSessionId={chatHistory?.sessionId}
    />
  );
}
