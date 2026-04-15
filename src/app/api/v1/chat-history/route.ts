import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLatestChatSessionForUser } from "@/lib/chat/history-core";
import { resolveUserIdFromBearer } from "@/lib/auth/verify-bearer-token";

/**
 * `GET /api/v1/chat-history?agentId=...&limit=...`
 *
 * エージェントごとの最新チャットセッション（メッセージ一覧）を返す。
 * `agentId` は Prisma の Agent.id だけでなく slug も受け付ける
 * （iOS 側は詳細取得時に slug を持つので両対応しておくと楽）。
 *
 * 既存 `getLatestChatSessionForUser` をそのまま呼ぶ薄いラッパー。
 * Bearer 必須。
 */
export async function GET(req: NextRequest) {
  const resolved = await resolveUserIdFromBearer(req.headers.get("authorization"));
  if (!resolved) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const agentIdOrSlug = url.searchParams.get("agentId")?.trim() ?? "";
  if (!agentIdOrSlug) {
    return NextResponse.json({ ok: false, error: "agent_id_required" }, { status: 400 });
  }
  const limit = clampInt(url.searchParams.get("limit"), 1, 500, 100);

  // id 直接 or slug → id 解決
  let agentId = agentIdOrSlug;
  const bySlug = await prisma.agent.findFirst({
    where: { slug: agentIdOrSlug },
    select: { id: true },
  });
  if (bySlug) agentId = bySlug.id;

  const history = await getLatestChatSessionForUser(resolved.userId, agentId);
  if (!history) {
    return NextResponse.json({
      ok: true,
      session_id: null,
      messages: [],
    });
  }

  return NextResponse.json({
    ok: true,
    session_id: history.sessionId,
    messages: history.messages.slice(-limit).map((m, i) => ({
      id: `${history.sessionId}-${i}`,
      role: m.role,
      content: m.content,
    })),
  });
}

function clampInt(raw: string | null, min: number, max: number, fallback: number): number {
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}
