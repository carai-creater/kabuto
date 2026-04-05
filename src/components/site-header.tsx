import Image from "next/image";
import Link from "next/link";

type Props = {
  displayName?: string | null;
  email?: string | null;
  balancePt?: number | null;
  /** DB 未設定・接続失敗時の短い説明 */
  configWarning?: string | null;
};

export function SiteHeader({
  displayName,
  email,
  balancePt,
  configWarning,
}: Props) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050505]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="group flex min-w-0 shrink items-center gap-3 outline-none focus-visible:ring-2 focus-visible:ring-kabuto-gold focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]"
        >
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-black shadow-[0_0_24px_-4px_rgba(212,175,55,0.35)] ring-1 ring-[#D4AF37]/30 transition group-hover:ring-[#D4AF37]/55">
            <Image
              src="/kabuto-logo.png"
              alt="kabuto"
              width={40}
              height={40}
              className="object-contain"
              priority
            />
          </span>
          <span className="truncate font-semibold tracking-tight text-zinc-100">
            kabuto
          </span>
        </Link>

        {configWarning && (
          <p className="max-w-[min(100%,12rem)] truncate text-[10px] text-amber-400/90 sm:max-w-xs lg:max-w-md">
            {configWarning}
          </p>
        )}
        <nav className="flex shrink-0 items-center gap-2 text-sm sm:gap-4">
          <Link
            href="/wallet"
            className="hidden rounded-md px-2 py-1 text-zinc-400 transition hover:bg-white/5 hover:text-zinc-100 sm:inline"
          >
            ウォレット
          </Link>
          <Link
            href="/creator"
            className="hidden rounded-md px-2 py-1 text-zinc-400 transition hover:bg-white/5 hover:text-zinc-100 md:inline"
          >
            クリエイター
          </Link>
          <Link
            href="/demo"
            className="rounded-md px-2 py-1 text-zinc-400 transition hover:bg-white/5 hover:text-zinc-100"
          >
            デモ
          </Link>
          {balancePt != null && (
            <span className="rounded-md border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-2.5 py-1 text-xs font-medium tabular-nums text-[#E8D48B] sm:text-sm">
              {balancePt.toLocaleString("ja-JP")} pt
            </span>
          )}
          {email && (
            <span className="hidden max-w-[10rem] truncate text-xs text-zinc-500 lg:inline">
              {displayName ?? email}
            </span>
          )}
        </nav>
      </div>
    </header>
  );
}
