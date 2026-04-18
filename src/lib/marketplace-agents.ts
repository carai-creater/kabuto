import { unstable_cache } from "next/cache";
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
  iconUrl: true,
  pricePerUsePt: true,
  usageCount: true,
  ratingAvg: true,
  reviewCount: true,
  firstThreeFree: true,
  tags: true,
  createdAt: true,
} as const;

async function fetchMarketplaceAgents(): Promise<AgentListItem[]> {
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

/**
 * エージェント一覧を 60 秒キャッシュ。
 * エージェント公開・更新時は revalidateTag("marketplace-agents") で即時無効化。
 */
export const getMarketplaceAgents = unstable_cache(
  fetchMarketplaceAgents,
  ["marketplace-agents"],
  { revalidate: 60, tags: ["marketplace-agents"] },
);
