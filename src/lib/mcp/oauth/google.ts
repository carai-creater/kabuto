/**
 * Google OAuth 2.0 ヘルパ
 *
 * Gmail / Google Drive / Google Calendar を 1 つの OAuth クライアントで
 * まとめて認可するための関数群。`googleapis` SDK は使わず fetch のみで実装する。
 *
 * 関連ドキュメント:
 *   https://developers.google.com/identity/protocols/oauth2/web-server
 */

const AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

/** 1 回の同意で接続される serverKey 群。callback で 3 行 upsert する。 */
export const GOOGLE_SERVICES = ["gmail", "google-drive", "google-calendar"] as const;
export type GoogleServiceKey = (typeof GOOGLE_SERVICES)[number];

/**
 * 付与を求めるスコープ。Gmail は検索＋ドラフト作成まで必要なので modify、
 * Drive は readonly、Calendar は events までとする（MVP）。
 */
export const GOOGLE_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/calendar.events",
];

export type GoogleTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
  id_token: string;
};

export type GoogleRefreshResponse = {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  id_token?: string;
};

export function getGoogleOauthEnv(): { clientId: string; clientSecret: string } {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    throw new Error(
      "GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET is not set. Register an OAuth client in Google Cloud Console and set both environment variables.",
    );
  }
  return { clientId, clientSecret };
}

export function buildAuthorizeUrl(params: { redirectUri: string; state: string }): string {
  const { clientId } = getGoogleOauthEnv();
  const url = new URL(AUTHORIZE_URL);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", GOOGLE_SCOPES.join(" "));
  // refresh_token が必要なので access_type=offline
  url.searchParams.set("access_type", "offline");
  // 2 回目以降も確実に refresh_token を返させるため consent を強制する
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set("state", params.state);
  return url.toString();
}

export async function exchangeCode(params: {
  code: string;
  redirectUri: string;
}): Promise<GoogleTokenResponse> {
  const { clientId, clientSecret } = getGoogleOauthEnv();
  const body = new URLSearchParams({
    code: params.code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: params.redirectUri,
    grant_type: "authorization_code",
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
    // token エンドポイントはキャッシュすべきでない
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`google token exchange failed: ${res.status} ${text}`);
  }
  return (await res.json()) as GoogleTokenResponse;
}

export async function refreshAccessToken(refreshToken: string): Promise<GoogleRefreshResponse> {
  const { clientId, clientSecret } = getGoogleOauthEnv();
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`google token refresh failed: ${res.status} ${text}`);
  }
  return (await res.json()) as GoogleRefreshResponse;
}

/**
 * id_token のペイロード(中段の base64url)を復号して `email` と `sub` を取り出す。
 *
 * TODO: RS256 の署名検証は MVP では省略している。Google JWKS を fetch して
 * verify する実装に差し替えるべき。今回は CSRF が state / HttpOnly cookie で
 * 防がれており、token 自体が TLS を張った直後の token endpoint から来ている
 * 前提で payload 読み取りのみ行う。
 */
export function decodeIdTokenEmail(idToken: string): { email: string; sub: string } {
  const parts = idToken.split(".");
  if (parts.length !== 3) throw new Error("invalid id_token format");
  const payloadJson = Buffer.from(base64UrlToBase64(parts[1]), "base64").toString("utf8");
  const payload = JSON.parse(payloadJson) as { email?: unknown; sub?: unknown };
  if (typeof payload.email !== "string" || typeof payload.sub !== "string") {
    throw new Error("id_token missing email or sub");
  }
  return { email: payload.email, sub: payload.sub };
}

function base64UrlToBase64(input: string): string {
  const replaced = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = replaced.length % 4;
  return pad ? replaced + "=".repeat(4 - pad) : replaced;
}
