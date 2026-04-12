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
  try {
    const supabase = await createClientOrNull();
    if (!supabase) {
      console.log("[session] supabase client null (env not configured)");
      return null;
    }

    const jar = await cookies();
    const sbCookieCount = jar.getAll().filter((c) => c.name.startsWith("sb-")).length;
    console.log("[session] sb-cookie count", sbCookieCount);

    const {
      data: { user },
      error: getUserError,
    } = await supabase.auth.getUser();

    console.log("[session] getUser result", { hasUser: !!user, error: getUserError?.message });

    if (user) {
      const uid = await ensurePrismaUserFromAuth(user);
      console.log("[session] ensurePrismaUser result", { uid });
      return uid;
    }

    if (isDemoLoginEnabled()) {
      const v = jar.get(SESSION_COOKIE)?.value;
      return v && v.length > 0 ? v : null;
    }

    return null;
  } catch (e) {
    console.error("[session] resolveSessionUserId error", e);
    return null;
  }
}

export const getSessionUserId = cache(resolveSessionUserId);
