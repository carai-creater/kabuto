/** URL の login_error= に使う値（オープンリダイレクト防止のため allowlist のみ） */
export const LOGIN_ERROR_CODES = ["need_auth", "no_app_user"] as const;
export type LoginErrorCode = (typeof LOGIN_ERROR_CODES)[number];

export function isLoginErrorCode(v: string | undefined): v is LoginErrorCode {
  return !!v && LOGIN_ERROR_CODES.includes(v as LoginErrorCode);
}

export function messageForLoginErrorCode(code: string | undefined): string | null {
  if (!isLoginErrorCode(code)) return null;
  switch (code) {
    case "need_auth":
      return "マイページを表示するにはログインが必要です。セッションが無いか期限切れの可能性があります。下のフォームからログインしてください。";
    case "no_app_user":
      return "Supabase のログインは通っていますが、アプリのユーザー情報をデータベースから読み込めませんでした。Vercel の DATABASE_URL・マイグレーション、または同じメールの別アカウント競合を確認してください。";
    default:
      return null;
  }
}
