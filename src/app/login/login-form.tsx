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
    } catch {
      setError("ログインに失敗しました。");
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
        <p className="text-[15px] text-[var(--destructive)]" role="alert">
          {error}
        </p>
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
