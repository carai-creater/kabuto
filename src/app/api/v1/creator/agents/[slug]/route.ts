import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveUserIdFromBearer } from "@/lib/auth/verify-bearer-token";
import {
  createAgentPayloadSchema,
} from "@/lib/agent/create-agent";
import { updateAgentFromPayload } from "@/lib/agent/update-agent";

/**
 * `PATCH /api/v1/creator/agents/:slug`
 *
 * Updates an existing agent owned by the caller. Accepts the full
 * `CreateAgentPayload` (same schema as create — no partial updates).
 * Delegates to the existing `updateAgentFromPayload` so behavior
 * stays identical to the web editor.
 */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const resolved = await resolveUserIdFromBearer(req.headers.get("authorization"));
  if (!resolved) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { slug } = await context.params;

  // Ownership check — updateAgentFromPayload expects the caller already
  // confirmed ownership; keep that contract explicit here.
  const owned = await prisma.agent.findFirst({
    where: { slug, creatorId: resolved.userId },
    select: { id: true },
  });
  if (!owned) {
    return NextResponse.json({ ok: false, error: "not_found_or_forbidden" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }
  const parsed = createAgentPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "invalid" },
      { status: 400 },
    );
  }

  // Preserve current publish state; a separate POST handles publish toggle.
  const currentPublished = (await prisma.agent.findFirst({
    where: { slug, creatorId: resolved.userId },
    select: { isPublished: true },
  }))?.isPublished ?? false;

  try {
    await updateAgentFromPayload(resolved.userId, slug, parsed.data, [], {
      isPublished: currentPublished,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/v1/creator/agents PATCH]", err);
    return NextResponse.json({ ok: false, error: "update_failed" }, { status: 500 });
  }
}

/**
 * `POST /api/v1/creator/agents/:slug` with body `{ publish: boolean }`
 *
 * Toggle publish state without touching any of the editor fields.
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const resolved = await resolveUserIdFromBearer(req.headers.get("authorization"));
  if (!resolved) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { slug } = await context.params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }
  const rec = (body ?? {}) as Record<string, unknown>;
  const publish = rec.publish;
  if (typeof publish !== "boolean") {
    return NextResponse.json({ ok: false, error: "missing_publish_flag" }, { status: 400 });
  }

  const result = await prisma.agent.updateMany({
    where: { slug, creatorId: resolved.userId },
    data: { isPublished: publish },
  });
  if (result.count === 0) {
    return NextResponse.json(
      { ok: false, error: "not_found_or_forbidden" },
      { status: 404 },
    );
  }
  return NextResponse.json({ ok: true, is_published: publish });
}
