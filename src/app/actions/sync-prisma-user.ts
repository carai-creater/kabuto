"use server";

import { ensureAppUserForAuthUser } from "@/lib/auth/ensure-app-user";
import { createClientOrNull } from "@/utils/supabase/server";

/**
 * クライアントで Supabase セッションが付いた直後に呼び、Prisma User を作成・紐付けする。
 */
export async function syncPrismaUserAfterAuth(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const supabase = await createClientOrNull();
  if (!supabase) {
    return {
      ok: false,
      error:
        "NEXT_PUBLIC_SUPABASE_URL またはキーがサーバーで読み取れません。",
    };
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return {
      ok: false,
      error:
        "セッションのユーザー情報を取得できませんでした。ページを更新して再度お試しください。",
    };
  }

  const result = await ensureAppUserForAuthUser(user);
  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  return { ok: true };
}
