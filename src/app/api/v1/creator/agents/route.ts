import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveUserIdFromBearer } from "@/lib/auth/verify-bearer-token";
import {
  createAgentFromPayload,
  createAgentPayloadSchema,
} from "@/lib/agent/create-agent";

/**
 * `GET /api/v1/creator/agents`
 *   自分が作成したエージェント一覧（draft/published 含む）。
 *
 * `POST /api/v1/creator/agents`
 *   JSON で `CreateAgentPayload` を受け取り、既存の
 *   `createAgentFromPayload` を呼んで作成する。knowledge ファイルは
 *   別エンドポイントでアップロード → 登録する設計のためここでは空。
 */
export async function GET(req: NextRequest) {
  const resolved = await resolveUserIdFromBearer(req.headers.get("authorization"));
  if (!resolved) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const rows = await prisma.agent.findMany({
    where: { creatorId: resolved.userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      iconEmoji: true,
      isPublished: true,
      pricePerUsePt: true,
      usageCount: true,
      ratingAvg: true,
      reviewCount: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({
    ok: true,
    items: rows.map((a) => ({
      id: a.id,
      slug: a.slug,
      title: a.title,
      description: a.description,
      icon_emoji: a.iconEmoji,
      is_published: a.isPublished,
      price_per_use_pt: Number(a.pricePerUsePt),
      usage_count: a.usageCount,
      rating_avg: Number(a.ratingAvg),
      review_count: a.reviewCount,
      created_at: a.createdAt.toISOString(),
      updated_at: a.updatedAt.toISOString(),
    })),
  });
}

export async function POST(req: NextRequest) {
  const resolved = await resolveUserIdFromBearer(req.headers.get("authorization"));
  if (!resolved) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const parsed = createAgentPayloadSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { ok: false, error: first?.message ?? "invalid" },
      { status: 400 },
    );
  }

  try {
    const created = await createAgentFromPayload(resolved.userId, parsed.data, []);
    return NextResponse.json({ ok: true, id: created.id, slug: created.slug });
  } catch (err) {
    console.error("[api/v1/creator/agents POST]", err);
    return NextResponse.json({ ok: false, error: "create_failed" }, { status: 500 });
  }
}
