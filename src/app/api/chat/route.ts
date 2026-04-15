import { processChatRequest } from "@/lib/chat/process-chat-request";
import { getSessionUserId } from "@/lib/session";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * Web (`/api/chat`) エントリポイント。cookie ベースのセッションを解決し、
 * 共通の `processChatRequest` に委譲する。ゲスト経路は維持。
 */
export async function POST(req: Request) {
  const userId = await getSessionUserId();
  return processChatRequest(req, { userId, allowGuest: true });
}
