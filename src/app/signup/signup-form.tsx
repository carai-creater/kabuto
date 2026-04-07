"use client";

import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [doneMessage, setDoneMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setDoneMessage(null);
    setPending(true);
    try {
      const supabase = createClient();
      const origin = window.location.origin;
      const { data, error: signErr } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
        },
      });
      if (signErr) {
        setError(signErr.message);
        return;
      }
      if (data.session) {
        router.push("/dashboard");
        router.refresh();
        return;
      }
      setDoneMessage(
        "確認メールを送信しました。メール内のリンクを開くと登録が完了します。"
      );
    } catch {
      setError("登録に失敗しました。");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-5">
      <div>
        <label htmlFor="signup-email" className="text-label">
          メール
        </label>
        <input
          id="signup-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-apple mt-2 w-full"
        />
      </div>
      <div>
        <label htmlFor="signup-password" className="text-label">
          パスワード（8文字以上推奨）
        </label>
        <input
          id="signup-password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
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
      {doneMessage && (
        <p className="text-[15px] text-[var(--accent)]" role="status">
          {doneMessage}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="btn-primary w-full"
      >
        {pending ? "送信中…" : "アカウントを作成"}
      </button>
      <p className="text-center text-[14px] text-[var(--muted)]">
        既にアカウントがある方は{" "}
        <a href="#login-section" className="text-[var(--accent)] underline">
          ログイン
        </a>
      </p>
    </form>
  );
}
