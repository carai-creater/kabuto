import { X509Certificate } from "node:crypto";
import { compactVerify, decodeProtectedHeader, importX509 } from "jose";
import { APPLE_ROOT_CA_G3_PEM } from "@/lib/wallet/apple-root-ca";

/**
 * Parses & **cryptographically verifies** a StoreKit 2 signed transaction
 * JWS (Compact Serialization).
 *
 * Phase 6.1 upgrade: returns a discriminated union so the grant route can
 * return typed error codes (`invalid_signature` / `expired_cert` /
 * `chain_invalid` / `bundle_mismatch` / `malformed`) instead of a
 * black-box 400.
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
 */

export type IapClaims = {
  transactionId: string;
  productId: string;
  purchaseDate?: number;
  originalTransactionId?: string;
  bundleId?: string;
};

export type IapVerifyFailure =
  /** JWS is not three base64url segments, or header is unparseable */
  | "malformed"
  /** Header has no x5c chain or chain is empty */
  | "no_chain"
  /** A cert in the chain is outside its validity window */
  | "expired_cert"
  /** A cert isn't signed by its purported issuer, or chain doesn't terminate at the pinned Apple root */
  | "chain_invalid"
  /** JWS signature under the leaf key fails verification */
  | "invalid_signature"
  /** Payload is valid JSON but missing required `transactionId`/`productId` */
  | "missing_claims"
  /** Payload's bundleId ≠ expected */
  | "bundle_mismatch"
  /** Catch-all; exception in dependency. Err details are logged server-side but not surfaced to client */
  | "internal";

export type IapVerifyResult =
  | { ok: true; claims: IapClaims }
  | { ok: false; reason: IapVerifyFailure };

type VerifyOptions = {
  expectedBundleId?: string;
  clock?: Date;
  trustedRootPem?: string;
};

export async function verifyIapJwsTyped(
  jws: string,
  options: VerifyOptions = {},
): Promise<IapVerifyResult> {
  try {
    if (typeof jws !== "string" || jws.split(".").length !== 3) {
      return { ok: false, reason: "malformed" };
    }

    let header;
    try {
      header = decodeProtectedHeader(jws);
    } catch {
      return { ok: false, reason: "malformed" };
    }

    const x5c = header.x5c;
    if (!Array.isArray(x5c) || x5c.length < 1) {
      return { ok: false, reason: "no_chain" };
    }

    let chain: X509Certificate[];
    try {
      chain = x5c.map((b64) => new X509Certificate(Buffer.from(b64, "base64")));
    } catch {
      return { ok: false, reason: "chain_invalid" };
    }

    const trustedRootPem = options.trustedRootPem ?? APPLE_ROOT_CA_G3_PEM;
    const trustedRoot = new X509Certificate(trustedRootPem);

    const now = (options.clock ?? new Date()).getTime();
    if (!validityOk(trustedRoot, now)) {
      return { ok: false, reason: "expired_cert" };
    }

    for (let i = 0; i < chain.length; i++) {
      const cert = chain[i];
      if (!validityOk(cert, now)) {
        return { ok: false, reason: "expired_cert" };
      }
      const issuer = chain[i + 1] ?? trustedRoot;
      if (!cert.checkIssued(issuer) || !cert.verify(issuer.publicKey)) {
        return { ok: false, reason: "chain_invalid" };
      }
    }

    const top = chain[chain.length - 1];
    if (!top.checkIssued(trustedRoot) || !top.verify(trustedRoot.publicKey)) {
      if (top.fingerprint256 !== trustedRoot.fingerprint256) {
        return { ok: false, reason: "chain_invalid" };
      }
    }

    const leafPem = chain[0].toString();
    let payload: Uint8Array;
    try {
      const leafKey = await importX509(leafPem, (header.alg as string) ?? "ES256");
      const verified = await compactVerify(jws, leafKey);
      payload = verified.payload;
    } catch {
      return { ok: false, reason: "invalid_signature" };
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(Buffer.from(payload).toString("utf8")) as Record<string, unknown>;
    } catch {
      return { ok: false, reason: "malformed" };
    }

    const transactionId = typeof parsed.transactionId === "string" ? parsed.transactionId : null;
    const productId = typeof parsed.productId === "string" ? parsed.productId : null;
    if (!transactionId || !productId) {
      return { ok: false, reason: "missing_claims" };
    }

    const expectedBundle = options.expectedBundleId
      ?? process.env.IAP_EXPECTED_BUNDLE_ID
      ?? "com.carai.kabutoios";
    const claimedBundle = typeof parsed.bundleId === "string" ? parsed.bundleId : null;
    if (claimedBundle && claimedBundle !== expectedBundle) {
      return { ok: false, reason: "bundle_mismatch" };
    }

    return {
      ok: true,
      claims: {
        transactionId,
        productId,
        purchaseDate: typeof parsed.purchaseDate === "number" ? parsed.purchaseDate : undefined,
        originalTransactionId:
          typeof parsed.originalTransactionId === "string"
            ? parsed.originalTransactionId
            : undefined,
        bundleId: claimedBundle ?? undefined,
      },
    };
  } catch (err) {
    console.error("[verifyIapJwsTyped] unexpected failure:", err);
    return { ok: false, reason: "internal" };
  }
}

/**
 * Backward-compatible wrapper that collapses any failure to `null`.
 * Preserved for Phase 5 call sites that don't care about the reason.
 * New code should call `verifyIapJwsTyped` directly.
 */
export async function verifyIapJws(
  jws: string,
  options: VerifyOptions = {},
): Promise<IapClaims | null> {
  const result = await verifyIapJwsTyped(jws, options);
  return result.ok ? result.claims : null;
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
