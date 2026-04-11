import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";

import { AgentDetailView } from "@/components/agent-detail-view";
import {
  agentDetailInclude,
} from "@/lib/agent/agent-detail-include";
import { ensureProfileForUser } from "@/lib/auth/profile";
import { prisma } from "@/lib/prisma";
import { DbUnavailableMessage } from "@/components/db-unavailable";
import { isDatabaseConfigured } from "@/lib/is-database-configured";
import { getSessionUserId } from "@/lib/session";

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
    const userId = await getSessionUserId();
    if (!userId) return { title: "エージェント" };
    const agent = await prisma.agent.findFirst({
      where: { slug, creatorId: userId },
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

export default async function CreatorAgentDetailPage(props: Props) {
  if (!isDatabaseConfigured()) {
    return <DbUnavailableMessage />;
  }

  const userId = await getSessionUserId();
  if (!userId) {
    redirect("/login?next=%2Fdashboard%2Fcreator");
  }

  try {
    await ensureProfileForUser(userId);
  } catch {
    return <DbUnavailableMessage />;
  }

  const { slug: raw } = await props.params;
  const slug = normalizeSlug(raw);
  if (!slug) {
    notFound();
  }

  let agent;
  try {
    agent = await prisma.agent.findFirst({
      where: { slug, creatorId: userId },
      include: agentDetailInclude,
    });
  } catch {
    return <DbUnavailableMessage />;
  }

  if (!agent) {
    notFound();
  }

  return (
    <AgentDetailView agent={agent} sessionUserId={userId} />
  );
}
