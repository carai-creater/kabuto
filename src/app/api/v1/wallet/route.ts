import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveUserIdFromBearer } from "@/lib/auth/verify-bearer-token";

/**
 * `GET /api/v1/wallet`
 *
 * 残高 + 直近の購入/消費履歴を 1 レスポンスで返す。ページングは
 * `GET /api/v1/wallet/history` を別途用意。既存 `Wallet` / `PointPurchase`
 * / `WalletTransaction` を select するだけの薄いラッパー。
 */
export async function GET(req: NextRequest) {
  const resolved = await resolveUserIdFromBearer(req.headers.get("authorization"));
  if (!resolved) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const userId = resolved.userId;

  const [wallet, purchases, usages] = await Promise.all([
    prisma.wallet.findUnique({
      where: { userId },
      select: { balancePt: true, updatedAt: true },
    }),
    prisma.pointPurchase.findMany({
      where: { userId, status: "completed" },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        amountPt: true,
        amountYen: true,
        stripeSessionId: true,
        createdAt: true,
      },
    }),
    prisma.walletTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        agentId: true,
        amountPt: true,
        createdAt: true,
      },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    balance_pt: wallet?.balancePt ?? 0,
    updated_at: wallet?.updatedAt.toISOString() ?? null,
    recent_purchases: purchases.map((p) => ({
      id: p.id,
      amount_pt: p.amountPt,
      amount_yen: p.amountYen,
      source: p.stripeSessionId.startsWith("iap_") ? "iap" : "stripe",
      created_at: p.createdAt.toISOString(),
    })),
    recent_usages: usages.map((u) => ({
      id: u.id,
      agent_id: u.agentId,
      amount_pt: u.amountPt,
      created_at: u.createdAt.toISOString(),
    })),
  });
}
