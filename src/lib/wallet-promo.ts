import { isDatabaseConfigured } from "@/lib/is-database-configured";
import { prisma } from "@/lib/prisma";

/**
 * 期間限定付与。未設定時は開発のみデフォルト（slug / pt）。
 * 本番では `WALLET_PROMO_SLUG` と `WALLET_PROMO_PT` を明示してください。
 */
export function getWalletPromoConfig(): { slug: string; pt: number } | null {
  const slug =
    process.env.WALLET_PROMO_SLUG?.trim() ||
    (process.env.NODE_ENV === "development" ? "ltd-1000pt-202604" : "");
  const ptStr =
    process.env.WALLET_PROMO_PT?.trim() ||
    (process.env.NODE_ENV === "development" ? "1000" : "");
  if (!slug || !ptStr) return null;
  const pt = parseInt(ptStr, 10);
  if (!Number.isFinite(pt) || pt <= 0) return null;
  return { slug, pt };
}

function isPrismaUniqueViolation(e: unknown): boolean {
  return (
    e !== null &&
    typeof e === "object" &&
    "code" in e &&
    (e as { code?: string }).code === "P2002"
  );
}

/** ログインユーザーにキャンペーン pt を 1 回だけ付与する（失敗時はログのみ）。 */
export async function grantWalletPromoIfNeeded(userId: string): Promise<void> {
  const cfg = getWalletPromoConfig();
  if (!cfg || !isDatabaseConfigured()) return;

  const { slug, pt } = cfg;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.walletPromoClaim.create({
        data: {
          userId,
          slug,
          pointsPt: pt,
        },
      });
      await tx.wallet.upsert({
        where: { userId },
        update: { balancePt: { increment: pt } },
        create: { userId, balancePt: pt },
      });
    });
  } catch (e: unknown) {
    if (isPrismaUniqueViolation(e)) {
      return;
    }
    console.error("[wallet-promo] grant failed:", e);
  }
}
