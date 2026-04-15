import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { agentDetailInclude } from "@/lib/agent/agent-detail-include";
import { serializeAgentDetail } from "@/lib/api/v1/agent-serializer";
import { resolveUserIdFromBearer } from "@/lib/auth/verify-bearer-token";

/**
 * `GET /api/v1/agents/:slug`
 *
 * 公開エージェント詳細 + starters + creator。任意で Bearer 認証
 * （クリエイター自身なら非公開でも見える既存挙動を維持）。
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;

  // 公開エージェントをまず検索（匿名 OK）
  let agent = await prisma.agent.findFirst({
    where: { slug, isPublished: true },
    include: agentDetailInclude,
  });

  // クリエイター自身なら非公開も見せる
  if (!agent) {
    const resolved = await resolveUserIdFromBearer(req.headers.get("authorization"));
    if (resolved) {
      agent = await prisma.agent.findFirst({
        where: { slug, creatorId: resolved.userId },
        include: agentDetailInclude,
      });
    }
  }

  if (!agent) {
    return NextResponse.json(
      { ok: false, error: "agent_not_found" },
      { status: 404 },
    );
  }

  // 取得した Bearer が自分かどうか / お気に入り済みかを添える
  const viewer = await resolveUserIdFromBearer(req.headers.get("authorization"));
  let isFavorited = false;
  let reviews: Array<{
    id: string;
    rating: number;
    comment: string | null;
    created_at: string;
    user: { id: string; name: string | null };
  }> = [];

  if (viewer) {
    const fav = await prisma.agentFavorite.findUnique({
      where: { userId_agentId: { userId: viewer.userId, agentId: agent.id } },
      select: { id: true },
    });
    isFavorited = fav != null;
  }

  // レビュー（最新 20 件まで）
  const reviewRows = await prisma.review.findMany({
    where: { agentId: agent.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      user: { select: { id: true, name: true } },
    },
  });
  reviews = reviewRows.map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    created_at: r.createdAt.toISOString(),
    user: { id: r.user.id, name: r.user.name ?? null },
  }));

  return NextResponse.json({
    ok: true,
    agent: serializeAgentDetail(agent),
    reviews,
    is_favorited: isFavorited,
    viewer_is_creator: viewer?.userId === agent.creatorId,
  });
}
