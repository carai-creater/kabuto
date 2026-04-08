import { z } from "zod";

import { makeUniqueAgentSlug } from "@/lib/slug";
import { prisma } from "@/lib/prisma";

/**
 * ChatGPT の GPTs / Gemini の GEM に相当する作成ペイロード。
 * フォーム送信・将来の HTTP API の両方で同じ形にまとめられる。
 */
export const createAgentPayloadSchema = z.object({
  title: z.string().min(1, "名前を入力してください").max(200),
  description: z.string().min(1, "説明を入力してください").max(4000),
  /** GPTs の「Instructions」相当 → DB の systemPrompt に保存 */
  instructions: z.string().min(1, "指示を入力してください").max(100_000),
  iconEmoji: z.string().min(1).max(32),
  conversationStarters: z
    .array(z.string().min(1).max(500))
    .max(4),
  pricePerUsePt: z.coerce.number().int().min(0).max(10_000_000),
});

export type CreateAgentPayload = z.infer<typeof createAgentPayloadSchema>;

export function parseCreateAgentFormData(
  formData: FormData,
):
  | { ok: true; data: CreateAgentPayload }
  | { ok: false; error: string } {
  const starters = [0, 1, 2, 3]
    .map((i) => String(formData.get(`starter${i}`) ?? "").trim())
    .filter((s) => s.length > 0)
    .slice(0, 4);

  const iconRaw = String(formData.get("iconEmoji") ?? "").trim();

  const raw = {
    title: String(formData.get("title") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    instructions: String(formData.get("instructions") ?? "").trim(),
    iconEmoji: iconRaw.length > 0 ? iconRaw : "🤖",
    conversationStarters: starters,
    pricePerUsePt: formData.get("pricePerUsePt"),
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
      "入力内容を確認してください。";
    return { ok: false, error: msg };
  }
  return { ok: true, data: parsed.data };
}

export async function createAgentFromPayload(
  userId: string,
  data: CreateAgentPayload,
): Promise<{ slug: string }> {
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

  const agent = await prisma.agent.create({
    data: {
      slug,
      creatorId: userId,
      title: data.title.trim(),
      description: data.description.trim(),
      iconEmoji: data.iconEmoji,
      systemPrompt: data.instructions.trim(),
      pricePerUsePt: data.pricePerUsePt,
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
    select: { slug: true },
  });

  return { slug: agent.slug };
}
