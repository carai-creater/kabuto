import { prisma } from "@/lib/prisma";

/** 既存ユーザーに Profile が無い場合に user で作成する */
export async function ensureProfileForUser(userId: string): Promise<void> {
  await prisma.profile.upsert({
    where: { userId },
    create: { userId, role: "user" },
    update: {},
  });
}
