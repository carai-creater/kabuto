import { embed } from "ai";
import { createClient } from "@supabase/supabase-js";

import { embeddingModel } from "@/lib/chat/providers";
import { prisma } from "@/lib/prisma";

export type KnowledgeSearchResult = {
  text: string;
  source: "vector_rpc" | "documents_fallback";
};

const VECTOR_RPC =
  process.env.KABUTO_VECTOR_MATCH_RPC ?? "match_knowledge_chunks";

/**
 * Supabase Vector（pgvector + RPC）が利用可能なら埋め込み検索し、
 * 未設定・失敗時は KnowledgeDocument メタからフォールバックする。
 */
export async function searchKnowledgeForAgent(input: {
  agentId: string;
  knowledgeBaseId: string | null;
  query: string;
}): Promise<KnowledgeSearchResult> {
  const { agentId, knowledgeBaseId, query } = input;

  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (
    url &&
    serviceKey &&
    process.env.OPENAI_API_KEY &&
    process.env.KABUTO_VECTOR_RPC_ENABLED === "true"
  ) {
    try {
      const { embedding } = await embed({
        model: embeddingModel,
        value: query,
      });

      const supabase = createClient(url, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      const { data, error } = await supabase.rpc(VECTOR_RPC, {
        query_embedding: embedding,
        match_count: 8,
        filter_agent_id: agentId,
        filter_knowledge_base_id: knowledgeBaseId,
      });

      if (!error && Array.isArray(data) && data.length > 0) {
        const lines = data
          .map((row: { content?: string; chunk?: string; similarity?: number }) => {
            const body = row.content ?? row.chunk ?? "";
            const sim =
              typeof row.similarity === "number"
                ? ` (similarity ${row.similarity.toFixed(3)})`
                : "";
            return `${body}${sim}`;
          })
          .filter(Boolean);
        if (lines.length > 0) {
          return {
            text: lines.join("\n\n---\n\n"),
            source: "vector_rpc",
          };
        }
      }
    } catch {
      // fall through to prisma fallback
    }
  }

  const docs = await prisma.knowledgeDocument.findMany({
    where: { agentId },
    take: 12,
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true },
  });

  const q = query.trim().toLowerCase();
  const matched =
    q.length === 0
      ? docs.slice(0, 5)
      : docs.filter((d) => d.title.toLowerCase().includes(q)).slice(0, 8);

  const picked = matched.length > 0 ? matched : docs.slice(0, 5);

  const lines = picked.map(
    (d) =>
      `文書「${d.title}」: ナレッジベースに登録済み（本文は Vector ストアまたは RAG パイプラインで参照してください）。`
  );

  return {
    text:
      lines.length > 0
        ? lines.join("\n")
        : "このエージェントに紐づくナレッジ文書はまだありません。",
    source: "documents_fallback",
  };
}
