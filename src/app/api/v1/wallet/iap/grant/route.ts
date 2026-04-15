import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveUserIdFromBearer } from "@/lib/auth/verify-bearer-token";
import { grantIapCore } from "@/lib/wallet/iap-grant";
import { parseIapJws } from "@/lib/wallet/iap-jws";
import { lookupIapPackage } from "@/lib/wallet/iap-packages";

/**
 * `POST /api/v1/wallet/iap/grant`
 *
 * Body: `{ product_id, transaction_id, signed_transaction_jws }`
 *
 * - Bearer 必須
 * - 既存の `PointPurchase.stripeSessionId` unique 制約を
 *   `iap_<transaction_id>` として流用し、同一 transaction_id の二重付与
 *   を DB レベルで防止
 * - Phase 5 では JWS の **署名検証はまだ行っていない**
 *   （migration-gaps A12）。claims の構造検証 + クライアント送信値との
 *   クロスチェックのみ。本番運用前に Apple root CA で厳密検証が必須
 */
export async function POST(req: NextRequest) {
  const resolved = await resolveUserIdFromBearer(req.headers.get("authorization"));
  if (!resolved) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }
  const rec = (body ?? {}) as Record<string, unknown>;
  const productId = typeof rec.product_id === "string" ? rec.product_id : "";
  const transactionId = typeof rec.transaction_id === "string" ? rec.transaction_id : "";
  const jws = typeof rec.signed_transaction_jws === "string" ? rec.signed_transaction_jws : "";

  if (!productId || !transactionId || !jws) {
    return NextResponse.json(
      { ok: false, error: "missing_fields" },
      { status: 400 },
    );
  }

  if (!lookupIapPackage(productId)) {
    return NextResponse.json(
      { ok: false, error: "unknown_product" },
      { status: 400 },
    );
  }

  // Parse the JWS payload and cross-check against client-sent values.
  // Signature verification is deferred (A12).
  const claims = parseIapJws(jws);
  if (!claims) {
    return NextResponse.json(
      { ok: false, error: "invalid_jws" },
      { status: 400 },
    );
  }
  if (claims.transactionId !== transactionId || claims.productId !== productId) {
    return NextResponse.json(
      { ok: false, error: "jws_mismatch" },
      { status: 400 },
    );
  }

  const result = await grantIapCore(prisma, {
    userId: resolved.userId,
    productId,
    transactionId,
  });

  if (!result.ok) {
    const status = result.code === "unknown_product" ? 400 : 500;
    return NextResponse.json({ ok: false, error: result.code }, { status });
  }

  return NextResponse.json({
    ok: true,
    already_granted: result.alreadyGranted,
    amount_pt: result.amountPt,
    balance_pt: result.balancePt,
  });
}
