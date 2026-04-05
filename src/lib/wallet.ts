import { prisma } from "@/lib/prisma";

export async function getWalletBalancePt(userId: string): Promise<number> {
  const w = await prisma.wallet.findUnique({
    where: { userId },
    select: { balancePt: true },
  });
  return w?.balancePt ?? 0;
}
