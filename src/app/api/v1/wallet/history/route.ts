import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveUserIdFromBearer } from "@/lib/auth/verify-bearer-token";

/**
 * `GET /api/v1/wallet/history?cursor=<iso>&limit=<n>&kind=<purchase|usage|all>`
 *
 * Cursor is an ISO8601 `createdAt` — rows strictly older than `cursor`
 * are returned. Merges PointPurchase and WalletTransaction into a
 * single time-ordered feed so iOS can render one scrollable history.
 */
export async function GET(req: NextRequest) {
  const resolved = await resolveUserIdFromBearer(req.headers.get("authorization"));
  if (!resolved) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const userId = resolved.userId;

  const url = new URL(req.url);
  const cursor = url.searchParams.get("cursor");
  const limit = clampInt(url.searchParams.get("limit"), 1, 100, 30);
  const kind = url.searchParams.get("kind") ?? "all";

  const cursorDate = cursor ? new Date(cursor) : null;
  const cursorFilter = cursorDate && !Number.isNaN(cursorDate.getTime())
    ? { lt: cursorDate }
    : undefined;

  const wantsPurchase = kind === "all" || kind === "purchase";
  const wantsUsage = kind === "all" || kind === "usage";

  const [purchases, usages] = await Promise.all([
    wantsPurchase
      ? prisma.pointPurchase.findMany({
          where: {
            userId,
            status: "completed",
            ...(cursorFilter ? { createdAt: cursorFilter } : {}),
          },
          orderBy: { createdAt: "desc" },
          take: limit,
          select: {
            id: true,
            amountPt: true,
            amountYen: true,
            stripeSessionId: true,
            createdAt: true,
          },
        })
      : Promise.resolve([]),
    wantsUsage
      ? prisma.walletTransaction.findMany({
          where: {
            userId,
            ...(cursorFilter ? { createdAt: cursorFilter } : {}),
          },
          orderBy: { createdAt: "desc" },
          take: limit,
          select: {
            id: true,
            agentId: true,
            amountPt: true,
            createdAt: true,
          },
        })
      : Promise.resolve([]),
  ]);

  type Row = {
    id: string;
    kind: "purchase" | "usage";
    amount_pt: number;
    amount_yen: number | null;
    source: string | null;
    agent_id: string | null;
    created_at: string;
    created_at_ms: number;
  };

  const merged: Row[] = [
    ...purchases.map((p) => ({
      id: p.id,
      kind: "purchase" as const,
      amount_pt: p.amountPt,
      amount_yen: p.amountYen,
      source: p.stripeSessionId.startsWith("iap_") ? "iap" : "stripe",
      agent_id: null,
      created_at: p.createdAt.toISOString(),
      created_at_ms: p.createdAt.getTime(),
    })),
    ...usages.map((u) => ({
      id: u.id,
      kind: "usage" as const,
      amount_pt: -u.amountPt,
      amount_yen: null,
      source: null,
      agent_id: u.agentId,
      created_at: u.createdAt.toISOString(),
      created_at_ms: u.createdAt.getTime(),
    })),
  ]
    .sort((a, b) => b.created_at_ms - a.created_at_ms)
    .slice(0, limit);

  const nextCursor = merged.length === limit ? merged[merged.length - 1].created_at : null;

  return NextResponse.json({
    ok: true,
    items: merged.map(({ created_at_ms, ...rest }) => rest),
    next_cursor: nextCursor,
  });
}

function clampInt(raw: string | null, min: number, max: number, fallback: number): number {
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}
