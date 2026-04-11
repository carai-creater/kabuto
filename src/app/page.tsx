import { prisma } from "@/lib/prisma";
import { HomeMarketplace } from "@/components/home-marketplace";
import type { AgentListItem } from "@/components/agent-directory";
import { isDatabaseConfigured } from "@/lib/is-database-configured";
import { getMarketplaceDemoAgents } from "@/lib/marketplace-demo-agents";

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

export default async function Home() {
  let agents: AgentListItem[] = [];
  let isSampleCatalog = false;

  if (!isDatabaseConfigured()) {
    agents = getMarketplaceDemoAgents();
    isSampleCatalog = true;
  } else {
    try {
      const rows = await prisma.agent.findMany({
        where: { isPublished: true },
        orderBy: { usageCount: "desc" },
        select: agentSelect,
      });
      agents = rows;
      if (rows.length === 0) {
        agents = getMarketplaceDemoAgents();
        isSampleCatalog = true;
      }
    } catch (err) {
      console.error("[Home] database error:", err);
      agents = getMarketplaceDemoAgents();
      isSampleCatalog = true;
    }
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <HomeMarketplace agents={agents} isSampleCatalog={isSampleCatalog} />
    </div>
  );
}
