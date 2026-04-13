import type { User as SupabaseAuthUser } from "@supabase/supabase-js";

import { ensureProfileForUser } from "@/lib/auth/profile";
import { prisma } from "@/lib/prisma";

/**
 * Supabase Auth ユーザーに対応する Prisma User.id を返す。
 * 初回は行作成、既存メールのみなら authUserId をリンクする。
 */
export async function ensurePrismaUserFromAuth(
  authUser: SupabaseAuthUser
): Promise<string | null> {
  const email = authUser.email?.trim();
  if (!email) return null;
  console.log("[ensurePrismaUser] start", { email, authId: authUser.id });

  const existingByAuth = await prisma.user.findUnique({
    where: { authUserId: authUser.id },
    select: { id: true },
  });
  if (existingByAuth) {
    await ensureProfileForUser(existingByAuth.id);
    return existingByAuth.id;
  }

  const existingByEmail = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      authUserId: true,
      name: true,
      avatarUrl: true,
    },
  });

  if (existingByEmail) {
    if (
      existingByEmail.authUserId &&
      existingByEmail.authUserId !== authUser.id
    ) {
      console.error(
        "[auth] email already linked to another auth user:",
        email
      );
      return null;
    }
    if (!existingByEmail.authUserId) {
      await prisma.user.update({
        where: { id: existingByEmail.id },
        data: {
          authUserId: authUser.id,
          name:
            existingByEmail.name ??
            (authUser.user_metadata?.name as string | undefined) ??
            null,
          avatarUrl:
            existingByEmail.avatarUrl ??
            (authUser.user_metadata?.avatar_url as string | undefined) ??
            null,
        },
      });
    }
    await ensureProfileForUser(existingByEmail.id);
    return existingByEmail.id;
  }

  console.log("[ensurePrismaUser] creating new user", email);
  const created = await prisma.user.create({
    data: {
      email,
      name: (authUser.user_metadata?.name as string | undefined) ?? null,
      avatarUrl:
        (authUser.user_metadata?.avatar_url as string | undefined) ?? null,
      authUserId: authUser.id,
      wallet: { create: { balancePt: 1000 } },
      profile: { create: { role: "creator" } },
    },
    select: { id: true },
  }).catch((e: unknown) => {
    console.error("[ensurePrismaUser] create failed", String(e));
    throw e;
  });

  return created.id;
}
