"use server";

import { getLatestChatSessionForUser } from "@/lib/chat/history-core";
import { saveChatMessagesForUser } from "@/lib/chat/save-messages-core";
import { getSessionUserId } from "@/lib/session";

type MessageInput = { role: "user" | "assistant"; content: string };

/**
 * 既存 web エントリポイント。core に委譲するだけで、シグネチャ・挙動不変。
 */
export async function saveChatMessages(
  agentId: string,
  currentSessionId: string | null,
  messages: MessageInput[]
): Promise<{ sessionId: string } | null> {
  const userId = await getSessionUserId();
  if (!userId) return null;
  return saveChatMessagesForUser(userId, agentId, currentSessionId, messages);
}

/**
 * ユーザーの最新チャット履歴を取得する（エージェントごと）
 */
export async function getLatestChatSession(
  agentId: string
): Promise<{ sessionId: string; messages: MessageInput[] } | null> {
  const userId = await getSessionUserId();
  if (!userId) return null;
  return getLatestChatSessionForUser(userId, agentId);
}
