"use server";

import { revalidatePath } from "next/cache";
import { submitReviewCore } from "@/lib/agent/review-core";
import { getSessionUserId } from "@/lib/session";

export async function submitAgentReview(input: {
  agentId: string;
  rating: number;
  comment?: string;
}): Promise<{ ok: true } | { ok: false; code: string }> {
  const userId = await getSessionUserId();
  if (!userId) {
    return { ok: false, code: "UNAUTHORIZED" };
  }

  const result = await submitReviewCore({
    userId,
    agentId: input.agentId,
    rating: input.rating,
    comment: input.comment ?? null,
  });

  if (result.ok) {
    // 動的セグメントは route pattern で無効化（リテラル日本語パスは Next.js 16 でハングする）
    revalidatePath("/agents/[slug]", "page");
    revalidatePath("/");
  }

  return result;
}
