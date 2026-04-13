import { isDatabaseConfigured } from "@/lib/is-database-configured";
import { prisma } from "@/lib/prisma";

/**
 * 期間限定付与。`WALLET_PROMO_PT` があれば本番でも有効（slug は省略時 `ltd-1000pt-202604`）。
 * 未設定かつ開発環境のみデフォルト 1000pt。無効化は `WALLET_PROMO_PT=0`。
 */
export function getWalletPromoConfig(): { slug: string; pt: number } | null {
  const rawPt =
    process.env.WALLET_PROMO_PT?.trim() ??
    (process.env.NODE_ENV === "development" ? "1000" : "");
  if (rawPt === "" || rawPt === "0") return null;
  const pt = parseInt(rawPt, 10);
  if (!Number.isFinite(pt) || pt <= 0) return null;

  const slug =
    process.env.WALLET_PROMO_SLUG?.trim() || "ltd-1000pt-202604";
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
