import { NextResponse } from "next/server";

import { createClientOrNull } from "@/utils/supabase/server";

/**
 * メール確認・OAuth など PKCE の code をセッションに交換する。
 * Supabase の Redirect URLs に `https://<本番>/auth/callback` を追加すること。
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createClientOrNull();
  if (!supabase) {
    return NextResponse.redirect(`${origin}/login?error=supabase_config`);
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`
    );
  }

  return NextResponse.redirect(`${origin}${next}`);
}
