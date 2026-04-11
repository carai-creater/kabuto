"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createAgentFromPayload,
  parseCreateAgentFormData,
} from "@/lib/agent/create-agent";
import { getSessionUserId } from "@/lib/session";

/** データは Supabase Postgres（DATABASE_URL）へ Prisma 経由で保存 */
export type CreateAgentState = { error: string | null };

function messageForCreateFailure(e: unknown): string {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (["P1001", "P1002", "P1017"].includes(e.code)) {
      return "データベースに接続できませんでした。Vercel の DATABASE_URL（Supabase のプーラー URL）と DIRECT_URL を確認してください。";
    }
    if (e.code === "P2002") {
      return "識別子が重複しました。名前を少し変えて保存してください。";
    }
  }
  if (e instanceof Prisma.PrismaClientValidationError) {
    return "保存内容の形式が正しくありません。入力を確認してください。";
  }
  console.error("[createAgent]", e);
  return "保存に失敗しました。しばらくしてから再度お試しください。";
}

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

  let slug: string;
  try {
    const created = await createAgentFromPayload(
      userId,
      parsed.data,
      parsed.knowledgeFiles,
    );
    slug = created.slug;
  } catch (e) {
    return { error: messageForCreateFailure(e) };
  }

  revalidatePath("/dashboard/creator");
  revalidatePath("/");
  revalidatePath(`/agents/${slug}`);
  redirect(`/dashboard/creator/new?preview=${encodeURIComponent(slug)}`);
}
