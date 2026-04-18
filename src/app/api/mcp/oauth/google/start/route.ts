import { NextResponse } from "next/server";

import { getSessionUserId } from "@/lib/session";
import { getPublicOrigin } from "@/lib/site-url";
import { sanitizeInternalPath } from "@/lib/sanitize-redirect";
import { buildAuthorizeUrl } from "@/lib/mcp/oauth/google";
import { OAUTH_STATE_COOKIE, issueState } from "@/lib/mcp/oauth/state";

/**
 * GET /api/mcp/oauth/google/start?returnTo=/dashboard/settings
 *
 * Google OAuth 同意画面にリダイレクトする。戻り先パスを `returnTo` で受け取り、
 * state cookie に埋め込んで callback で使う。
 */
export async function GET(req: Request) {
  const userId = await getSessionUserId();
  const origin = getPublicOrigin(req);

  if (!userId) {
    return NextResponse.redirect(`${origin}/login?next=%2Fdashboard%2Fsettings`);
  }

  const url = new URL(req.url);
  const returnTo = sanitizeInternalPath(
    url.searchParams.get("returnTo"),
    "/dashboard/settings",
  );

  const redirectUri = `${origin}/api/mcp/oauth/google/callback`;

  let authorizeUrl: string;
  let cookieValue: string;
  try {
    const issued = issueState({ userId, returnTo });
    cookieValue = issued.cookieValue;
    authorizeUrl = buildAuthorizeUrl({ redirectUri, state: issued.state });
  } catch (err) {
    console.error("[mcp-oauth] start failed", err);
    return NextResponse.redirect(`${origin}${returnTo}?mcp_error=not_configured`);
  }

  const res = NextResponse.redirect(authorizeUrl);
  res.cookies.set(OAUTH_STATE_COOKIE, cookieValue, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
  return res;
}
