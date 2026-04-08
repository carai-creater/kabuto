"use server";

import { revalidatePath } from "next/cache";
import type { ProfileRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";

export type SetUserRoleState = {
  error: string | null;
  success: boolean;
};

async function requireAdmin(): Promise<
  { ok: true; userId: string } | { ok: false; message: string }
> {
  const userId = await getSessionUserId();
  if (!userId) {
    return { ok: false, message: "ログインが必要です。" };
  }
  const p = await prisma.profile.findUnique({
    where: { userId },
    select: { role: true },
  });
  if (p?.role !== "admin") {
    return { ok: false, message: "管理者権限がありません。" };
  }
  return { ok: true, userId };
}

const ROLES: ProfileRole[] = ["user", "creator", "admin"];

export async function setUserRoleByEmail(
  _prev: SetUserRoleState,
  formData: FormData,
): Promise<SetUserRoleState> {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return { error: gate.message, success: false };
  }

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const roleRaw = String(formData.get("role") ?? "").trim() as ProfileRole;

  if (!email) {
    return { error: "メールアドレスを入力してください。", success: false };
  }
  if (!ROLES.includes(roleRaw)) {
    return { error: "ロールが不正です。", success: false };
  }

  const target = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!target) {
    return {
      error:
        "そのメールのユーザーが見つかりません（一度ログインしてアカウント作成済みか確認してください）。",
      success: false,
    };
  }

  try {
    await prisma.profile.upsert({
      where: { userId: target.id },
      create: { userId: target.id, role: roleRaw },
      update: { role: roleRaw },
    });
  } catch (e) {
    console.error("[setUserRoleByEmail]", e);
    return { error: "更新に失敗しました。", success: false };
  }

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/creator");
  revalidatePath("/", "layout");

  return { error: null, success: true };
}
