import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type SubmitReviewInput = {
  userId: string;
  agentId: string;
  rating: number;
  comment?: string | null;
};

export type SubmitReviewResult = { ok: true } | { ok: false; code: string };

/**
 * 純粋なレビュー投稿ロジック。`userId` は呼び出し側が解決する
 * （既存 Server Action は cookie、`/api/v1/*` は Bearer JWT 経由）。
 * 既存 `src/app/actions/review.ts` からも本関数を呼ぶ。
 */
export async function submitReviewCore(
  input: SubmitReviewInput,
): Promise<SubmitReviewResult> {
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    return { ok: false, code: "BAD_RATING" };
  }
  if (
    typeof input.agentId !== "string" ||
    input.agentId.length === 0 ||
    input.agentId.length > 64
  ) {
    return { ok: false, code: "BAD_AGENT_ID" };
  }
  const comment = input.comment?.trim() || null;
  if (comment && comment.length > 2000) {
    return { ok: false, code: "COMMENT_TOO_LONG" };
  }

  const agent = await prisma.agent.findUnique({
    where: { id: input.agentId },
    select: { id: true, isPublished: true, creatorId: true },
  });
  if (!agent || !agent.isPublished) {
    return { ok: false, code: "AGENT_NOT_FOUND" };
  }
  if (agent.creatorId === input.userId) {
    return { ok: false, code: "SELF_REVIEW_FORBIDDEN" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.review.upsert({
      where: { agentId_userId: { agentId: input.agentId, userId: input.userId } },
      create: {
        agentId: input.agentId,
        userId: input.userId,
        rating: input.rating,
        comment,
      },
      update: { rating: input.rating, comment },
    });

    const agg = await tx.review.aggregate({
      where: { agentId: input.agentId },
      _avg: { rating: true },
      _count: { _all: true },
    });

    await tx.agent.update({
      where: { id: input.agentId },
      data: {
        ratingAvg: agg._avg.rating ?? new Prisma.Decimal(0),
        reviewCount: agg._count._all,
      },
    });
  });

  return { ok: true };
}
