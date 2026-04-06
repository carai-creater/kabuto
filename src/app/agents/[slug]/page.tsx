import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { RunAgentPanel } from "@/components/run-agent-panel";
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

  return (
    <main className="flex min-h-screen w-full flex-1 flex-col">
      <RunAgentPanel
        agentId={agent.id}
        pricePerUsePt={agent.pricePerUsePt}
        starters={agent.conversationStarters}
        tools={agent.tools}
        fullScreenChat
      />
    </main>
  );
}
