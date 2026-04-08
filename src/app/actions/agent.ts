"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createAgentFromPayload,
  parseCreateAgentFormData,
} from "@/lib/agent/create-agent";
import { getSessionUserId } from "@/lib/session";

/** データは Supabase Postgres（DATABASE_URL）へ Prisma 経由で保存 */
export type CreateAgentState = { error: string | null };

export async function createAgent(
  _prev: CreateAgentState,
  formData: FormData,
): Promise<CreateAgentState> {
  const userId = await getSessionUserId();
  if (!userId) {
    return { error: "ログインが必要です。" };
  }

  const parsed = parseCreateAgentFormData(formData);
  if (!parsed.ok) {
    return { error: parsed.error };
  }

  const { slug } = await createAgentFromPayload(
    userId,
    parsed.data,
    parsed.knowledgeFiles,
  );

  revalidatePath("/dashboard/creator");
  revalidatePath("/");
  revalidatePath(`/agents/${slug}`);
  redirect(`/dashboard/creator/new?preview=${encodeURIComponent(slug)}`);
}
