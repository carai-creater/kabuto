"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { ensureProfileForUser } from "@/lib/auth/profile";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";

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

const updateSchema = z.object({
  name: z
    .string()
    .max(200)
    .transform((v) => v.trim() || null),
  avatarUrl: optionalHttpUrl("アバター URL"),
  websiteUrl: optionalHttpUrl("ウェブサイト"),
  xUrl: optionalHttpUrl("X (Twitter)"),
  bio: z
    .string()
    .max(8000)
    .transform((v) => (v.trim() ? v.trim() : null)),
});

export type UpdateProfileState = {
  error: string | null;
  success: boolean;
  /** 保存のたびに変わる値（トーストを毎回出すため） */
  nonce: number;
};

export async function updateProfile(
  _prev: UpdateProfileState,
  formData: FormData,
): Promise<UpdateProfileState> {
  const userId = await getSessionUserId();
  if (!userId) {
    return { error: "ログインが必要です。", success: false, nonce: 0 };
  }

  const parsed = updateSchema.safeParse({
    name: formData.get("name") ?? "",
    avatarUrl: String(formData.get("avatarUrl") ?? ""),
    websiteUrl: String(formData.get("websiteUrl") ?? ""),
    xUrl: String(formData.get("xUrl") ?? ""),
    bio: String(formData.get("bio") ?? ""),
  });

  if (!parsed.success) {
    const msg =
      parsed.error.flatten().formErrors[0] ??
      parsed.error.issues[0]?.message ??
      "入力内容を確認してください。";
    return { error: msg, success: false, nonce: 0 };
  }

  const { name, avatarUrl, bio, websiteUrl, xUrl } = parsed.data;

  try {
    await ensureProfileForUser(userId);
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          name,
          avatarUrl,
        },
      }),
      prisma.profile.update({
        where: { userId },
        data: {
          bio,
          websiteUrl,
          xUrl,
        },
      }),
    ]);
  } catch (e) {
    console.error("[updateProfile]", e);
    return { error: "保存に失敗しました。", success: false, nonce: 0 };
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  revalidatePath("/", "layout");

  return { error: null, success: true, nonce: Date.now() };
}
