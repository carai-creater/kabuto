import type { LanguageModelUsage } from "ai";

import { prisma } from "@/lib/prisma";

export type ModelRates = {
  inputRate: number;
  outputRate: number;
};

export const FALLBACK_MODEL_RATES: ModelRates = {
  inputRate: 0.5,
  outputRate: 1.5,
};

/** 1k トークンあたりのレートから消費 pt を算出（切り上げ）。 */
export function computePointsFromUsage(
  usage: LanguageModelUsage,
  rates: ModelRates
): number {
  const inT = usage.inputTokens ?? 0;
  const outT = usage.outputTokens ?? 0;
  const raw =
    (inT / 1000) * rates.inputRate + (outT / 1000) * rates.outputRate;
  return Math.max(0, Math.ceil(raw));
}

/**
 * 送信前ガード用の粗い見積もり（入力はメッセージ長から、出力は上限想定）。
 */
export function estimateMinPointsForRequest(
  messagesJsonSize: number,
  rates: ModelRates,
  assumedOutputTokens = 4096
): number {
  const approxInputTokens = Math.max(1, Math.ceil(messagesJsonSize / 3));
  return Math.ceil(
    (approxInputTokens / 1000) * rates.inputRate +
      (assumedOutputTokens / 1000) * rates.outputRate
  );
}

export async function loadModelRates(modelId: string): Promise<ModelRates> {
  const row = await prisma.modelConfig.findUnique({
    where: { modelId },
  });
  if (!row) return FALLBACK_MODEL_RATES;
  return { inputRate: row.inputRate, outputRate: row.outputRate };
}

export type ChargeChatResult =
  | { ok: true; duplicate: boolean; amountPt: number }
  | { ok: false; code: "INSUFFICIENT_BALANCE" };

/**
 * トークン使用量に応じた pt 減算と WalletTransaction 記録（idempotency）。
 */
export async function chargeWalletForChatUsage(input: {
  userId: string;
  agentId: string | null;
  modelId: string;
  usage: LanguageModelUsage;
  rates: ModelRates;
  idempotencyKey: string;
}): Promise<ChargeChatResult> {
  const amountPt = computePointsFromUsage(input.usage, input.rates);

  const tokenUsage = {
    modelId: input.modelId,
    inputTokens: input.usage.inputTokens ?? null,
    outputTokens: input.usage.outputTokens ?? null,
    inputTokenDetails: input.usage.inputTokenDetails,
    outputTokenDetails: input.usage.outputTokenDetails,
  };

  try {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.walletTransaction.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
      });
      if (existing) {
        return { ok: true, duplicate: true, amountPt: existing.amountPt };
      }

      if (amountPt <= 0) {
        await tx.walletTransaction.create({
          data: {
            userId: input.userId,
            agentId: input.agentId,
            amountPt: 0,
            tokenUsage,
            idempotencyKey: input.idempotencyKey,
          },
        });
        return { ok: true, duplicate: false, amountPt: 0 };
      }

      const dec = await tx.wallet.updateMany({
        where: {
          userId: input.userId,
          balancePt: { gte: amountPt },
        },
        data: { balancePt: { decrement: amountPt } },
      });
      if (dec.count !== 1) {
        throw Object.assign(new Error("INSUFFICIENT_BALANCE"), {
          code: "INSUFFICIENT_BALANCE",
        });
      }

      await tx.walletTransaction.create({
        data: {
          userId: input.userId,
          agentId: input.agentId,
          amountPt,
          tokenUsage,
          idempotencyKey: input.idempotencyKey,
        },
      });

      return { ok: true, duplicate: false, amountPt };
    });
  } catch (e) {
    if (
      e instanceof Error &&
      (e as Error & { code?: string }).code === "INSUFFICIENT_BALANCE"
    ) {
      return { ok: false, code: "INSUFFICIENT_BALANCE" };
    }
    throw e;
  }
}
