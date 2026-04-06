"use server";

import { getSessionUserId } from "@/lib/session";
import { getWalletBalancePt } from "@/lib/wallet";

/** ログイン中ユーザーのウォレット残高（未ログインは null） */
export async function getSessionWalletBalance(): Promise<number | null> {
  const userId = await getSessionUserId();
  if (!userId) return null;
  return getWalletBalancePt(userId);
}
