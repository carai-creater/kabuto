/**
 * Google OAuth で接続された UserMcpConnection から、失効していない
 * access_token を取り出すヘルパ。expiresAt - 60s を過ぎていれば
 * refresh_token で自動更新し DB を書き戻す。
 *
 * MCP クライアント実装時（= 実際に Gmail/Drive/Calendar API を叩くとき）に
 * 呼び出す想定。現時点では UI からは呼んでいないが、保存したトークンが
 * 実際に使えることを保証するためにテスト経路として最初から置いておく。
 */

import { prisma } from "@/lib/prisma";
import {
  decryptMcpCredential,
  encryptMcpCredential,
} from "@/lib/crypto/mcp-credential";
import { refreshAccessToken } from "@/lib/mcp/oauth/google";

export async function getValidGoogleAccessToken(
  userId: string,
  serverKey: "gmail" | "google-drive" | "google-calendar",
): Promise<string> {
  const row = await prisma.userMcpConnection.findUnique({
    where: { userId_serverKey: { userId, serverKey } },
  });
  if (!row || row.authType !== "oauth" || !row.accessToken) {
    throw new Error(`mcp connection not found or not oauth: ${serverKey}`);
  }

  const now = Date.now();
  const expMs = row.expiresAt?.getTime() ?? 0;
  // 60 秒の猶予を持って失効前にリフレッシュする
  if (expMs - 60_000 > now) {
    return decryptMcpCredential(row.accessToken);
  }

  if (!row.refreshToken) {
    throw new Error(`no refresh_token; reconnect required: ${serverKey}`);
  }

  const refreshed = await refreshAccessToken(decryptMcpCredential(row.refreshToken));
  const newAccess = encryptMcpCredential(refreshed.access_token);
  await prisma.userMcpConnection.update({
    where: { id: row.id },
    data: {
      accessToken: newAccess,
      expiresAt: new Date(now + refreshed.expires_in * 1000),
      ...(refreshed.scope ? { scopes: refreshed.scope } : {}),
    },
  });
  return refreshed.access_token;
}
