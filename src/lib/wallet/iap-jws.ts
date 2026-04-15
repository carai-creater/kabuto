import { X509Certificate } from "node:crypto";
import { compactVerify, decodeProtectedHeader, importX509 } from "jose";
import { APPLE_ROOT_CA_G3_PEM } from "@/lib/wallet/apple-root-ca";

/**
 * Parses & **cryptographically verifies** a StoreKit 2 signed transaction
 * JWS (Compact Serialization). Phase 6 upgrade from the Phase 5 structural-
 * only decoder.
 *
 * Verification steps:
 *   1. Parse the JWS protected header, extract the `x5c` certificate chain
 *      (leaf → intermediate → root, all base64 DER).
 *   2. Walk the chain: each issuer must sign the previous cert, and the
 *      root must be Apple Root CA - G3 (pinned in `apple-root-ca.ts`).
 *   3. Check `notBefore` / `notAfter` on every cert in the chain.
 *   4. Import the leaf cert as a JWK and verify the JWS signature
 *      with `jose.compactVerify`.
 *   5. Parse the payload and cross-check the expected iOS bundle id
 *      (via `IAP_EXPECTED_BUNDLE_ID` env or the default).
 *
 * Any failure returns `null`; the caller (`/api/v1/wallet/iap/grant`)
 * rejects the request with 400.
 */

export type IapClaims = {
  transactionId: string;
  productId: string;
  purchaseDate?: number;
  originalTransactionId?: string;
  bundleId?: string;
};

type VerifyOptions = {
  /** Override the expected bundle id. When omitted, reads
   *  `IAP_EXPECTED_BUNDLE_ID` or falls back to the Debug bundle. */
  expectedBundleId?: string;
  /** Accept a date instead of "now" — used by tests to pin notBefore/notAfter. */
  clock?: Date;
  /** Override the trusted root CA — used by tests that generate their own chain. */
  trustedRootPem?: string;
};

export async function verifyIapJws(
  jws: string,
  options: VerifyOptions = {},
): Promise<IapClaims | null> {
  try {
    const header = decodeProtectedHeader(jws);
    const x5c = header.x5c;
    if (!Array.isArray(x5c) || x5c.length < 1) return null;

    // Build the chain as X509Certificate objects.
    const chain = x5c.map((b64) => new X509Certificate(Buffer.from(b64, "base64")));
    if (chain.length === 0) return null;

    // Add the pinned trust anchor at the end so chain validation terminates.
    const trustedRootPem = options.trustedRootPem ?? APPLE_ROOT_CA_G3_PEM;
    const trustedRoot = new X509Certificate(trustedRootPem);

    const now = (options.clock ?? new Date()).getTime();
    if (!validityOk(trustedRoot, now)) return null;

    // Walk: chain[i] must be signed by chain[i+1]; the final cert must
    // either BE the pinned root or be signed by it.
    for (let i = 0; i < chain.length; i++) {
      const cert = chain[i];
      if (!validityOk(cert, now)) return null;
      const issuer = chain[i + 1] ?? trustedRoot;
      if (!cert.checkIssued(issuer) || !cert.verify(issuer.publicKey)) {
        return null;
      }
    }
    // Ensure the top of the supplied chain actually chains to Apple root.
    const top = chain[chain.length - 1];
    if (
      !top.checkIssued(trustedRoot) ||
      !top.verify(trustedRoot.publicKey)
    ) {
      // Unless the top IS the trusted root itself (self-signed match).
      if (top.fingerprint256 !== trustedRoot.fingerprint256) {
        return null;
      }
    }

    // Verify the JWS signature using the leaf cert's public key.
    const leafPem = chain[0].toString();
    const leafKey = await importX509(leafPem, (header.alg as string) ?? "ES256");
    const { payload } = await compactVerify(jws, leafKey);

    const parsed = JSON.parse(Buffer.from(payload).toString("utf8")) as Record<string, unknown>;
    const transactionId = typeof parsed.transactionId === "string" ? parsed.transactionId : null;
    const productId = typeof parsed.productId === "string" ? parsed.productId : null;
    if (!transactionId || !productId) return null;

    // Bundle ID pinning — reject JWS that wasn't issued for our app.
    const expectedBundle = options.expectedBundleId
      ?? process.env.IAP_EXPECTED_BUNDLE_ID
      ?? "com.carai.kabutoios";
    const claimedBundle = typeof parsed.bundleId === "string" ? parsed.bundleId : null;
    if (claimedBundle && claimedBundle !== expectedBundle) return null;

    return {
      transactionId,
      productId,
      purchaseDate: typeof parsed.purchaseDate === "number" ? parsed.purchaseDate : undefined,
      originalTransactionId:
        typeof parsed.originalTransactionId === "string"
          ? parsed.originalTransactionId
          : undefined,
      bundleId: claimedBundle ?? undefined,
    };
  } catch (err) {
    console.error("[verifyIapJws] failed:", err);
    return null;
  }
}

function validityOk(cert: X509Certificate, nowMs: number): boolean {
  const notBefore = Date.parse(cert.validFrom);
  const notAfter = Date.parse(cert.validTo);
  if (!Number.isFinite(notBefore) || !Number.isFinite(notAfter)) return false;
  return nowMs >= notBefore && nowMs <= notAfter;
}

/**
 * Legacy structural-only parser kept for migration/backfill only — NOT
 * used by the grant route. Tests that predate Phase 6 still call this.
 */
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
