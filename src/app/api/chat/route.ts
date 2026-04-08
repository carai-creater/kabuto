import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  tool,
  type UIMessage,
} from "ai";
import { z } from "zod";

import {
  chargeWalletForChatUsage,
  estimateMinPointsForRequest,
  loadModelRates,
} from "@/lib/chat/billing";
import { searchKnowledgeForAgent } from "@/lib/chat/knowledge";
import { getLanguageModel } from "@/lib/chat/providers";
import { tryConsumeGuestChatSlot } from "@/lib/guest-rate-limit";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";

export const runtime = "nodejs";
export const maxDuration = 120;

const bodySchema = z.object({
  messages: z.array(z.unknown()),
  modelId: z.string().min(1).optional(),
  agentId: z.string().min(1).optional(),
  idempotencyKey: z.string().min(1).optional(),
});

function buildSystemPrompt(
  agent: {
    systemPrompt: string;
    instructions: string | null;
    toolConfig: unknown;
  } | null
): string {
  if (!agent) {
    return "あなたは有用なアシスタントです。必要に応じてツール searchKnowledge でナレッジを確認してください。";
  }
  const primary =
    agent.instructions?.trim().length ? agent.instructions : agent.systemPrompt;
  const parts = [primary];
  if (agent.toolConfig != null) {
    parts.push(`ツール設定メタ: ${JSON.stringify(agent.toolConfig)}`);
  }
  parts.push(
    "事実確認が必要なときは searchKnowledge ツールでナレッジを検索してから回答してください。"
  );
  return parts.join("\n\n");
}

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid body", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const userId = await getSessionUserId();

  if (!userId) {
    if (!parsed.data.agentId?.trim()) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const guest = await tryConsumeGuestChatSlot(req);
    if (!guest.ok) {
      return Response.json(
        {
          error: "Guest daily limit reached",
          code: "GUEST_LIMIT",
          message: "ログインして継続",
        },
        { status: 429 }
      );
    }
  }

  const headerKey = req.headers.get("x-idempotency-key");
  const idempotencyKey =
    parsed.data.idempotencyKey?.trim() ||
    (headerKey && headerKey.trim().length > 0 ? headerKey.trim() : null) ||
    crypto.randomUUID();

  const modelId = parsed.data.modelId?.trim() || "gpt-4o";
  const rates = await loadModelRates(modelId);

  if (userId) {
    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      return Response.json({ error: "Wallet not found" }, { status: 400 });
    }

    const estimate = estimateMinPointsForRequest(
      JSON.stringify(parsed.data.messages).length,
      rates
    );
    if (wallet.balancePt < Math.max(1, estimate)) {
      return Response.json(
        {
          error: "Insufficient balance",
          code: "INSUFFICIENT_BALANCE",
          requiredPt: Math.max(1, estimate),
          balancePt: wallet.balancePt,
        },
        { status: 402 }
      );
    }
  }

  let agent: {
    id: string;
    systemPrompt: string;
    instructions: string | null;
    toolConfig: unknown;
    knowledgeBaseId: string | null;
  } | null = null;

  if (parsed.data.agentId) {
    const row = await prisma.agent.findFirst({
      where: {
        id: parsed.data.agentId,
        OR: [
          { isPublished: true },
          ...(userId ? [{ creatorId: userId }] : []),
        ],
      },
      select: {
        id: true,
        systemPrompt: true,
        instructions: true,
        toolConfig: true,
        knowledgeBaseId: true,
      },
    });
    if (!row) {
      return Response.json({ error: "Agent not found" }, { status: 404 });
    }
    agent = row;
  }

  const modelMessages = await convertToModelMessages(
    parsed.data.messages as Omit<UIMessage, "id">[]
  );

  const system = buildSystemPrompt(agent);

  const searchKnowledge = tool({
    description:
      "エージェントのナレッジベースから、質問に関連する抜粋を取得する。回答前に事実確認が必要なときに使う。",
    inputSchema: z.object({
      query: z.string().describe("検索クエリ（自然文）"),
    }),
    execute: async ({ query }) => {
      if (!agent) {
        return {
          ok: false as const,
          message:
            "エージェントが指定されていないためナレッジ検索はできません。",
        };
      }
      const res = await searchKnowledgeForAgent({
        agentId: agent.id,
        knowledgeBaseId: agent.knowledgeBaseId,
        query,
      });
      return { ok: true as const, ...res };
    },
  });

  const result = streamText({
    model: getLanguageModel(modelId),
    system,
    messages: modelMessages,
    tools: { searchKnowledge },
    stopWhen: stepCountIs(5),
    onFinish: async ({ totalUsage }) => {
      if (!userId) return;
      const charge = await chargeWalletForChatUsage({
        userId,
        agentId: agent?.id ?? null,
        modelId,
        usage: totalUsage,
        rates,
        idempotencyKey,
      });
      if (!charge.ok) {
        console.error(
          "[api/chat] billing failed after stream:",
          charge.code,
          { userId, modelId }
        );
      }
    },
  });

  return result.toUIMessageStreamResponse();
}
