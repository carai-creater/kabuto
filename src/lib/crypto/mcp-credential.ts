import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

/**
 * MCP 資格情報(外部サービスの API キー/トークン)を DB に保存する前に
 * AES-256-GCM で暗号化するユーティリティ。
 *
 * 形式: v1:<iv_base64>:<authTag_base64>:<ciphertext_base64>
 * - iv は 12 バイト(GCM 推奨)
 * - authTag は 16 バイト
 * - v1 はフォーマットバージョン。将来鍵ローテ時に v2 を追加する余地を残す
 *
 * 鍵は MCP_CREDENTIAL_KEY env から派生。
 * - 推奨: 32 バイトをランダム生成して hex または base64 で渡す
 *   例) `openssl rand -base64 32`
 * - 任意長の文字列が入った場合は SHA-256 で 32 バイトに畳み込む(弱い運用を許容する安全網)
 */

const FORMAT_VERSION = "v1";

function getKey(): Buffer {
  const raw = process.env.MCP_CREDENTIAL_KEY?.trim();
  if (!raw) {
    throw new Error(
      "MCP_CREDENTIAL_KEY is not set. Generate one with `openssl rand -base64 32` and set it as an environment variable.",
    );
  }

  // base64 / hex で 32 バイトぴったりなら直接使う
  const tryBase64 = tryDecode(raw, "base64");
  if (tryBase64 && tryBase64.length === 32) return tryBase64;
  const tryHex = tryDecode(raw, "hex");
  if (tryHex && tryHex.length === 32) return tryHex;

  // それ以外は SHA-256 で 32 バイトに畳み込む
  return createHash("sha256").update(raw, "utf8").digest();
}

function tryDecode(value: string, encoding: "base64" | "hex"): Buffer | null {
  try {
    const buf = Buffer.from(value, encoding);
    // base64/hex として解釈可能でも実体が無いケースを弾く
    if (buf.length === 0) return null;
    // 往復確認(不正な文字が混じっていたら長さが一致しない)
    if (buf.toString(encoding).replace(/=+$/, "") !== value.replace(/=+$/, "")) {
      return null;
    }
    return buf;
  } catch {
    return null;
  }
}

export function encryptMcpCredential(plaintext: string): string {
  if (!plaintext) throw new Error("plaintext is empty");
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [
    FORMAT_VERSION,
    iv.toString("base64"),
    authTag.toString("base64"),
    ciphertext.toString("base64"),
  ].join(":");
}

export function decryptMcpCredential(payload: string): string {
  if (!payload) throw new Error("payload is empty");
  const parts = payload.split(":");
  if (parts.length !== 4 || parts[0] !== FORMAT_VERSION) {
    throw new Error("invalid mcp credential payload");
  }
  const [, ivB64, tagB64, ctB64] = parts;
  const key = getKey();
  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(tagB64, "base64");
  const ciphertext = Buffer.from(ctB64, "base64");
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString("utf8");
}

/** 値が暗号化済み(v1 形式)かどうかを軽く判定する。移行期にのみ使用。 */
export function isEncryptedMcpCredential(value: string): boolean {
  return typeof value === "string" && value.startsWith(`${FORMAT_VERSION}:`);
}
