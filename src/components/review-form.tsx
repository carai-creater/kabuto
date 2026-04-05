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
      className="rounded-2xl border border-white/10 bg-zinc-950/40 p-5"
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
      <h2 className="text-sm font-medium text-zinc-300">レビューを書く</h2>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className="text-xs text-zinc-500" htmlFor="rating">
          星
        </label>
        <select
          id="rating"
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="rounded-lg border border-white/10 bg-black/60 px-2 py-1.5 text-sm text-zinc-100"
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
        className="mt-3 w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600"
      />
      <button
        type="submit"
        disabled={pending}
        className="mt-3 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm text-zinc-100 transition hover:bg-white/10 disabled:opacity-50"
      >
        {pending ? "送信中…" : "送信"}
      </button>
      {msg && <p className="mt-2 text-sm text-zinc-400">{msg}</p>}
    </form>
  );
}
