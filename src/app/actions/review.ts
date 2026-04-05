"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
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
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    return { ok: false, code: "BAD_RATING" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.review.upsert({
      where: {
        agentId_userId: { agentId: input.agentId, userId },
      },
      create: {
        agentId: input.agentId,
        userId,
        rating: input.rating,
        comment: input.comment?.trim() || null,
      },
      update: {
        rating: input.rating,
        comment: input.comment?.trim() || null,
      },
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

  const slug = await prisma.agent.findUnique({
    where: { id: input.agentId },
    select: { slug: true },
  });
  if (slug) {
    revalidatePath(`/agents/${slug.slug}`);
    revalidatePath("/");
  }

  return { ok: true };
}
