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
 * 成功時は { ok: true, redirectTo } を返し、クライアントが window.location.assign() でフルナビする。
 * redirect() はクライアントへの Cookie 伝播が完了する前にナビゲートし始めることがあるため使わない。
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
    // #region agent log
    fetch("http://127.0.0.1:7864/ingest/91c79867-500f-449c-8815-99e6b921d264", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "6cdd8c",
      },
      body: JSON.stringify({
        sessionId: "6cdd8c",
        hypothesisId: "H1",
        location: "auth-login.ts:signIn-error",
        message: "signInWithPassword failed",
        data: { code: error.code ?? "unknown" },
        timestamp: Date.now(),
        runId: "pre-fix",
      }),
    }).catch(() => {});
    // #endregion
    return { ok: false, error: error.message };
  }

  const {
    data: { session: sessionAfterSignIn },
  } = await supabase.auth.getSession();
  const sbCookieCountAfter = cookieStore
    .getAll()
    .filter((c) => c.name.startsWith("sb-")).length;
  // #region agent log
  fetch("http://127.0.0.1:7864/ingest/91c79867-500f-449c-8815-99e6b921d264", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "6cdd8c",
    },
    body: JSON.stringify({
      sessionId: "6cdd8c",
      hypothesisId: "H1",
      location: "auth-login.ts:post-signin",
      message: "after signIn getSession + cookie count",
      data: {
        hasSession: !!sessionAfterSignIn,
        sbCookieCount: sbCookieCountAfter,
      },
      timestamp: Date.now(),
      runId: "post-fix",
    }),
  }).catch(() => {});
  // #endregion

  revalidatePath("/", "layout");
  const redirectTo = sanitizeInternalPath(nextPath, "/dashboard");
  const sbCookieCountFinal = cookieStore
    .getAll()
    .filter((c) => c.name.startsWith("sb-")).length;
  // #region agent log
  fetch("http://127.0.0.1:7864/ingest/91c79867-500f-449c-8815-99e6b921d264", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "6cdd8c",
    },
    body: JSON.stringify({
      sessionId: "6cdd8c",
      hypothesisId: "H1",
      location: "auth-login.ts:before-return",
      message: "returning ok:true with redirectTo (client will window.location.assign)",
      data: { sbCookieCount: sbCookieCountFinal, redirectTo },
      timestamp: Date.now(),
      runId: "window-assign-fix",
    }),
  }).catch(() => {});
  // #endregion
  return { ok: true, redirectTo };
}
