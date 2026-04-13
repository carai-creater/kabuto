import { grantWalletPromoIfNeeded } from "@/lib/wallet-promo";
import { getSessionUserId } from "@/lib/session";

/** リクエストごとにログインユーザーへキャンペーン pt を未受け取りなら付与する */
export async function PromoWalletGrant() {
  const userId = await getSessionUserId();
  if (userId) {
    await grantWalletPromoIfNeeded(userId);
  }
  return null;
}
