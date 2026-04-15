"use server";

import { prisma } from "@/lib/prisma";
import { toggleFavoriteCore } from "@/lib/agent/favorite-core";
import { getSessionUserId } from "@/lib/session";

export async function toggleFavorite(agentId: string): Promise<{ favorited: boolean }> {
  const userId = await getSessionUserId();
  if (!userId) throw new Error("unauthorized");
  return toggleFavoriteCore(userId, agentId);
}

export async function getFavoriteAgents(): Promise<
  { id: string; slug: string; title: string; iconEmoji: string; description: string }[]
> {
  const userId = await getSessionUserId();
  if (!userId) return [];

  const rows = await prisma.agentFavorite.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      agent: { select: { id: true, slug: true, title: true, iconEmoji: true, description: true } },
    },
  });

  return rows.map((r) => r.agent);
}
