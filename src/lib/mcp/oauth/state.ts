/**
 * MCP OAuth フローの `state` パラメータを署名・検証するユーティリティ。
 *
 * 設計:
 * - `state` はクエリに乗る乱数 32 バイト (base64url)
 * - クライアント側で保持する情報 (userId / returnTo / createdAt) は
 *   HttpOnly cookie に「state と紐づけた HMAC + payload」として入れる
 * - callback 時にクエリの state と cookie 側の HMAC を検証することで CSRF を防ぐ
 *
 * cookie の形式: `<hmacBase64url>.<payloadBase64url>`
 *   - hmac: HMAC_SHA256(key, state + "." + payloadBase64url)
 *   - payload: JSON({ userId, returnTo, iat })
 *
 * key は `MCP_CREDENTIAL_KEY` から派生させる (専用の env を増やさない)。
 */

import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";

const TTL_MS = 10 * 60 * 1000; // 10 分

export type OauthStatePayload = {
  userId: string;
  returnTo: string;
  iat: number;
};

function getStateKey(): Buffer {
  const raw = process.env.MCP_CREDENTIAL_KEY?.trim();
  if (!raw) {
    throw new Error(
      "MCP_CREDENTIAL_KEY is not set. It is required to sign OAuth state cookies.",
    );
  }
  // mcp-credential.ts とは別のドメインセパレータで派生させる
  return createHash("sha256").update(`${raw}:oauth-state`, "utf8").digest();
}

function b64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(input: string): Buffer {
  const replaced = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = replaced.length % 4;
  return Buffer.from(pad ? replaced + "=".repeat(4 - pad) : replaced, "base64");
}

function hmac(state: string, payloadB64: string): string {
  return b64url(createHmac("sha256", getStateKey()).update(`${state}.${payloadB64}`).digest());
}

export function issueState(input: { userId: string; returnTo: string }): {
  state: string;
  cookieValue: string;
} {
  const state = b64url(randomBytes(32));
  const payload: OauthStatePayload = {
    userId: input.userId,
    returnTo: input.returnTo,
    iat: Date.now(),
  };
  const payloadB64 = b64url(Buffer.from(JSON.stringify(payload), "utf8"));
  const sig = hmac(state, payloadB64);
  return { state, cookieValue: `${sig}.${payloadB64}` };
}

export function verifyState(state: string, cookieValue: string): OauthStatePayload {
  if (!state || !cookieValue) throw new Error("state or cookie missing");
  const parts = cookieValue.split(".");
  if (parts.length !== 2) throw new Error("malformed state cookie");
  const [sig, payloadB64] = parts;

  const expected = hmac(state, payloadB64);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new Error("state signature mismatch");
  }

  const payload = JSON.parse(fromB64url(payloadB64).toString("utf8")) as OauthStatePayload;
  if (typeof payload.userId !== "string" || typeof payload.returnTo !== "string" || typeof payload.iat !== "number") {
    throw new Error("state payload invalid");
  }
  if (Date.now() - payload.iat > TTL_MS) {
    throw new Error("state expired");
  }
  return payload;
}

export const OAUTH_STATE_COOKIE = "kabuto_mcp_oauth_state";
