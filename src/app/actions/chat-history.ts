"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";

type MessageInput = { role: "user" | "assistant"; content: string };

/**
 * チャットメッセージを DB に保存する。
 * セッションが存在しない場合は新規作成する。
 */
export async function saveChatMessages(
  agentId: string,
  currentSessionId: string | null,
  messages: MessageInput[]
): Promise<{ sessionId: string } | null> {
  const userId = await getSessionUserId();
  if (!userId) return null;

  if (messages.length < 2) return null;

  try {
    let sessionId = currentSessionId;

    if (!sessionId) {
      // 既存セッションを取得（最新1件）
      const existing = await prisma.chatSession.findFirst({
        where: { userId, agentId },
        orderBy: { updatedAt: "desc" },
        select: { id: true },
      });
      sessionId = existing?.id ?? null;
    }

    if (!sessionId) {
      // 新規セッション作成
      const session = await prisma.chatSession.create({
        data: { userId, agentId },
        select: { id: true },
      });
      sessionId = session.id;
    }

    // 既存メッセージを全削除して上書き（完全な会話履歴を保持）
    await prisma.chatMessage.deleteMany({ where: { sessionId: sessionId! } });
    await prisma.chatMessage.createMany({
      data: messages.map((m) => ({
        sessionId: sessionId!,
        role: m.role,
        content: m.content,
      })),
    });

    // セッションの updatedAt を更新
    await prisma.chatSession.update({
      where: { id: sessionId! },
      data: { updatedAt: new Date() },
    });

    return { sessionId: sessionId! };
  } catch (err) {
    console.error("[saveChatMessages]", err);
    return null;
  }
}

/**
 * ユーザーの最新チャット履歴を取得する（エージェントごと）
 */
export async function getLatestChatSession(
  agentId: string
): Promise<{ sessionId: string; messages: MessageInput[] } | null> {
  const userId = await getSessionUserId();
  if (!userId) return null;

  try {
    const session = await prisma.chatSession.findFirst({
      where: { userId, agentId },
      orderBy: { updatedAt: "desc" },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!session || session.messages.length === 0) return null;

    return {
      sessionId: session.id,
      messages: session.messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    };
  } catch {
    return null;
  }
}
