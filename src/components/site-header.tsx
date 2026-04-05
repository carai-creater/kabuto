import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

type Props = {
  displayName?: string | null;
  email?: string | null;
  balancePt?: number | null;
  configWarning?: string | null;
};

export function SiteHeader({
  displayName,
  email,
  balancePt,
  configWarning,
}: Props) {
  return (
    <header
      className="sticky top-0 z-50 border-b backdrop-blur-xl backdrop-saturate-150"
      style={{
        background: "var(--header-bg)",
        borderColor: "var(--border)",
      }}
    >
      <div className="mx-auto flex h-[52px] max-w-5xl items-center justify-between gap-3 px-5 sm:h-14 sm:px-8">
        <Link
          href="/"
          className="group flex min-w-0 shrink items-center gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
        >
          <span className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-[var(--card)] shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.08]">
            <Image
              src="/kabuto-logo.png"
              alt=""
              width={32}
              height={32}
              className="object-contain"
              priority
            />
          </span>
          <span className="truncate text-[17px] font-semibold tracking-tight text-foreground">
            kabuto
          </span>
        </Link>

        {configWarning && (
          <p className="hidden max-w-[10rem] truncate text-[11px] text-[var(--muted)] sm:block md:max-w-xs">
            {configWarning}
          </p>
        )}

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <nav className="flex items-center gap-0.5">
            <Link
              href="/wallet"
              className="link-subtle rounded-full px-2 py-1.5 text-[12px] sm:px-3 sm:text-[13px]"
            >
              ウォレット
            </Link>
            <Link
              href="/creator"
              className="link-subtle hidden rounded-full px-2 py-1.5 text-[12px] sm:inline-flex sm:px-3 sm:text-[13px]"
            >
              クリエイター
            </Link>
            <Link
              href="/demo"
              className="link-subtle rounded-full px-2 py-1.5 text-[12px] sm:px-3 sm:text-[13px]"
            >
              デモ
            </Link>
          </nav>
          {balancePt != null && (
            <span
              className="tabular-nums text-[12px] font-medium text-[var(--subtle)] sm:text-[13px] sm:px-1"
              title="残高"
            >
              {balancePt.toLocaleString("ja-JP")}
              <span className="text-[var(--muted)]"> pt</span>
            </span>
          )}
          {email && (
            <span className="hidden max-w-[8rem] truncate text-[12px] text-[var(--muted)] lg:inline">
              {displayName ?? email}
            </span>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
