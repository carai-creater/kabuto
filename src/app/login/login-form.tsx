"use client";

import { loginWithPassword } from "@/app/actions/auth-login";
import { useState } from "react";

type Props = {
  /** ログイン成功後の遷移先（相対パスのみ想定） */
  redirectTo?: string;
};

export function LoginForm({ redirectTo = "/dashboard" }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const result = await loginWithPassword(email, password, redirectTo);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      // Server Action が Set-Cookie をレスポンスに乗せた後にフルナビする。
      // redirect() だとクライアントへの Cookie 伝播が完了する前にナビゲートが始まる場合があるため
      // window.location.assign を使い、ブラウザが Set-Cookie を処理してから GET /dashboard を送る。
      window.location.assign(result.redirectTo);
    } catch (err) {
      const msg =
        err instanceof Error
          ? `予期しないエラー: ${err.message}`
          : "ログインに失敗しました。";
      setError(msg);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-5">
      <div>
        <label htmlFor="login-email" className="text-label">
          メール
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-apple mt-2 w-full"
        />
      </div>
      <div>
        <label htmlFor="login-password" className="text-label">
          パスワード
        </label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-apple mt-2 w-full"
        />
      </div>
      {error && (
        <div
          className="rounded-xl border border-[var(--destructive)]/35 bg-[var(--card-elevated)] px-4 py-3 text-left"
          role="alert"
        >
          <p className="text-[13px] font-semibold text-[var(--destructive)]">
            エラー
          </p>
          <p className="mt-2 whitespace-pre-wrap break-words text-[14px] leading-relaxed text-foreground">
            {error}
          </p>
        </div>
      )}
      <button
        type="submit"
        disabled={pending}
        className="btn-primary w-full"
      >
        {pending ? "ログイン中…" : "ログイン"}
      </button>
    </form>
  );
}
