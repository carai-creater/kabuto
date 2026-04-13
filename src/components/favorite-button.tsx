"use client";

import { useState, useTransition } from "react";
import { toggleFavorite } from "@/app/actions/favorites";

type Props = {
  agentId: string;
  initialFavorited: boolean;
  isLoggedIn: boolean;
};

export function FavoriteButton({ agentId, initialFavorited, isLoggedIn }: Props) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [pending, startTransition] = useTransition();

  if (!isLoggedIn) return null;

  function handleClick() {
    startTransition(async () => {
      const result = await toggleFavorite(agentId);
      setFavorited(result.favorited);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-label={favorited ? "お気に入りから削除" : "お気に入りに追加"}
      title={favorited ? "お気に入りから削除" : "お気に入りに追加"}
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition ${
        favorited
          ? "border-amber-400/60 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 dark:border-amber-400/40 dark:text-amber-400"
          : "border-[var(--border)] bg-[var(--card)] text-[var(--muted)] hover:border-amber-400/60 hover:text-amber-600 dark:hover:text-amber-400"
      } disabled:opacity-50`}
    >
      <span aria-hidden className="text-[15px] leading-none">
        {favorited ? "★" : "☆"}
      </span>
      {favorited ? "お気に入り登録済み" : "お気に入り"}
    </button>
  );
}
