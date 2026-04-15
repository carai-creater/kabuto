import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { submitReviewCore } from "@/lib/agent/review-core";
import { resolveUserIdFromBearer } from "@/lib/auth/verify-bearer-token";

/**
 * `POST /api/v1/agents/:slug/reviews`
 * Body: { rating: 1-5, comment?: string }
 *
 * Bearer 必須。既存 `submitReviewCore` を呼ぶだけ。
 * `revalidatePath` は web 用キャッシュなので API v1 では行わない。
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const viewer = await resolveUserIdFromBearer(req.headers.get("authorization"));
  if (!viewer) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { slug } = await context.params;
  const agent = await prisma.agent.findFirst({
    where: { slug, isPublished: true },
    select: { id: true },
  });
  if (!agent) {
    return NextResponse.json({ ok: false, error: "agent_not_found" }, { status: 404 });
  }

  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }
  const rating = Number((body as { rating?: unknown })?.rating);
  const comment = (body as { comment?: unknown })?.comment;

  const result = await submitReviewCore({
    userId: viewer.userId,
    agentId: agent.id,
    rating,
    comment: typeof comment === "string" ? comment : null,
  });

  if (!result.ok) {
    const status = result.code === "SELF_REVIEW_FORBIDDEN" ? 403 : 400;
    return NextResponse.json({ ok: false, error: result.code }, { status });
  }

  return NextResponse.json({ ok: true });
}
