"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { completeUsageTransaction } from "@/lib/usage/completeUsage";

export type RunAgentCompletionState =
  | {
      ok: true;
      assistantMessage: string;
      duplicate: boolean;
      newBalancePt: number;
      usageCount: number;
      pointsCharged: number;
    }
  | {
      ok: false;
      code:
        | "UNAUTHORIZED"
        | "NOT_FOUND"
        | "NO_WALLET"
        | "INSUFFICIENT"
        | "SETTLEMENT_FAILED";
      balance?: number;
      required?: number;
    };

/**
 * レガシー: モック応答 + `UsageLedger` 課金（回数ベース）。
 * エージェント画面のチャットは `/api/chat` + トークン従量に移行済み。
 */
export async function runAgentCompletion(input: {
  agentId: string;
  idempotencyKey: string;
  selectedLlm: string;
  userMessage: string;
}): Promise<RunAgentCompletionState> {
  const userId = await getSessionUserId();
  if (!userId) {
    return { ok: false, code: "UNAUTHORIZED" };
  }

  const agent = await prisma.agent.findFirst({
    where: { id: input.agentId, isPublished: true },
  });
  if (!agent) {
    return { ok: false, code: "NOT_FOUND" };
  }

  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) {
    return { ok: false, code: "NO_WALLET" };
  }

  if (wallet.balancePt < agent.pricePerUsePt) {
    return {
      ok: false,
      code: "INSUFFICIENT",
      balance: wallet.balancePt,
      required: agent.pricePerUsePt,
    };
  }

  await new Promise((r) => setTimeout(r, 450));

  const assistantMessage = `（${input.selectedLlm} のモック応答）\n\n${agent.iconEmoji} ${agent.title} が応答しました。\n\nあなたの入力:\n${input.userMessage.slice(0, 800)}`;

  const settled = await completeUsageTransaction({
    userId,
    agentId: input.agentId,
    idempotencyKey: input.idempotencyKey,
  });

  if (!settled.ok) {
    if (settled.code === "INSUFFICIENT_BALANCE") {
      return { ok: false, code: "INSUFFICIENT" };
    }
    return { ok: false, code: "SETTLEMENT_FAILED" };
  }

  const slugRow = await prisma.agent.findUnique({
    where: { id: input.agentId },
    select: { slug: true },
  });
  revalidatePath("/");
  revalidatePath("/wallet");
    revalidatePath("/dashboard/creator");
  if (slugRow) {
    revalidatePath(`/agents/${slugRow.slug}`);
  }

  return {
    ok: true,
    assistantMessage,
    duplicate: settled.duplicate,
    newBalancePt: settled.newBalancePt,
    usageCount: settled.usageCount,
    pointsCharged: settled.pointsCharged,
  };
}
