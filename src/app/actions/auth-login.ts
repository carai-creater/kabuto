"use server";

import { createServerClient } from "@supabase/ssr";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { sanitizeInternalPath } from "@/lib/sanitize-redirect";
import { getSupabasePublicEnv } from "@/utils/supabase/env";

/** onAuthStateChange 内の applyServerStorage が非同期のため、sb-* が載るまで待つ */
async function waitForSupabaseAuthCookies(
  maxAttempts = 150,
): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    const jar = await cookies();
    const has = jar
      .getAll()
      .some((c) => c.name.startsWith("sb-") && c.value.length > 0);
    if (has) return true;
    await new Promise<void>((resolve) => {
      if (i % 3 === 2) {
        setImmediate(resolve);
      } else {
        queueMicrotask(resolve);
      }
    });
  }
  return false;
}

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
    cookieEncoding: "base64url",
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
    return { ok: false, error: error.message };
  }

  const cookiesWritten = await waitForSupabaseAuthCookies();
  if (!cookiesWritten) {
    return {
      ok: false,
      error:
        "セッション用の Cookie を保存できませんでした。ページを再読み込みして再度お試しください。",
    };
  }

  revalidatePath("/", "layout");
  const redirectTo = sanitizeInternalPath(nextPath, "/dashboard");
  return { ok: true, redirectTo };
}
