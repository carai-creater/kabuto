import type { CreateAgentPayload } from "@/lib/agent/create-agent";
import { buildKabutoToolConfig } from "@/lib/agent/editor-config";
import { attachKnowledgeFilesFromForm } from "@/lib/agent/knowledge-upload";
import { prisma } from "@/lib/prisma";

export async function updateAgentFromPayload(
  userId: string,
  slug: string,
  data: CreateAgentPayload,
  knowledgeFiles: File[],
  opts: { isPublished: boolean },
): Promise<{ slug: string }> {
  const existing = await prisma.agent.findFirst({
    where: { slug, creatorId: userId },
    select: { id: true },
  });
  if (!existing) {
    throw new Error("AGENT_NOT_FOUND");
  }

  const toolConfig = buildKabutoToolConfig({
    capabilities: data.capabilities,
    actions: data.actions,
    mcp: data.mcp,
    useRecommendedModel: data.useRecommendedModel,
  });

  const starters = data.conversationStarters;

  await prisma.$transaction(async (tx) => {
    await tx.conversationStarter.deleteMany({
      where: { agentId: existing.id },
    });

    await tx.agent.update({
      where: { id: existing.id },
      data: {
        title: data.title.trim(),
        description: data.description.trim(),
        iconEmoji: data.iconEmoji,
        systemPrompt: data.instructions.trim(),
        defaultLlm: data.defaultLlm,
        toolConfig,
        pricePerUsePt: data.pricePerUsePt,
        isPublished: opts.isPublished,
      },
    });

    if (starters.length > 0) {
      await tx.conversationStarter.createMany({
        data: starters.map((text, position) => ({
          agentId: existing.id,
          position,
          text: text.trim(),
        })),
      });
    }
  });

  if (knowledgeFiles.length > 0) {
    await attachKnowledgeFilesFromForm(userId, existing.id, knowledgeFiles);
  }

  return { slug };
}
