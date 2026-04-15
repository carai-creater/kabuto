import { prisma } from "@/lib/prisma";

/**
 * 純粋なお気に入りトグル。呼び出し側が `userId` を解決する
 * （既存 Server Action は cookie、`/api/v1/*` は Bearer JWT 経由）。
 */
export async function toggleFavoriteCore(
  userId: string,
  agentId: string,
): Promise<{ favorited: boolean }> {
  const existing = await prisma.agentFavorite.findUnique({
    where: { userId_agentId: { userId, agentId } },
    select: { id: true },
  });

  if (existing) {
    await prisma.agentFavorite.delete({ where: { id: existing.id } });
    return { favorited: false };
  }
  await prisma.agentFavorite.create({ data: { userId, agentId } });
  return { favorited: true };
}
