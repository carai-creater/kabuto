import { createClient } from "@supabase/supabase-js";

import { prisma } from "@/lib/prisma";

export const AGENT_KNOWLEDGE_BUCKET = "agent-knowledge";

const MAX_FILES = 8;
const MAX_BYTES = 8 * 1024 * 1024;

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._\-ぁ-んァ-ヶ一-龠々ー]/g, "_").slice(0, 180);
}

/**
 * 作成フォームからアップロードされたファイルを Storage に載せ、KnowledgeDocument を作成する。
 * バケット未作成・キー未設定時はメタのみ作成（storageKey は pending プレフィックス）。
 */
export async function attachKnowledgeFilesFromForm(
  userId: string,
  agentId: string,
  files: File[],
): Promise<{ saved: number; skipped: number }> {
  const list = files.filter((f) => f instanceof File).slice(0, MAX_FILES);
  let saved = 0;
  let skipped = 0;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  for (const file of list) {
    if (file.size > MAX_BYTES) {
      skipped += 1;
      continue;
    }

    const title = file.name || "document";
    const mime = file.type || "application/octet-stream";

    if (!url || !serviceKey) {
      await prisma.knowledgeDocument.create({
        data: {
          agentId,
          title,
          mimeType: mime,
          storageKey: `pending/${agentId}/${sanitizeFilename(title)}`,
        },
      });
      saved += 1;
      continue;
    }

    try {
      const supabase = createClient(url, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const path = `${userId}/${agentId}/${Date.now()}-${sanitizeFilename(title)}`;
      const buf = Buffer.from(await file.arrayBuffer());
      const { error } = await supabase.storage
        .from(AGENT_KNOWLEDGE_BUCKET)
        .upload(path, buf, {
          contentType: mime,
          upsert: false,
        });

      if (error) {
        await prisma.knowledgeDocument.create({
          data: {
            agentId,
            title,
            mimeType: mime,
            storageKey: `pending/${agentId}/${sanitizeFilename(title)}`,
          },
        });
        saved += 1;
        continue;
      }

      await prisma.knowledgeDocument.create({
        data: {
          agentId,
          title,
          mimeType: mime,
          storageKey: path,
        },
      });
      saved += 1;
    } catch {
      skipped += 1;
    }
  }

  return { saved, skipped };
}
