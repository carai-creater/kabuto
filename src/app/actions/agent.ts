"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { makeUniqueAgentSlug } from "@/lib/slug";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";

/** データは Supabase Postgres（DATABASE_URL）へ Prisma 経由で保存 */
const createSchema = z.object({
  title: z.string().min(1, "名前を入力してください").max(200),
  description: z.string().min(1, "説明を入力してください").max(4000),
  systemPrompt: z.string().min(1, "システムプロンプトを入力してください").max(100_000),
  pricePerUsePt: z.coerce.number().int().min(0).max(10_000_000),
});

export type CreateAgentState = { error: string | null };

export async function createAgent(
  _prev: CreateAgentState,
  formData: FormData,
): Promise<CreateAgentState> {
  const userId = await getSessionUserId();
  if (!userId) {
    return { error: "ログインが必要です。" };
  }

  const parsed = createSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    systemPrompt: formData.get("systemPrompt"),
    pricePerUsePt: formData.get("pricePerUsePt"),
  });

  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const msg =
      first.title?.[0] ??
      first.description?.[0] ??
      first.systemPrompt?.[0] ??
      first.pricePerUsePt?.[0] ??
      "入力内容を確認してください。";
    return { error: msg };
  }

  const { title, description, systemPrompt, pricePerUsePt } = parsed.data;

  let slug = makeUniqueAgentSlug(title);
  for (let attempt = 0; attempt < 8; attempt++) {
    const clash = await prisma.agent.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!clash) break;
    slug = makeUniqueAgentSlug(`${title}-${attempt}`);
  }

  const agent = await prisma.agent.create({
    data: {
      slug,
      creatorId: userId,
      title: title.trim(),
      description: description.trim(),
      iconEmoji: "🤖",
      systemPrompt: systemPrompt.trim(),
      pricePerUsePt,
      isPublished: false,
      tags: [],
    },
    select: { slug: true },
  });

  revalidatePath("/dashboard/creator");
  revalidatePath("/");
  redirect(`/agents/${agent.slug}`);
}
