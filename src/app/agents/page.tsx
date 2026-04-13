import type { Metadata } from "next";
import { HomeMarketplace } from "@/components/home-marketplace";
import { getMarketplaceAgents } from "@/lib/marketplace-agents";

export const metadata: Metadata = {
  title: "エージェントを探す — kabuto",
  description: "公開されている AI エージェントを検索・利用できます。",
};

export default async function AgentsBrowsePage() {
  const agents = await getMarketplaceAgents();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <HomeMarketplace agents={agents} variant="browse" />
    </div>
  );
}
