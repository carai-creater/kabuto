import { createClient, type User as SupabaseAuthUser } from "@supabase/supabase-js";
import { getSupabasePublicEnv } from "@/utils/supabase/env";
import { ensurePrismaUserFromAuth } from "@/lib/auth/resolve-prisma-user";

/**
 * `/api/v1/*` 向け。iOS クライアントが `Authorization: Bearer <jwt>`
 * で送ってくる Supabase アクセストークンを検証し、対応する
 * Prisma `User.id` を返す。
 *
 * 既存の Cookie ベース `getSessionUserId()` とは **並行** で動く。
 * 既存経路は一切触らない。
 */
export async function resolveUserIdFromBearer(
  authorization: string | null,
): Promise<{ userId: string; authUser: SupabaseAuthUser } | null> {
  if (!authorization) return null;
  const match = /^Bearer\s+(.+)$/i.exec(authorization);
  if (!match) return null;
  const token = match[1].trim();
  if (token.length === 0) return null;

  const { url, key } = getSupabasePublicEnv();
  if (!url || !key) return null;

  // Cookie 未使用の薄いクライアント。auth.getUser(token) は Supabase 側で
  // JWT を検証し、無効ならエラーを返す。
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;

  const userId = await ensurePrismaUserFromAuth(data.user);
  if (!userId) return null;
  return { userId, authUser: data.user };
}
