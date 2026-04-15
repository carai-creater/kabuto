import type { Prisma } from "@prisma/client";

/**
 * snake_case JSON への整形。Decimal などサーバ固有型を数値/string に
 * 正規化して iOS の Codable が扱いやすい形にする。
 *
 * 契約を一箇所に集めることで `/api/v1/agents` と `/api/v1/home` などで
 * 形がブレないようにする（PhaseXの拡張もここだけ触る）。
 */

type DecimalLike = Prisma.Decimal | number | null | undefined;

function toNumber(value: DecimalLike): number {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  return value.toNumber();
}

export type AgentListJSON = {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon_emoji: string;
  icon_url: string | null;
  price_per_use_pt: number;
  usage_count: number;
  rating_avg: number;
  review_count: number;
  first_three_free: boolean;
  tags: string[];
  created_at: string | null;
};

type AgentListRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  iconEmoji: string;
  iconUrl: string | null;
  pricePerUsePt: DecimalLike;
  usageCount: number;
  ratingAvg: DecimalLike;
  reviewCount: number;
  firstThreeFree: boolean;
  tags: string[];
  createdAt?: Date;
};

export function serializeAgentListItem(a: AgentListRow): AgentListJSON {
  return {
    id: a.id,
    slug: a.slug,
    title: a.title,
    description: a.description,
    icon_emoji: a.iconEmoji,
    icon_url: a.iconUrl ?? null,
    price_per_use_pt: toNumber(a.pricePerUsePt),
    usage_count: a.usageCount,
    rating_avg: toNumber(a.ratingAvg),
    review_count: a.reviewCount,
    first_three_free: a.firstThreeFree,
    tags: a.tags ?? [],
    created_at: a.createdAt ? a.createdAt.toISOString() : null,
  };
}

export type AgentDetailJSON = AgentListJSON & {
  system_prompt: string;
  instructions: string | null;
  default_llm: string | null;
  creator: { name: string | null; email: string };
  conversation_starters: Array<{ position: number; text: string }>;
  knowledge_documents: Array<{ id: string; title: string; mime_type: string; created_at: string }>;
};

type AgentDetailRow = AgentListRow & {
  systemPrompt: string;
  instructions: string | null;
  defaultLlm: string | null;
  creator: { name: string | null; email: string };
  conversationStarters: Array<{ position: number; text: string }>;
  knowledgeDocuments: Array<{ id: string; title: string; mimeType: string; createdAt: Date }>;
};

export function serializeAgentDetail(a: AgentDetailRow): AgentDetailJSON {
  return {
    ...serializeAgentListItem(a),
    system_prompt: a.systemPrompt,
    instructions: a.instructions,
    default_llm: a.defaultLlm,
    creator: { name: a.creator.name ?? null, email: a.creator.email },
    conversation_starters: (a.conversationStarters ?? [])
      .slice()
      .sort((x, y) => x.position - y.position)
      .map((s) => ({ position: s.position, text: s.text })),
    knowledge_documents: (a.knowledgeDocuments ?? []).map((k) => ({
      id: k.id,
      title: k.title,
      mime_type: k.mimeType,
      created_at: k.createdAt.toISOString(),
    })),
  };
}
