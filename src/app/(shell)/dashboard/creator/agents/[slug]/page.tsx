import Link from "next/link";
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
    <div className="flex min-h-0 w-full flex-1 flex-col">
      <div className="border-b border-[var(--border)] bg-[var(--card)] px-4 py-2 text-center text-[13px] text-[var(--muted)]">
        <Link
          href={`/dashboard/creator/edit/${encodeURIComponent(slug)}`}
          className="font-medium text-[var(--accent)] hover:underline"
        >
          設定・公開は編集ページへ
        </Link>
      </div>
      <AgentDetailView agent={agent} sessionUserId={userId} />
    </div>
  );
}
