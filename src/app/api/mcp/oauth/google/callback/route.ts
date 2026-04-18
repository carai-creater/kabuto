import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getPublicOrigin } from "@/lib/site-url";
import { encryptMcpCredential } from "@/lib/crypto/mcp-credential";
import {
  GOOGLE_SERVICES,
  decodeIdTokenEmail,
  exchangeCode,
} from "@/lib/mcp/oauth/google";
import { OAUTH_STATE_COOKIE, verifyState } from "@/lib/mcp/oauth/state";

const SERVICE_LABELS: Record<(typeof GOOGLE_SERVICES)[number], string> = {
  gmail: "Gmail",
  "google-drive": "Google Drive",
  "google-calendar": "Google Calendar",
};

/**
 * GET /api/mcp/oauth/google/callback
 *
 * Google から戻ってくる OAuth 2.0 コード交換エンドポイント。
 * - state cookie を検証
 * - code をトークンに交換
 * - Gmail / Drive / Calendar 3 件を同時に upsert
 * - ユーザーを `returnTo` に戻す（成功/失敗は query flag で通知）
 */
export async function GET(req: Request) {
  const origin = getPublicOrigin(req);
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  const cookieStore = await cookies();
  const stateCookie = cookieStore.get(OAUTH_STATE_COOKIE)?.value ?? "";

  const settingsFallback = "/dashboard/settings";

  function redirectError(returnTo: string, code: string) {
    const res = NextResponse.redirect(`${origin}${returnTo}?mcp_error=${encodeURIComponent(code)}`);
    res.cookies.delete(OAUTH_STATE_COOKIE);
    return res;
  }

  if (oauthError) {
    return redirectError(settingsFallback, oauthError);
  }
  if (!code || !state) {
    return redirectError(settingsFallback, "missing_code");
  }
  if (!stateCookie) {
    return redirectError(settingsFallback, "expired_state");
  }

  let payload: { userId: string; returnTo: string };
  try {
    payload = verifyState(state, stateCookie);
  } catch (err) {
    console.error("[mcp-oauth] state verification failed", err);
    return redirectError(settingsFallback, "bad_state");
  }

  const redirectUri = `${origin}/api/mcp/oauth/google/callback`;

  let tokens;
  try {
    tokens = await exchangeCode({ code, redirectUri });
  } catch (err) {
    console.error("[mcp-oauth] token exchange failed", err);
    return redirectError(payload.returnTo, "token_exchange_failed");
  }

  let email: string;
  let sub: string;
  try {
    ({ email, sub } = decodeIdTokenEmail(tokens.id_token));
  } catch (err) {
    console.error("[mcp-oauth] id_token decode failed", err);
    return redirectError(payload.returnTo, "id_token_invalid");
  }

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
  const encAccess = encryptMcpCredential(tokens.access_token);
  const encRefresh = tokens.refresh_token ? encryptMcpCredential(tokens.refresh_token) : null;

  try {
    await prisma.$transaction(
      GOOGLE_SERVICES.map((serverKey) =>
        prisma.userMcpConnection.upsert({
          where: { userId_serverKey: { userId: payload.userId, serverKey } },
          create: {
            userId: payload.userId,
            serverKey,
            label: SERVICE_LABELS[serverKey],
            authType: "oauth",
            accessToken: encAccess,
            refreshToken: encRefresh,
            expiresAt,
            scopes: tokens.scope,
            accountEmail: email,
            accountId: sub,
          },
          update: {
            authType: "oauth",
            accessToken: encAccess,
            // refresh_token は再認可時に返らないことがあるので、null の場合は既存値を保持する
            ...(encRefresh ? { refreshToken: encRefresh } : {}),
            expiresAt,
            scopes: tokens.scope,
            accountEmail: email,
            accountId: sub,
            // token 方式で以前保存していた場合の古い credential をクリア
            credential: null,
          },
        }),
      ),
    );
  } catch (err) {
    console.error("[mcp-oauth] upsert failed", err);
    return redirectError(payload.returnTo, "db_failed");
  }

  const res = NextResponse.redirect(`${origin}${payload.returnTo}?mcp_connected=google`);
  res.cookies.delete(OAUTH_STATE_COOKIE);
  return res;
}
