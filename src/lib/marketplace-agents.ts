import type { AgentListItem } from "@/components/agent-directory";
import { isDatabaseConfigured } from "@/lib/is-database-configured";
import { getMarketplaceDemoAgents } from "@/lib/marketplace-demo-agents";
import { prisma } from "@/lib/prisma";

const agentSelect = {
  id: true,
  slug: true,
  title: true,
  description: true,
  iconEmoji: true,
  pricePerUsePt: true,
  usageCount: true,
  ratingAvg: true,
  reviewCount: true,
  firstThreeFree: true,
  tags: true,
  createdAt: true,
} as const;

export async function getMarketplaceAgents(): Promise<AgentListItem[]> {
  if (!isDatabaseConfigured()) {
    return getMarketplaceDemoAgents();
  }
  try {
    const rows = await prisma.agent.findMany({
      where: { isPublished: true },
      orderBy: { usageCount: "desc" },
      select: agentSelect,
    });
    if (rows.length === 0) {
      return getMarketplaceDemoAgents();
    }
    return rows;
  } catch (err) {
    console.error("[getMarketplaceAgents] database error:", err);
    return getMarketplaceDemoAgents();
  }
}
