"use client";

import { useState, useTransition } from "react";
import { submitAgentReview } from "@/app/actions/review";

type Props = {
  agentId: string;
};

export function ReviewForm({ agentId }: Props) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="surface-card p-6 sm:p-8"
      onSubmit={(e) => {
        e.preventDefault();
        setMsg(null);
        startTransition(async () => {
          const r = await submitAgentReview({
            agentId,
            rating,
            comment: comment.trim() || undefined,
          });
          if (!r.ok) {
            setMsg(
              r.code === "UNAUTHORIZED"
                ? "デモでログインしてください。"
                : "送信に失敗しました。",
            );
            return;
          }
          setMsg("評価を保存しました。");
        });
      }}
    >
      <h2 className="text-[17px] font-semibold text-foreground">レビュー</h2>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="text-label" htmlFor="rating">
          評価
        </label>
        <select
          id="rating"
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="input-apple py-2 text-[15px]"
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        placeholder="コメント（任意）"
        className="input-apple mt-3 w-full resize-y placeholder:text-[var(--muted)]"
      />
      <button
        type="submit"
        disabled={pending}
        className="btn-primary mt-5"
      >
        {pending ? "送信中…" : "送信"}
      </button>
      {msg && (
        <p className="mt-3 text-[15px] text-[var(--muted)]">{msg}</p>
      )}
    </form>
  );
}
