"use server";

import { createServerClient } from "@supabase/ssr";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { sanitizeInternalPath } from "@/lib/sanitize-redirect";
import { getSupabasePublicEnv } from "@/utils/supabase/env";

export type LoginPasswordResult =
  | { ok: true; redirectTo: string }
  | { ok: false; error: string };

/**
 * ブラウザのみの signIn だと Cookie が次リクエストに乗らずミドルウェアが未ログインとみなすことがあるため、
 * Server Action で Supabase SSR の storage を通じて Cookie を確実に書く。
 * 成功後は window.location.assign でフルナビし、Set-Cookie をブラウザが処理してから /dashboard を読みに行く。
 */
export async function loginWithPassword(
  email: string,
  password: string,
  nextPath: string | undefined,
): Promise<LoginPasswordResult> {
  const { url, key } = getSupabasePublicEnv();
  if (!url || !key) {
    return { ok: false, error: "認証の環境変数が設定されていません。" };
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    const code =
      "code" in error && typeof (error as { code?: string }).code === "string"
        ? (error as { code: string }).code
        : "";
    const detail = [error.message, code && `code: ${code}`]
      .filter(Boolean)
      .join(" · ");
    return {
      ok: false,
      error: `ログインに失敗しました。${detail}`,
    };
  }

  revalidatePath("/", "layout");
  const redirectTo = sanitizeInternalPath(nextPath, "/dashboard");
  return { ok: true, redirectTo };
}
