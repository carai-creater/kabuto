import { z } from "zod";

import {
  buildKabutoToolConfig,
  type KabutoEditorActions,
  type KabutoEditorActionsAuth,
  type KabutoEditorCapabilities,
  type KabutoEditorMcpConfig,
} from "@/lib/agent/editor-config";
import { attachKnowledgeFilesFromForm } from "@/lib/agent/knowledge-upload";
import {
  AGENT_MODEL_OPTIONS,
  DEFAULT_AGENT_MODEL_ID,
  type AgentModelId,
} from "@/lib/agent/model-options";
import { makeUniqueAgentSlug } from "@/lib/slug";
import { prisma } from "@/lib/prisma";

const modelIds = AGENT_MODEL_OPTIONS.map((m) => m.id) as [
  AgentModelId,
  ...AgentModelId[],
];

/**
 * ChatGPT の GPT エディタ「構成」に相当する作成ペイロード。
 * フォーム送信・将来の HTTP API の両方で同じ形にまとめられる。
 */
export const createAgentPayloadSchema = z.object({
  title: z.string().min(1, "名前を入力してください").max(200),
  description: z.string().min(1, "説明を入力してください").max(4000),
  /** GPTs の「Instructions」相当 → DB の systemPrompt に保存 */
  instructions: z.string().min(1, "指示を入力してください").max(100_000),
  iconEmoji: z.string().min(1).max(32),
  conversationStarters: z.array(z.string().min(1).max(500)).max(4),
  pricePerUsePt: z.coerce.number().int().min(0).max(10_000_000),
  defaultLlm: z.enum(modelIds),
  useRecommendedModel: z.boolean(),
  capabilities: z.object({
    webSearch: z.boolean(),
    canvas: z.boolean(),
    imageGeneration: z.boolean(),
    codeInterpreter: z.boolean(),
  }),
  actions: z.object({
    authType: z.enum(["none", "api_key", "oauth"]),
    openApiSchema: z.string().max(200_000),
    privacyPolicyUrl: z.string().max(2000),
  }),
  mcp: z.object({
    enabled: z.boolean(),
    serverKey: z.string().max(100),
    endpointUrl: z.string().max(2000),
    instruction: z.string().max(5000),
  }),
  /** クリエイターが宣言した外部サービス連携キー一覧 */
  mcpServices: z.array(z.string().max(64)).max(20).default([]),
});

export type CreateAgentPayload = z.infer<typeof createAgentPayloadSchema>;

function parseActionsAuth(v: string): KabutoEditorActionsAuth {
  if (v === "api_key" || v === "oauth") return v;
  return "none";
}

function collectKnowledgeFiles(formData: FormData): File[] {
  const all = formData.getAll("knowledgeFiles");
  const out: File[] = [];
  for (const item of all) {
    if (item instanceof File && item.size > 0) {
      out.push(item);
    }
  }
  return out.slice(0, 8);
}

export function parseCreateAgentFormData(
  formData: FormData,
):
  | { ok: true; data: CreateAgentPayload; knowledgeFiles: File[] }
  | { ok: false; error: string } {
  const starters = [0, 1, 2, 3]
    .map((i) => String(formData.get(`starter${i}`) ?? "").trim())
    .filter((s) => s.length > 0)
    .slice(0, 4);

  const iconRaw = String(formData.get("iconEmoji") ?? "").trim();

  const capabilities: KabutoEditorCapabilities = {
    webSearch: formData.get("capWebSearch") === "on",
    canvas: formData.get("capCanvas") === "on",
    imageGeneration: formData.get("capImageGen") === "on",
    codeInterpreter: formData.get("capCodeInterpreter") === "on",
  };

  const actions: KabutoEditorActions = {
    authType: parseActionsAuth(String(formData.get("actionsAuthType") ?? "")),
    openApiSchema: String(formData.get("actionsOpenApiSchema") ?? ""),
    privacyPolicyUrl: String(formData.get("actionsPrivacyPolicyUrl") ?? "").trim(),
  };
  const mcp: KabutoEditorMcpConfig = {
    enabled: formData.get("mcpEnabled") === "on",
    serverKey: String(formData.get("mcpServerKey") ?? "").trim(),
    endpointUrl: String(formData.get("mcpEndpointUrl") ?? "").trim(),
    instruction: String(formData.get("mcpInstruction") ?? "").trim(),
  };

  // クリエイターが選択した外部サービス連携キーを収集
  const mcpServices = formData
    .getAll("mcp_service")
    .map((v) => String(v).trim())
    .filter((v) => v.length > 0)
    .slice(0, 20);

  const defaultLlmRaw = String(formData.get("defaultLlm") ?? "").trim();
  const defaultLlm = modelIds.includes(defaultLlmRaw as AgentModelId)
    ? (defaultLlmRaw as AgentModelId)
    : DEFAULT_AGENT_MODEL_ID;

  const raw = {
    title: String(formData.get("title") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    instructions: String(formData.get("instructions") ?? "").trim(),
    iconEmoji: iconRaw.length > 0 ? iconRaw : "🤖",
    conversationStarters: starters,
    pricePerUsePt: formData.get("pricePerUsePt"),
    defaultLlm,
    useRecommendedModel: formData.get("useRecommendedModel") === "on",
    capabilities,
    actions,
    mcp,
    mcpServices,
  };

  const parsed = createAgentPayloadSchema.safeParse(raw);
  if (!parsed.success) {
    const f = parsed.error.flatten().fieldErrors;
    const msg =
      f.title?.[0] ??
      f.description?.[0] ??
      f.instructions?.[0] ??
      f.iconEmoji?.[0] ??
      f.conversationStarters?.[0] ??
      f.pricePerUsePt?.[0] ??
      f.defaultLlm?.[0] ??
      f.actions?.[0] ??
      f.capabilities?.[0] ??
      "入力内容を確認してください。";
    return { ok: false, error: msg };
  }

  return {
    ok: true,
    data: parsed.data,
    knowledgeFiles: collectKnowledgeFiles(formData),
  };
}

export async function createAgentFromPayload(
  userId: string,
  data: CreateAgentPayload,
  knowledgeFiles: File[],
): Promise<{ slug: string; id: string }> {
  let slug = makeUniqueAgentSlug(data.title);
  for (let attempt = 0; attempt < 8; attempt++) {
    const clash = await prisma.agent.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!clash) break;
    slug = makeUniqueAgentSlug(`${data.title}-${attempt}`);
  }

  const starters = data.conversationStarters;
  const toolConfig = buildKabutoToolConfig({
    capabilities: data.capabilities,
    actions: data.actions,
    mcp: data.mcp,
    useRecommendedModel: data.useRecommendedModel,
  });

  const agent = await prisma.agent.create({
    data: {
      slug,
      creatorId: userId,
      title: data.title.trim(),
      description: data.description.trim(),
      iconEmoji: data.iconEmoji,
      systemPrompt: data.instructions.trim(),
      defaultLlm: data.defaultLlm,
      toolConfig,
      pricePerUsePt: data.pricePerUsePt,
      mcpServices: data.mcpServices,
      isPublished: false,
      tags: [],
      ...(starters.length > 0
        ? {
            conversationStarters: {
              create: starters.map((text, position) => ({
                position,
                text: text.trim(),
              })),
            },
          }
        : {}),
    },
    select: { slug: true, id: true },
  });

  if (knowledgeFiles.length > 0) {
    await attachKnowledgeFilesFromForm(userId, agent.id, knowledgeFiles);
  }

  return { slug: agent.slug, id: agent.id };
}
