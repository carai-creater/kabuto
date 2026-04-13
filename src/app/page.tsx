import { HomeMarketplace } from "@/components/home-marketplace";
import { getMarketplaceAgents } from "@/lib/marketplace-agents";

export default async function Home() {
  const agents = await getMarketplaceAgents();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <HomeMarketplace agents={agents} variant="home" />
    </div>
  );
}
