"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";

export async function toggleFavorite(agentId: string): Promise<{ favorited: boolean }> {
  const userId = await getSessionUserId();
  if (!userId) throw new Error("unauthorized");

  const existing = await prisma.agentFavorite.findUnique({
    where: { userId_agentId: { userId, agentId } },
    select: { id: true },
  });

  if (existing) {
    await prisma.agentFavorite.delete({ where: { id: existing.id } });
    return { favorited: false };
  } else {
    await prisma.agentFavorite.create({ data: { userId, agentId } });
    return { favorited: true };
  }
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
