import { prisma } from "@/lib/prisma";

/**
 * デモログイン時のウォレット下限（pt）。
 * - 未設定: 開発では 1000、本番では 0（無効）
 * - `DEMO_WALLET_MIN_BALANCE_PT=0` で開発でも付与しない
 */
export function getDemoWalletMinBalancePt(): number {
  const raw = process.env.DEMO_WALLET_MIN_BALANCE_PT?.trim();
  if (raw === "0") return 0;
  if (raw && raw.length > 0) {
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  }
  return process.env.NODE_ENV === "development" ? 1000 : 0;
}

/** 残高が下限未満なら下限まで引き上げる（デモ用）。 */
export async function ensureDemoWalletMinBalance(userId: string): Promise<void> {
  const minPt = getDemoWalletMinBalancePt();
  if (minPt <= 0) return;

  const row = await prisma.wallet.findUnique({
    where: { userId },
    select: { balancePt: true },
  });
  if (!row) {
    await prisma.wallet.create({
      data: { userId, balancePt: minPt },
    });
    return;
  }
  if (row.balancePt >= minPt) return;
  await prisma.wallet.update({
    where: { userId },
    data: { balancePt: minPt },
  });
}
