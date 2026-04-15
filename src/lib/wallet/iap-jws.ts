/**
 * Parses a StoreKit 2 signed transaction (JWS Compact Serialization).
 *
 * **Phase 5 limitation**: we only *decode* the payload, we do **not**
 * cryptographically verify the Apple signature. That requires Apple's
 * root CA bundle plus a JWS library and is tracked as migration gap A12.
 * Until that lands, the primary defense against replay is the unique
 * constraint on `PointPurchase.stripeSessionId` (we store
 * `iap_<transactionId>` there).
 *
 * We still cross-check the payload claims against the client-sent
 * `product_id` / `transaction_id` to reject blatantly mismatched bodies.
 */

export type IapClaims = {
  transactionId: string;
  productId: string;
  purchaseDate?: number; // ms since epoch
  originalTransactionId?: string;
  bundleId?: string;
};

export function parseIapJws(jws: string): IapClaims | null {
  const parts = jws.split(".");
  if (parts.length !== 3) return null;
  const [, payloadSeg] = parts;
  const json = base64UrlToUtf8(payloadSeg);
  if (!json) return null;

  let obj: unknown;
  try {
    obj = JSON.parse(json);
  } catch {
    return null;
  }
  if (!obj || typeof obj !== "object") return null;
  const rec = obj as Record<string, unknown>;

  // StoreKit 2 signed transaction payload keys.
  // https://developer.apple.com/documentation/appstoreserverapi/jwstransactiondecodedpayload
  const transactionId = asString(rec.transactionId);
  const productId = asString(rec.productId);
  if (!transactionId || !productId) return null;

  return {
    transactionId,
    productId,
    purchaseDate: asNumber(rec.purchaseDate),
    originalTransactionId: asString(rec.originalTransactionId) ?? undefined,
    bundleId: asString(rec.bundleId) ?? undefined,
  };
}

function base64UrlToUtf8(b64url: string): string | null {
  try {
    const padded = b64url.replace(/-/g, "+").replace(/_/g, "/");
    const pad = padded.length % 4;
    const full = pad ? padded + "=".repeat(4 - pad) : padded;
    return Buffer.from(full, "base64").toString("utf8");
  } catch {
    return null;
  }
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}
