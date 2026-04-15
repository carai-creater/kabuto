import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveUserIdFromBearer } from "@/lib/auth/verify-bearer-token";
import { saveChatMessagesForUser } from "@/lib/chat/save-messages-core";

/**
 * `POST /api/v1/chat-history/save`
 *
 * iOS クライアント用の履歴永続化エンドポイント（A11 対応）。
 * Body: `{ agent_id_or_slug, session_id?, messages: [{role, content}] }`
 *
 * - Bearer 必須
 * - `agent_id_or_slug` は Prisma `Agent.id` と `slug` のどちらでも受け付ける
 * - `saveChatMessagesForUser` を呼ぶだけ（重複ロジックなし）
 */
export async function POST(req: NextRequest) {
  const resolved = await resolveUserIdFromBearer(req.headers.get("authorization"));
  if (!resolved) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }
  const rec = (body ?? {}) as Record<string, unknown>;
  const agentIdOrSlug = typeof rec.agent_id_or_slug === "string" ? rec.agent_id_or_slug : "";
  const sessionId = typeof rec.session_id === "string" && rec.session_id.length > 0
    ? rec.session_id
    : null;
  const rawMessages = Array.isArray(rec.messages) ? rec.messages : null;
  if (!agentIdOrSlug || !rawMessages) {
    return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 400 });
  }

  const messages = rawMessages
    .map((m): { role: "user" | "assistant"; content: string } | null => {
      if (!m || typeof m !== "object") return null;
      const row = m as Record<string, unknown>;
      const role = row.role;
      const content = row.content;
      if ((role !== "user" && role !== "assistant") || typeof content !== "string") return null;
      return { role, content };
    })
    .filter((m): m is { role: "user" | "assistant"; content: string } => m !== null);

  if (messages.length < 2) {
    return NextResponse.json({ ok: false, error: "need_at_least_two_messages" }, { status: 400 });
  }

  let agentId = agentIdOrSlug;
  const bySlug = await prisma.agent.findFirst({
    where: { slug: agentIdOrSlug },
    select: { id: true },
  });
  if (bySlug) agentId = bySlug.id;

  const saved = await saveChatMessagesForUser(resolved.userId, agentId, sessionId, messages);
  if (!saved) {
    return NextResponse.json({ ok: false, error: "save_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, session_id: saved.sessionId });
}
