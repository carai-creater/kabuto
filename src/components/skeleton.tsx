/**
 * 共通スケルトン部品 — shimmer アニメーション付き
 */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={[
        "relative overflow-hidden rounded-md bg-[var(--border)]",
        "before:absolute before:inset-0 before:-translate-x-full",
        "before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
        "before:animate-[shimmer_1.4s_infinite]",
        "dark:before:via-white/10",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}
