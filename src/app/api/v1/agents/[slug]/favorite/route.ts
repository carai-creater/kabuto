import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { toggleFavoriteCore } from "@/lib/agent/favorite-core";
import { resolveUserIdFromBearer } from "@/lib/auth/verify-bearer-token";

/**
 * `POST /api/v1/agents/:slug/favorite`   → お気に入り ON
 * `DELETE /api/v1/agents/:slug/favorite` → お気に入り OFF
 *
 * 冪等ではなく既存 `toggleFavoriteCore` をラップする。
 * POST はお気に入り済みなら no-op で `favorited: true` を返す、
 * DELETE は既に外れていれば no-op で `favorited: false` を返す。
 */

async function resolve(req: NextRequest, slug: string) {
  const viewer = await resolveUserIdFromBearer(req.headers.get("authorization"));
  if (!viewer) {
    return {
      error: NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 }),
    };
  }
  const agent = await prisma.agent.findFirst({
    where: { slug, isPublished: true },
    select: { id: true },
  });
  if (!agent) {
    return {
      error: NextResponse.json({ ok: false, error: "agent_not_found" }, { status: 404 }),
    };
  }
  return { userId: viewer.userId, agentId: agent.id };
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const r = await resolve(req, slug);
  if ("error" in r) return r.error;

  // 既存 toggle はオン/オフ切替。既にオンなら何もしない動きにするため、
  // 現在の状態を見て create のみ実行する。
  const existing = await prisma.agentFavorite.findUnique({
    where: { userId_agentId: { userId: r.userId, agentId: r.agentId } },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({ ok: true, favorited: true });
  }
  const result = await toggleFavoriteCore(r.userId, r.agentId);
  return NextResponse.json({ ok: true, favorited: result.favorited });
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const r = await resolve(req, slug);
  if ("error" in r) return r.error;

  const existing = await prisma.agentFavorite.findUnique({
    where: { userId_agentId: { userId: r.userId, agentId: r.agentId } },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ ok: true, favorited: false });
  }
  const result = await toggleFavoriteCore(r.userId, r.agentId);
  return NextResponse.json({ ok: true, favorited: result.favorited });
}
