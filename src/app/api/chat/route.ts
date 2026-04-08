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
import {
  buildEditorSystemSupplement,
  parseKabutoEditor,
} from "@/lib/agent/editor-config";
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
  } | null,
): string {
  if (!agent) {
    return "あなたは有用なアシスタントです。必要に応じてツール searchKnowledge でナレッジを確認してください。";
  }
  const primary =
    agent.instructions?.trim().length ? agent.instructions : agent.systemPrompt;
  const parts = [primary];
  const editor = parseKabutoEditor(agent.toolConfig);
  const supplement = buildEditorSystemSupplement(editor);
  if (supplement) {
    parts.push(supplement);
  }
  parts.push(
    "事実確認が必要なときは searchKnowledge ツールでナレッジを検索してから回答してください。",
  );
  return parts.join("\n\n");
}

async function fetchWebSearchResults(query: string): Promise<string> {
  const key = process.env.BRAVE_SEARCH_API_KEY ?? process.env.BRAVE_API_KEY;
  if (!key?.trim()) {
    return "Web検索API（環境変数 BRAVE_SEARCH_API_KEY など）が未設定のため、検索結果を取得できません。一般知識で答えてください。";
  }
  const url = new URL("https://api.search.brave.com/res/v1/web/search");
  url.searchParams.set("q", query);
  url.searchParams.set("count", "8");
  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "X-Subscription-Token": key.trim(),
    },
  });
  if (!res.ok) {
    return `検索APIがエラーを返しました (${res.status})。`;
  }
  const data = (await res.json()) as {
    web?: {
      results?: { title?: string; description?: string; url?: string }[];
    };
  };
  const results = data.web?.results ?? [];
  if (results.length === 0) {
    return "該当するウェブ結果が見つかりませんでした。";
  }
  return results
    .slice(0, 8)
    .map((r, i) => {
      const title = r.title ?? "(無題)";
      const desc = r.description ?? "";
      const link = r.url ?? "";
      return `${i + 1}. ${title}\n${desc}\n${link}`;
    })
    .join("\n\n");
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

  const editor = agent ? parseKabutoEditor(agent.toolConfig) : null;
  const caps = editor?.capabilities;

  const webSearch = tool({
    description:
      "ウェブ検索。最新情報・ニュース・公式サイトの内容が必要なときに使う。",
    inputSchema: z.object({
      query: z.string().describe("検索クエリ"),
    }),
    execute: async ({ query }) => {
      const text = await fetchWebSearchResults(query);
      return { ok: true as const, results: text };
    },
  });

  const generateImage = tool({
    description:
      "テキストプロンプトから画像を生成する（プラットフォームで画像APIが有効なとき）。",
    inputSchema: z.object({
      prompt: z.string().describe("画像の内容の説明"),
    }),
    execute: async () => ({
      ok: false as const,
      message:
        "画像生成APIは運用設定後に接続されます。必要ならテキストでイメージを説明してください。",
    }),
  });

  const runPython = tool({
    description:
      "Python コードを実行して数値計算や簡単なデータ処理を行う（サンドボックス接続時）。",
    inputSchema: z.object({
      code: z.string().describe("実行する Python コード"),
    }),
    execute: async ({ code }) => ({
      ok: false as const,
      hint: "コード実行環境は未接続です。数式は手計算で示してください。",
      codePreview: code.slice(0, 400),
    }),
  });

  const tools = {
    searchKnowledge,
    ...(caps?.webSearch ? { webSearch } : {}),
    ...(caps?.imageGeneration ? { generateImage } : {}),
    ...(caps?.codeInterpreter ? { runPython } : {}),
  };

  const result = streamText({
    model: getLanguageModel(modelId),
    system,
    messages: modelMessages,
    tools,
    stopWhen: stepCountIs(14),
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
