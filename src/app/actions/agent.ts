"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

import {
  createAgentFromPayload,
  parseCreateAgentFormData,
} from "@/lib/agent/create-agent";
import { updateAgentFromPayload } from "@/lib/agent/update-agent";
import { getSessionUserId } from "@/lib/session";

/** データは Supabase Postgres（DATABASE_URL）へ Prisma 経由で保存 */
export type CreateAgentState = { error: string | null };

function messageForAgentSaveFailure(e: unknown): string {
  if (e instanceof Error && e.message === "AGENT_NOT_FOUND") {
    return "エージェントが見つかりません。一覧から開き直してください。";
  }
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
  console.error("[agent action]", e);
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
    return { error: messageForAgentSaveFailure(e) };
  }

  revalidatePath("/dashboard/creator");
  revalidatePath("/");
  // 動的セグメントは route pattern で無効化（リテラル日本語パスは Next.js 16 でハングする）
  revalidatePath("/agents/[slug]", "page");
  revalidateTag("marketplace-agents", "max");
  redirect(`/dashboard/creator/new?preview=${encodeURIComponent(slug)}`);
}

export async function updateAgent(
  _prev: CreateAgentState,
  formData: FormData,
): Promise<CreateAgentState> {
  const userId = await getSessionUserId();
  if (!userId) {
    return { error: "ログインが必要です。" };
  }

  const slug = String(formData.get("agentSlug") ?? "").trim();
  if (!slug) {
    return { error: "エージェントを特定できません。" };
  }

  const intent = String(formData.get("intent") ?? "draft");
  const isPublished = intent === "publish";

  const parsed = parseCreateAgentFormData(formData);
  if (!parsed.ok) {
    return { error: parsed.error };
  }

  try {
    await updateAgentFromPayload(
      userId,
      slug,
      parsed.data,
      parsed.knowledgeFiles,
      { isPublished },
    );
  } catch (e) {
    return { error: messageForAgentSaveFailure(e) };
  }

  revalidatePath("/dashboard/creator");
  revalidatePath("/");
  // 動的セグメントは route pattern で無効化（リテラル日本語パスは Next.js 16 でハングする）
  revalidatePath("/agents/[slug]", "page");
  revalidatePath("/dashboard/creator/edit/[slug]", "page");
  revalidatePath("/dashboard/creator/agents/[slug]", "page");
  revalidateTag("marketplace-agents", "max");

  redirect(
    `/dashboard/creator/edit/${encodeURIComponent(slug)}?saved=${isPublished ? "published" : "draft"}`,
  );
}
