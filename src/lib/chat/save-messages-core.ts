import { prisma } from "@/lib/prisma";

export type SaveChatMessageInput = { role: "user" | "assistant"; content: string };

/**
 * 純関数版 `saveChatMessages`。呼び出し側が `userId` を解決する
 * （既存 cookie 経路と新 Bearer 経路の両方で使う）。
 * 既存の `src/app/actions/chat-history.ts#saveChatMessages` は
 * Phase 6 で本関数に委譲するよう書き換え、挙動は不変。
 *
 * 冪等性: sessionId 指定時は所有権 + agentId 一致を確認、一致しない場合は
 * 新規セッションにフォールバック（IDOR 防止は既存どおり）。
 * メッセージは全削除 → createMany で上書きする既存セマンティクスを踏襲。
 */
export async function saveChatMessagesForUser(
  userId: string,
  agentId: string,
  currentSessionId: string | null,
  messages: SaveChatMessageInput[],
): Promise<{ sessionId: string } | null> {
  if (messages.length < 2) return null;

  try {
    let sessionId: string | null = null;

    if (currentSessionId) {
      const owned = await prisma.chatSession.findFirst({
        where: { id: currentSessionId, userId, agentId },
        select: { id: true },
      });
      sessionId = owned?.id ?? null;
    }

    if (!sessionId) {
      const existing = await prisma.chatSession.findFirst({
        where: { userId, agentId },
        orderBy: { updatedAt: "desc" },
        select: { id: true },
      });
      sessionId = existing?.id ?? null;
    }

    if (!sessionId) {
      const agent = await prisma.agent.findUnique({
        where: { id: agentId },
        select: { id: true },
      });
      if (!agent) return null;
      const session = await prisma.chatSession.create({
        data: { userId, agentId },
        select: { id: true },
      });
      sessionId = session.id;
    }

    await prisma.chatMessage.deleteMany({ where: { sessionId } });
    await prisma.chatMessage.createMany({
      data: messages.map((m) => ({ sessionId: sessionId!, role: m.role, content: m.content })),
    });
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() },
    });

    return { sessionId };
  } catch (err) {
    console.error("[saveChatMessagesForUser]", err);
    return null;
  }
}
