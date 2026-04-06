import Link from "next/link";
import { PAGE_SHELL } from "@/lib/page-shell";
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
      <div
        className={`flex h-[52px] w-full items-center justify-between gap-2 sm:gap-3 sm:h-14 ${PAGE_SHELL}`}
      >
        <Link
          href="/"
          className="shrink-0 text-[17px] font-semibold tracking-tight text-foreground outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
        >
          kabuto
        </Link>

        {configWarning && (
          <p className="hidden min-w-0 flex-1 truncate px-1 text-center text-[11px] text-[var(--muted)] sm:block">
            {configWarning}
          </p>
        )}

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <nav className="flex items-center gap-0.5">
            <Link
              href="/dashboard"
              className="link-subtle rounded-full px-2 py-1.5 text-[12px] sm:px-3 sm:text-[13px]"
            >
              マイページ
            </Link>
            <Link
              href="/wallet"
              className="link-subtle rounded-full px-2 py-1.5 text-[12px] sm:px-3 sm:text-[13px]"
            >
              ウォレット
            </Link>
            <Link
              href="/creator"
              className="link-subtle hidden rounded-full px-2 py-1.5 text-[12px] md:inline-flex md:px-3 md:text-[13px]"
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
