import { cache } from "react";
import { cookies } from "next/headers";

import { ensurePrismaUserFromAuth } from "@/lib/auth/resolve-prisma-user";
import { isDemoLoginEnabled } from "@/lib/demo";
import { createClientOrNull } from "@/utils/supabase/server";

export const SESSION_COOKIE = "kabuto_uid";

/**
 * ログイン中の Prisma `User.id`。
 * 1) Supabase Auth セッション（優先）
 * 2) デモ有効時のみ Cookie `kabuto_uid`
 *
 * React cache により同一リクエスト内の重複呼び出しを 1 回にまとめる（レイアウト + ページ + ヘッダー）。
 */
async function resolveSessionUserId(): Promise<string | null> {
  const supabase = await createClientOrNull();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      return ensurePrismaUserFromAuth(user);
    }
  }

  if (isDemoLoginEnabled()) {
    const jar = await cookies();
    const v = jar.get(SESSION_COOKIE)?.value;
    return v && v.length > 0 ? v : null;
  }

  return null;
}

export const getSessionUserId = cache(resolveSessionUserId);
