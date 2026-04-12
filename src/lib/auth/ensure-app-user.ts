import type { User as SupabaseAuthUser } from "@supabase/supabase-js";

import { ensurePrismaUserFromAuth } from "@/lib/auth/resolve-prisma-user";

export type EnsureAppUserResult =
  | { ok: true; userId: string }
  | { ok: false; error: string };

/**
 * Supabase Auth ユーザーに対応する Prisma User を保証する。
 * 失敗時はマイページ遷移の前に UI に渡す文言を返す。
 */
export async function ensureAppUserForAuthUser(
  user: SupabaseAuthUser | null,
): Promise<EnsureAppUserResult> {
  if (!user) {
    return {
      ok: false,
      error:
        "セッションのユーザー情報を取得できませんでした。もう一度ログインしてください。",
    };
  }

  try {
    const userId = await ensurePrismaUserFromAuth(user);
    if (!userId) {
      if (!user.email?.trim()) {
        return {
          ok: false,
          error:
            "この認証にはメールアドレスがありません。アプリのユーザーと紐づけられません。",
        };
      }
      return {
        ok: false,
        error:
          "このメールは別の Supabase 認証アカウントと既に紐づいています。別メールで登録するか、データベース上の User 行を確認してください。",
      };
    }
    return { ok: true, userId };
  } catch (e) {
    console.error("[ensureAppUserForAuthUser]", e);
    return {
      ok: false,
      error:
        "アプリ用データベース（Prisma）に接続できないか、ユーザーを保存できませんでした。本番では Vercel の DATABASE_URL・DIRECT_URL が Supabase Postgres を指しているか、prisma migrate deploy でスキーマが当たっているかを確認してください。",
    };
  }
}
