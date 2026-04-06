import type { User as SupabaseAuthUser } from "@supabase/supabase-js";

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

  const existingByAuth = await prisma.user.findUnique({
    where: { authUserId: authUser.id },
    select: { id: true },
  });
  if (existingByAuth) return existingByAuth.id;

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
    return existingByEmail.id;
  }

  const created = await prisma.user.create({
    data: {
      email,
      name: (authUser.user_metadata?.name as string | undefined) ?? null,
      avatarUrl:
        (authUser.user_metadata?.avatar_url as string | undefined) ?? null,
      authUserId: authUser.id,
      wallet: { create: { balancePt: 0 } },
    },
    select: { id: true },
  });

  return created.id;
}
