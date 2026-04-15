import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ensureProfileForUser } from "@/lib/auth/profile";
import { resolveUserIdFromBearer } from "@/lib/auth/verify-bearer-token";

/**
 * `PATCH /api/v1/me/profile`
 *
 * iOS 向けプロフィール更新。既存 `updateProfile` server action と
 * 同じ zod スキーマ・同じ DB 更新手順を inline で実行する。
 * 重複ロジックを避けるため本質的な処理（transaction）は同一。
 */

function optionalHttpUrl(field: string) {
  return z
    .string()
    .max(2000)
    .transform((v) => v.trim())
    .refine(
      (v) => v === "" || /^https?:\/\//i.test(v),
      `${field}は http(s):// で始まる URL を入力するか、空にしてください`,
    )
    .transform((v) => (v === "" ? null : v));
}

const patchSchema = z.object({
  name: z
    .string()
    .max(200)
    .optional()
    .transform((v) => (v == null ? undefined : v.trim() || null)),
  avatar_url: optionalHttpUrl("アバター URL").optional(),
  website_url: optionalHttpUrl("ウェブサイト").optional(),
  x_url: optionalHttpUrl("X (Twitter)").optional(),
  bio: z
    .string()
    .max(8000)
    .optional()
    .transform((v) => (v == null ? undefined : v.trim() || null)),
});

export async function PATCH(req: NextRequest) {
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

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "invalid" },
      { status: 400 },
    );
  }

  const { name, avatar_url, website_url, x_url, bio } = parsed.data;

  try {
    await ensureProfileForUser(resolved.userId);
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resolved.userId },
        data: {
          ...(name !== undefined ? { name } : {}),
          ...(avatar_url !== undefined ? { avatarUrl: avatar_url } : {}),
        },
      }),
      prisma.profile.update({
        where: { userId: resolved.userId },
        data: {
          ...(bio !== undefined ? { bio } : {}),
          ...(website_url !== undefined ? { websiteUrl: website_url } : {}),
          ...(x_url !== undefined ? { xUrl: x_url } : {}),
        },
      }),
    ]);
  } catch (err) {
    console.error("[api/v1/me/profile]", err);
    return NextResponse.json({ ok: false, error: "save_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
