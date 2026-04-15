import { processChatRequest } from "@/lib/chat/process-chat-request";
import { resolveUserIdFromBearer } from "@/lib/auth/verify-bearer-token";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * `POST /api/v1/chat`
 *
 * iOS 向けのチャット SSE エンドポイント。
 * 既存 `/api/chat` と同じ `processChatRequest` を呼ぶだけの薄いラッパー。
 *
 * - 認証: **Bearer 必須**（Phase 4 ではゲストチャット未対応）
 * - ボディ契約: 既存 `/api/chat` と同じ `{ messages, modelId?, agentId?, idempotencyKey? }`
 * - レスポンス: 既存と同じ Vercel AI SDK UI Message Stream（SSE）
 */
export async function POST(req: Request) {
  const resolved = await resolveUserIdFromBearer(req.headers.get("authorization"));
  if (!resolved) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  return processChatRequest(req, { userId: resolved.userId, allowGuest: false });
}
