import { prisma } from "@/lib/prisma";
import { splitUsagePoints } from "@/lib/economy";

export type CompleteUsageResult =
  | {
      ok: true;
      duplicate: boolean;
      ledgerId: string;
      newBalancePt: number;
      usageCount: number;
      pointsCharged: number;
    }
  | { ok: false; code: "NOT_FOUND" | "INSUFFICIENT_BALANCE" };

/**
 * AI 実行完了後に呼ぶ。台帳挿入（idempotency）→ 残高減算 → 利用回数 → クリエイター報酬を1トランザクションで実行。
 * skipDuplicates により同一 idempotencyKey の二重課金を防止。
 */
export async function completeUsageTransaction(input: {
  userId: string;
  agentId: string;
  idempotencyKey: string;
}): Promise<CompleteUsageResult> {
  const agent = await prisma.agent.findFirst({
    where: { id: input.agentId, isPublished: true },
  });
  if (!agent) return { ok: false, code: "NOT_FOUND" };

  const pointsCharged = agent.pricePerUsePt;
  const { creatorEarningsPt, platformFeePt } = splitUsagePoints(pointsCharged);

  try {
    return await prisma.$transaction(async (tx) => {
      const insertRes = await tx.usageLedger.createMany({
        data: [
          {
            userId: input.userId,
            agentId: input.agentId,
            pointsCharged,
            creatorEarningsPt,
            platformFeePt,
            idempotencyKey: input.idempotencyKey,
          },
        ],
        skipDuplicates: true,
      });

      if (insertRes.count === 0) {
        const existing = await tx.usageLedger.findUnique({
          where: { idempotencyKey: input.idempotencyKey },
        });
        if (!existing) {
          throw new Error("usage_ledger idempotency race without row");
        }
        const wallet = await tx.wallet.findUniqueOrThrow({
          where: { userId: input.userId },
        });
        const a = await tx.agent.findUniqueOrThrow({
          where: { id: input.agentId },
        });
        return {
          ok: true,
          duplicate: true,
          ledgerId: existing.id,
          newBalancePt: wallet.balancePt,
          usageCount: a.usageCount,
          pointsCharged: existing.pointsCharged,
        };
      }

      if (pointsCharged > 0) {
        const dec = await tx.wallet.updateMany({
          where: {
            userId: input.userId,
            balancePt: { gte: pointsCharged },
          },
          data: { balancePt: { decrement: pointsCharged } },
        });
        if (dec.count !== 1) {
          throw Object.assign(new Error("INSUFFICIENT_BALANCE"), {
            code: "INSUFFICIENT_BALANCE",
          });
        }
      }

      await tx.agent.update({
        where: { id: input.agentId },
        data: { usageCount: { increment: 1 } },
      });

      if (creatorEarningsPt > 0) {
        await tx.creatorWallet.upsert({
          where: { userId: agent.creatorId },
          create: {
            userId: agent.creatorId,
            balancePt: creatorEarningsPt,
          },
          update: { balancePt: { increment: creatorEarningsPt } },
        });
      }

      const wallet = await tx.wallet.findUniqueOrThrow({
        where: { userId: input.userId },
      });
      const updatedAgent = await tx.agent.findUniqueOrThrow({
        where: { id: input.agentId },
      });

      const ledger = await tx.usageLedger.findUniqueOrThrow({
        where: { idempotencyKey: input.idempotencyKey },
      });

      return {
        ok: true,
        duplicate: false,
        ledgerId: ledger.id,
        newBalancePt: wallet.balancePt,
        usageCount: updatedAgent.usageCount,
        pointsCharged,
      };
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
