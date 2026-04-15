import { prisma } from "@/lib/prisma";

export type ChatHistoryMessage = { role: "user" | "assistant"; content: string };

export type ChatHistoryResult = {
  sessionId: string;
  messages: ChatHistoryMessage[];
};

/**
 * 指定ユーザー × エージェントの最新チャット履歴を取得する純関数。
 * 既存 `getLatestChatSession` (server action, cookie 経由) と
 * `/api/v1/chat-history` (Bearer 経由) の両方から呼ばれる。
 */
export async function getLatestChatSessionForUser(
  userId: string,
  agentId: string,
): Promise<ChatHistoryResult | null> {
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
