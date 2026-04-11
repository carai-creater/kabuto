import type { Prisma } from "@prisma/client";

/** エージェント詳細・試用画面で共通利用する Prisma include */
export const agentDetailInclude = {
  conversationStarters: true,
  knowledgeDocuments: { orderBy: { createdAt: "asc" as const } },
  creator: { select: { name: true, email: true } },
} satisfies Prisma.AgentInclude;

export type AgentDetailPayload = Prisma.AgentGetPayload<{
  include: typeof agentDetailInclude;
}>;
